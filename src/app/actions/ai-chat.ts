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

        // 1. Buscar Contexto na Base de Conhecimento
        const contextResults = await searchKnowledgeBase(message, 3);
        const contextText = contextResults.map(r => r.content).join("\n\n---\n\n");

        // 2. Chamada para o n8n
        // Async Pattern: Fire and forget (or await 200 OK)
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                chatId, // Send conversation session ID
                datetime: new Date().toISOString(),
                context: contextText, // Send retrieved info
                tenantId: profile.tenantId,
                preview: true,
                chatApp: true,
                message_type: "extendedTextMessage",
                instanceName: `preview_${profile.tenantId}`,
                messageId: crypto.randomUUID()
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
        // 1. Validate Token (Simple Base64 decode of tenantId)
        let tenantId = "";
        try {
            tenantId = atob(token);
        } catch (e) {
            return { error: "Link inválido ou corrompido." };
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

        // 5. Call N8N
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                chatId,
                datetime: new Date().toISOString(),
                context: contextText,
                tenantId: tenantId,
                preview: true,
                chatApp: true,
                publicLink: true,
                message_type: "extendedTextMessage",
                instanceName: `public_preview_${tenantId}`,
                messageId: crypto.randomUUID()
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

export async function generatePublicChatLink() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { tenantId: true }
        });

        if (!profile || !profile.tenantId) return { error: "Tenant not found" };

        // Generate base64 token
        const token = btoa(profile.tenantId);

        // Return relative path or full URL if env var is set, but relative is safer for now to be constructed on client
        return { success: true, token };

    } catch (e: any) {
        return { error: e.message };
    }
}

export async function checkAIResponse(chatId: string) {
    try {
        console.log(`[POLLING] Checking for chatId: ${chatId}`);
        // Use Prisma to bypass RLS policies on system_configs
        const config = await prisma.systemConfig.findUnique({
            where: { key: `chat_response_${chatId}` }
        });

        if (config && config.value) {
            console.log(`[POLLING] Found message for ${chatId}:`, config.value.substring(0, 50));
            // Found it! Clean up (consume once)
            await prisma.systemConfig.delete({
                where: { key: `chat_response_${chatId}` }
            });
            console.log(`[POLLING] Deleted config for ${chatId}`);
            return { success: true, message: config.value };
        }

        console.log(`[POLLING] No message found for ${chatId}`);
        return { success: false };
    } catch (e: any) {
        console.error("[POLLING] Error:", e);
        return { success: false };
    }
}
