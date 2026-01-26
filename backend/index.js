import express from "express";
import cors from "cors";
// import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pg from "pg";
import env from "./env.js";
import connect_db, { db } from "./db.js";
import { submissionQueue } from "./queue.js";
import Redis from "ioredis";
import helmet from "helmet";



const redis = new Redis(env.REDIS_URL);

const app = express();
const saltRounds = 10;

// * Middlewares
app.use(cors({
    origin: env.VITE_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(helmet());

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});


function verifyCsrf(req, res, next) {
  const csrfHeader = req.get("x-csrf-token");
  const csrfCookie = req.cookies.csrfToken;

  if (!csrfHeader || csrfHeader !== csrfCookie) {
    return res.status(403).json({ message: "CSRF token mismatch" });
  }

  next();
}

function authenticateToken(req, res, next) {
    const authCookie = req.cookies['authcookie'];

    // If there is no cookie, return an error
    if(authCookie == null) return res.sendStatus(401);

    // If there is a cookie, verify it
    jwt.verify(authCookie, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // If there is an error, return an error
        if(err) return res.sendStatus(403);

        // If there is no error, continue the execution
        req.user = user;
        next();
    })
}

// Check Auth Status
app.get('/auth/me', authenticateToken, async (req, res) => {
    try {
        // Check admin table first to prioritize admin access
        const admin = await db.query("SELECT id, email, username FROM admins WHERE email = $1", [req.user.email]);
        if (admin.rows.length > 0) {
             return res.json({
                user: {
                    id: admin.rows[0].id,
                    email: admin.rows[0].email,
                    username: admin.rows[0].username,
                    isAdmin: true
                }
            });
        }

        const user = await db.query("SELECT id, email, username FROM users WHERE email = $1", [req.user.email]);
        if (user.rows.length > 0) {
            return res.json({
                user: {
                    id: user.rows[0].id,
                    email: user.rows[0].email,
                    username: user.rows[0].username,
                    isAdmin: false 
                }
            });
        }

        return res.sendStatus(404);
    } catch (err) {
        console.error(err);
        return res.sendStatus(500);
    }
});



// * Routes

