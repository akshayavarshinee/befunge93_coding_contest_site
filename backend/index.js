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
import LocalExecutor from "./localExecutor.js";


const redis = new Redis(env.REDIS_URL);

const app = express();
const saltRounds = 10;

// * Middlewares
const allowedOrigins = [
    env.VITE_URL,
    "http://localhost:8080",
    "http://localhost:5173",
].filter(Boolean).map(url => url.replace(/\/$/, ""));

// Add protocol variations
const baseViteUrl = (env.VITE_URL || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
if (baseViteUrl && !baseViteUrl.includes("localhost")) {
    allowedOrigins.push(`https://${baseViteUrl}`);
    allowedOrigins.push(`http://${baseViteUrl}`);
}

const uniqueOrigins = [...new Set(allowedOrigins)];
console.log("Allowed CORS origins:", uniqueOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        if (uniqueOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected: ${origin}. Allowed: ${JSON.stringify(uniqueOrigins)}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));
app.options(/.*/, cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

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
        // Check admin table first
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

        // Check teams table for team lead access
        const teamRes = await db.query("SELECT id, tl_email as email, team_name FROM teams WHERE tl_email = $1", [req.user.email]);
        if (teamRes.rows.length > 0) {
            const team = teamRes.rows[0];
            return res.json({
                user: {
                    id: team.id,
                    email: team.email,
                    username: `${team.id}-${team.team_name}`, // Formatted for presentation
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

async function logActivity(eventType, actorType, actorId, targetType, targetId, details) {
    const timestamp = new Date().toISOString();
    console.log(`[LOG][${timestamp}] ${eventType} | Actor: ${actorType}(${actorId}) | Target: ${targetType}(${targetId}) | Details:`, details || {});
}



// * Routes

// Register Team
app.post('/auth/register', async (req, res) => {
    const {
        teamName, 
        tlName, 
        tlEmail, 
        college, 
        password,
        m1Name,
        m1Email,
        m1College
    } = req.body;

    if (!teamName || !tlName || !tlEmail || !password || !college) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try{
        const check_result = await db.query("SELECT * FROM teams WHERE tl_email = $1", [tlEmail]);

        if(check_result.rows.length > 0){
            return res.status(400).json({message:"Team with this email already exists"});
        }
        
        const hash = await bcrypt.hash(password, saltRounds);
        
        // Use a transaction
        await db.query('BEGIN');
        
        const newTeam = await db.query(
            "INSERT INTO teams (tl_email, team_name, password_hash) VALUES ($1, $2, $3) RETURNING id",
            [tlEmail, teamName, hash]
        );
        const teamId = newTeam.rows[0].id;

        // Insert Leader
        await db.query(
            "INSERT INTO users (team_id, full_name, email, college) VALUES ($1, $2, $3, $4)",
            [teamId, tlName, tlEmail, college]
        );

        // Insert Member 1 if exists
        if (m1Email && m1Name && m1College) {
            await db.query(
                "INSERT INTO users (team_id, full_name, email, college) VALUES ($1, $2, $3, $4)",
                [teamId, m1Name, m1Email, m1College]
            );
        }

        await db.query('COMMIT');

        const token = jwt.sign(
            {email: tlEmail, id: teamId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "6h" }
        );

        res.cookie("authcookie", token, {
            maxAge: 21600000, // 6h
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            domain: env.NODE_ENV === "production" ? (env.DOMAIN || null) : "localhost"
        });

        await logActivity("TEAM_REGISTER", "team", teamId, "team", teamId, { teamName });

        return res.status(200).json({message:"Team registered successfully"});
    }
    catch(err){
        await db.query('ROLLBACK');
        console.error(err);
        return res.status(500).json({message: "Registration failed"});
    }
});

// Login Team (Idempotent password setup)
app.post('/auth/login', async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try{
        const check_result = await db.query("SELECT * FROM teams WHERE tl_email = $1", [email]);

        if(check_result.rows.length === 0){
            return res.status(400).json({message:"Team not found"});
        }

        const team = check_result.rows[0];
        
        if (!team.password_hash) {
            // First time login / password setup
            const hash = await bcrypt.hash(password, saltRounds);
            await db.query("UPDATE teams SET password_hash = $1 WHERE id = $2", [hash, team.id]);
            team.password_hash = hash;
            console.log(`[Auth] Password setup for team ${team.id}`);
        }
        else{
            const matched = await bcrypt.compare(password, team.password_hash);
            if(!matched){
                return res.status(400).json({message:"Incorrect password"});
            }
        }

        const token = jwt.sign(
            {email: email, id: team.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "3h" }
        );

        res.cookie("authcookie", token, {
            maxAge: 21600000, // 6h
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            domain: env.NODE_ENV === "production" ? (env.DOMAIN || null) : "localhost"
        });

        await logActivity("TEAM_LOGIN", "team", team.id, "team", team.id, null);

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: team.id,
                email: team.tl_email,
                username: `${team.id}-${team.team_name}`
            }
        });

    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Login failed"});
    }
});

// Logout
app.post('/auth/logout', authenticateToken, (req, res) => {
    // res.clearCookie('authcookie');
    res.clearCookie("authcookie", {
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        secure: env.NODE_ENV === "production",
        domain: env.NODE_ENV === "production" ? (env.DOMAIN || null) : "localhost"
    });

    return res.status(200).json({message:"User logged out successfully"});
});


// Admin Login (Email/Password only)
app.post("/auth/admin/login", async (req, res) => {
    const {email, password} = req.body;

    try{
        const check_result = await db.query("SELECT * FROM admins WHERE email = $1", [email]);

        if(check_result.rows.length === 0){
            return res.status(400).json({message:"Admin does not exist"});
        }

        const admin = check_result.rows[0];
        const matched = await bcrypt.compare(password, admin.password_hash);
        
        if(!matched){
            return res.status(400).json({message:"Incorrect password"});
        }

        const token = jwt.sign(
            {email: email, id: admin.id, isAdmin: true },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "3h" }
        );


        res.cookie("authcookie", token, {
            maxAge: 21600000, // 6h
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: env.NODE_ENV === "production" ? "none" : "lax",
            domain: env.NODE_ENV === "production" ? (env.DOMAIN || null) : "localhost"
        });

        await logActivity("ADMIN_LOGIN", "admin", admin.id, "admin", admin.id, null);

        return res.status(200).json({
            message: "Admin login successful",
            user: {
                id: admin.id,
                email: admin.email,
                username: admin.username,
                isAdmin: true
            }
        });

    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Admin login error"});
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
        const result = await db.query(`
            SELECT p.*, cp.points, cp."order",
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
            JOIN contest_problems cp ON p.id = cp.problem_id
            LEFT JOIN test_cases t ON p.id = t.problem_id
            WHERE cp.contest_id = $1
            GROUP BY p.id, cp.points, cp."order"
            ORDER BY cp."order" ASC
        `, [req.params.id]);
        return res.status(200).json(result.rows);
    }
    catch(err){
        console.log(err);
    }
});

// Search Problems (for adding to contest)
app.get("/api/admin/problems/search", authenticateToken, async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;
        let query = "SELECT * FROM problems";
        let params = [];
        
        if (q) {
            query += " WHERE name ILIKE $1";
            params.push(`%${q}%`);
        }
        
        query += " ORDER BY id DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
        params.push(limit, offset);
        
        const result = await db.query(query, params);
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: "Search failed"});
    }
});

