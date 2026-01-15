const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log("Starting metadata boolean migration...");

    const docs = await prisma.documents.findMany();
    console.log(`Found ${docs.length} documents.`);

    for (const doc of docs) {
        let metadata = doc.metadata;
        if (typeof metadata === 'string') {
            metadata = JSON.parse(metadata);
        }

        let changed = false;
        const booleanFields = [
            'active', 'priceHidden', 'durationHidden', 'requiresEval',
            'hasEvaluation', 'evalIsPaid', 'evalHasDuration', 'isPriceList'
        ];

        for (const field of booleanFields) {
            if (metadata[field] === "1") {
                metadata[field] = true;
                changed = true;
            } else if (metadata[field] === "0") {
                metadata[field] = false;
                changed = true;
            }
        }

        if (changed) {
            await prisma.documents.update({
                where: { id: doc.id },
                data: { metadata: metadata }
            });
            console.log(`Updated document ${doc.id}`);
        }
    }

    console.log("Migration complete.");
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
