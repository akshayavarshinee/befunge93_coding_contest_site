
import connect_db, { db } from "./db.js";

async function migrate() {
    try {
        connect_db();
        console.log("Starting migration...");

        // 1. Update contests table
        console.log("Adding pause columns to contests...");
        await db.query(`
            ALTER TABLE contests 
            ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS total_paused_duration INTEGER DEFAULT 0;
        `);

        // 2. Create contest_problems table
        console.log("Creating contest_problems table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS contest_problems (
                contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
                problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
                points INTEGER DEFAULT 100,
                "order" INTEGER DEFAULT 0,
                PRIMARY KEY (contest_id, problem_id)
            );
        `);

        // 3. Migrate existing data
        console.log("Migrating existing problems to contest_problems...");
        // Check if contest_id column exists before trying to migrate from it
        const checkColumn = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='problems' AND column_name='contest_id';
        `);

        if (checkColumn.rows.length > 0) {
            await db.query(`
                INSERT INTO contest_problems (contest_id, problem_id)
                SELECT contest_id, id FROM problems 
                WHERE contest_id IS NOT NULL
                ON CONFLICT (contest_id, problem_id) DO NOTHING;
            `);
             
            // Note: We are NOT dropping contest_id yet to prevent breaking running code 
            // before we patch it, but we will duplicate the relationship.
            // Ideally validation should now check contest_problems.
            console.log("Data migration complete.");
        } else {
            console.log("Column contest_id not found in problems, skipping data migration.");
        }
        
        // 4. Add leaderboard violation_count (if not exists - it was used in code but not in tables.sql shown)
        // The user showed tables.sql without violation_count, but index.js uses it. 
        // Let's add it to be safe.
        await db.query(`
            ALTER TABLE leaderboard 
            ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0;
        `);

        console.log("Migration finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
