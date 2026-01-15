"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getEffectiveTenantId(tenantOverrideId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { tenantId: true, role: true },
    });

    if (!profile) throw new Error("Profile not found");

    if (tenantOverrideId) {
        if (profile.role !== 'super_admin') {
            throw new Error("Unauthorized: Only Super Admins can impersonate tenants.");
        }
        return tenantOverrideId;
    }

    return profile.tenantId;
}

export async function resetService(remoteJid: string, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        // Get tenant configs for webhook URL
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { configs: true }
        });

        const configs = tenant?.configs as any || {};
        const webhookUrl = configs.resetServiceWebhookUrl || process.env.RESET_SERVICE_WEBHOOK_URL || "https://webhook.grupoeliteempresarial.com.br/webhook/c3ec0207-fcd5-4fb6-8b53-b4370f85b6f6";

        if (!webhookUrl) {
            console.warn("Reset service webhook URL not configured, using default/fallback.");
        }

        console.log(`[Reset Service] Triggering webhook for ${remoteJid} (Tenant: ${tenantId}) to ${webhookUrl}`);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                remoteJid: remoteJid,
                tenantId: tenantId
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Webhook failed: ${response.status} ${text}`);
        }

        // Add "Atendimento Zerado" system message
        // First find the leadId
        const lead = await prisma.lead.findFirst({
            where: { whatsapp: remoteJid, tenantId }
        });

        if (lead) {
            await prisma.conversation.create({
                data: {
                    content: "Atendimento Zerado",
                    role: "system",
                    leadId: lead.id,
                    tenantId,
                    instanceName: lead.instanceName
                }
            });
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error resetting service:", error);
        return { success: false, error: error.message };
    }
}
