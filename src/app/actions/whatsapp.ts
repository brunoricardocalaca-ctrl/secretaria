"use server";

import prisma from "@/lib/prisma";
import { EvolutionClient } from "@/lib/evolution";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const client = new EvolutionClient();

async function getTenantContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: { tenant: true },
    });

    if (!profile) throw new Error("Profile not found");
    return { tenantId: profile.tenantId, tenantSlug: profile.tenant.slug };
}

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
}

export async function createWhatsappInstance(formData: FormData) {
    const label = formData.get("name") as string;
    if (!label) return { error: "Nome é obrigatório" };

    try {
        const { tenantId, tenantSlug } = await getTenantContext();

        // Internal unique name: slug_label_hash
        const shortHash = Math.random().toString(36).substring(7, 11);
        const internalName = `${tenantSlug}_${slugify(label)}_${shortHash}`;
        const token = Math.random().toString(36).substring(7);

        console.log(`[Action] Creating internal instance: ${internalName} for ${label}`);

        // 1. Create in Evolution API
        const res = await client.createInstance(internalName, token);

        if (res?.error) {
            return { error: res.error };
        }

        // 2. Auto-configure Webhook and Events
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });
        const webhookUrl = (tenant?.configs as any)?.n8nWebhookUrl;

        if (webhookUrl) {
            console.log(`[Action] Auto-configuring webhook for ${internalName}: ${webhookUrl}`);
            try {
                await client.setWebhook(internalName, webhookUrl, [
                    "MESSAGES_UPSERT"
                ]);
            } catch (webhookErr) {
                console.error(`[Action] Failed to auto-configure webhook:`, webhookErr);
                // We continue because the instance was created, but log the error
            }
        }

        // 3. Save in Database
        await prisma.whatsappInstance.create({
            data: {
                tenantId,
                name: label,
                internalName,
                token,
                status: "disconnected"
            }
        });

        revalidatePath("/dashboard/channels");
        return { success: true, instance: { instanceName: internalName }, qrcode: res.qrcode };
    } catch (e: any) {
        console.error(`[Action] Critical Creation Error:`, e);
        return { error: e.message || "Erro desconhecido no servidor" };
    }
}

export async function getConnectQR(internalName: string) {
    try {
        const { tenantId } = await getTenantContext();
        // Security check
        const inst = await prisma.whatsappInstance.findFirst({
            where: { internalName, tenantId }
        });
        if (!inst) throw new Error("Conexão não encontrada ou não autorizada");

        const res = await client.connectInstance(internalName);
        return res;
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteInstanceAction(rawInternalName: string) {
    const internalName = rawInternalName.trim();
    console.log(`[Action] deleteInstanceAction called for: ${internalName}`);
    try {
        const { tenantId } = await getTenantContext();
        console.log(`[Action] TenantId: ${tenantId}`);
        // Security check
        const inst = await prisma.whatsappInstance.findFirst({
            where: { internalName, tenantId }
        });
        console.log(`[Action] Instance found in DB:`, inst);
        if (!inst) throw new Error("Conexão não encontrada ou não autorizada");

        console.log(`[Action] Deleting instance: ${internalName}`);

        // 1. Delete from Evolution
        console.log(`[Action] Calling Evolution API delete...`);
        try {
            await client.deleteInstance(internalName);
            console.log(`[Action] Evolution API delete successful`);
        } catch (evError: any) {
            console.error(`[Action] Evolution API delete failed:`, evError.message);
            // If it's already NOT FOUND in evolution, we should still delete from our DB
            if (evError.message?.toLowerCase().includes("not found") || evError.message?.includes("404")) {
                console.log(`[Action] Instance already gone from Evolution, proceeding with DB deletion`);
            } else {
                throw evError; // Re-throw other errors
            }
        }

        // 2. Delete from DB
        console.log(`[Action] Deleting from DB with id: ${inst.id}`);
        await prisma.whatsappInstance.delete({
            where: { id: inst.id }
        });
        console.log(`[Action] DB delete successful`);

        revalidatePath("/dashboard/channels");
        return { success: true };
    } catch (e: any) {
        console.error(`[Action] Delete Error:`, e);
        return { error: e.message || "Falha ao remover WhatsApp" };
    }
}

export async function logoutInstanceAction(rawInternalName: string) {
    const internalName = rawInternalName.trim();
    try {
        const { tenantId } = await getTenantContext();
        const inst = await prisma.whatsappInstance.findFirst({
            where: { internalName, tenantId }
        });
        if (!inst) throw new Error("Conexão não encontrada ou não autorizada");

        console.log(`[Action] Logging out instance: ${internalName}`);
        try {
            await client.logoutInstance(internalName);
        } catch (evError: any) {
            console.error(`[Action] Evolution API logout failed:`, evError.message);
            // Similar to delete, if 404 just ignore
            if (!evError.message?.toLowerCase().includes("not found") && !evError.message?.includes("404")) {
                throw evError;
            }
        }

        revalidatePath("/dashboard/channels");
        return { success: true };
    } catch (e: any) {
        console.error(`[Action] Logout Error:`, e);
        return { error: e.message || "Falha ao desconectar WhatsApp" };
    }
}

export async function listInstances() {
    try {
        const { tenantId } = await getTenantContext();
        // Fetch from DB - Filter out preview instances
        const dbInstances = await prisma.whatsappInstance.findMany({
            where: {
                tenantId,
                NOT: {
                    internalName: { startsWith: 'preview_' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Optionally sync status with Evolution (slow if many, but good for accuracy)
        const evolutionInstances = await client.fetchInstances();

        const enriched = dbInstances.map(dbInst => {
            const evInst = evolutionInstances.find((ei: any) => (ei.instanceName || ei.name) === dbInst.internalName);
            return {
                ...dbInst,
                connectionStatus: evInst?.status || evInst?.connectionStatus || dbInst.status,
                // Ensure UI gets the friendly name
                displayName: dbInst.name,
            };
        });

        return enriched;
    } catch (e) {
        console.error("[Action] List Instances Error:", e);
        return [];
    }
}

export async function getInstanceStatus(internalName: string) {
    try {
        const { tenantId } = await getTenantContext();
        const evInstances = await client.fetchInstances();
        const inst = evInstances.find((i: any) => (i.instanceName || i.name) === internalName);
        return inst?.status || inst?.connectionStatus || "disconnected";
    } catch (e) {
        return "error";
    }
}
