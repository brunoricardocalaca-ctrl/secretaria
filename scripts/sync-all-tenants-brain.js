const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
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

async function syncAutomaticFAQ(tenantId, apiKey, autoId, question, answer) {
    const embedding = await getEmbedding(`Pergunta: ${question}\nResposta: ${answer}`, apiKey);
    const vectorString = `[${embedding.join(",")}]`;

    const metadata = {
        type: "faq",
        question,
        active: true,
        isAuto: true,
        autoId,
        updatedAt: new Date().toISOString()
    };

    // Check if exists
    const existing = await prisma.$queryRawUnsafe(
        `SELECT id FROM documents WHERE tenant_id = $1 AND metadata->>'autoId' = $2`,
        tenantId, autoId
    );

    if (existing.length > 0) {
        await prisma.$executeRawUnsafe(
            `UPDATE documents 
             SET content = $1, 
                 metadata = $2::jsonb, 
                 embedding = $3::vector 
             WHERE id = $4`,
            answer, JSON.stringify(metadata), vectorString, existing[0].id
        );
    } else {
        const id = randomUUID();
        await prisma.$executeRawUnsafe(
            `INSERT INTO documents (id, tenant_id, content, metadata, embedding, "createdAt")
             VALUES ($1, $2, $3, $4::jsonb, $5::vector, NOW())`,
            id, tenantId, answer, JSON.stringify(metadata), vectorString
        );
    }
}

async function main() {
    try {
        const tenants = await prisma.tenant.findMany();
        console.log(`Found ${tenants.length} tenants. Syncing brain data...`);

        for (const tenant of tenants) {
            const configs = tenant.configs || {};
            const apiKey = configs.openaiApiKey;
            const tenantName = tenant.name;

            if (!apiKey) {
                console.log(`- Skipping tenant ${tenantName} (No API Key)`);
                continue;
            }

            console.log(`- Syncing tenant: ${tenantName}`);

            // 1. Company Info
            if (configs.companyInfo) {
                await syncAutomaticFAQ(
                    tenant.id,
                    apiKey,
                    "info_empresa",
                    `Me fale sobre a empresa ${tenantName}?`,
                    configs.companyInfo
                );
            }

            // 2. Business Hours
            const businessHours = configs.businessHours;
            if (businessHours) {
                let hoursText = `Horários de atendimento da ${tenantName}:\n`;
                if (businessHours.weekday) hoursText += `- Segunda a Sexta: ${businessHours.weekday.start} às ${businessHours.weekday.end}\n`;
                if (businessHours.saturday) hoursText += `- Sábados: ${businessHours.saturday.start} às ${businessHours.saturday.end}\n`;
                if (businessHours.sunday) {
                    hoursText += `- Domingos: ${businessHours.sunday.closed ? "Fechado" : `${businessHours.sunday.start} às ${businessHours.sunday.end}`}\n`;
                }

                await syncAutomaticFAQ(
                    tenant.id,
                    apiKey,
                    "horarios_atendimento",
                    `Quais são os horários de atendimento da ${tenantName}?`,
                    hoursText.trim()
                );
            }
        }

        console.log("Brain data sync complete.");
    } catch (err) {
        console.error("Sync Error:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
