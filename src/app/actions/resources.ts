"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "./agenda";
import { revalidatePath } from "next/cache";

export async function getResources() {
    const { tenantId } = await getTenantContext();

    return await prisma.resource.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' }
    });
}

export async function upsertResource(data: {
    id?: string;
    name: string;
    type: string;
    exclusive?: boolean;
    capacity?: number;
    description?: string;
}) {
    const { tenantId } = await getTenantContext();

    try {
        if (data.id) {
            const resource = await prisma.resource.update({
                where: { id: data.id, tenantId },
                data: {
                    name: data.name,
                    type: data.type,
                    exclusive: data.exclusive ?? true,
                    capacity: data.capacity ?? 1,
                    description: data.description,
                }
            });
            revalidatePath("/dashboard/agenda");
            return { success: true, resource };
        } else {
            const resource = await prisma.resource.create({
                data: {
                    name: data.name,
                    type: data.type,
                    exclusive: data.exclusive ?? true,
                    capacity: data.capacity ?? 1,
                    description: data.description,
                    tenantId
                }
            });
            revalidatePath("/dashboard/agenda");
            return { success: true, resource };
        }
    } catch (error) {
        console.error("Error upserting resource:", error);
        throw error;
    }
}

export async function deleteResource(id: string) {
    const { tenantId } = await getTenantContext();

    try {
        await prisma.resource.delete({
            where: { id, tenantId }
        });
        revalidatePath("/dashboard/agenda");
        return { success: true };
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw error;
    }
}

export async function upsertAvailability(data: {
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorkingDay: boolean;
    pauses?: any;
    profileId?: string | null;
}) {
    const { tenantId } = await getTenantContext();

    try {
        const existing = await prisma.availability.findFirst({
            where: {
                tenantId,
                dayOfWeek: data.dayOfWeek,
                profileId: data.profileId || null
            }
        });

        if (existing) {
            const availability = await prisma.availability.update({
                where: { id: existing.id },
                data: {
                    startTime: data.startTime,
                    endTime: data.endTime,
                    isWorkingDay: data.isWorkingDay,
                    pauses: data.pauses || null,
                }
            });
            revalidatePath("/dashboard/agenda");
            return { success: true, availability };
        } else {
            const availability = await prisma.availability.create({
                data: {
                    dayOfWeek: data.dayOfWeek,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    isWorkingDay: data.isWorkingDay,
                    pauses: data.pauses || null,
                    profileId: data.profileId || null,
                    tenantId
                }
            });
            revalidatePath("/dashboard/agenda");
            return { success: true, availability };
        }
    } catch (error) {
        console.error("Error upserting availability:", error);
        throw error;
    }
}

export async function getAvailabilities(profileId?: string | null) {
    const { tenantId } = await getTenantContext();

    return await prisma.availability.findMany({
        where: {
            tenantId,
            profileId: profileId || null
        },
        orderBy: { dayOfWeek: 'asc' }
    });
}

export async function getHolidays() {
    const { tenantId } = await getTenantContext();

    return await prisma.holiday.findMany({
        where: { tenantId },
        orderBy: { date: 'asc' }
    });
}

export async function upsertHoliday(data: {
    id?: string;
    name: string;
    date: string;
    isRecurring?: boolean;
    profileId?: string | null;
}) {
    const { tenantId } = await getTenantContext();

    try {
        if (data.id) {
            const holiday = await prisma.holiday.update({
                where: { id: data.id, tenantId },
                data: {
                    name: data.name,
                    date: new Date(data.date),
                    isRecurring: data.isRecurring ?? false,
                    profileId: data.profileId || null,
                }
            });
            revalidatePath("/dashboard/agenda");
            return { success: true, holiday };
        } else {
            const holiday = await prisma.holiday.create({
                data: {
                    name: data.name,
                    date: new Date(data.date),
                    isRecurring: data.isRecurring ?? false,
                    profileId: data.profileId || null,
                    tenantId
                }
            });
            revalidatePath("/dashboard/agenda");
            return { success: true, holiday };
        }
    } catch (error) {
        console.error("Error upserting holiday:", error);
        throw error;
    }
}

export async function deleteHoliday(id: string) {
    const { tenantId } = await getTenantContext();

    try {
        await prisma.holiday.delete({
            where: { id, tenantId }
        });
        revalidatePath("/dashboard/agenda");
        return { success: true };
    } catch (error) {
        console.error("Error deleting holiday:", error);
        throw error;
    }
}