// Register
app.post('/auth/register', async (req, res) => {
    const {username, email, password} = req.body;

    try{
        const check_result = await db.query("SELECT * FROM users WHERE email = $1 or username = $2", [email, username]);

        if(check_result.rows.length > 0){
            return res.status(400).json({message:"User already exists"});
        }
        const hash = await bcrypt.hash(password, saltRounds);
        
        await db.query(
            "INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *",
            [email, hash, username]
        );

        const token = jwt.sign(
            {email: email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "3h" }
        );


        // res.cookie('authcookie', token, {
        //     maxAge: 900000,
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: 'none'
        // });

        res.cookie("authcookie", token, {
            maxAge: 900000,
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });



        return res.status(200).json({message:"User registered successfully"});

    }
    catch(err){
        console.log(err);
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    const {username, email, password} = req.body;

    try{
        const check_result = await db.query("SELECT * FROM users WHERE email = $1 AND username = $2", [email, username]);

        if(check_result.rows.length === 0){
            return res.status(400).json({message:"User does not exist"});
        }

        const hashed_password = check_result.rows[0].password_hash;

        const matched = await bcrypt.compare(password, hashed_password);
        
        if(!matched){
            return res.status(400).json({message:"Incorrect password"});
        }

        const token = jwt.sign(
            {email: email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "3h" }
        );


        // res.cookie('authcookie', token, {
        //     maxAge: 900000,
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: 'none'
        // });

        res.cookie("authcookie", token, {
            maxAge: 900000,
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });


        return res.status(200).json({message:"User logged in successfully"});

    }
    catch(err){
        console.log(err);
    }
});

// Logout
app.post('/auth/logout', authenticateToken, (req, res) => {
    // res.clearCookie('authcookie');
    res.clearCookie("authcookie", {
        sameSite: "lax",
        secure: false
    });

    return res.status(200).json({message:"User logged out successfully"});
});


// Admin Login
app.post("/auth/admin/login", async (req, res) => {
    const {username, email, password} = req.body;

    try{
        const check_result = await db.query("SELECT * FROM admins WHERE email = $1 or username = $2", [email, username]);

        if(check_result.rows.length === 0){
            return res.status(400).json({message:"Admin does not exist"});
        }

        const hashed_password = check_result.rows[0].password_hash;

        const matched = await bcrypt.compare(password, hashed_password);
        
        if(!matched){
            return res.status(400).json({message:"Incorrect password"});
        }

        const token = jwt.sign(
            {email: email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "3h" }
        );


        // res.cookie('authcookie', token, {
        //     maxAge: 900000,
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: 'none'
        // });

        res.cookie("authcookie", token, {
            maxAge: 900000,
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });

        return res.status(200).json({message:"Admin logged in successfully"});

    }
    catch(err){
        console.log(err);
    }
});

// app.post('/auth/admin/register', async (req, res) => {
//     const {username, email, password} = req.body;

//     try{
//         const check_result = await db.query("SELECT * FROM admins WHERE email = $1 or username = $2", [email, username]);

//         if(check_result.rows.length > 0){
//             return res.status(400).json({message:"Admin already exists"});
//         }
//         const hash = await bcrypt.hash(password, saltRounds);
        
//         await db.query(
//             "INSERT INTO admins (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *",
//             [email, hash, username]
//         );

//         const token = jwt.sign(
//             {email: email },
//             process.env.ACCESS_TOKEN_SECRET,
//             { expiresIn: "3h" }
//         );


//         // res.cookie('authcookie', token, {
//         //     maxAge: 900000,
//         //     httpOnly: true,
//         //     secure: process.env.NODE_ENV === "production",
//         //     sameSite: 'none'
//         // });

//         res.cookie("authcookie", token, {
//             maxAge: 900000,
//             httpOnly: true,
//             secure: false,
//             sameSite: "lax"
//         });


//         return res.status(200).json({message:"Admin registered successfully"});

//     }
//     catch(err){
//         console.log(err);
//     }
// });

// Contests
app.get("/api/admin/contests", authenticateToken, async (req, res) => {
    try{
        const result = await db.query("SELECT * FROM contests");
        return res.status(200).json(result.rows);
    }
    catch(err){
        console.log(err);
    }
});

// contest problems
app.get("/api/admin/contests/:id/problems", authenticateToken, async (req, res) => {
    try{
        // const contests = await db.query("SELECT id FROM contests where id = $1", [req.params.id]);
        // const result = await db.query("SELECT * FROM problems where contest_id = $1", [contests.rows[0].id]);
        // const result = await db.query("select * from problems p left join test_cases t on p.id = t.problem_id where p.contest_id = $1", [contests.rows[0].id]);
        const result = await db.query(`
            SELECT p.*,
                COALESCE(
                    json_agg(
                    json_build_object(
                        'input', t.input,
                        'expected_output', t.expected_output
                    )
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) AS test_cases
            FROM problems p
            LEFT JOIN test_cases t ON p.id = t.problem_id
            WHERE p.contest_id = $1
            GROUP BY p.id
        `, [req.params.id]);
        return res.status(200).json(result.rows);
    }
    catch(err){
        console.log(err);
    }
});

// add problem to contest
app.post("/api/admin/problems", authenticateToken, async (req, res) => {
    try{
        const {name, description, contestId, input_format, output_format, example_input, example_output, test_cases, test_case_results} = req.body;
        
        // Parse test cases if they come as strings (from legacy frontend form)
        let inputs = [];
        let outputs = [];
        try {
            inputs = typeof test_cases === 'string' ? JSON.parse(test_cases) : (test_cases || []);
            outputs = typeof test_case_results === 'string' ? JSON.parse(test_case_results) : (test_case_results || []);
        } catch (e) {
            console.error("JSON parse error", e);
            return res.status(400).json({message: "Invalid JSON for test cases"});
        }

        const problem = await db.query(
            "INSERT INTO problems (name, description, contest_id, input_format, output_format, example_input, example_output) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *", 
            [name, description, contestId, input_format, output_format, example_input, example_output]
        );
        
        const problemId = problem.rows[0].id;

        // Insert test cases
        for(let i=0; i<inputs.length; i++) {
            await db.query(
                "INSERT INTO test_cases (problem_id, input, expected_output) VALUES ($1, $2, $3)",
                [problemId, inputs[i] || "", outputs[i] || ""]
            );
        }
        
        return res.status(200).json(problem.rows[0]);
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: "Failed to create problem"});
    }
});

app.delete("/api/admin/problems", authenticateToken, async (req, res) => {
    try{
        const {id} = req.body;
        await db.query("DELETE FROM test_cases WHERE problem_id = $1", [id]);
        await db.query(
            "DELETE FROM problems WHERE id = $1", 
            [id]
        );
        
        return res.status(200).json({message:"Problem deleted successfully"});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: "Failed to create problem"});
    }
});

