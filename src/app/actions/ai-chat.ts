"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSystemConfig } from "./admin-settings";
import { searchKnowledgeBase } from "./knowledge";

export async function sendAIPreviewMessage(message: string, chatId?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            include: { tenant: true }
        });

        if (!profile || !profile.tenant) return { error: "Tenant not found" };

        const webhookUrl = await getSystemConfig("n8n_webhook_url");
        if (!webhookUrl) {
            return { error: "Webhook n8n não configurado no Admin." };
        }

        // 0. Garantir que o Lead existe com um nome bonito para os logs
        const leadId = chatId || crypto.randomUUID();
        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const previewInstanceName = `preview_${profile.tenantId}`;

        // Ensure the preview instance exists to avoid FK error
        const existingInstance = await prisma.whatsappInstance.findUnique({
            where: { internalName: previewInstanceName }
        });

        if (!existingInstance) {
            console.log(`[AI Preview] Creating missing instance for ${profile.tenantId}`);
            await prisma.whatsappInstance.create({
                data: {
                    tenantId: profile.tenantId,
                    name: 'Chat de Teste IA',
                    internalName: previewInstanceName,
                    status: 'connected'
                }
            });
        }

        await prisma.lead.upsert({
            where: { id: leadId },
            create: {
                id: leadId,
                whatsapp: `preview_${profile.tenantId}_${leadId}`,
                name: `Chat IA - ${formattedDate}`,
                pushName: `Simulado por ${profile.email}`,
                tenantId: profile.tenantId,
                instanceName: previewInstanceName // Now safe to use fixed instance
            },
            update: {
                updatedAt: new Date(),
                instanceName: previewInstanceName
            }
        });

        const assistantName = profile.tenant.assistantName || "Secretária";

        // 1. Buscar Contexto na Base de Conhecimento
        const contextResults = await searchKnowledgeBase(message, 3);
        const contextText = contextResults.map(r => r.content).join("\n\n---\n\n");

        // 2. Chamada para o n8n - Mimicando estrutura da Evolution API
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "messages.upsert",
                instance: previewInstanceName,
                data: {
                    messages: [{
                        key: {
                            remoteJid: `preview_${profile.tenantId}_${leadId}`,
                            fromMe: false,
                            id: crypto.randomUUID()
                        },
                        pushName: `Simulado por ${profile.email}`,
                        message: {
                            extendedTextMessage: {
                                text: message
                            }
                        },
                        messageTimestamp: Math.floor(Date.now() / 1000),
                        // Campos extras para controle interno no n8n
                        metadata: {
                            preview: true,
                            chatApp: true,
                            tenantId: profile.tenantId,
                            agentName: assistantName,
                            context: contextText
                        }
                    }]
                }
            })
        });

        if (!response.ok) {
            // Log but don't fail hard if it's just n8n being slow? No, 500 error is bad.
            // If n8n workflow is async, it should return 200 OK immediately (Mock Response or Respond to Webhook early).
            // throw new Error(`n8n Error: ${response.statusText}`);
        }

        // We don't wait for output. Realtime will handle it.
        return { success: true };

    } catch (e: any) {
        console.error("AI Preview Error:", e);
        return { error: e.message };
    }
}

