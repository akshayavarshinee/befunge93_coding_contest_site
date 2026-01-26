import {Pool} from "pg";
import env from "./env.js";

export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    // host: env.DB_HOST,
    // port: env.DB_PORT || 5432,
    // user: env.DB_USER,
    // password: env.DB_PASSWORD,
    // database: env.DB_NAME,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
})

const connect_db = async () =>{
    try {
        await db.connect();
        console.log("Connected to Postgres");
    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
}

export default connect_db;