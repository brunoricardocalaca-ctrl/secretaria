"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Holiday } from "@prisma/client";

export async function getTenantContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findFirst({
        where: { userId: user.id },
        include: { tenant: true }
    });
    if (!profile || !profile.tenant) throw new Error("Tenant not found");

    return {
        tenantId: profile.tenantId,
        profileId: profile.id,
        userRole: profile.role
    };
}

export async function createSimpleAppointment(data: {
    date: string;
    startTime: string;
    endTime: string;
    leadId: string;
    profileId?: string;
    status?: string;
    notes?: string;
    services?: { serviceId: string; price: number; duration: number }[];
    resourceIds?: string[];
}) {
    const { tenantId, profileId: currentProfileId } = await getTenantContext();

    try {
        const appointment = await prisma.appointment.create({
            data: {
                tenantId,
                leadId: data.leadId,
                profileId: data.profileId || currentProfileId,
                date: new Date(data.date),
                startTime: new Date(`${data.date}T${data.startTime}:00`),
                endTime: new Date(`${data.date}T${data.endTime}:00`),
                status: data.status || "SCHEDULED",
                notes: data.notes,
                services: data.services ? {
                    create: data.services.map(s => ({
                        serviceId: s.serviceId,
                        price: s.price,
                        duration: s.duration,
                    }))
                } : undefined,
                resources: data.resourceIds ? {
                    connect: data.resourceIds.map(id => ({ id }))
                } : undefined,
            },
            include: {
                lead: true,
                profile: true,
                services: {
                    include: {
                        service: true
                    }
                },
                resources: true
            }
        });

        revalidatePath("/dashboard/agenda");
        return appointment;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
    const { tenantId } = await getTenantContext();

    const appointment = await prisma.appointment.update({
        where: {
            id: appointmentId,
            tenantId
        },
        data: {
            status
        }
    });

    revalidatePath("/dashboard/agenda");
    return appointment;
}

export async function deleteAppointment(appointmentId: string) {
    const { tenantId } = await getTenantContext();

    await prisma.$transaction(async (tx: any) => {
        // 1. Delete related services
        await tx.appointmentService.deleteMany({
            where: { appointmentId }
        });

        // 2. Delete the appointment
        await tx.appointment.delete({
            where: {
                id: appointmentId,
                tenantId
            }
        });
    });

    revalidatePath("/dashboard/agenda");
    return { success: true };
}

export async function checkSchedulingConflicts(data: {
    profileId: string;
    resourceIds?: string[];
    date: string;
    startTime: string;
    endTime: string;
}) {
    const { tenantId } = await getTenantContext();

    const conflicts: { type: 'unavailable' | 'blocked' | 'holiday' | 'resource'; message: string }[] = [];

    const appointmentDate = new Date(data.date);
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);

    const newStartMinutes = startHour * 60 + startMinute;
    const newEndMinutes = endHour * 60 + endMinute;

    // Check for holidays/blocks
    const holidays = await prisma.holiday.findMany({
        where: {
            tenantId,
            OR: [
                {
                    date: appointmentDate,
                    isRecurring: false
                },
                {
                    isRecurring: true,
                    // Note: recurrence check might need more precise logic for day/month
                }
            ]
        }
    });

    // Primitive recurrence check (just day/month matching assuming date is YYYY-MM-DD)
    const blockingHoliday = holidays.find((h: Holiday) => {
        if (!h.blocking) return false;
        if (!h.isRecurring) return true;
        const hDate = new Date(h.date);
        return hDate.getDate() === appointmentDate.getDate() && hDate.getMonth() === appointmentDate.getMonth();
    });

    if (blockingHoliday) {
        conflicts.push({
            type: 'holiday',
            message: `${blockingHoliday.name} - Agenda bloqueada para este dia`
        });
    }

    // Check professional availability settings
    const dayOfWeek = appointmentDate.getDay();

    let availability = await prisma.availability.findFirst({
        where: {
            tenantId,
            profileId: data.profileId,
            dayOfWeek
        }
    });

    if (!availability) {
        availability = await prisma.availability.findFirst({
            where: {
                tenantId,
                profileId: null,
                dayOfWeek
            }
        });
    }

    if (availability) {
        if (!availability.isWorkingDay) {
            conflicts.push({
                type: 'unavailable',
                message: 'Profissional não atende neste dia'
            });
        } else {
            const [availStartH, availStartM] = availability.startTime.split(':').map(Number);
            const [availEndH, availEndM] = availability.endTime.split(':').map(Number);
            const availStartMinutes = availStartH * 60 + availStartM;
            const availEndMinutes = availEndH * 60 + availEndM;

            if (newStartMinutes < availStartMinutes || newEndMinutes > availEndMinutes) {
                conflicts.push({
                    type: 'unavailable',
                    message: `Horário fora do expediente (${availability.startTime} - ${availability.endTime})`
                });
            }

            if (availability.pauses) {
                const pauses = typeof availability.pauses === 'string'
                    ? JSON.parse(availability.pauses as string)
                    : availability.pauses as any;

                if (Array.isArray(pauses)) {
                    for (const pause of pauses) {
                        const [pauseStartH, pauseStartM] = pause.start.split(':').map(Number);
                        const [pauseEndH, pauseEndM] = pause.end.split(':').map(Number);
                        const pauseStartMinutes = pauseStartH * 60 + pauseStartM;
                        const pauseEndMinutes = pauseEndH * 60 + pauseEndM;

                        if (newStartMinutes < pauseEndMinutes && newEndMinutes > pauseStartMinutes) {
                            conflicts.push({
                                type: 'unavailable',
                                message: `Horário coincide com pausa (${pause.start} - ${pause.end})`
                            });
                        }
                    }
                }
            }
        }
    }

    // Check for overlapping appointments (Profile/Professional)
    const existingAppointments = await prisma.appointment.findMany({
        where: {
            tenantId,
            profileId: data.profileId,
            date: appointmentDate,
            status: {
                notIn: ['CANCELLED', 'COMPLETED']
            }
        }
    });

    const hasProfileOverlap = existingAppointments.some(apt => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        const aptStartMinutes = aptStart.getHours() * 60 + aptStart.getMinutes();
        const aptEndMinutes = aptEnd.getHours() * 60 + aptEnd.getMinutes();

        return (newStartMinutes < aptEndMinutes && newEndMinutes > aptStartMinutes);
    });

    if (hasProfileOverlap) {
        conflicts.push({
            type: 'unavailable',
            message: 'Profissional já possui agendamento neste horário'
        });
    }

    return conflicts;
}

