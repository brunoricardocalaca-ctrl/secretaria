import { NextRequest, NextResponse } from "next/server";
import { EvolutionClient } from "@/lib/evolution";
import prisma from "@/lib/prisma";

/**
 * Endpoint para envio de mensagens via Evolution API
 * URL: POST /api/evolution/message/send
 * Body: { tenantId, chatId, text, mediaUrl?, instanceName?, number? }
 * 
 * Se number/instanceName não forem enviados, buscaremos pelo chatId (Lead ID).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { instanceName, number, text, mediaUrl, tenantId, chatId } = body;

        // Validação Mínima
        if (!chatId && !number) {
            return NextResponse.json(
                { error: "Must provide either chatId (Lead ID) or number" },
                { status: 400 }
            );
        }

        if (!tenantId) {
            return NextResponse.json(
                { error: "Missing required field: tenantId" },
                { status: 400 }
            );
        }

        if (!text && !mediaUrl) {
            return NextResponse.json(
                { error: "Must provide either text or mediaUrl" },
                { status: 400 }
            );
        }

        // Se faltar número ou instância, buscar do Lead usando chatId
        if (chatId && (!number || !instanceName)) {
            const lead = await prisma.lead.findUnique({
                where: { id: chatId }
            });

            if (!lead) {
                return NextResponse.json(
                    { error: "Lead (Chat ID) not found" },
                    { status: 404 }
                );
            }

            // Usar dados do Lead se não foram fornecidos
            if (!number) number = lead.whatsapp;
            if (!instanceName) instanceName = lead.instanceName;
        }

        // Validação Final antes do envio
        if (!instanceName || !number) {
            return NextResponse.json(
                { error: "Could not resolve instanceName or number from Chat ID" },
                { status: 400 }
            );
        }

        const evolution = new EvolutionClient();
        let result;

        if (mediaUrl) {
            // Envio de mídia
            result = await evolution.sendMedia(instanceName, number, mediaUrl, text);
        } else {
            // Envio de texto apenas
            result = await evolution.sendText(instanceName, number, text);
        }

        // Salvar mensagem no banco de dados (se chatId/leadId for fornecido)
        if (chatId) {
            try {
                await prisma.conversation.create({
                    data: {
                        content: text || (mediaUrl ? `[Media: ${mediaUrl}]` : ""),
                        role: "assistant", // Mensagem enviada pelo sistema/IA
                        leadId: chatId,    // chatId é o ID do Lead
                        tenantId: tenantId,
                        instanceName: instanceName
                    }
                });

                // Atualizar updatedAt do lead para subir na lista
                await prisma.lead.update({
                    where: { id: chatId },
                    data: { updatedAt: new Date() }
                });

            } catch (dbError) {
                console.error("[Evolution Send Message] Failed to save to DB:", dbError);
                // Não falhar a requisição se o erro for apenas no banco (mensagem já foi enviada)
            }
        }

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error("[Evolution Send Message API Error]:", error);
        return NextResponse.json(
            {
                error: error.message || "Internal Server Error",
                details: error
            },
            { status: 500 }
        );
    }
}
