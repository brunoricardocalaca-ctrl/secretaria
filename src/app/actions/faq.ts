"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSystemConfig } from "./admin-settings";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { getOpenAIEmbedding } from "@/lib/openai";

async function getTenantContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: { tenant: true }
    });
    if (!profile || !profile.tenant) throw new Error("Tenant not found");

    return {
        tenantId: profile.tenantId,
        configs: profile.tenant.configs as any,
        tenantName: profile.tenant.name
    };
}

export async function getFAQs() {
    try {
        const { tenantId } = await getTenantContext();

        const faqs = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, content, metadata, "createdAt" 
             FROM documents 
             WHERE "tenant_id" = $1 AND metadata->>'type' = 'faq'
             ORDER BY "createdAt" DESC`,
            tenantId
        );

        return faqs.map(f => ({
            id: f.id,
            question: (f.metadata as any)?.question || "",
            answer: f.content,
            active: (f.metadata as any)?.active === "1",
            isAuto: (f.metadata as any)?.isAuto === "1",
            isPriceList: (f.metadata as any)?.isPriceList === "1",
            priceItems: (f.metadata as any)?.priceItems || [],
            createdAt: f.createdAt
        }));
    } catch (e) {
        console.error("Error fetching FAQs:", e);
        return [];
    }
}

export async function saveFAQAction(data: {
    id?: string,
    question: string,
    answer: string,
    active?: boolean,
    isAuto?: boolean,
    isPriceList?: boolean,
    priceItems?: { name: string, price: string }[]
}) {
    try {
        const { tenantId } = await getTenantContext();
        if (!tenantId) throw new Error("Tenant context missing");

        const apiKey = await getSystemConfig("openai_api_key");
        if (!apiKey) {
            return { error: "OpenAI API Key não configurada no Admin." };
        }

        const fullContent = `Pergunta: ${data.question}\nResposta: ${data.answer}`;
        const embedding = await getOpenAIEmbedding(fullContent, apiKey);
        const vectorString = `[${embedding.join(",")}]`;

        const metadata = {
            type: "faq",
            question: data.question,
            active: data.active !== false ? "1" : "0",
            isAuto: data.isAuto === true ? "1" : "0",
            isPriceList: data.isPriceList === true ? "1" : "0",
            priceItems: data.priceItems || [],
            updatedAt: new Date().toISOString()
        };

        if (data.id) {
            // Update
            await prisma.$executeRaw`
                UPDATE documents 
                SET content = ${fullContent},
                    metadata = ${JSON.stringify(metadata)}::jsonb,
                    embedding = ${vectorString}::vector
                WHERE id = ${data.id} AND tenant_id = ${tenantId}
            `;
        } else {
            // Insert
            const id = randomUUID();
            await prisma.$executeRaw`
                INSERT INTO documents (id, tenant_id, content, metadata, embedding, "createdAt")
                VALUES (${id}, ${tenantId}, ${fullContent}, ${JSON.stringify(metadata)}::jsonb, ${vectorString}::vector, NOW())
            `;
        }

        revalidatePath("/dashboard/knowledge");
        return { success: true };
    } catch (e: any) {
        console.error("Error saving FAQ:", e);
        return { error: e.message };
    }
}

export async function deleteFAQAction(id: string) {
    try {
        const { tenantId } = await getTenantContext();
        await prisma.$executeRaw`DELETE FROM documents WHERE id = ${id} AND tenant_id = ${tenantId}`;
        revalidatePath("/dashboard/knowledge");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function toggleFAQStatusAction(id: string, active: boolean) {
    try {
        const { tenantId } = await getTenantContext();

        const doc = await prisma.$queryRawUnsafe<any[]>(
            `SELECT metadata FROM documents WHERE id = $1 AND tenant_id = $2`,
            id, tenantId
        );

        if (doc.length === 0) throw new Error("Document not found");

        const newMetadata = {
            ...(doc[0].metadata as any),
            active: active ? "1" : "0"
        };

        await prisma.$executeRaw`
            UPDATE documents 
            SET metadata = ${JSON.stringify(newMetadata)}::jsonb
            WHERE id = ${id}
        `;

        revalidatePath("/dashboard/knowledge");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function syncCompanyProfileToFAQ() {
    try {
        const { tenantId, configs, tenantName } = await getTenantContext();
        const apiKey = configs?.openaiApiKey;
        if (!apiKey) return { error: "API Key missing" };

        const companyInfo = configs?.companyInfo;
        const businessHours = configs?.businessHours;

        // 1. Sync Company Info
        if (companyInfo) {
            await syncAutomaticFAQ(
                tenantId,
                apiKey,
                "info_empresa",
                `Me fale sobre a empresa ${tenantName}?`,
                companyInfo
            );
        }

        // 2. Sync Business Hours
        if (businessHours) {
            let hoursText = `Horários de atendimento da ${tenantName}:\n`;
            if (businessHours.weekday) hoursText += `- Segunda a Sexta: ${businessHours.weekday.start} às ${businessHours.weekday.end}\n`;
            if (businessHours.saturday) hoursText += `- Sábados: ${businessHours.saturday.start} às ${businessHours.saturday.end}\n`;
            if (businessHours.sunday) {
                hoursText += `- Domingos: ${businessHours.sunday.closed ? "Fechado" : `${businessHours.sunday.start} às ${businessHours.sunday.end}`}\n`;
            }

            await syncAutomaticFAQ(
                tenantId,
                apiKey,
                "horarios_atendimento",
                `Quais são os horários de atendimento da ${tenantName}?`,
                hoursText.trim()
            );
        }

        // 3. Sync Address
        const address = configs?.address;
        if (address) {
            await syncAutomaticFAQ(
                tenantId,
                apiKey,
                "address_empresa",
                `Qual o endereço da ${tenantName}?`,
                address
            );
        }

        return { success: true };
    } catch (e: any) {
        console.error("Auto Sync Error:", e);
        return { error: e.message };
    }
}

async function syncAutomaticFAQ(tenantId: string, apiKey: string, autoId: string, question: string, answer: string) {
    const fullContent = `Pergunta: ${question}\nResposta: ${answer}`;
    const embedding = await getOpenAIEmbedding(fullContent, apiKey);
    const vectorString = `[${embedding.join(",")}]`;

    const metadata = {
        type: "faq",
        question,
        active: "1",
        isAuto: "1",
        autoId,
        updatedAt: new Date().toISOString()
    };

    // Check if exists
    const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM documents WHERE tenant_id = $1 AND metadata->>'autoId' = $2`,
        tenantId, autoId
    );

    if (existing.length > 0) {
        await prisma.$executeRaw`
            UPDATE documents 
            SET content = ${fullContent},
                metadata = ${JSON.stringify(metadata)}::jsonb,
                embedding = ${vectorString}::vector
            WHERE id = ${existing[0].id}
        `;
    } else {
        const id = randomUUID();
        await prisma.$executeRaw`
            INSERT INTO documents (id, tenant_id, content, metadata, embedding, "createdAt")
            VALUES (${id}, ${tenantId}, ${fullContent}, ${JSON.stringify(metadata)}::jsonb, ${vectorString}::vector, NOW())
        `;
    }
}