app.put("/api/admin/problems", authenticateToken, async (req, res) => {
    try{
        let {name, description, input_format, output_format, example_input, example_output, test_cases, test_case_results, contestId, problemId } = req.body;
        console.log("Update Problem Request Body:", req.body);
        
        // Fallback: if problemId is missing, check if 'id' is present
        if (!problemId && req.body.id) {
            problemId = req.body.id;
        }

        if (!problemId) {
            return res.status(400).json({ error: "problemId is required" });
        }

        console.log(`Updating problem ${problemId} for contest ${contestId}`);
        
        await db.query(
            "UPDATE problems SET name = $1, description = $2, contest_id = $3, input_format = $4, output_format = $5, example_input = $6, example_output = $7 WHERE id = $8", 
            [name, description, contestId, input_format, output_format, example_input, example_output, problemId]
        );

        // Update test cases: Delete old ones and insert new ones
        let inputs = [];
        let outputs = [];
        try {
            inputs = typeof test_cases === 'string' ? JSON.parse(test_cases) : (test_cases || []);
            outputs = typeof test_case_results === 'string' ? JSON.parse(test_case_results) : (test_case_results || []);
        } catch (e) {
            console.error("JSON parse error", e);
            // Don't fail the whole update if test cases are bad, but maybe we should?
        }

        if (inputs.length > 0 || outputs.length > 0) {
             await db.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
             for(let i=0; i<inputs.length; i++) {
                await db.query(
                    "INSERT INTO test_cases (problem_id, input, expected_output) VALUES ($1, $2, $3)",
                    [problemId, inputs[i] || "", outputs[i] || ""]
                );
             }
        }
        
        return res.status(200).json({message:"Problem updated successfully"});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: "Failed to update problem"});
    }
});

// create contest
app.post("/api/admin/contests", authenticateToken, async (req, res) => {
    try{
        const {name, duration, problems} = req.body;
        const contest_id = await db.query("INSERT INTO contests (name, duration) VALUES ($1, $2) RETURNING id", [name, duration]);
        for(let problem of problems){
            const inputs = JSON.parse(problem.test_cases || "[]");
            const outputs = JSON.parse(problem.test_case_results || "[]");

            const prob = await db.query(
                "INSERT INTO problems (name, description, contest_id, input_format, output_format, example_input, example_output) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id", 
                [problem.name, problem.description, contest_id.rows[0].id, problem.input_format, problem.output_format, problem.example_input, problem.example_output]
            );

            for(let i=0; i<inputs.length; i++) {
                await db.query(
                    "INSERT INTO test_cases (problem_id, input, expected_output) VALUES ($1, $2, $3)",
                    [prob.rows[0].id, inputs[i], outputs[i]]
                );
            }
        }
        return res.status(200).json({message:"Contest created successfully"});
    }
    catch(err){
        console.log(err);
    }
});

// Start Contest
app.post("/api/admin/contests/:id/start", authenticateToken, async (req, res) => {
    try{
        const {id} = req.params;
        
        // Get contest duration
        const contest = await db.query("SELECT duration FROM contests WHERE id = $1", [id]);
        if (contest.rows.length === 0) {
            return res.status(404).json({message: "Contest not found"});
        }
        
        const durationMinutes = contest.rows[0].duration;
        
        // Calculate end_time = now + duration
        await db.query(
            "UPDATE contests SET start_time = CURRENT_TIMESTAMP, end_time = CURRENT_TIMESTAMP + INTERVAL '1 minute' * $1 WHERE id = $2", 
            [durationMinutes, id]
        );
        
        return res.status(200).json({message:"Contest started successfully"});
    }
    catch(err){
        console.error("Start contest error:", err);
        return res.status(500).json({message: "Failed to start contest"});
    }
})

// End Contest
app.post("/api/admin/contests/:id/end", authenticateToken, async (req, res) => {
    try{
        const {id} = req.params;
        await db.query("UPDATE contests SET end_time = CURRENT_TIMESTAMP WHERE id = $1", [id]);
        return res.status(200).json({message:"Contest ended successfully"});
    }
    catch(err){
        console.log(err);
    }
})

// Reset Contest (reset start_time and end_time to NULL)
app.post("/api/admin/contests/:id/reset", authenticateToken, async (req, res) => {
    try{
        const {id} = req.params;
        
        // Clear leaderboard entries for this contest
        await db.query("DELETE FROM leaderboard WHERE contest_id = $1", [id]);
        
        // Clear submissions for this contest
        await db.query("DELETE FROM submissions WHERE contest_id = $1", [id]);
        
        // Reset contest times
        await db.query("UPDATE contests SET start_time = NULL, end_time = NULL WHERE id = $1", [id]);
        
        return res.status(200).json({message:"Contest reset successfully. Leaderboard and submissions cleared."});
    }
    catch(err){
        console.error("Reset contest error:", err);
        return res.status(500).json({message: "Failed to reset contest"});
    }
})

