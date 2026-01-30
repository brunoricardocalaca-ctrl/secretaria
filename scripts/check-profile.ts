import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
    const email = "fernandalves00@gmail.com";

    console.log(`Checking profile for ${email}...`);

    const profile = await prisma.profile.findFirst({
        where: { email: email },
        include: { tenant: true }
    });

    console.log("Profile Data:", JSON.stringify(profile, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
