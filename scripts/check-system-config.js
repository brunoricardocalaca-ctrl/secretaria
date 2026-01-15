const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

async function main() {
    console.log('Checking SystemConfig...');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key: 'assessment_gen_prompt' }
        });
        console.log('assessment_gen_prompt:', config);

        const serviceConfig = await prisma.systemConfig.findUnique({
            where: { key: 'service_gen_prompt' }
        });
        console.log('service_gen_prompt:', serviceConfig ? 'Found (length: ' + serviceConfig.value.length + ')' : 'Not Found');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
