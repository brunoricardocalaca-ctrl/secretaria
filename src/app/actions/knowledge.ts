"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSystemConfig } from "./admin-settings";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getOpenAIBatchedEmbeddings, getOpenAIEmbedding } from "@/lib/openai";

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

export async function syncServicesToKnowledgeBase(providedTenantId?: string, providedApiKey?: string) {
    try {
        const { tenantId } = providedTenantId ? { tenantId: providedTenantId } : await getTenantContext();
        const apiKey = providedApiKey || await getSystemConfig("openai_api_key");

        if (!apiKey) {
            return { error: "OpenAI API Key não configurada no Admin." };
        }

        // 1. Buscar serviços (Sincronizamos todos, mas marcamos como ativos/inativos no metadata)
        const services = await prisma.service.findMany({
            where: { tenantId }
        });

        const documentsWithTags = [];

        // 2. Preparar textos para embedding e Gerar Tags Ultraespecíficas
        if (services.length > 0) {
            const preparedDocs = await Promise.all(services.map(async (s) => {
                const rules = s.rules ? (typeof s.rules === 'string' ? JSON.parse(s.rules) : s.rules) : {};
                let detailText = `Serviço: ${s.name}\n`;
                if (s.description) detailText += `Descrição: ${s.description}\n`;

                if (rules.pricingModel === 'table' && rules.priceTableContent) {
                    detailText += `Tabela de Preços:\n${rules.priceTableContent}\n`;
                } else if (!s.priceHidden && s.price) {
                    detailText += `Preço: R$ ${Number(s.price).toFixed(2)}\n`;
                }

                if (!rules.durationHidden && s.durationMin) {
                    detailText += `Duração: ${s.durationMin} minutos\n`;
                }

                if (rules.negativeTags) {
                    detailText += `IMPORTANTE - NÃO OFERECER SE O CLIENTE MENCIONAR: ${rules.negativeTags}\n`;
                }

                // Gerar Tags via LLM
                let tags: string[] = [];
                try {
                    const tagResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: "gpt-4o-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "Você é um especialista em SEO e classificação de serviços. Gere de 5 a 8 tags ultraespecíficas (em minúsculas, separadas por hífen se necessário) para o serviço fornecido. Retorne APENAS as tags separadas por vírgula, sem explicações."
                                },
                                {
                                    role: "user",
                                    content: `Nome: ${s.name}\nDescrição: ${s.description || "N/A"}`
                                }
                            ],
                            temperature: 0,
                            max_tokens: 100
                        })
                    });

                    if (tagResponse.ok) {
                        const tagData = await tagResponse.json();
                        const tagContent = tagData.choices[0].message.content;
                        tags = tagContent.split(",").map((t: string) => t.trim().toLowerCase());
                    }
                } catch (err) {
                    console.error(`Erro ao gerar tags para ${s.name}:`, err);
                }

                return {
                    id: s.id,
                    text: detailText.trim(),
                    metadata: {
                        ...rules, // Spread all rules to ensure metadata has everything
                        serviceId: s.id,
                        serviceName: s.name,
                        type: "service",
                        active: s.active ? "1" : "0",
                        description: s.description || "",
                        price: s.price ? Number(s.price).toFixed(2) : "0.00",
                        priceHidden: s.priceHidden ? "1" : "0",
                        durationMin: s.durationMin?.toString() || "0",
                        durationHidden: rules.durationHidden ? "1" : "0",
                        requiresEval: s.requiresEval ? "1" : "0",

                        // Standardized fields (preserving '1'/'0' for boolean filters in SQL)
                        hasEvaluation: (rules.hasEvaluation || s.requiresEval) ? "1" : "0",
                        evalIsPaid: rules.evalIsPaid ? "1" : "0",
                        evalHasDuration: rules.evalHasDuration ? "1" : "0",
                        isPriceList: rules.pricingModel === 'table' ? "1" : "0",
                        hasImage: s.imageUrl ? "1" : "0",

                        // Array processing for tags
                        tags: [
                            ...(tags || []),
                            ...(rules.positiveTags ? rules.positiveTags.split(",").map((t: string) => t.trim().toLowerCase()) : (s as any).tags ? (s as any).tags.split(",").map((t: string) => t.trim().toLowerCase()) : [])
                        ],
                        negativeTags: rules.negativeTags ? rules.negativeTags.split(",").map((t: string) => t.trim().toLowerCase()) : []
                    }
                };
            }));
            documentsWithTags.push(...preparedDocs);
        }

        // 3. Batched Embeddings via utility
        const embeddings = services.length > 0 ? await getOpenAIBatchedEmbeddings(documentsWithTags.map(d => d.text), apiKey) : [];

        // 4. MIGRATION AUTOMÁTICA: Garantir que a coluna se chama tenant_id para não quebrar os triggers do Postgres
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "documents" RENAME COLUMN "tenantId" TO "tenant_id";`);
        } catch (e) { }

        // 5. Buscar registros existentes via SQL Raw (mais seguro contra desalinhamento de schema/client)
        const existingEntries = await prisma.$queryRawUnsafe<any[]>(
            `SELECT "id", "metadata" FROM "documents" WHERE "tenant_id" = $1 AND "metadata"->>'type' = 'service'`,
            tenantId
        );

        const existingMap = new Map();
        existingEntries.forEach(entry => {
            const svcId = (entry.metadata as any)?.serviceId;
            if (svcId) existingMap.set(svcId, entry.id);
        });

        // 6. Inserir ou Atualizar (Upsert)
        const syncedDatabaseIds = new Set();

        if (services.length > 0) {
            for (let i = 0; i < documentsWithTags.length; i++) {
                const doc = documentsWithTags[i];
                const svcId = doc.metadata.serviceId;
                const vector = embeddings[i];
                const vectorString = `[${vector.join(",")}]`;

                const existingId = existingMap.get(svcId);

                if (existingId) {
                    await prisma.$executeRaw`
                        UPDATE "documents" 
                        SET "content" = ${doc.text}, 
                            "metadata" = ${JSON.stringify(doc.metadata)}::jsonb, 
                            "embedding" = ${vectorString}::vector
                        WHERE "id" = ${existingId}
                    `;
                    syncedDatabaseIds.add(existingId);
                } else {
                    const newId = randomUUID();
                    await prisma.$executeRaw`
                        INSERT INTO "documents" ("id", "tenant_id", "content", "metadata", "embedding", "createdAt")
                        VALUES (
                            ${newId}, 
                            ${tenantId}, 
                            ${doc.text}, 
                            ${JSON.stringify(doc.metadata)}::jsonb, 
                            ${vectorString}::vector, 
                            NOW()
                        )
                    `;
                    syncedDatabaseIds.add(newId);
                }
            }
        }

        // 7. Limpar quem não está mais na lista de serviços ativos
        const idsToRemove = existingEntries
            .filter(e => !syncedDatabaseIds.has(e.id))
            .map(e => e.id);

        if (idsToRemove.length > 0) {
            await prisma.$executeRawUnsafe(
                `DELETE FROM "documents" WHERE "id" = ANY($1::uuid[])`,
                idsToRemove
            );
        }

        try {
            revalidatePath("/dashboard/services");
        } catch (e) {
            // Ignore revalidation errors in CLI/Cron contexts
        }
        return { success: true, count: documentsWithTags.length };

    } catch (e: any) {
        console.error("Knowledge Sync Error:", e);
        return { error: e.message };
    }
}

export async function searchKnowledgeBase(query: string, limit: number = 3, internalTenantId?: string, internalApiKey?: string) {
    try {
        const tenantId = internalTenantId || (await getTenantContext()).tenantId;
        const apiKey = internalApiKey || await getSystemConfig("openai_api_key");

        if (!apiKey) return [];

        // 1. Gerar embedding para a busca
        const vector = await getOpenAIEmbedding(query, apiKey);
        const vectorString = `[${vector.join(",")}]`;

        // 2. Busca Semântica no Postgres (Cosine Similarity)
        // <=> is the operator for cosine distance in pgvector
        const results = await prisma.$queryRawUnsafe<any[]>(`
            SELECT content, metadata, (1 - (embedding <=> ${vectorString}::vector)) as similarity
            FROM documents
            WHERE "tenant_id" = $1 AND metadata->>'active' = '1'
            ORDER BY similarity DESC
            LIMIT $2
        `, tenantId, limit);

        return results;

    } catch (e) {
        console.error("Knowledge Search Error:", e);
        return [];
    }
}
