import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
    const email = "fernandalves00@gmail.com";

    console.log(`Checking status for ${email}...`);

    const userData: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, email, email_confirmed_at, confirmed_at, last_sign_in_at, created_at, updated_at FROM auth.users WHERE email = '${email}';`
    );

    console.log("User Data in auth.users:", JSON.stringify(userData, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
