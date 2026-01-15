const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany();
    console.log("Tenants found:", tenants.length);
    tenants.forEach(t => {
        console.log(`Tenant ID: ${t.id}`);
        console.log(`Configs:`, JSON.stringify(t.configs, null, 2));
        console.log(`Setup Step:`, t.setupStep);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
