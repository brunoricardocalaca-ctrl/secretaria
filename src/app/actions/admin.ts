"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updateTenantAction(formData: FormData) {
    const tenantId = formData.get("tenantId") as string;
    const name = formData.get("name") as string;
    const planStatus = formData.get("planStatus") as string;
    const n8nWebhookUrl = formData.get("n8nWebhookUrl") as string;
    const planPrice = formData.get("planPrice") as string;
    const nextBillingDate = formData.get("nextBillingDate") as string;

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
                planPrice: planPrice ? parseFloat(planPrice) : undefined,
                nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : undefined,
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

export async function activateTenantAction(tenantId: string) {
    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                planStatus: "active",
                setupCompleted: true, // Auto-complete setup on release
                nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // 1 month from now
            }
        });

        revalidatePath(`/admin/tenants/${tenantId}`);
        revalidatePath("/admin/tenants");
        return { success: "Conta liberada com sucesso!" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateUserRoleAction(profileId: string, role: string) {
    try {
        await prisma.profile.update({
            where: { id: profileId },
            data: { role }
        });

        revalidatePath(`/admin/tenants`); // Revalidate list/details
        return { success: "Cargo atualizado!" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteTenantAction(tenantId: string) {
    try {
        // Prisma cascade should handle everything
        await prisma.tenant.delete({
            where: { id: tenantId }
        });

        revalidatePath("/admin/tenants");
        return { success: "Empresa excluída permanentemente." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function impersonateAction(email: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: adminUser.id },
        select: { role: true }
    });

    if (adminProfile?.role !== 'super_admin') {
        return { error: "Acesso negado. Apenas super admins podem acessar contas." };
    }

    let redirectUrl: string | null = null;

    try {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
            }
        });

        if (error) throw error;

        // Use direct link redirect
        redirectUrl = data.properties.action_link;
    } catch (e: any) {
        console.error("Impersonation error:", e);
        return { error: e.message || "Erro ao gerar link de acesso." };
    }

    if (redirectUrl) {
        redirect(redirectUrl);
    }
}

export async function deleteUserAction(profileId: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    try {
        // Get user ID before deleting profile
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { userId: true }
        });

        if (profile?.userId) {
            try {
                const supabaseAdmin = createAdminClient();
                await supabaseAdmin.auth.admin.deleteUser(profile.userId);
            } catch (authError: any) {
                console.error("Error deleting from Supabase Auth:", authError.message);
                // Continue to delete from Prisma even if Auth delete fails (or user logic)
            }
        }

        await prisma.profile.delete({
            where: { id: profileId }
        });

        revalidatePath("/admin/tenants");
        return { success: "Usuário removido do sistema (Auth + Dados)." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function addUserAction(tenantId: string, email: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    try {
        const supabaseAdmin = createAdminClient();
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

        if (inviteError) {
            // Check if user already exists
            const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = userData.users.find(u => u.email === email);

            if (existingUser) {
                // Link existing user to this tenant
                await prisma.profile.create({
                    data: {
                        userId: existingUser.id,
                        email,
                        role: 'user',
                        tenantId
                    }
                });
                revalidatePath("/admin/tenants");
                return { success: "Usuário existente vinculado à empresa." };
            }
            throw inviteError;
        }

        if (inviteData.user) {
            await prisma.profile.create({
                data: {
                    userId: inviteData.user.id,
                    email,
                    role: 'user',
                    tenantId
                }
            });
        }

        revalidatePath("/admin/tenants");
        return { success: "Convite enviado e usuário criado!" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function resetUserPasswordAction(profileId: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    const adminProfile = await prisma.profile.findUnique({
        where: { userId: adminUser.id },
        select: { role: true }
    });

    if (adminProfile?.role !== 'super_admin') {
        return { error: "Acesso negado." };
    }

    try {
        // Get the target user's userId from profile
        const targetProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { userId: true }
        });

        if (!targetProfile) return { error: "Usuário não encontrado." };

        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
            targetProfile.userId,
            { password: '123mudar?' }
        );

        if (error) throw error;

        return { success: "Senha resetada para '123mudar?'" };
    } catch (e: any) {
        console.error("Password reset error:", e);
        return { error: e.message || "Erro ao resetar senha." };
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

                    // Attempt to find existing user
                    const { data: userData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                    const existingUser = userData?.users.find(u => u.email === ownerEmail);

                    if (existingUser) {
                        userId = existingUser.id;
                        inviteMessage = " (Usuário já existia, foi vinculado)";
                    } else {
                        inviteMessage = " (Erro ao convidar usuário)";
                    }
                } else {
                    userId = inviteData.user?.id;
                }

                if (userId) {
                    // Check if profile already exists for this specific tenant (avoid duplicates if re-running)
                    const existingProfile = await prisma.profile.findFirst({
                        where: { userId, tenantId: tenant.id }
                    });

                    if (!existingProfile) {
                        await prisma.profile.create({
                            data: {
                                userId: userId,
                                email: ownerEmail,
                                role: 'admin',
                                tenantId: tenant.id
                            }
                        });
                    }
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
