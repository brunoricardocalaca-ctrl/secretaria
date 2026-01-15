"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getTenantContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    });

    if (!profile) {
        throw new Error("Profile not found");
    }

    return { tenantId: profile.tenantId, userId: user.id };
}

export async function saveSetupStep1(data: {
    assistantName: string;
    companyInfo: string;
    instagramLink?: string;
    conversationStyle: string;
    weekdayStart: string;
    weekdayEnd: string;
    saturdayStart: string;
    saturdayEnd: string;
    sundayClosed: boolean;
    initialMessage?: string;
}) {
    try {
        const { tenantId } = await getTenantContext();

        // Preparar configurações
        const configs = {
            assistantName: data.assistantName,
            companyInfo: data.companyInfo,
            initialMessage: data.initialMessage || null,
            instagramLink: data.instagramLink || null,
            conversationStyle: data.conversationStyle,
            businessHours: {
                weekday: {
                    start: data.weekdayStart,
                    end: data.weekdayEnd
                },
                saturday: {
                    start: data.saturdayStart,
                    end: data.saturdayEnd
                },
                sunday: {
                    closed: data.sundayClosed
                }
            }
        };

        // Atualizar tenant com configs e avançar step
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                configs: configs as any,
                // setupStep: 2 // Temporarily disabled due to Prisma Cache (Requires Restart)
            }
        });

        revalidatePath("/setup");
        return { success: true };
    } catch (e: any) {
        console.error("[Setup] Detail Error saving step 1:", e);
        return { error: e.message || "Unknown error" };
    }
}

// ... (previous imports and functions)

export async function saveSetupStep3(data: {
    notificationPhone: string;
}) {
    try {
        const { tenantId } = await getTenantContext();

        // Get existing configs to merge
        const existing = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { configs: true }
        });

        const currentConfigs = existing?.configs as any || {};

        const newConfigs = {
            ...currentConfigs,
            notificationPhone: data.notificationPhone
        };

        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                configs: newConfigs as any,
                // setupStep: 4 // Temporarily disabled due to Prisma Cache (Requires Restart)
            }
        });

        revalidatePath("/setup");
        return { success: true };
    } catch (e: any) {
        console.error("[Setup] Error saving step 3:", e);
        return { error: e.message };
    }
}

export async function completeSetup() {
    try {
        const { tenantId } = await getTenantContext();

        // Marcar setup como completo
        // Marcar setup como completo
        // Using executeRaw to bypass potential Prisma Client cache issues in dev
        // Table: "tenants" (mapped), Columns: "setupCompleted", "setupStep"
        await prisma.$executeRaw`UPDATE "tenants" SET "setupCompleted" = true, "setupStep" = 5 WHERE "id" = ${tenantId}`;

        revalidatePath("/", "layout"); // Revalidate everything
        return { success: true };
    } catch (e: any) {
        console.error("[Setup] Error completing setup:", e);
        return { error: e.message };
    }
}

export async function getTenantSetupData() {
    try {
        const { tenantId } = await getTenantContext();

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                configs: true,
                setupCompleted: true,
                setupStep: true
            }
        });

        return { success: true, data: tenant };
    } catch (e: any) {
        console.error("[Setup] Error getting tenant data:", e);
        return { error: e.message };
    }
}
