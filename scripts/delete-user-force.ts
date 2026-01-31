
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// 1. Setup Prisma with Adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL is missing in .env");
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 2. Setup Supabase Admin
function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Skipping Supabase Auth deletion.");
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

async function main() {
    const email = "brunocalaca0@gmail.com";
    console.log(`🔍 Searching for user: ${email}`);

    // Find Profile in Prisma
    const profile = await prisma.profile.findFirst({
        where: { email }
    });

    if (!profile) {
        console.log("⚠️ Profile not found in database.");
    } else {
        console.log(`✅ Found Profile ID: ${profile.id}, User ID: ${profile.userId}`);
    }

    const supabaseAdmin = createAdminClient();

    if (supabaseAdmin) {
        // Delete from Supabase Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        // Find by exact email match
        const supabaseUser = users?.find(u => u.email === email);

        if (supabaseUser) {
            console.log(`✅ Found in Supabase Auth (ID: ${supabaseUser.id}). Deleting...`);
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);

            if (deleteError) {
                console.error("❌ Error deleting from Supabase:", deleteError.message);
            } else {
                console.log("🗑️ Deleted from Supabase Auth.");
            }
        } else {
            console.log("⚠️ User not found in Supabase Auth.");
        }
    }

    // Delete from Prisma
    if (profile) {
        console.log(`🗑️ Deleting profile from Prisma...`);
        await prisma.profile.delete({
            where: { id: profile.id }
        });
        console.log("✅ Profile deleted from Database.");
    } else {
        console.log("ℹ️ No profile to delete in Database.");
    }

    console.log("✨ Deletion process complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