export async function getAppointments(filters: { startDate: Date; endDate: Date; profileId?: string }) {
    const { tenantId } = await getTenantContext();

    const appointments = await prisma.appointment.findMany({
        where: {
            tenantId,
            date: {
                gte: filters.startDate,
                lte: filters.endDate
            },
            profileId: filters.profileId || undefined,
        },
        include: {
            lead: true,
            profile: true,
            services: {
                include: {
                    service: true
                }
            },
            resources: true
        },
        orderBy: {
            startTime: 'asc'
        }
    });

    return appointments;
}

export async function getAgendaData() {
    const { tenantId } = await getTenantContext();

    // Fetch professionals (Profiles with admin or professional roles)
    const professionals = await prisma.profile.findMany({
        where: { tenantId },
        select: { id: true, email: true, role: true },
    }).then(profiles => profiles.map(p => ({ id: p.id, name: p.email.split('@')[0] }))); // Fallback name

    // Fetch resources
    const resources = await prisma.resource.findMany({
        where: { tenantId },
        select: { id: true, name: true, type: true },
        orderBy: { name: 'asc' }
    });

    // Fetch this week's appointments
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const appointments = await getAppointments({
        startDate: startOfWeek,
        endDate: endOfWeek
    });

    return { professionals, resources, appointments };
}

export async function searchLeads(query: string) {
    const { tenantId } = await getTenantContext();
    return await prisma.lead.findMany({
        where: {
            tenantId,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { whatsapp: { contains: query, mode: 'insensitive' } }
            ]
        },
        take: 10
    });
}

export async function searchServices(query: string) {
    const { tenantId } = await getTenantContext();

    // If query is empty, return all active services
    const services = await prisma.service.findMany({
        where: {
            tenantId,
            active: true,
            ...(query.length >= 2 ? {
                name: { contains: query, mode: 'insensitive' }
            } : {})
        },
        orderBy: { name: 'asc' },
        take: query.length >= 2 ? 10 : 20
    });

    return services.map(s => ({
        ...s,
        price: s.price ? Number(s.price) : 0,
        durationMin: s.durationMin || 60
    }));
}
