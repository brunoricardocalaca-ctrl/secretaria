const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");
require("dotenv").config({ path: ".env" }); // Load from root .env

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
    const email = "brunoricardocalaca@gmail.com";
    const password = "Burn8561@";

    console.log(`Starting registration for ${email}...`);

    // 1. Sign Up User via Supabase API
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error("Supabase Auth Error:", error.message);
    } else {
        console.log("User registered in Supabase.");
    }

    // 2. Force Confirm via Postgres
    console.log("Connecting to Postgres...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected. Updating confirmation status...");

        const res = await client.query(
            `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1`,
            [email]
        );

        console.log(`Updated ${res.rowCount} row(s). User confirmed.`);
    } catch (err) {
        console.error("Postgres Error:", err);
    } finally {
        await client.end();
    }
}

main();
