const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getEmbedding(text, apiKey) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI Error: ${err}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function main() {
    try {
        console.log("Starting FAQ content migration...");

        // Fetch all FAQ documents
        const docs = await prisma.$queryRawUnsafe(
            `SELECT d.id, d.tenant_id, d.content, d.metadata, t.configs 
             FROM documents d
             JOIN "tenants" t ON d.tenant_id = t.id
             WHERE d.metadata->>'type' = 'faq'`
        );

        console.log(`Found ${docs.length} FAQ documents to migrate.`);

        for (const doc of docs) {
            const metadata = doc.metadata;
            const question = metadata.question;
            const answer = doc.content;
            const apiKey = doc.configs?.openaiApiKey;

            if (!question) {
                console.log(`- Skipping doc ${doc.id}: No question in metadata.`);
                continue;
            }

            if (!apiKey) {
                console.log(`- Skipping doc ${doc.id}: No OpenAI API Key found for tenant.`);
                continue;
            }

            // check if already migrated (optional but safe)
            if (answer.startsWith("Pergunta:")) {
                console.log(`- Skipping doc ${doc.id}: Already migrated.`);
                continue;
            }

            console.log(`- Migrating doc ${doc.id} (Tenant: ${doc.tenant_id})`);

            const fullContent = `Pergunta: ${question}\nResposta: ${answer}`;
            const embedding = await getEmbedding(fullContent, apiKey);
            const vectorString = `[${embedding.join(",")}]`;

            await prisma.$executeRawUnsafe(
                `UPDATE documents 
                 SET content = $1, 
                     embedding = $2::vector 
                 WHERE id = $3`,
                fullContent, vectorString, doc.id
            );
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
