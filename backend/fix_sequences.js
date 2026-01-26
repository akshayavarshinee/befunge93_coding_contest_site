
import { db } from "./db.js";

async function fixSequences() {
    try {
        console.log("Checking sequences...");

        // Fix users table sequence
        const maxUserResult = await db.query("SELECT MAX(id) as max_id FROM users");
        const maxUserId = maxUserResult.rows[0].max_id || 0;
        console.log(`Max user ID is ${maxUserId}`);
        
        if (maxUserId > 0) {
            await db.query(`SELECT setval('users_id_seq', $1, true)`, [maxUserId]);
            console.log(`Updated users_id_seq to ${maxUserId}`);
        }

        // Fix admins table sequence (good practice to check this too)
        const maxAdminResult = await db.query("SELECT MAX(id) as max_id FROM admins");
        const maxAdminId = maxAdminResult.rows[0].max_id || 0;
        console.log(`Max admin ID is ${maxAdminId}`);

        if (maxAdminId > 0) {
            await db.query(`SELECT setval('admins_id_seq', $1, true)`, [maxAdminId]);
            console.log(`Updated admins_id_seq to ${maxAdminId}`);
        }
        
        console.log("Sequences fixed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error fixing sequences:", err);
        process.exit(1);
    }
}

fixSequences();
