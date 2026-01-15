import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
// Import the singleton we created for the app
import prisma from "../src/lib/prisma";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    const email = "brunoricardocalaca@gmail.com";
    const password = "Burn8561@";

    console.log(`Starting registration for ${email}...`);

    // 1. Sign Up User
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error("Supabase Auth Error:", error.message);
    } else {
        console.log("User created/found in Supabase Auth.");
    }

    // 2. Force Confirm Email
    console.log("Attempting to force confirmation via DB...");
    try {
        // We update auth.users. 
        // Prisma usually connects to 'public' schema but superuser can access 'auth'.
        // We use executeRawUnsafe because 'auth.users' is not in our Prisma Schema.
        const result = await prisma.$executeRawUnsafe(
            `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${email}';`
        );
        console.log("Confirmation Update Result:", result);
        console.log("SUCCESS: User confirmed! You can login now.");
    } catch (dbError) {
        console.error("Database error:", dbError);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