// Link existing problem to contest
app.post("/api/admin/contests/:id/problems", authenticateToken, async(req, res) => {
    try {
        const { id } = req.params; // contest_id
        const { problemId, points } = req.body;
        
        // Check if already exists
        const check = await db.query(
            "SELECT * FROM contest_problems WHERE contest_id = $1 AND problem_id = $2",
            [id, problemId]
        );
        
        if (check.rows.length > 0) {
            return res.status(400).json({message: "Problem already added to this contest"});
        }
        
        await db.query(
            "INSERT INTO contest_problems (contest_id, problem_id, points) VALUES ($1, $2, $3)",
            [id, problemId, points || 100]
        );
        
        return res.status(200).json({message: "Problem added to contest"});
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "Failed to add problem"});
    }
});

// Create new problem (and optionally link to contest)
app.post("/api/admin/problems", authenticateToken, async (req, res) => {
    try{
        const {name, description, contestId, input_format, output_format, example_input, example_output, test_cases, points} = req.body;
        
        // Parse test cases - Expecting a single consistent array of objects {input, expected_output}
        let parsedTestCases = [];
        try {
            parsedTestCases = typeof test_cases === 'string' ? JSON.parse(test_cases) : (test_cases || []);
        } catch (e) {
            console.error("JSON parse error", e);
            return res.status(400).json({message: "Invalid JSON for test cases"});
        }

        const problem = await db.query(
            "INSERT INTO problems (name, description, input_format, output_format, example_input, example_output) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
            [name, description, input_format, output_format, example_input, example_output]
        );
        
        const problemId = problem.rows[0].id;

        // Link to contest if contestId is provided
        if (contestId) {
             await db.query(
                "INSERT INTO contest_problems (contest_id, problem_id, points) VALUES ($1, $2, $3)",
                [contestId, problemId, points || 100]
            );
        }

        // Insert test cases
        for(let tc of parsedTestCases) {
            await db.query(
                "INSERT INTO test_cases (problem_id, input, expected_output) VALUES ($1, $2, $3)",
                [problemId, tc.input || "", tc.expected_output || ""]
            );
        }
        
        await logActivity("PROBLEM_CREATE", "admin", req.user.id, "problem", problemId, { name, contestId });

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
        
        await logActivity("PROBLEM_DELETE", "admin", req.user.id, "problem", id, null);

        return res.status(200).json({message:"Problem deleted successfully"});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: "Failed to create problem"});
    }
});

