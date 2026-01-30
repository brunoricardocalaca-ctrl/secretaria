import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
    const email = "fernandalves00@gmail.com";

    console.log(`Forcing full activation for ${email}...`);

    // 1. Force all confirmation fields in auth.users
    await prisma.$executeRawUnsafe(
        `UPDATE auth.users SET 
            email_confirmed_at = NOW(), 
            last_sign_in_at = NOW(),
            updated_at = NOW()
         WHERE email = '${email}';`
    );
    console.log("Updated auth.users confirmation fields.");

    // 2. Find the profile and tenant
    const profile = await prisma.profile.findFirst({
        where: { email: email },
        include: { tenant: true }
    });

    if (profile) {
        // 3. Set tenant as setup completed and active
        await prisma.tenant.update({
            where: { id: profile.tenantId },
            data: {
                setupCompleted: true,
                setupStep: 3,
                planStatus: "active"
            }
        });
        console.log("Updated tenant to setupCompleted: true and planStatus: active.");

        // 4. Ensure profile is admin
        await prisma.profile.update({
            where: { id: profile.id },
            data: {
                role: "admin"
            }
        });
        console.log("Ensured profile role is admin.");
    } else {
        console.log("Profile not found, could not update tenant.");
    }

    console.log("DONE: Final activation complete.");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