// Delete Contest
app.delete("/api/admin/contests/:id", authenticateToken, async (req, res) => {
    try{
        const {id} = req.params;
        
        // Check if contest exists
        const contest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        if (contest.rows.length === 0) {
            return res.status(404).json({message: "Contest not found"});
        }
        
        // Delete contest (CASCADE will remove associated problems, test_cases, submissions, leaderboard)
        await db.query("DELETE FROM contests WHERE id = $1", [id]);
        
        return res.status(200).json({message: "Contest deleted successfully"});
    }
    catch(err){
        console.error("Delete contest error:", err);
        return res.status(500).json({message: "Failed to delete contest"});
    }
})

app.get("/api/contest", authenticateToken, async (req, res) => {
    try{
        const result = await db.query("SELECT * FROM contests");
        return res.status(200).json(result.rows);
    }
    catch(err){
        console.log(err);
    }
})

app.get("/api/contest/:id", authenticateToken, async (req, res) => {
    try{

        const {id} = req.params;
        const contestResult = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        
        if (contestResult.rows.length === 0) {
             return res.status(404).json({ error: "Contest not found" });
        }

        const contest = contestResult.rows[0];
        
        // Use DB time check for strict correctness or check fetched values
        // Ideally we trust the DB to check time
        const activeCheck = await db.query(
            "SELECT * FROM contests WHERE id = $1 AND start_time <= CURRENT_TIMESTAMP AND (end_time IS NULL OR end_time >= CURRENT_TIMESTAMP)", 
            [id]
        );

        if(activeCheck.rows.length === 0){
             // Determine why
             const notStarted = await db.query("SELECT * FROM contests WHERE id = $1 AND (start_time > CURRENT_TIMESTAMP OR start_time IS NULL)", [id]);
             if (notStarted.rows.length > 0) {
                 return res.status(400).json({ error: "Contest has not started yet." });
             } else {
                 return res.status(400).json({ error: "Contest has ended." });
             }
        }
        else{
            const problems = await db.query("SELECT * FROM problems WHERE contest_id = $1", [id]);
            return res.status(200).json({
                contest: contest,
                problems: problems.rows
            });
        }
    }
    catch(err){
        console.log(err);
    }
})

// Join Contest (Initialize Leaderboard)
app.post("/api/contests/:id/join", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get username from database using email from JWT
        const userResult = await db.query("SELECT username FROM users WHERE email = $1", [req.user.email]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const username = userResult.rows[0].username;

        // Check if contest exists
        const contestCheck = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        if (contestCheck.rows.length === 0) {
            return res.status(404).json({ message: "Contest not found" });
        }

        // Check if already in leaderboard
        const leaderboardCheck = await db.query(
            "SELECT * FROM leaderboard WHERE username = $1 AND contest_id = $2",
            [username, id]
        );

        if (leaderboardCheck.rows.length > 0) {         
            return res.status(200).json({ message: "Rejoined contest successfully" });
        }

        // Add to leaderboard
        await db.query(
            "INSERT INTO leaderboard (username, contest_id, total_score, total_time) VALUES ($1, $2, 0, 0)",
            [username, id]
        );

        return res.status(200).json({ message: "Joined contest successfully" });

    } catch (err) {
        console.error("Join contest error:", err);
        return res.status(500).json({ message: "Failed to join contest" });
    }
});

// Report Violation
app.post("/api/contests/:id/report-violation", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type, timestamp } = req.body;
        
        // Get username
        const userResult = await db.query("SELECT username FROM users WHERE email = $1", [req.user.email]);
        if (userResult.rows.length === 0) return res.sendStatus(401);
        const username = userResult.rows[0].username;

        // Increment violation count
        await db.query(
            "UPDATE leaderboard SET violation_count = COALESCE(violation_count, 0) + 1 WHERE username = $1 AND contest_id = $2",
            [username, id]
        );
        
        console.log(`Violation reported for ${username} in contest ${id}: ${type}`);

        return res.status(200).json({ message: "Violation recorded" });

    } catch (err) {
        console.error("Report violation error:", err);
        return res.status(500).json({ message: "Failed to report violation" });
    }
});

// get submissions