app.put("/api/admin/problems", authenticateToken, async (req, res) => {
    try{
        let {name, description, input_format, output_format, example_input, example_output, test_cases, points, contestId, problemId } = req.body;
        console.log("Update Problem Request Body:", req.body);
        
        // Fallback: if problemId is missing, check if 'id' is present
        if (!problemId && req.body.id) {
            problemId = req.body.id;
        }

        if (!problemId) {
            return res.status(400).json({ error: "problemId is required" });
        }

        // Update problem details (independent of contest)
        await db.query(
            "UPDATE problems SET name = $1, description = $2, input_format = $3, output_format = $4, example_input = $5, example_output = $6 WHERE id = $7", 
            [name, description, input_format, output_format, example_input, example_output, problemId]
        );

        // Update contest specific details (points) if contestId is present
        if (contestId) {
             await db.query(
                "UPDATE contest_problems SET points = $1 WHERE contest_id = $2 AND problem_id = $3",
                [points || 100, contestId, problemId]
            );
        }

        // Update test cases: Delete old ones and insert new ones
        // Expecting test_cases to be array of Objects
        let parsedTestCases = [];
        try {
            parsedTestCases = typeof test_cases === 'string' ? JSON.parse(test_cases) : (test_cases || []);
        } catch (e) {
            console.error("JSON parse error", e);
        }

        if (parsedTestCases.length > 0) {
             await db.query("DELETE FROM test_cases WHERE problem_id = $1", [problemId]);
             for(let tc of parsedTestCases) {
                await db.query(
                    "INSERT INTO test_cases (problem_id, input, expected_output) VALUES ($1, $2, $3)",
                    [problemId, tc.input || "", tc.expected_output || ""]
                );
             }
        }
        
        await logActivity("PROBLEM_UPDATE", "admin", req.user.id, "problem", problemId, { name, contestId });

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
                "INSERT INTO problems (name, description, input_format, output_format, example_input, example_output) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", 
                [problem.name, problem.description, problem.input_format, problem.output_format, problem.example_input, problem.example_output]
            );
            const probId = prob.rows[0].id;

            // Link via mapping table
            await db.query(
                "INSERT INTO contest_problems (contest_id, problem_id, points, \"order\") VALUES ($1, $2, $3, $4)",
                [contest_id.rows[0].id, probId, 100, 0]
            );

            for(let i=0; i<inputs.length; i++) {
                await db.query(
                    "INSERT INTO test_cases (problem_id, input, expected_output) VALUES ($1, $2, $3)",
                    [probId, inputs[i], outputs[i]]
                );
            }
        }
        await logActivity("CONTEST_CREATE", "admin", req.user.id, "contest", contest_id.rows[0].id, { name, problemsCount: problems.length });

        return res.status(200).json({message:"Contest created successfully"});
    }
    catch(err){
        console.log(err);
    }
});

