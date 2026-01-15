"use server";

import prisma from "@/lib/prisma";
import { createSimpleAppointment, checkSchedulingConflicts } from "./agenda";
import { searchServices } from "./agenda";

/**
 * Cria um agendamento a partir de uma conversa do WhatsApp
 * Função otimizada para uso pela IA
 */
export async function createAppointmentFromAI(params: {
    leadId: string;
    tenantId: string;
    serviceName: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    notes?: string;
    professionalId?: string; // Opcional, usa primeiro disponível se não informado
}) {
    try {
        // 1. Buscar o serviço pelo nome
        const services = await searchServices(params.serviceName);
        if (services.length === 0) {
            return {
                success: false,
                error: "Serviço não encontrado",
                message: `Desculpe, não encontrei o serviço "${params.serviceName}". Você pode me dizer qual serviço gostaria?`
            };
        }

        const service = services[0]; // Pega o primeiro resultado (mais relevante)
        const duration = service.durationMin || 60;

        // 2. Calcular endTime baseado na duração
        const [hours, minutes] = params.startTime.split(':').map(Number);
        const start = new Date(`${params.date}T${params.startTime}:00`);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + duration);
        const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

        // 3. Buscar ou definir profissional
        let professionalId = params.professionalId;

        if (!professionalId) {
            // Busca primeiro profissional disponível do tenant
            const professionals = await prisma.profile.findMany({
                where: { tenantId: params.tenantId },
                take: 1
            });

            if (professionals.length === 0) {
                return {
                    success: false,
                    error: "Nenhum profissional disponível",
                    message: "Desculpe, não há profissionais disponíveis no momento."
                };
            }

            professionalId = professionals[0].id;
        }

        // 4. Verificar conflitos de horário
        const conflicts = await checkSchedulingConflicts({
            profileId: professionalId,
            date: params.date,
            startTime: params.startTime,
            endTime: endTime
        });

        if (conflicts.length > 0) {
            const conflictMessages = conflicts.map(c => c.message).join(', ');
            return {
                success: false,
                error: "Conflito de horário",
                message: `Desculpe, não é possível agendar neste horário: ${conflictMessages}. Gostaria de tentar outro horário?`,
                conflicts
            };
        }

        // 5. Criar o agendamento
        const appointment = await createSimpleAppointment({
            leadId: params.leadId,
            profileId: professionalId,
            date: params.date,
            startTime: params.startTime,
            endTime: endTime,
            notes: params.notes || `Agendamento criado via WhatsApp`,
            services: [{
                serviceId: service.id,
                price: Number(service.price || 0),
                duration: duration
            }]
        });

        // 6. Buscar dados completos para resposta
        const lead = await prisma.lead.findUnique({
            where: { id: params.leadId },
            select: { name: true, whatsapp: true }
        });

        // 7. Formatar resposta para a IA
        const appointmentDate = new Date(params.date);
        const dayOfWeek = appointmentDate.toLocaleDateString('pt-BR', { weekday: 'long' });
        const formattedDate = appointmentDate.toLocaleDateString('pt-BR');

        return {
            success: true,
            appointment,
            message: `✅ Agendamento confirmado!\n\n` +
                `📅 ${dayOfWeek}, ${formattedDate}\n` +
                `🕐 ${params.startTime}\n` +
                `💇 ${service.name}\n` +
                `⏱️ Duração: ${duration} minutos\n\n` +
                `Você receberá uma confirmação em breve. Até lá! 👋`
        };

    } catch (error: any) {
        console.error("Error creating appointment from AI:", error);
        return {
            success: false,
            error: error.message,
            message: "Desculpe, ocorreu um erro ao criar o agendamento. Por favor, tente novamente."
        };
    }
}

/**
 * Lista agendamentos de um lead (para a IA consultar)
 */
export async function getLeadAppointments(leadId: string) {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                leadId,
                status: { notIn: ['CANCELLED'] }
            },
            include: {
                services: {
                    include: {
                        service: true
                    }
                },
                profile: {
                    select: { email: true }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        return {
            success: true,
            appointments: appointments.map(apt => ({
                id: apt.id,
                date: new Date(apt.startTime).toLocaleDateString('pt-BR'),
                time: new Date(apt.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                service: apt.services[0]?.service?.name || 'Serviço',
                status: apt.status,
                professional: apt.profile.email.split('@')[0]
            }))
        };
    } catch (error) {
        console.error("Error fetching lead appointments:", error);
        return {
            success: false,
            appointments: []
        };
    }
}

/**
 * Cancela um agendamento via WhatsApp
 */
export async function cancelAppointmentFromAI(params: {
    appointmentId: string;
    leadId: string;
    reason?: string;
}) {
    try {
        // Verificar se o agendamento pertence ao lead
        const appointment = await prisma.appointment.findFirst({
            where: {
                id: params.appointmentId,
                leadId: params.leadId
            },
            include: {
                services: {
                    include: { service: true }
                }
            }
        });

        if (!appointment) {
            return {
                success: false,
                message: "Agendamento não encontrado."
            };
        }

        // Atualizar status
        await prisma.appointment.update({
            where: { id: params.appointmentId },
            data: {
                status: 'CANCELLED',
                notes: appointment.notes
                    ? `${appointment.notes}\n\nCancelado via WhatsApp: ${params.reason || 'Sem motivo informado'}`
                    : `Cancelado via WhatsApp: ${params.reason || 'Sem motivo informado'}`
            }
        });

        const date = new Date(appointment.startTime).toLocaleDateString('pt-BR');
        const time = new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        return {
            success: true,
            message: `❌ Agendamento cancelado\n\n` +
                `📅 ${date} às ${time}\n` +
                `💇 ${appointment.services[0]?.service?.name}\n\n` +
                `Se precisar reagendar, é só me avisar! 😊`
        };

    } catch (error) {
        console.error("Error canceling appointment from AI:", error);
        return {
            success: false,
            message: "Desculpe, não consegui cancelar o agendamento. Por favor, entre em contato conosco."
        };
    }
}
