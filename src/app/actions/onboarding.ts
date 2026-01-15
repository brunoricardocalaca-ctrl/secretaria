"use server";

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")     // Replace spaces with -
        .replace(/[^\w-]+/g, "")  // Remove all non-word chars
        .replace(/--+/g, "-");    // Replace multiple - with single -
}

export async function createTenantAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const companyName = formData.get("companyName") as string;
    const slug = formData.get("slug") as string || slugify(companyName);

    if (!companyName) {
        return { error: "Nome da empresa é obrigatório" };
    }

    try {
        // Transaction to ensure both Tenant and Profile are created
        // However, Prisma doesn't support transactions across different datasources 
        // if using Supabase Auth (which is not in Prisma).
        // We'll create Tenant first, then Profile.

        // 1. Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: companyName,
                slug: slug,
                // Basic configs starter
                configs: {
                    agentName: "Lumina Agent",
                }
            }
        });

        // 2. Create Profile linked to Tenant
        await prisma.profile.create({
            data: {
                userId: user.id,
                email: user.email!,
                tenantId: tenant.id,
                role: "admin",
            }
        });

        // 3. Create Default WhatsappInstance for AI Preview
        // Uses a predictable internal name so logic knows where to look.
        // We use "preview_web" + slug suffix or similar relative logic,
        // OR we can just create an instance named "Default" and use that.
        // Given the requirement for "preview_web" in n8n, maybe we should reconsider the naming?
        // But internalName must be unique globally. 
        // So we will create "preview-{tenantId}" or similar.
        // Wait, n8n webhook is sending "preview_web" (hardcoded). 
        // If n8n tries to insert "preview_web" into conversations, it FAILS because FK check.
        // UNLESS we are not inserting into DB in preview mode? No, the error says we ARE.
        // If n8n inserts "preview_web", it must exist.
        // Since "preview_web" is hardcoded in the action, it's shared.
        // WE CANNOT share "preview_web" instance across tenants if instance belongs to one tenant in schema.
        // Actually, schema: tenantId is field on WhatsappInstance.
        // So one row "preview_web" belongs to ONE tenant.
        // Other tenants cannot "own" it.
        // But Conversastion.instanceName -> WhatsappInstance.internalName.
        // If many tenants reference the SAME instanceName "preview_web", it works for FK.
        // Problem: The conversation also has tenantId.
        // It's weird to have Conversation(tenantA) -> Instance(tenantB).
        // BUT for a "System Preview" instance, maybe it's acceptable?

        // USER REQUEST: "create login... vir pré setado uma instancia".
        // Maybe the user wants a PERSONAL instance.
        // Let's create `instance-${slug}` or something.
        // AND updated n8n payload to send `instance-${slug}`?
        // But n8n is external. We have to send the name IN THE PAYLOAD.
        // So I will create an instance here, say `preview-${tenant.id}`.
        // AND I need to update `ai-chat.ts` to send *this* dynamic name, not a hardcoded "preview_web".

        // Let's stick to the plan:
        // 1. Create instance here.
        // 2. Update ai-chat.ts to fetch this instance or derive the name.

        await prisma.whatsappInstance.create({
            data: {
                tenantId: tenant.id,
                name: "Instância de Teste",
                internalName: `preview_${tenant.id}`, // Unique and immutable (Tenant UUID)
                status: "connected",
            }
        });

    } catch (e: any) {
        console.error("Failed to create tenant:", e);
        // Cheap check for unique constraint
        if (e.code === 'P2002') {
            return { error: "Este identificador (slug) já está em uso." };
        }
        return { error: "Erro ao criar empresa. Tente novamente." };
    }

    return redirect("/dashboard");
}
