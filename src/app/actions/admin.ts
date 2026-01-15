"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateTenantAction(formData: FormData) {
    const tenantId = formData.get("tenantId") as string;
    const name = formData.get("name") as string;
    const planStatus = formData.get("planStatus") as string;
    const n8nWebhookUrl = formData.get("n8nWebhookUrl") as string;

    if (!tenantId) return { error: "Tenant ID required" };

    try {
        const currentTenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { configs: true }
        });

        const currentConfigs = (currentTenant?.configs as any) || {};

        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name,
                planStatus,
                configs: {
                    ...currentConfigs,
                    n8nWebhookUrl: n8nWebhookUrl || undefined
                }
            }
        });

        revalidatePath(`/admin/tenants/${tenantId}`);
        revalidatePath("/admin/tenants");
        return { success: "Empresa atualizada com sucesso!" };

    } catch (e: any) {
        return { error: e.message };
    }
}

export async function createTenantManualAction(formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const ownerEmail = formData.get("ownerEmail") as string;
    const ownerPhone = formData.get("ownerPhone") as string;
    const planPrice = formData.get("planPrice") as string;
    const planDueDate = formData.get("planDueDate") as string; // YYYY-MM-DD

    // Config: Invite User?
    const shouldInviteUser = !!ownerEmail;

    if (!name) {
        return { error: "Nome da empresa é obrigatório." };
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Default: Date of creation = Due Date
    const billingDate = planDueDate ? new Date(planDueDate) : new Date();

    try {
        // 1. Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug: finalSlug,
                ownerEmail: ownerEmail || null,
                ownerPhone: ownerPhone || null,
                planPrice: planPrice ? parseFloat(planPrice) : 297.00,
                nextBillingDate: billingDate,
                planStatus: "active",
                configs: {
                    agentName: "Lumina Agent",
                }
            }
        });

        // 2. Create Preview Instance
        await prisma.whatsappInstance.create({
            data: {
                tenantId: tenant.id,
                name: "Instância de Teste",
                internalName: `preview_${tenant.id}`,
                status: "connected",
            }
        });

        // 3. Supabase Auth Integration (If email provided)
        let inviteMessage = " Convite enviado.";

        if (shouldInviteUser) {
            try {
                if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no .env");
                }

                const supabaseAdmin = createAdminClient();
                const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(ownerEmail);

                let userId: string | undefined;

                if (inviteError) {
                    console.warn("User invite warning:", inviteError.message);
                    inviteMessage = " (Usuário já existe ou erro no convite)";
                } else {
                    userId = inviteData.user?.id;
                }

                if (userId) {
                    await prisma.profile.create({
                        data: {
                            userId: userId,
                            email: ownerEmail,
                            role: 'admin',
                            tenantId: tenant.id
                        }
                    });
                }
            } catch (authError: any) {
                console.error("Supabase Auth Error:", authError.message);
                // Return the specific error to the UI
                inviteMessage = ` ⚠️ Erro no Auth: ${authError.message}`;
            }
        }

        revalidatePath("/admin/tenants");
        return { success: `Empresa criada!${inviteMessage}`, tenantId: tenant.id };

    } catch (e: any) {
        if (e.code === 'P2002') return { error: "Slug já existe." };
        console.error("Create Tenant Error:", e);
        return { error: e.message };
    }
}
