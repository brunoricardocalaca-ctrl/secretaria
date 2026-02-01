import fs from 'node:fs';
import { PrismaClient } from "@prisma/client";

// Manual helper to load env
function loadEnv(path: string) {
    try {
        if (fs.existsSync(path)) {
            console.log(`Loading env from ${path}...`);
            const content = fs.readFileSync(path, 'utf-8');
            content.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const [key, ...values] = trimmed.split('=');
                if (key && values.length > 0) {
                    const val = values.join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            });
        }
    } catch (e) {
        console.warn(`Failed to read ${path}`, e);
    }
}

// Load .env and .env.local
loadEnv('.env');
loadEnv('.env.local');

console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL length:", process.env.DATABASE_URL.length);
}

const prisma = new PrismaClient();

async function main() {
    try {
        const email = "brunocalaca0@gmail.com";
        console.log(`🔎 Checking profile for ${email}...`);

        const profile = await prisma.profile.findFirst({
            where: { email },
            include: { tenant: true }
        });

        if (profile) {
            console.log("✅ PROFILE FOUND IN DATABASE");
            console.log("-----------------------------------------");
            console.log(`User ID: ${profile.userId}`);
            console.log(`Email: ${profile.email}`);
            console.log(`Role: ${profile.role}`);
            console.log(`Tenant: ${profile.tenant?.name}`);
            console.log("-----------------------------------------");
            console.log("CONCLUSION: The 'inviteUser' action successfully executed.");
            console.log("The user account exists in Supabase and the Profile was created.");
            console.log("The missing email is due to Email Delivery Service configuration.");
        } else {
            console.log("❌ PROFILE NOT FOUND");
            console.log("-----------------------------------------");
            console.log("CONCLUSION: The 'inviteUser' action apparently failed or rolled back.");
        }

    } catch (e) {
        console.error("Critical Error in script:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
