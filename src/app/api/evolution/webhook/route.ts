import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Webhook para receber mensagens da Evolution API
 * Configure no Evolution: POST /webhook/set/{instanceName}
 * URL: https://seu-dominio.com/api/evolution/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Evolution API envia diferentes eventos
        // Exemplo de estrutura: { event: "messages.upsert", instance: "...", data: {...} }
        const { event, instance, data } = body;

        // Processar apenas mensagens recebidas
        if (event === "messages.upsert" || event === "message.received") {
            const message = data?.messages?.[0] || data?.message || data;

            // Extrair informações da mensagem
            const remoteJid = message.key?.remoteJid || message.from;
            const pushName = message.pushName || message.key?.pushName;
            const messageText = message.message?.conversation ||
                message.message?.extendedTextMessage?.text ||
                "";
            const isFromMe = message.key?.fromMe || false;

            // Ignorar mensagens enviadas por nós
            if (isFromMe) {
                return NextResponse.json({ success: true, ignored: "fromMe" });
            }

            // Limpar número (remover @s.whatsapp.net se necessário)
            const whatsappNumber = remoteJid;

            if (!whatsappNumber) {
                return NextResponse.json({ error: "No whatsapp number" }, { status: 400 });
            }

            // Buscar ou criar Lead
            let lead = await prisma.lead.findFirst({
                where: {
                    whatsapp: whatsappNumber,
                    instanceName: instance
                }
            });

            if (!lead) {
                // Criar novo lead se não existir
                // Precisamos do tenantId - buscar pela instância
                const whatsappInstance = await prisma.whatsappInstance.findUnique({
                    where: { internalName: instance }
                });

                if (!whatsappInstance) {
                    return NextResponse.json({ error: "Instance not found" }, { status: 404 });
                }

                lead = await prisma.lead.create({
                    data: {
                        whatsapp: whatsappNumber,
                        pushName: pushName || null,
                        name: pushName || null,
                        tenantId: whatsappInstance.tenantId,
                        instanceName: instance
                    }
                });
            } else {
                // Atualizar pushName se veio diferente
                if (pushName && lead.pushName !== pushName) {
                    lead = await prisma.lead.update({
                        where: { id: lead.id },
                        data: {
                            pushName,
                            // Se não tem name, usar pushName
                            name: lead.name || pushName
                        }
                    });
                }
            }

            // Salvar mensagem na conversa (role: 'user' para mensagens do cliente)
            if (messageText) {
                await prisma.conversation.create({
                    data: {
                        content: messageText,
                        role: 'user',
                        leadId: lead.id,
                        tenantId: lead.tenantId,
                        instanceName: instance
                    }
                });

                // Atualizar updatedAt do lead
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { updatedAt: new Date() }
                });
            }

            return NextResponse.json({
                success: true,
                leadId: lead.id,
                pushName: lead.pushName
            });
        }

        // Outros eventos podem ser processados aqui
        return NextResponse.json({ success: true, event });

    } catch (error: any) {
        console.error("[Evolution Webhook Error]:", error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}

// Permitir GET para verificação
export async function GET() {
    return NextResponse.json({
        status: "Evolution Webhook Active",
        endpoint: "/api/evolution/webhook"
    });
}
