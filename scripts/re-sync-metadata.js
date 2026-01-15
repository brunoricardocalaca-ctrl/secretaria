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
        console.log("Starting full metadata re-sync...");

        // 1. Update Services
        console.log("\n--- Syncing Services ---");
        const services = await prisma.service.findMany();
        console.log(`Found ${services.length} services.`);

        for (const s of services) {
            const rules = s.rules ? (typeof s.rules === 'string' ? JSON.parse(s.rules) : s.rules) : {};

            const metadata = {
                serviceId: s.id,
                serviceName: s.name,
                type: "service",
                active: s.active,
                description: s.description || "",
                price: s.price ? Number(s.price).toFixed(2) : "0.00",
                priceHidden: s.priceHidden,
                durationMin: s.durationMin?.toString() || "0",
                durationHidden: !!rules.durationHidden,
                requiresEval: s.requiresEval,

                // Evaluation Rules
                hasEvaluation: !!(rules.hasEvaluation || s.requiresEval),
                evaluationDescription: rules.evaluationDescription || "",
                evalIsPaid: !!rules.evalIsPaid,
                evalPrice: rules.evalPrice || "0.00",
                evalHasDuration: !!rules.evalHasDuration,
                evalDuration: rules.evalDuration || "0",

                // Pricing Rules
                pricingModel: rules.pricingModel || "fixed",
                isPriceList: rules.pricingModel === 'table',
                priceMin: rules.priceMin || "0.00",
                priceMax: rules.priceMax || "0.00",
                priceItems: rules.priceTableItems || [],
                hasImage: !!s.imageUrl
            };

            // Update in documents table
            const result = await prisma.$executeRawUnsafe(
                `UPDATE documents SET metadata = $1::jsonb WHERE metadata->>'serviceId' = $2`,
                JSON.stringify(metadata), s.id
            );

            if (result > 0) {
                console.log(`[OK] Updated service: ${s.name} (${s.id})`);
            } else {
                console.log(`[SKIP] No document found for service: ${s.name} (${s.id})`);
            }
        }

        // 2. Update FAQs
        console.log("\n--- Syncing FAQs ---");
        const faqs = await prisma.$queryRawUnsafe(
            `SELECT id, metadata FROM documents WHERE metadata->>'type' = 'faq'`
        );
        console.log(`Found ${faqs.length} FAQs.`);

        for (const f of faqs) {
            const metadata = f.metadata || {};
            const newActive = metadata.active === "1" || metadata.active === true || metadata.active === "true";

            const newMetadata = {
                ...metadata,
                active: newActive,
                isAuto: !!metadata.isAuto, // ensure boolean
                isPriceList: !!metadata.isPriceList // ensure boolean
            };

            await prisma.$executeRawUnsafe(
                `UPDATE documents SET metadata = $1::jsonb WHERE id = $2`,
                JSON.stringify(newMetadata), f.id
            );
            console.log(`[OK] Updated FAQ: ${metadata.question || f.id}`);
        }

        console.log("\nFull re-sync complete!");
    } catch (err) {
        console.error("Re-sync Error:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
