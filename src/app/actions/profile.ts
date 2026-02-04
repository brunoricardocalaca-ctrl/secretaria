"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAssistantStatus() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            include: {
                tenant: {
                    include: {
                        whatsappInstances: {
                            take: 1
                        }
                    }
                }
            }
        });

        if (!profile) {
            console.error(`getAssistantStatus: Profile not found for user ${user.id}`);
            throw new Error("Profile not found");
        }

        const whatsappInstance = (profile.tenant as any).whatsappInstances[0];
        const isWhatsappConnected = whatsappInstance?.status === "connected";

        // Logic to find the name:
        // 1. Check top-level assistantName
        // 2. Check configs.assistantName
        // 3. Check configs.agentName (Legacy)
        const tenant = profile.tenant as any;
        const configs = (tenant.configs as any) || {};
        const resolvedName = tenant.assistantName || configs.assistantName || configs.agentName || "Secretária";

        return {
            success: true,
            name: resolvedName,
            isOnline: tenant.isAiActive,
            isWhatsappConnected
        };
    } catch (e: any) {
        console.error("getAssistantStatus Error:", e);
        return { error: e.message };
    }
}

export async function toggleAssistantStatus() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { tenantId: true }
        });

        if (!profile) throw new Error("Profile not found");

        const tenant = await prisma.tenant.findUnique({
            where: { id: profile.tenantId },
            select: { id: true, isAiActive: true }
        });

        if (!tenant) throw new Error("Tenant not found");

        const newValue = !tenant.isAiActive;

        // Using Raw SQL to bypass stale Prisma Client cache in dev server
        await prisma.$executeRawUnsafe(
            `UPDATE tenants SET "isAiActive" = $1 WHERE "id" = $2`,
            newValue,
            tenant.id
        );

        console.log(`[Assistant] Status toggled to ${newValue} for tenant ${tenant.id}`);

        revalidatePath("/dashboard");
        return { success: true };
    } catch (e: any) {
        console.error("toggleAssistantStatus Error:", e);
        return { error: e.message };
    }
}

export async function updateAssistantName(name: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { tenantId: true }
        });

        if (!profile) throw new Error("Profile not found");

        const tenant = await prisma.tenant.findUnique({
            where: { id: profile.tenantId },
            select: { id: true, configs: true }
        });

        if (!tenant) throw new Error("Tenant not found");

        const currentConfigs = (tenant?.configs as any) || {};
        // Remove legacy names from configs to avoid priority conflicts
        const { assistantName: _, agentName: __, ...newConfigs } = currentConfigs;

        // Using Raw SQL to bypass stale Prisma Client cache in dev server
        await prisma.$executeRawUnsafe(
            `UPDATE tenants SET "assistantName" = $1, "configs" = $2 WHERE "id" = $3`,
            name,
            JSON.stringify(newConfigs),
            tenant.id
        );

        console.log(`[Assistant] Name updated to "${name}" for tenant ${tenant.id}`);

        revalidatePath("/", "layout");
        return { success: true };
    } catch (e: any) {
        console.error("updateAssistantName Error:", e);
        return { error: e.message };
    }
}
// trigger
