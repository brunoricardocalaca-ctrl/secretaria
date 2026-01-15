const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

async function main() {
    console.log('Testing SystemConfig access...');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const key = 'test_key_' + Date.now();
        console.log(`Upserting key: ${key}`);
        const result = await prisma.systemConfig.upsert({
            where: { key },
            update: { value: 'test_value' },
            create: { key, value: 'test_value' },
        });
        console.log('Success:', result);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
