
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugWebhooks() {
    try {
        const tenantId = "cm5qispsf0003u139vswre392"; // Hardcoded for debugging if I can find a valid one
        // Let's find first tenant
        const tenant = await prisma.tenant.findFirst({
            include: { whatsappInstances: true }
        });

        if (!tenant) {
            console.log("No tenant found");
            return;
        }

        console.log("Tenant Configs:", tenant.configs);
        console.log("Instances:", tenant.whatsappInstances.map(i => i.internalName));

        const webhookUrl = tenant.configs?.n8nWebhookUrl;
        if (!webhookUrl) {
            console.log("No n8nWebhookUrl found in configs");
            return;
        }

        const EvolutionClient = require('./src/lib/evolution').EvolutionClient;
        const evolution = new EvolutionClient();

        for (const inst of tenant.whatsappInstances) {
            console.log(`Checking webhook for ${inst.internalName}...`);
            try {
                const current = await evolution.findWebhook(inst.internalName);
                console.log(`Current Webhook for ${inst.internalName}:`, JSON.stringify(current, null, 2));

                console.log(`Setting Webhook for ${inst.internalName} to ${webhookUrl}...`);
                const result = await evolution.setWebhook(inst.internalName, webhookUrl, ["MESSAGES_UPSERT"]);
                console.log(`Result for ${inst.internalName}:`, JSON.stringify(result, null, 2));
            } catch (err) {
                console.error(`Error for ${inst.internalName}:`, err.message);
            }
        }

    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

debugWebhooks();
