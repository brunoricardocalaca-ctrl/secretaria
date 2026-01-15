const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log("Starting active status migration in documents...");

        // Fetch all documents with metadata
        const docs = await prisma.$queryRawUnsafe(
            `SELECT id, metadata FROM documents`
        );

        console.log(`Found ${docs.length} documents. checking metadata...`);

        let updatedCount = 0;

        for (const doc of docs) {
            const metadata = doc.metadata || {};
            const currentActive = metadata.active;

            let newActive;
            if (currentActive === true || currentActive === "true") {
                newActive = "1";
            } else if (currentActive === false || currentActive === "false") {
                newActive = "0";
            } else if (currentActive === "1" || currentActive === "0") {
                // already migrated or correct format
                continue;
            } else {
                // Default to "1" if not specified or different
                newActive = "1";
            }

            console.log(`- Updating doc ${doc.id}: ${currentActive} -> ${newActive}`);

            const newMetadata = {
                ...metadata,
                active: newActive
            };

            await prisma.$executeRawUnsafe(
                `UPDATE documents SET metadata = $1::jsonb WHERE id = $2`,
                JSON.stringify(newMetadata), doc.id
            );
            updatedCount++;
        }

        console.log(`Migration complete. Updated ${updatedCount} documents.`);
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
