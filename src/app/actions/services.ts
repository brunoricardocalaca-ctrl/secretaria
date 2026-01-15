"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { syncServicesToKnowledgeBase } from "./knowledge";

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

export async function getServices() {
    try {
        const tenantId = await getTenantId();
        const services = await prisma.service.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
        });

        return services.map(s => ({
            ...s,
            price: s.price ? Number(s.price) : null
        }));
    } catch (error) {
        console.error("Error fetching services:", error);
        return [];
    }
}

export async function upsertService(data: any) {
    try {
        const tenantId = await getTenantId();
        const { id, ...rest } = data;

        if (id) {
            const service = await prisma.service.update({
                where: { id, tenantId },
                data: {
                    ...rest,
                    price: rest.price ? parseFloat(rest.price) : null,
                    tags: rest.tags || null,
                },
            });
            revalidatePath("/dashboard/services");

            const serialized = {
                ...service,
                price: service.price ? Number(service.price) : null
            };

            // Automate AI Sync
            await syncServicesToKnowledgeBase();

            return { success: true, service: serialized };
        } else {
            const service = await prisma.service.create({
                data: {
                    ...rest,
                    tenantId,
                    price: rest.price ? parseFloat(rest.price) : null,
                    tags: rest.tags || null,
                },
            });
            revalidatePath("/dashboard/services");

            const serialized = {
                ...service,
                price: service.price ? Number(service.price) : null
            };

            // Automate AI Sync
            await syncServicesToKnowledgeBase();

            return { success: true, service: serialized };
        }
    } catch (error: any) {
        console.error("Error saving service:", error);
        return { error: error.message };
    }
}

export async function deleteService(id: string) {
    try {
        const tenantId = await getTenantId();
        await prisma.service.delete({
            where: { id, tenantId },
        });
        revalidatePath("/dashboard/services");

        // Automate AI Sync (to remove from KB or mark as inactive)
        await syncServicesToKnowledgeBase();

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting service:", error);
        return { error: error.message };
    }
}
