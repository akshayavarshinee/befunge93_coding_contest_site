import connect_db, {db} from "./db.js";

try{
    await connect_db();
    // await db.query(`DELETE FROM teams where team_name like 'user%';`);
    for(let i = 1; i <= 200; ++i){
        const res = await db.query(`INSERT INTO teams (team_name, tl_email, password_hash) VALUES ('user${i}', 'user${i}@gmail.com', '$2b$10$BBXUJ0lXLTJtB8F/Bn568ee74jAQ7h3MtD1p5NWVBn4zXSCZqdaLq');`);
        console.log(res);   
    }
    console.log("Seed complete!")
}
catch(err){
    console.log(err);
}
