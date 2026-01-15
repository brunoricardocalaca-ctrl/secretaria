"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { EvolutionClient } from "@/lib/evolution";

const evolution = new EvolutionClient();

async function getEffectiveTenantId(tenantOverrideId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { tenantId: true, role: true },
    });

    if (!profile) throw new Error("Profile not found");

    // Logic: If override requested, check if user is super_admin
    if (tenantOverrideId) {
        if (profile.role !== 'super_admin') {
            throw new Error("Unauthorized: Only Super Admins can impersonate tenants.");
        }
        return tenantOverrideId;
    }

    return profile.tenantId;
}

export async function getChats(tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        // Busca leads do tenant com a última mensagem
        const leads = await prisma.lead.findMany({
            where: { tenantId },
            include: {
                conversations: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return {
            success: true,
            chats: leads.map(lead => ({
                id: lead.id,
                name: lead.pushName || lead.name || lead.whatsapp.replace('@s.whatsapp.net', ''),
                pushName: lead.pushName,
                displayPhone: lead.whatsapp.replace('@s.whatsapp.net', ''),
                lastMessage: lead.conversations[0]?.content || "Sem mensagens",
                time: lead.conversations[0]?.createdAt
                    ? new Date(lead.conversations[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "",
                unread: 0,
                whatsapp: lead.whatsapp,
                unread: 0,
                whatsapp: lead.whatsapp,
                instanceName: lead.instanceName,
                aiPaused: lead.aiPaused
            }))
        };
    } catch (e: any) {
        console.error("Error fetching chats:", e);
        return { error: e.message };
    }
}

export async function getMessages(leadId: string, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        const messages = await prisma.conversation.findMany({
            where: {
                leadId,
                tenantId
            },
            orderBy: { createdAt: 'asc' }
        });

        return {
            success: true,
            messages: messages.map(m => ({
                id: m.id,
                text: m.content,
                sender: m.role, // 'user', 'assistant', 'human'
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
        };
    } catch (e: any) {
        console.error("Error fetching messages:", e);
        return { error: e.message };
    }
}

export async function sendMessageAction(leadId: string, content: string, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { instance: true }
        });

        if (!lead || !lead.instanceName) throw new Error("Lead ou instância não encontrados");

        // 1. Enviar via Evolution API
        await evolution.sendText(lead.instanceName, lead.whatsapp, content);

        // 2. Salvar no Banco (Como 'human')
        const msg = await prisma.conversation.create({
            data: {
                content,
                role: 'human',
                leadId,
                tenantId,
                instanceName: lead.instanceName
            }
        });

        // 3. Atualizar o updatedAt do lead para subir na lista
        await prisma.lead.update({
            where: { id: leadId },
            data: { updatedAt: new Date() }
        });

        return {
            success: true,
            message: {
                id: msg.id,
                text: msg.content,
                sender: msg.role,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        };
    } catch (e: any) {
        console.error("Error sending message:", e);
        return { error: e.message };
    }
}

export async function updateLeadName(leadId: string, newName: string, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        const lead = await prisma.lead.update({
            where: { id: leadId, tenantId },
            data: { name: newName }
        });

        return {
            success: true,
            lead: {
                id: lead.id,
                name: lead.name,
                pushName: lead.pushName
            }
        };
    } catch (e: any) {
        console.error("Error updating lead name:", e);
        return { error: e.message };
    }
}

export async function fetchPushName(leadId: string, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        const lead = await prisma.lead.findUnique({
            where: { id: leadId, tenantId }
        });

        if (!lead || !lead.instanceName) throw new Error("Lead ou instância não encontrados");

        // Buscar pushName da Evolution API
        const contact = await evolution.getContact(lead.instanceName, lead.whatsapp);

        if (contact && contact.pushName) {
            // Atualizar no banco
            await prisma.lead.update({
                where: { id: leadId },
                data: { pushName: contact.pushName }
            });

            return {
                success: true,
                pushName: contact.pushName
            };
        }

        return { success: false, error: "PushName não encontrado" };
    } catch (e: any) {
        console.error("Error fetching pushName:", e);
        return { error: e.message };
    }
}

export async function sendDocument(leadId: string, fileUrl: string, caption?: string, fileName?: string, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { instance: true }
        });

        if (!lead || !lead.instanceName) throw new Error("Lead ou instância não encontrados");

        // 1. Enviar via Evolution API
        await evolution.sendMedia(lead.instanceName, lead.whatsapp, fileUrl, caption, fileName);

        // 2. Salvar no Banco (Como 'human')
        const msg = await prisma.conversation.create({
            data: {
                content: caption || `📎 Documento enviado: ${fileName}`,
                role: 'human',
                leadId,
                tenantId,
                instanceName: lead.instanceName
            }
        });

        // 3. Atualizar o updatedAt do lead
        await prisma.lead.update({
            where: { id: leadId },
            data: { updatedAt: new Date() }
        });

        return {
            success: true,
            message: {
                id: msg.id,
                text: msg.content,
                sender: msg.role,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        };
    } catch (e: any) {
        console.error("Error sending document:", e);
        return { error: e.message };
    }
}

export async function toggleAiStatus(leadId: string, paused: boolean, tenantOverrideId?: string) {
    try {
        const tenantId = await getEffectiveTenantId(tenantOverrideId);

        await prisma.lead.update({
            where: { id: leadId, tenantId },
            data: { aiPaused: paused }
        });

        // Optional: Add system message about AI status change
        const message = paused ? "IA Pausada" : "IA Retomada";

        // Check if we can find the lead to get instance name for message record
        const lead = await prisma.lead.findUnique({
            where: { id: leadId }
        });

        if (lead) {
            await prisma.conversation.create({
                data: {
                    content: message,
                    role: 'system',
                    leadId,
                    tenantId,
                    instanceName: lead.instanceName
                }
            });
        }

        return { success: true, aiPaused: paused };
    } catch (e: any) {
        console.error("Error toggling AI status:", e);
        return { error: e.message };
    }
}
