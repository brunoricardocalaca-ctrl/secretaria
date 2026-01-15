"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSystemConfig } from "./admin-settings";

async function getTenantContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: { tenant: true }
    });
    if (!profile || !profile.tenant) throw new Error("Tenant not found");

    return { tenantId: profile.tenantId, configs: profile.tenant.configs as any };
}

export async function generateServiceDraft(description: string) {
    try {
        const { configs } = await getTenantContext();
        // Use Global Key
        const apiKey = await getSystemConfig("openai_api_key");

        if (!apiKey) {
            return { error: "OpenAI API Key não configurada no Admin Global." };
        }

        if (!description || description.trim().length < 5) {
            return { error: "Descrição muito curta. Forneça mais detalhes para a IA." };
        }

        // Fetch custom prompt from DB
        // Fetch custom prompt from DB
        const customPrompt = await prisma.systemConfig.findUnique({
            where: { key: "service_gen_prompt" }
        });

        const descriptionPromptRecord = await prisma.systemConfig.findUnique({
            where: { key: "service_description_prompt" }
        });

        let systemPrompt = customPrompt?.value || `Você é uma IA especialista em criar catálogos de serviços para clínicas e estúdios.
                        Sua tarefa é analisar uma descrição (mesmo que rascunho) e estruturar um serviço profissional.
                        
                        Retorne APENAS um JSON válido com a seguinte estrutura, sem markdown ou explicações:
                        {
                            "suggestedName": "Nome curto e comercial do serviço",
                            "description": "Texto persuasivo em um parágrafo usando técnicas de copywriting. Use emojis e bullet points se necessário para vender o serviço via WhatsApp.",
                            "durationMin": 30, // Estimativa em minutos (number)
                            "tags": "tag1, tag2, tag3", // 5 a 8 tags positivas separadas por vírgula
                            "negativeTags": "tag1, tag2, tag3", // 3 a 5 tags negativas (o que NÃO é o serviço)
                            "diagnosticQuestions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"] // Array de 3 perguntas para qualificar o lead
                        }`;

        // Inject specific description instructions if set
        if (descriptionPromptRecord?.value && descriptionPromptRecord.value.trim() !== "") {
            systemPrompt += `\n\nIMPORTANTE SOBRE A DESCRIÇÃO:\n${descriptionPromptRecord.value}`;
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Fast and efficient for this task
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `Descrição do usuário: "${description}"`
                    }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI Error:", err);
            return { error: "Falha ao conectar com a IA. Tente novamente." };
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        return { success: true, data: content };

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return { error: error.message };
    }
}

export async function generateAssessmentDescription(serviceName: string, draftDescription?: string) {
    try {
        const { configs } = await getTenantContext();
        // Use Global Key
        const apiKey = await getSystemConfig("openai_api_key");

        if (!apiKey) {
            return { error: "OpenAI API Key não configurada no Admin Global." };
        }

        // Fetch custom prompt
        const customPrompt = await prisma.systemConfig.findUnique({
            where: { key: "assessment_gen_prompt" }
        });

        console.log("DEBUG: Fetching assessment prompt:");
        console.log("DEBUG: Key: assessment_gen_prompt");
        console.log("DEBUG: Value from DB:", customPrompt?.value);

        const systemPrompt = customPrompt?.value || `Você é uma especialista em vendas de clínicas de estética e saúde.
        Crie uma descrição persuasiva para a "Avaliação" do serviço "${serviceName}".
        
        Objetivo: Explicar ao cliente por que a avaliação é necessária (ex: segurança, personalização) e vender a ideia de agendar.
        Formato: Texto curto (1 parágrafo ou bullet points), com emojis, tom acolhedor e profissional.
        
        Retorne APENAS o texto da descrição.`;

        console.log("DEBUG: Final System Prompt Used:", systemPrompt);

        const userContent = draftDescription ? `Contexto adicional do usuário: "${draftDescription}"` : `Serviço: ${serviceName}`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            console.error("DEBUG: OpenAI Error:", await response.text());
            return { error: "Erro na IA." };
        }

        const data = await response.json();
        return { success: true, data: data.choices[0].message.content };

    } catch (error: any) {
        console.error("AI Assessment Gen Error:", error);
        return { error: error.message };
    }
}
