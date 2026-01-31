import { NextRequest, NextResponse } from "next/server";
import { EvolutionClient } from "@/lib/evolution";
import prisma from "@/lib/prisma";

/**
 * Endpoint para envio de mensagens via Evolution API
 * URL: POST /api/evolution/message/send
 * Body: { instanceName, number, text, mediaUrl?, tenantId, chatId }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { instanceName, number, text, mediaUrl, tenantId, chatId } = body;

        // Validação básica
        if (!instanceName || !number) {
            return NextResponse.json(
                { error: "Missing required fields: instanceName, number" },
                { status: 400 }
            );
        }

        if (!text && !mediaUrl) {
            return NextResponse.json(
                { error: "Must provide either text or mediaUrl" },
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
        if (chatId && tenantId) {
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
