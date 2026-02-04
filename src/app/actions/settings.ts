"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { EvolutionClient } from "@/lib/evolution";

async function getTenantId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { tenantId: true },
    });

    if (!profile) throw new Error("Profile not found");
    return profile.tenantId;
}

const evolution = new EvolutionClient();

export async function updateTenantConfig(newConfigs: any, tenantName?: string) {
    try {
        const tenantId = await getTenantId();

        // Get existing to merge
        const existing = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { configs: true }
        });

        const currentConfigs = existing?.configs as any || {};
        const mergedConfigs = {
            ...currentConfigs,
            ...newConfigs
        };

        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                configs: mergedConfigs as any,
                ...(tenantName ? { name: tenantName } : {}),
                ...(newConfigs.assistantName ? { assistantName: newConfigs.assistantName } : {})
            }
        });

        // Se o Webhook do n8n mudou, sincroniza em todas as instâncias do WhatsApp
        if (newConfigs.n8nWebhookUrl && newConfigs.n8nWebhookUrl !== currentConfigs.n8nWebhookUrl) {
            console.log(`[Config Update] Syncing new webhook URL for tenant ${tenantId}`);

            const instances = await prisma.whatsappInstance.findMany({
                where: { tenantId }
            });

            for (const inst of instances) {
                try {
                    await evolution.setWebhook(inst.internalName, newConfigs.n8nWebhookUrl, ["MESSAGES_UPSERT"]);
                    console.log(`[Config Update] Updated webhook for instance: ${inst.internalName}`);
                } catch (err) {
                    console.error(`[Config Update] Failed to sync webhook for ${inst.internalName}:`, err);
                }
            }
        }

        revalidatePath("/dashboard/settings");

        // Trigger FAQ sync for company info and hours
        try {
            const { syncCompanyProfileToFAQ } = await import("./faq");
            await syncCompanyProfileToFAQ();
        } catch (err) {
            console.error("Failed to auto-sync FAQ after settings update:", err);
        }

        return { success: true };
    } catch (e: any) {
        console.error("Error updating config:", e);
        return { error: e.message };
    }
}

export async function syncWebhooksAction() {
    try {
        const tenantId = await getTenantId();
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { configs: true }
        });

        const webhookUrl = (tenant?.configs as any)?.n8nWebhookUrl;
        if (!webhookUrl) throw new Error("Webhook n8n não configurado.");

        const instances = await prisma.whatsappInstance.findMany({
            where: { tenantId }
        });

        console.log(`[Manual Sync] Updating ${instances.length} instances for tenant ${tenantId}`);

        for (const inst of instances) {
            try {
                await evolution.setWebhook(inst.internalName, webhookUrl, ["MESSAGES_UPSERT"]);
            } catch (err) {
                console.error(`[Manual Sync] Failed for ${inst.internalName}:`, err);
            }
        }

        return { success: true, count: instances.length };
    } catch (e: any) {
        console.error("Error syncing webhooks:", e);
        return { error: e.message };
    }
}