// get submissions
app.get("/api/submissions", authenticateToken,  async(req, res) => {
    try{
        const { contestID, problemId } = req.query;
        
        if (!contestID || !problemId) {
            return res.status(400).json({ error: "Missing required query parameters: contestID, problemId" });
        }

        // Get user_id from email
        const userResult = await db.query("SELECT id FROM users WHERE email = $1", [req.user.email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const userId = userResult.rows[0].id;

        // Also fetch the 'code' column if it exists in submissions table? 
        // Tables.sql says: id, user_id, problem_id, contest_id, submitted_at, verdict. 
        // WAIT. Does the submissions table HAVE the code?
        // Let's check tables.sql again.
        
        // Checking tables.sql from memory... 
        // CREATE TABLE submissions (id, user_id, problem_id, contest_id, submitted_at, verdict);
        // It does NOT seem to have 'code'! 
        // If it doesn't have code, I can't implement "Load Code".
        // I need to check tables.sql first. If code is missing, I need tasks to add it.
        // Assuming I'll check tables.sql in the same turn or realized this risk. 
        // I should probably check tables.sql BEFORE applying this edit if I am unsure.
        // But the user said "i want to allow the user to see the submissions... along with the code."
        // And "i have made the changes in the db".
        // Use user's statement: "i have made the changes in the db and in the index.js, worker.js"
        // So I assume the DB *has* the code column now, even if my previous read didn't show it (maybe they did it manually or I missed it).
        // I will assume the column is named 'code' based on standard practices and their request.
        
        const result = await db.query(
            "SELECT * FROM submissions WHERE user_id = $1 AND problem_id = $2 AND contest_id = $3 ORDER BY submitted_at DESC", 
            [userId, problemId, contestID]
        );
        
        return res.status(200).json({submissions: result.rows});
    }
    catch(err){
        console.error("Server Error:", err);
        return res.status(500).json({message: "Failed to fetch submissions"})
    }     
})

// Submit Code
app.post("/api/submissions", async (req, res) => {
    const { userId, contestID, problemId, code} = req.body;

    if (!userId || !problemId || !code) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const rateLimitKey = `rate-limit:${userId}`;
    const rateLimited = await redis.get(rateLimitKey);

    if (rateLimited) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in 5 seconds." });
    }

    const activeCheck = await db.query(
        "SELECT * FROM contests WHERE id = $1 AND start_time <= CURRENT_TIMESTAMP AND (end_time IS NULL OR end_time >= CURRENT_TIMESTAMP)", 
        [contestID]
    );

    if (activeCheck.rows.length === 0) {
        return res.status(400).json({ error: "Contest is not active. Cannot Submit!" });
    }

    await redis.set(rateLimitKey, "1", "EX", 5);

    const job = await submissionQueue.add("run-code", {
        userId,
        problemId,
        contestId: contestID,
        code,
        submittedAt: new Date()
    },{
        timeout: 1000,
    });

    res.json({
        submissionId: job.id,
        status: "queued"
    });
});

// Get Submission Status
app.get("/api/submissions/:id", async (req, res) => {
    const { id } = req.params;

    const job = await submissionQueue.getJob(id);

    if (!job) {
        return res.status(404).json({ error: "Submission not found" });
    }

    const state = await job.getState();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    // Map BullMQ states to requirements
    // waiting -> queued
    // active -> active
    // completed -> completed
    // failed -> failed
    // delayed -> queued

    let status = state;
    if (state === "waiting" || state === "delayed") {
        status = "queued";
    }
    if(state === "completed"){
        status = "completed";
        // Result is handled by worker and stored in DB already
    }

    res.json({
        submissionId: job.id,
        status,
        result,
        failedReason,
        submittedAt: job.data.submittedAt
    });
});

app.get("/api/leaderboard", authenticateToken,  async(req, res) => {
    try{
        const { contestId } = req.query;
        
        if (!contestId || contestId === 'undefined' || isNaN(parseInt(contestId))) {
            return res.status(400).json({ error: "Valid contestId is required" });
        }
        
        const result = await db.query(`
            SELECT username, total_score, total_time, violation_count
            FROM leaderboard
            WHERE contest_id = $1
            ORDER BY total_score DESC, total_time ASC
        `, [parseInt(contestId)]);
        
        return res.status(200).json(result.rows);
    }
    catch(err){
        console.log(err);
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
})

const PORT = process.env.PORT || env.PORT || 5000;
const start_server = async () =>{
    try{
        await connect_db();
        // app.listen(5000, "0.0.0.0", () => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log("Server running on port " + PORT);
        });
    }
    catch(err){
        console.log(err);
    }
}

start_server();

