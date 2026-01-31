import { NextRequest, NextResponse } from "next/server";
import { EvolutionClient } from "@/lib/evolution";
import prisma from "@/lib/prisma";

/**
 * Endpoint para envio de mensagens via Evolution API
 * URL: POST /api/evolution/message/send
 * Body: { tenantId, chatId, text, mediaUrl?, instanceName?, number? }
 * 
 * Se number/instanceName não forem enviados (cenário Testar IA), apenas salva no banco.
 * Se forem enviados (ou encontrados no Lead), tenta enviar via WhatsApp também.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { instanceName, number, text, mediaUrl, tenantId, chatId } = body;

        // Validação Mínima
        if (!chatId && !number) {
            return NextResponse.json(
                { error: "Must provide post chatId (Lead ID) or number" },
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

        // Tentar preencher dados faltantes usando o Lead (se disponível)
        if (chatId && (!number || !instanceName)) {
            const lead = await prisma.lead.findUnique({
                where: { id: chatId }
            });

            if (lead) {
                if (!number) number = lead.whatsapp;
                if (!instanceName) instanceName = lead.instanceName;
            }
            // Se não achar o lead ou não tiver dados, apenas segue sem eles
        }

        let evolutionResult = null;

        // Apenas tenta enviar via Evolution se tivermos os dados necessários
        // Para "Testar IA", esses dados podem estar ausentes ou ser inválidos, então pulamos
        if (instanceName && number) {
            try {
                const evolution = new EvolutionClient();
                if (mediaUrl) {
                    evolutionResult = await evolution.sendMedia(instanceName, number, mediaUrl, text);
                } else {
                    evolutionResult = await evolution.sendText(instanceName, number, text);
                }
            } catch (evoError) {
                console.warn("[Evolution API] Skipping send or failed:", evoError);
                // Não bloqueamos o fluxo se falhar o envio externo, pois o foco pode ser apenas logar no chat interno
            }
        }

        // Salvar mensagem no banco de dados (CRÍTICO para o chat interno funcionar)
        let dbMessage = null;
        if (chatId) {
            try {
                dbMessage = await prisma.conversation.create({
                    data: {
                        content: text || (mediaUrl ? `[Media: ${mediaUrl}]` : ""),
                        role: "assistant", // Mensagem enviada pelo sistema/IA
                        leadId: chatId,    // chatId é o ID do Lead
                        tenantId: tenantId,
                        instanceName: instanceName || "internal_test" // Fallback para não quebrar constraint se houver
                    }
                });

                // Atualizar updatedAt do lead para subir na lista
                await prisma.lead.update({
                    where: { id: chatId },
                    data: { updatedAt: new Date() }
                });

            } catch (dbError) {
                console.error("[Evolution Send Message] Failed to save to DB:", dbError);
                return NextResponse.json({ error: "Failed to save message to database" }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            savedToDb: !!dbMessage,
            sentToEvolution: !!evolutionResult,
            data: evolutionResult
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