// Start Contest
app.post("/api/admin/contests/:id/start", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const contest = await db.query(
            "SELECT duration FROM contests WHERE id = $1",
            [id]
        );
        if (contest.rows.length === 0) {
            return res.status(404).json({ message: "Contest not found" });
        }

        const durationMinutes = contest.rows[0].duration;

        await db.query(`
            UPDATE contests
            SET
                start_time = CURRENT_TIMESTAMP,
                last_state_change_at = CURRENT_TIMESTAMP,
                total_active_seconds = 0,
                is_paused = FALSE,
                end_time = CURRENT_TIMESTAMP + INTERVAL '1 minute' * $1
            WHERE id = $2
        `, [durationMinutes, id]);

        await logActivity("CONTEST_START", "admin", req.user.id, "contest", id, { durationMinutes });

        const updatedContest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        res.status(200).json({ message: "Contest started successfully", contest: updatedContest.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to start contest" });
    }
});


// End Contest
app.post("/api/admin/contests/:id/end", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(`
            UPDATE contests
            SET
                total_active_seconds =
                    CASE
                        WHEN is_paused = FALSE AND last_state_change_at IS NOT NULL
                        THEN total_active_seconds
                             + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_state_change_at))::INT
                        ELSE total_active_seconds
                    END,
                is_paused = TRUE,
                end_time = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);

        await logActivity("CONTEST_END", "admin", req.user.id, "contest", id, null);

        const updatedContest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        res.status(200).json({ message: "Contest ended successfully", contest: updatedContest.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to end contest" });
    }
});


// Reset Contest (reset start_time and end_time to NULL)
app.post("/api/admin/contests/:id/reset", authenticateToken, async (req, res) => {
    try{
        const {id} = req.params;
        
        // Clear leaderboard entries for this contest
        await db.query("DELETE FROM leaderboard WHERE contest_id = $1", [id]);
        
        // Clear submissions for this contest
        await db.query("DELETE FROM submissions WHERE contest_id = $1", [id]);
        
        // Reset contest times
        await db.query(`UPDATE contests
            SET
                start_time = NULL,
                end_time = NULL,
                last_state_change_at = NULL,
                total_active_seconds = 0,
                is_paused = FALSE
            WHERE id = $1;
        `, [id]);
        
        await logActivity("CONTEST_RESET", "admin", req.user.id, "contest", id, null);

        const updatedContest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        return res.status(200).json({
            message: "Contest reset successfully. Leaderboard and submissions cleared.",
            contest: updatedContest.rows[0]
        });
    }
    catch(err){
        console.error("Reset contest error:", err);
        return res.status(500).json({message: "Failed to reset contest"});
    }
})

// Extend Contest Duration (Stopwatch Model)
app.post("/api/admin/contests/:id/extend", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { minutes } = req.body;
        
        if (!minutes || isNaN(minutes)) {
            return res.status(400).json({ message: "Invalid minutes provided" });
        }

        // authoritative duration update
        await db.query(
            "UPDATE contests SET duration = duration + $1, end_time = end_time + INTERVAL '1 minute' * $2 WHERE id = $3",
            [minutes, minutes, id]
        );

        const updatedContest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        await logActivity("CONTEST_EXTEND", "admin", req.user.id, "contest", id, { addedMinutes: minutes });

        return res.status(200).json({ message: `Contest extended`, contest: updatedContest.rows[0] });
    } catch (err) {
        console.error("Extend contest error:", err);
        return res.status(500).json({ message: "Failed to extend contest" });
    }
});

// Pause Contest
app.post("/api/admin/contests/:id/pause", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Correct Pause Logic: Mark the active segment as finished and set state to paused.
        await db.query(`
            UPDATE contests
            SET
                total_active_seconds =
                    total_active_seconds
                    + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_state_change_at))::INT,
                last_state_change_at = CURRENT_TIMESTAMP,
                is_paused = TRUE
            WHERE id = $1 AND is_paused = FALSE AND last_state_change_at IS NOT NULL
        `, [id]);

        await logActivity("CONTEST_PAUSE", "admin", req.user.id, "contest", id, null);

        const updatedContest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        res.status(200).json({ message: "Contest paused", contest: updatedContest.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to pause contest" });
    }
});

// Resume Contest
app.post("/api/admin/contests/:id/resume", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Correct Resume Logic: Extend end_time by the duration of the pause.
        await db.query(`
            UPDATE contests
            SET
                end_time = end_time + (CURRENT_TIMESTAMP - last_state_change_at),
                last_state_change_at = CURRENT_TIMESTAMP,
                is_paused = FALSE
            WHERE id = $1 AND is_paused = TRUE
        `, [id]);

        await logActivity("CONTEST_RESUME", "admin", req.user.id, "contest", id, null);

        const updatedContest = await db.query("SELECT * FROM contests WHERE id = $1", [id]);
        res.status(200).json({ message: "Contest resumed", contest: updatedContest.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to resume contest" });
    }
});
// Export Leaderboard to CSV
app.get("/api/admin/contests/:id/export", authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
    }

    try {
        const { id } = req.params;

        // Fetch leaderboard in correct order
        const leaderboardResult = await db.query(`
            SELECT l.team_id, l.team_name, l.total_score, l.total_time
            FROM leaderboard l
            WHERE l.contest_id = $1
            ORDER BY l.total_score DESC, l.total_time ASC
        `, [id]);

        const teamIds = leaderboardResult.rows.map(r => r.team_id);

        if (teamIds.length === 0) {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=leaderboard_contest_${id}.csv`);
            return res.send("team_id,team_name,team_leader_name,team_leader_email,team_leader_college,member_name,member_email,member_college\n");
        }

        // Fetch teams and their users
        const teamsInfo = await db.query("SELECT id, team_name, tl_email FROM teams WHERE id = ANY($1)", [teamIds]);
        const usersInfo = await db.query("SELECT team_id, full_name, email, college FROM users WHERE team_id = ANY($1)", [teamIds]);

        const teamsMap = {};
        teamsInfo.rows.forEach(t => { teamsMap[t.id] = t; });

        const usersByTeam = {};
        usersInfo.rows.forEach(u => {
            if (!usersByTeam[u.team_id]) usersByTeam[u.team_id] = [];
            usersByTeam[u.team_id].push(u);
        });

        const headers = ["team_id", "team_name", "team_leader_name", "team_leader_email", "team_leader_college", "member_name", "member_email", "member_college"];
        let csvContent = "\ufeff" + headers.join(",") + "\n"; 

        for (const entry of leaderboardResult.rows) {
            const teamId = entry.team_id;
            const team = teamsMap[teamId] || { team_name: entry.team_name, tl_email: "" };
            const users = usersByTeam[teamId] || [];

            const leader = users.find(u => u.email === team.tl_email) || users[0] || {};
            const member = users.find(u => u.email !== team.tl_email) || (users.length > 1 ? users[1] : {});

            const rowData = [
                teamId,
                team.team_name,
                leader.full_name || "",
                leader.email || "",
                leader.college || "",
                member.full_name || "",
                member.email || "",
                member.college || ""
            ];

            const escapeCSV = (val) => {
                const str = String(val === null || val === undefined ? "" : val);
                if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            csvContent += rowData.map(escapeCSV).join(",") + "\n";
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=leaderboard_contest_${id}.csv`);
        res.status(200).send(csvContent);

    } catch (err) {
        console.error("Export error:", err);
        return res.status(500).json({ message: "Failed to export leaderboard" });
    }
});


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
        
        await logActivity("CONTEST_DELETE", "admin", req.user.id, "contest", id, null);

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
        
        // Calculate remaining time or status based on pause state
        let currentTime = new Date();
        let endTime = new Date(contest.end_time);
        
        
        // Check if contest is active (handling pause)
        // If paused, we effectively extend the potential end time visually, but the server just knows it's paused.
        
        if(!contest.start_time){
             return res.status(400).json({ error: "Contest has not started yet." });
        }

        const problems = await db.query(`
            SELECT p.*, cp.points, cp."order"
            FROM problems p
            JOIN contest_problems cp ON p.id = cp.problem_id
            WHERE cp.contest_id = $1
            ORDER BY cp."order" ASC
        `, [id]);
        
        return res.status(200).json({
            contest: contest,
            problems: problems.rows
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({error: "Server error"});
    }
})


// Join Contest (Initialize Leaderboard)
app.post("/api/contests/:id/join", authenticateToken, async (req, res) => {
  try {
    const contestId = parseInt(req.params.id, 10);

    // Get team lead details
    const teamResult = await db.query("SELECT id FROM teams WHERE tl_email = $1", [req.user.email]);
    if (teamResult.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
    }
    const teamId = teamResult.rows[0].id;

    const result = await db.query(
      `
      INSERT INTO leaderboard (team_id, team_name, contest_id, total_score, total_time, violation_count)
      SELECT id, team_name, $2, 0, 0, 0
      FROM teams
      WHERE id = $1
      ON CONFLICT (team_id, contest_id) DO NOTHING
      RETURNING team_id
      `,
      [teamId, contestId]
    );

    if (result.rowCount === 1) {
      await logActivity("CONTEST_JOIN", "team", teamId, "contest", contestId, null);
      return res.status(200).json({ message: "Joined contest successfully" });
    }

    // No row inserted → either already joined OR contest missing
    const contestExists = await db.query("SELECT EXISTS (SELECT 1 FROM contests WHERE id = $1)", [contestId]);

    if (!contestExists.rows[0].exists) {
      return res.status(404).json({ message: "Contest not found" });
    }

    return res.status(200).json({ message: "Rejoined contest successfully" });

  } catch (err) {
    console.error("Join contest error:", err);
    return res.status(500).json({ message: "Failed to join contest" });
  }
});


// Report Violation
app.post("/api/contests/:id/report-violation", authenticateToken, async (req, res) => {
  try {
    const contestId = parseInt(req.params.id, 10);

    const teamResult = await db.query("SELECT id FROM teams WHERE tl_email = $1", [req.user.email]);
    if (teamResult.rows.length === 0) {
        return res.status(404).json({ message: "Team not found" });
    }
    const teamId = teamResult.rows[0].id;

    const result = await db.query(
      `
      UPDATE leaderboard
      SET violation_count = COALESCE(violation_count, 0) + 1
      WHERE
        team_id = $1
        AND contest_id = $2
      RETURNING violation_count
      `,
      [teamId, contestId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Team not in contest" });
    }

    await logActivity("VIOLATION", "system", null, "team", teamId, { contestId, violationCount: result.rows[0].violation_count });

    return res.status(200).json({
      message: "Violation recorded",
      violationCount: result.rows[0].violation_count
    });

  } catch (err) {
    console.error("Report violation error:", err);
    return res.status(500).json({ message: "Failed to report violation" });
  }
});



// get submissions
app.get("/api/submissions", authenticateToken,  async(req, res) => {
    try{
        const { contestID, problemId } = req.query;
        
        if (!contestID || !problemId) {
            return res.status(400).json({ error: "Missing required query parameters: contestID, problemId" });
        }

        // Get teamId from user (email)
        const teamResult = await db.query("SELECT id FROM teams WHERE tl_email = $1", [req.user.email]);
        if (teamResult.rows.length === 0) {
            return res.status(404).json({ message: "Team not found" });
        }
        const teamId = teamResult.rows[0].id;
        const result = await db.query(
            `SELECT s.*, t.team_name 
             FROM submissions s
             JOIN teams t ON s.team_id = t.id
             WHERE s.team_id = $1 AND s.problem_id = $2 AND s.contest_id = $3 
             ORDER BY s.submitted_at DESC`, 
            [teamId, problemId, contestID]
        );

        const submissions = result.rows.map(row => ({
            ...row,
            username: `${row.team_id}-${row.team_name}`
        }));
        
        return res.status(200).json({submissions});
    }
    catch(err){
        console.error("Server Error:", err);
        return res.status(500).json({message: "Failed to fetch submissions"})
    }     
})

// // Submit Code
// app.post("/api/submissions", async (req, res) => {
//     const { userId, contestID, problemId, code} = req.body;

//     if (!userId || !problemId || !code) {
//         return res.status(400).json({ error: "Missing required fields" });
//     }

//     const rateLimitKey = `rate-limit:${userId}`;
//     const rateLimited = await redis.get(rateLimitKey);

//     if (rateLimited) {
//         return res.status(429).json({ error: "Rate limit exceeded. Try again in 5 seconds." });
//     }

//     const contest = await db.query(
//       `
//       SELECT start_time, end_time, is_paused
//       FROM contests
//       WHERE id = $1
//       `,
//       [contestID]
//     );

//     if (contest.rows.length === 0) {
//       return res.status(404).json({ error: "Contest not found" });
//     }

//     const { start_time, end_time, is_paused } = contest.rows[0];
//     const now = new Date();

//     if (is_paused) {
//       return res.status(400).json({
//         error: "Contest is paused. Submissions are temporarily disabled."
//       });
//     }

//     if (!start_time || now < start_time || (end_time && now > end_time)) {
//       return res.status(400).json({
//         error: "Contest is not active. Cannot submit."
//       });
//     }

//     await redis.set(rateLimitKey, "1", "EX", 5);

//     const job = await submissionQueue.add("run-code", {
//         userId,
//         problemId,
//         contestId: contestID,
//         code,
//         submittedAt: new Date()
//     },{
//         timeout: 1000,
//     });

//     res.json({
//         submissionId: job.id,
//         status: "queued"
//     });
// });

// Submit Code (Stopwatch Model)
app.post("/api/submissions", authenticateToken, async (req, res) => {
    const { contestID, problemId, code } = req.body;

    if (!contestID || !problemId || !code) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Resolve Team ID from token
    const teamResult = await db.query("SELECT id FROM teams WHERE tl_email = $1", [req.user.email]);
    if (teamResult.rows.length === 0) {
        return res.status(404).json({ error: "Team not found" });
    }
    const teamId = teamResult.rows[0].id;

    // Rate limit per TEAM
    const rateLimitKey = `rate-limit:${teamId}`;
    if (await redis.get(rateLimitKey)) {
        return res.status(429).json({
            error: "Rate limit exceeded. Try again in 5 seconds."
        });
    }

    // Fetch stopwatch state
    const result = await db.query(`
        SELECT
            start_time,
            duration,
            total_active_seconds,
            last_state_change_at,
            is_paused
        FROM contests
        WHERE id = $1
    `, [contestID]);

    if (result.rows.length === 0) {
        return res.status(404).json({ error: "Contest not found" });
    }

    const {
        start_time,
        duration,
        total_active_seconds,
        last_state_change_at,
        is_paused
    } = result.rows[0];

    const now = Date.now();

    if (!start_time) {
        return res.status(400).json({
            error: "Contest has not started yet. Cannot submit."
        });
    }

    // Submissions disabled while paused
    if (is_paused) {
        return res.status(400).json({
            error: "Contest is paused. Submissions are temporarily disabled."
        });
    }

    // Compute elapsed ACTIVE contest time using DB clock to prevent skew
    const timeCheck = await db.query(`
        SELECT 
            total_active_seconds + 
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_state_change_at))::INT as elapsed
        FROM contests
        WHERE id = $1
    `, [contestID]);
    
    const elapsedActiveTime = timeCheck.rows[0].elapsed;

    // Contest window check
    if (elapsedActiveTime >= duration * 60) {
        return res.status(403).json({
            error: "Contest time is over"
        });
    }

    // Freeze time immediately
    const solveTime = elapsedActiveTime;
    const submittedAt = new Date(now);

    await redis.set(rateLimitKey, "1", "EX", 5);

    // Enqueue job with frozen time and team metadata
    const job = await submissionQueue.add(
        "run-code",
        {
            teamId,
            contestId: contestID,
            problemId,
            code,
            solveTime,
            submittedAt
        },
        { timeout: 5000 }
    );

    await logActivity("SUBMISSION_QUEUED", "team", teamId, "submission", job.id, { problemId, contestID, solveTime });

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
            SELECT t.id, t.team_name, l.total_score, l.total_time, l.violation_count
            FROM leaderboard l
            JOIN teams t ON l.team_id = t.id
            WHERE l.contest_id = $1
            ORDER BY l.total_score DESC, l.total_time ASC
        `, [parseInt(contestId)]);

        const formatted = result.rows.map(row => ({
            username: `${row.id}-${row.team_name}`,
            total_score: row.total_score,
            total_time: row.total_time,
            violation_count: row.violation_count
        }));
        
        return res.status(200).json(formatted);
    }
    catch(err){
        console.log(err);
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
})

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Global Error] ${err.stack}`);
    res.status(500).json({ 
        error: "Internal Server Error", 
        message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message 
    });
});

const PORT = process.env.PORT || env.PORT || 5000;
const start_server = async () =>{
    try{
        await connect_db();
        app.listen(PORT, () => {
        // app.listen(PORT, "0.0.0.0", () => {
            console.log("Server running on port " + PORT);
        });
    }
    catch(err){
        console.log(err);
    }
}

start_server();

