const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error("No tenant found. Seed app first.");
        return;
    }

    const instance = await prisma.whatsappInstance.findFirst({
        where: { tenantId: tenant.id }
    });

    if (!instance) {
        console.error("No instance found for tenant", tenant.id);
        return;
    }

    console.log("Seeding for tenant:", tenant.name, "and instance:", instance.internalName);

    const lead = await prisma.lead.upsert({
        where: {
            whatsapp_instanceName: {
                whatsapp: "5511999999999",
                instanceName: instance.internalName
            }
        },
        update: {},
        create: {
            whatsapp: "5511999999999",
            name: "Cliente de Teste",
            tenantId: tenant.id,
            instanceName: instance.internalName
        }
    });

    await prisma.conversation.createMany({
        data: [
            {
                content: "Olá! Gostaria de testar o sistema de mensagens.",
                role: "user",
                leadId: lead.id,
                tenantId: tenant.id,
                instanceName: instance.internalName
            },
            {
                content: "Olá! Perfeito, o sistema de mensagens está funcionando e eu sou a IA integrada.",
                role: "assistant",
                leadId: lead.id,
                tenantId: tenant.id,
                instanceName: instance.internalName
            },
            {
                content: "Que bom! E agora estou testando a resposta manual.",
                role: "human",
                leadId: lead.id,
                tenantId: tenant.id,
                instanceName: instance.internalName
            }
        ]
    });

    console.log("Seed completed successfully!");
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