export async function sendPublicAIPreviewMessage(message: string, token: string, chatId?: string) {
    try {
        // 1. Validate Token (Base64 decode of JSON {tenantId, chatId})
        let tenantId = "";
        let providedChatId = "";
        try {
            const decoded = JSON.parse(atob(token));
            tenantId = decoded.tenantId;
            providedChatId = decoded.chatId;
        } catch (e) {
            // Fallback for old tokens (just tenantId)
            try {
                tenantId = atob(token);
            } catch (e2) {
                return { error: "Link inválido ou corrompido." };
            }
        }

        if (!tenantId) return { error: "Link inválido." };

        // 2. Validate Tenant Exists
        // Using raw query for speed/decoupling, or prisma findUnique if simpler
        // Since we are "outside" auth context, we trust the ID if it exists in DB.
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) return { error: "Empresa não encontrada ou link expirado." };

        // 3. Get System Configs
        const webhookUrl = await getSystemConfig("n8n_webhook_url");
        if (!webhookUrl) {
            return { error: "Chat temporariamente indisponível (Erro de configuração)." };
        }

        // 4. Search Knowledge Base (We need a public search function or modify existing one)
        // Existing searchKnowledgeBase uses getTenantContext() which fails without auth.
        // We need searchPublicKnowledgeBase. 
        // For now, let's call n8n directly without context OR implement searchPublicKnowledgeBase below.

        let contextText = "";
        try {
            // Reuse search logic but passing tenantId explicitly
            // We can't use `searchKnowledgeBase` because it calls `getTenantContext` -> `supabase.auth.getUser`.
            // So we implement a quick search here or refactor.
            // Refactoring is safer.
            const apiKey = await getSystemConfig("openai_api_key");
            if (apiKey) {
                const { getOpenAIEmbedding } = await import("@/lib/openai");
                const vector = await getOpenAIEmbedding(message, apiKey);
                const vectorString = `[${vector.join(",")}]`;

                const results = await prisma.$queryRawUnsafe<any[]>(`
                    SELECT content FROM documents
                    WHERE "tenant_id" = $1 AND metadata->>'active' = '1'
                    ORDER BY (1 - (embedding <=> ${vectorString}::vector)) DESC
                    LIMIT 3
                 `, tenantId);

                contextText = results.map(r => r.content).join("\n\n---\n\n");
            }
        } catch (e) {
            console.error("Public Search Context Error", e);
            // Non-blocking, continue without context
        }

        // 0. Garantir que o Lead existe para o link público
        const leadId = chatId || providedChatId || crypto.randomUUID();
        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const previewInstanceName = `preview_${tenantId}`;

        // Ensure the preview instance exists to avoid FK error
        const existingInstance = await prisma.whatsappInstance.findUnique({
            where: { internalName: previewInstanceName }
        });

        if (!existingInstance) {
            console.log(`[Public AI Preview] Creating missing instance for ${tenantId}`);
            await prisma.whatsappInstance.create({
                data: {
                    tenantId: tenantId,
                    name: 'Chat de Teste IA',
                    internalName: previewInstanceName,
                    status: 'connected'
                }
            });
        }

        await prisma.lead.upsert({
            where: { id: leadId },
            create: {
                id: leadId,
                whatsapp: `public_${tenantId.substring(0, 8)}_${leadId}`,
                name: `Chat IA - ${formattedDate}`,
                pushName: "Acesso via Link",
                tenantId: tenantId,
                instanceName: previewInstanceName
            },
            update: {
                updatedAt: new Date(),
                instanceName: previewInstanceName
            }
        });

        const assistantName = tenant.assistantName || "Secretária";

        // 5. Call N8N - Mimicando estrutura da Evolution API
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "messages.upsert",
                instance: previewInstanceName,
                data: {
                    messages: [{
                        key: {
                            remoteJid: `public_${tenantId.substring(0, 8)}_${leadId}`,
                            fromMe: false,
                            id: crypto.randomUUID()
                        },
                        pushName: "Acesso via Link",
                        message: {
                            extendedTextMessage: {
                                text: message
                            }
                        },
                        messageTimestamp: Math.floor(Date.now() / 1000),
                        // Campos extras para controle interno no n8n
                        metadata: {
                            preview: true,
                            chatApp: true,
                            tenantId: tenantId,
                            agentName: assistantName,
                            context: contextText
                        }
                    }]
                }
            })
        });

        if (!response.ok) {
            // throw new Error("Erro na comunicação com a IA.");
        }

        // Return sync success
        return { success: true };

    } catch (e: any) {
        console.error("Public AI Preview Error:", e);
        return { error: e.message };
    }
}

export async function generatePublicChatLink(chatId?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { tenantId: true }
        });

        if (!profile || !profile.tenantId) return { error: "Tenant not found" };

        // Generate base64 token with JSON context
        const token = btoa(JSON.stringify({
            tenantId: profile.tenantId,
            chatId: chatId
        }));

        // Return token
        return { success: true, token };

    } catch (e: any) {
        return { error: e.message };
    }
}

export async function checkAIResponse(chatId: string) {
    const key = `chat_response_${chatId}`;
    console.log(`[POLLING SERVER] Checking for key: "${key}"`);

    try {
        // Use Prisma to bypass RLS policies on system_configs
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });

        console.log(`[POLLING SERVER] Prisma result:`, config ? {
            id: config.id,
            key: config.key,
            valueLength: config.value.length,
            valuePreview: config.value.substring(0, 50)
        } : null);

        if (config && config.value) {
            console.log(`[POLLING SERVER] Found message for ${chatId}, deleting...`);
            // Found it! Clean up (consume once)
            await prisma.systemConfig.delete({
                where: { key }
            });
            console.log(`[POLLING SERVER] Deleted config for ${chatId}`);
            return { success: true, message: config.value };
        }

        console.log(`[POLLING SERVER] No message found for key: "${key}"`);
        return { success: false };
    } catch (e: any) {
        console.error("[POLLING SERVER] Error:", e);
        return { success: false, error: e.message };
    }
}

export async function getPublicChatInfo(token: string) {
    try {
        let tenantId = "";
        try {
            const decoded = JSON.parse(atob(token));
            tenantId = decoded.tenantId;
        } catch (e) {
            tenantId = atob(token);
        }

        if (!tenantId) return { error: "Token inválido" };

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { assistantName: true, name: true }
        });

        if (!tenant) return { error: "Tenant não encontrado" };

        return {
            success: true,
            assistantName: tenant.assistantName || "Secretária",
            tenantName: tenant.name
        };
    } catch (e: any) {
        return { error: e.message };
    }
}
