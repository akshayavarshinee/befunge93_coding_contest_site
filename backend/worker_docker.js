import { Worker } from "bullmq";
import { db } from "./db.js";
import DockerExecutor from "./dockerExecutor.js";
import Redis from "ioredis";
import env from "./env.js";

/**
 * Enhanced BullMQ Worker with Docker-based isolated execution
 * - Never executes user code directly
 * - Enforces strict resource limits and timeouts
 * - Automatic cleanup and graceful termination
 */

const dockerExecutor = new DockerExecutor({
    imageName: 'befunge-runner:latest',
    cpuQuota: 50000,        // 50% of one CPU core
    memoryLimit: '128m',    // 128 MB RAM limit
    timeoutMs: 5000,        // 5 second wall-clock timeout
    networkMode: 'none'     // No network access
});

const worker = new Worker(
    "submissions",
    async (job) => {
        console.log(`[Worker] Processing job ${job.id}`);
        const { code, submittedAt, problemId, userId, contestId } = job.data;

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
                const result = await dockerExecutor.execute(code, input);

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
                // We do this BEFORE persisting the submission so the check for existing solutions works correctly
                await updateLeaderboard({
                    userId,
                    problemId,
                    contestId,
                    submittedAt
                });
            }

            console.log(`[Worker] Job ${job.id} Final Verdict: ${finalVerdict}`);

            // 4. Persist submission to database
            await persistSubmission({
                userId,
                problemId,
                contestId,
                submittedAt,
                verdict: finalVerdict,
                code,
                output: finalOutput,
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
                    `INSERT INTO submissions (user_id, problem_id, contest_id, submitted_at, verdict, code) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [userId, problemId, contestId || null, new Date(submittedAt), "Error", code]
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
    const { userId, problemId, contestId, submittedAt, verdict, code, output } = data;

    const insertQuery = `
        INSERT INTO submissions (user_id, problem_id, contest_id, submitted_at, verdict, code) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;

    await db.query(insertQuery, [
        userId,
        problemId,
        contestId || null,
        new Date(submittedAt),
        verdict,
        code
    ]);
}

/**
 * Update leaderboard for accepted submissions
 */
async function updateLeaderboard(data) {
    const { userId, problemId, contestId, submittedAt } = data;

    console.log(`[Worker] Checking leaderboard update for User ${userId}, Problem ${problemId}, Contest ${contestId}`);

    // Check if user has already solved this problem
    const existingSol = await db.query(
        "SELECT id FROM submissions WHERE user_id = $1 AND problem_id = $2 AND contest_id = $3 AND verdict = 'Accepted'",
        [userId, problemId, contestId]
    );

    // Only update leaderboard for first accepted submission
    if (existingSol.rows.length === 0) {
        const userResult = await db.query("SELECT username FROM users WHERE id = $1", [userId]);
        
        if (userResult.rows.length > 0) {
            const username = userResult.rows[0].username;

            const start_time = await db.query("SELECT start_time FROM contests WHERE id = $1", [contestId]);
            
            // Fetch points for this problem in this contest
            const pointResult = await db.query(
                "SELECT points FROM contest_problems WHERE contest_id = $1 AND problem_id = $2",
                [contestId, problemId]
            );
            const points = pointResult.rows.length > 0 ? pointResult.rows[0].points : 100; // Default to 100 if not set

            if (start_time.rows.length > 0 && start_time.rows[0].start_time) {
                const timeDiff = Math.max(0, Math.floor((new Date(submittedAt) - new Date(start_time.rows[0].start_time)) / 1000));
                
                console.log(`[Worker] Updating leaderboard for ${username}: +${points} score, +${timeDiff}s time`);

                await db.query(
                    `INSERT INTO leaderboard (username, contest_id, total_score, total_time)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (username, contest_id) 
                     DO UPDATE SET 
                         total_score = leaderboard.total_score + $3,
                         total_time = leaderboard.total_time + $4`,
                    [username, contestId, points, timeDiff]
                );
            } else {
                console.log(`[Worker] Leaderboard update skipped: No start time found for contest ${contestId}`);
            }
        } else {
            console.log(`[Worker] Leaderboard update skipped: User ${userId} not found`);
        }
    } else {
        console.log(`[Worker] Leaderboard update skipped: User already solved this problem`);
    }
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
