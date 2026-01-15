const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function convertBooleansToStrings(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(convertBooleansToStrings);
    }

    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'boolean') {
            newObj[key] = value ? "1" : "0";
        } else if (typeof value === 'object' && value !== null) {
            newObj[key] = convertBooleansToStrings(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

async function main() {
    try {
        console.log("Starting metadata boolean-to-string migration...");

        const documents = await prisma.$queryRawUnsafe(`SELECT id, metadata FROM documents`);
        console.log(`Found ${documents.length} documents.`);

        let updatedCount = 0;

        for (const doc of documents) {
            const originalMetadata = doc.metadata || {};
            const updatedMetadata = convertBooleansToStrings(originalMetadata);

            // Compare to see if update is needed
            if (JSON.stringify(originalMetadata) !== JSON.stringify(updatedMetadata)) {
                await prisma.$executeRawUnsafe(
                    `UPDATE documents SET metadata = $1::jsonb WHERE id = $2`,
                    JSON.stringify(updatedMetadata), doc.id
                );
                updatedCount++;
            }
        }

        console.log(`Migration complete! Updated ${updatedCount} documents.`);
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
