"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function verifySuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In a real scenario, you would check a specific role or email.
    // For now, we assume anyone accessing the /admin path is protected by middleware,
    // but verifying authentication is crucial.
    if (!user) throw new Error("Unauthorized");
    return user;
}

export async function getSystemConfig(key: string) {
    try {
        await verifySuperAdmin();
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });
        return config?.value || "";
    } catch (error) {
        console.error(`Error fetching config ${key}:`, error);
        return "";
    }
}

export async function upsertSystemConfig(key: string, value: string) {
    try {
        await verifySuperAdmin();
        await prisma.systemConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Error saving config ${key}:`, error);
        return { error: error.message };
    }
}
