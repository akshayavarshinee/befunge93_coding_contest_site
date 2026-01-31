import { Worker } from "bullmq";
import { db } from "./db.js";
import LocalExecutor from "./localExecutor.js";
import Redis from "ioredis";
import env from "./env.js";

/**
 * Enhanced BullMQ Worker with Docker-based isolated execution
 * - Never executes user code directly
 * - Enforces strict resource limits and timeouts
 * - Automatic cleanup and graceful termination
 */

const executor = new LocalExecutor({
    maxSteps: 1000000,      // 1M instructions limit
    timeoutMs: 3000         // 3 second wall-clock limit
});

try{
    await db.connect();
}
catch(err){
    console.error("Error connecting to database:", err);
    process.exit(1);
}

const worker = new Worker(
    "submissions",
    async (job) => {
        console.log(`[Worker] Processing job ${job.id}`);
        const { code, submittedAt, problemId, teamId, contestId, solveTime } = job.data;

        let finalVerdict = "Accepted";
        let finalOutput = "";
        let testCaseResults = [];

        try {
            // 1. Fetch test cases from database
            const testCases = await db.query(
                "SELECT input, expected_output FROM test_cases WHERE problem_id = $1 ORDER BY id ASC",
                [problemId]
            );

            let inputs = [];
            let outputs = [];

            // Fallback to example if no test cases
            if (testCases.rows.length === 0) {
                const problemEx = await db.query(
                    "SELECT example_input, example_output FROM problems WHERE id = $1",
                    [problemId]
                );
                if (problemEx.rows.length > 0) {
                    inputs.push(problemEx.rows[0].example_input || "");
                    outputs.push(problemEx.rows[0].example_output || "");
                } else {
                    inputs = [""];
                    outputs = [""];
                }
            } else {
                inputs = testCases.rows.map(r => r.input);
                outputs = testCases.rows.map(r => r.expected_output);
            }

            // 2. Execute code against each test case in isolated Docker container
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const expectedOutput = outputs[i];

                console.log(`[Worker] Job ${job.id}: Running test case ${i + 1}/${inputs.length}`);

                // Execute in isolated Docker container
                const result = await executor.execute(code, input);

                console.log(`[Worker] Job ${job.id}: Test case ${i + 1} verdict: ${result.verdict}`);

                // Store test case result
                testCaseResults.push({
                    testCase: i + 1,
                    verdict: result.verdict,
                    executionTime: result.executionTime,
                    memoryUsed: result.memoryUsed,
                    stdout: result.stdout,
                    stderr: result.stderr
                });

                // Check for execution errors first
                if (result.verdict === 'TLE') {
                    finalVerdict = "TLE";
                    finalOutput = `Time Limit Exceeded on test case ${i + 1}`;
                    break;
                } else if (result.verdict === 'MLE') {
                    finalVerdict = "MLE";
                    finalOutput = `Memory Limit Exceeded on test case ${i + 1}`;
                    break;
                } else if (result.verdict === 'RE') {
                    finalVerdict = "RE";
                    finalOutput = `Runtime Error on test case ${i + 1}: ${result.stderr}`;
                    break;
                }

                // 3. Validate output (only if execution was successful)
                const cleanOutput = result.stdout.trim();
                const cleanExpected = expectedOutput ? expectedOutput.trim() : "";

                if (cleanOutput !== cleanExpected) {
                    finalVerdict = "WA";
                    finalOutput = `Wrong Answer on test case ${i + 1}. Expected '${cleanExpected}', got '${cleanOutput}'`;
                    break;
                }
            }

            // If all test cases passed
            if (finalVerdict === "Accepted") {
                finalOutput = `All ${inputs.length} test case(s) passed`;
                // Update leaderboard if this is the FIRST accepted submission
                await updateLeaderboard({
                    teamId,
                    problemId,
                    contestId,
                    solveTime
                });
            }

            console.log(`[Worker] Job ${job.id} Final Verdict: ${finalVerdict}`);

            // 4. Persist submission to database
            await persistSubmission({
                teamId,
                problemId,
                contestId,
                submittedAt,
                verdict: finalVerdict,
                code,
                output: finalOutput,
                solveTime,
                testCaseResults
            });



            return {
                verdict: finalVerdict,
                output: finalOutput,
                testCaseResults
            };

        } catch (err) {
            console.error(`[Worker] Job ${job.id} System Error:`, err);

            // Fallback: save as internal error
            try {
                await db.query(
                    `INSERT INTO submissions (team_id, problem_id, contest_id, submitted_at, verdict, code, solve_time) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [teamId, problemId, contestId || null, new Date(submittedAt), "Error", code, solveTime || 0]
                );
            } catch (dbErr) {
                console.error("[Worker] Failed to save error verdict:", dbErr);
            }

            return {
                verdict: "Error",
                output: "Internal System Error: " + err.message
            };
        }
    },
    {
        connection: new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
        concurrency: 3,         // Limit concurrent Docker containers
        lockDuration: 10000,    // 10 seconds lock (longer for Docker operations)
    }
);

/**
 * Persist submission result to database
 */
async function persistSubmission(data) {
    const { teamId, problemId, contestId, verdict, code, solveTime, submittedAt } = data;

    await db.query(
        `
        INSERT INTO submissions (team_id, problem_id, contest_id, submitted_at, verdict, code, solve_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [teamId, problemId, contestId, submittedAt, verdict, code, solveTime]
    );
}


/**
 * Update leaderboard for accepted submissions
 */
async function updateLeaderboard(data) {
    const { teamId, problemId, contestId, solveTime } = data;

    // Check if this team already solved the problem
    const existing = await db.query(
        `
        SELECT 1
        FROM submissions
        WHERE team_id = $1
          AND problem_id = $2
          AND contest_id = $3
          AND verdict = 'Accepted'
        `,
        [teamId, problemId, contestId]
    );

    if (existing.rows.length > 0) {
        return;
    }

    const pointResult = await db.query(
        `
        SELECT points
        FROM contest_problems
        WHERE contest_id = $1 AND problem_id = $2
        `,
        [contestId, problemId]
    );

    const points =
        pointResult.rows.length > 0 ? pointResult.rows[0].points : 100;

    await db.query(
        `
        INSERT INTO leaderboard (team_id, team_name, contest_id, total_score, total_time)
        SELECT id, team_name, $2, $3, $4
        FROM teams
        WHERE id = $1
        ON CONFLICT (team_id, contest_id)
        DO UPDATE SET
            total_score = leaderboard.total_score + EXCLUDED.total_score,
            total_time  = leaderboard.total_time  + EXCLUDED.total_time
        `,
        [teamId, contestId, points, solveTime]
    );
}


// Graceful shutdown handler
process.on('SIGTERM', async () => {
    console.log('[Worker] Received SIGTERM, shutting down gracefully...');
    await worker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('[Worker] Received SIGINT, shutting down gracefully...');
    await worker.close();
    process.exit(0);
});

console.log('[Worker] Started and waiting for jobs...');

// Worker Event Logging
worker.on('completed', (job) => {
    console.log(`[Job ${job.id}] Completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`[Job ${job ? job.id : 'unknown'}] Failed: ${err.message}`);
});

worker.on('error', (err) => {
    console.error(`[Worker] Error: ${err.message}`);
});

worker.on('active', (job) => {
    console.log(`[Job ${job.id}] Started processing`);
});

export default worker;
