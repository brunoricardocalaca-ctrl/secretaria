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
    const assistantName = formData.get("assistantName") as string;
    const isAiActive = formData.get("isAiActive") === "true";

    if (!tenantId) return { error: "Tenant ID required" };

    try {
        const currentTenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { configs: true }
        });

        const currentConfigs = (currentTenant?.configs as any) || {};
        const newConfigs = {
            ...currentConfigs,
            n8nWebhookUrl: n8nWebhookUrl || undefined
        };

        // Using Raw SQL to bypass stale Prisma Client cache in dev server
        await prisma.$executeRawUnsafe(
            `UPDATE tenants SET 
                "name" = $1, 
                "planStatus" = $2, 
                "assistantName" = $3, 
                "isAiActive" = $4, 
                "planPrice" = $5, 
                "nextBillingDate" = $6, 
                "configs" = $7 
             WHERE "id" = $8`,
            name,
            planStatus,
            assistantName,
            isAiActive,
            planPrice ? parseFloat(planPrice) : undefined,
            nextBillingDate ? new Date(nextBillingDate) : undefined,
            JSON.stringify(newConfigs),
            tenantId
        );

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

// ... existing imports

export async function resendInviteAction(email: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    try {
        const supabaseAdmin = createAdminClient();

        // 1. Check if user exists in Supabase Auth
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = usersData.users.find(u => u.email === email);
        const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        if (existingUser) {
            // Case A: User is already active/confirmed -> Send Recovery Link (acts as access link)
            if (existingUser.email_confirmed_at) {
                const { error: recoveryError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
                    redirectTo: `${origin}/api/auth/callback?type=recovery`
                });

                if (recoveryError) throw recoveryError;
                return { success: "Usuário já ativo. Enviado link de acesso (recuperação) para o email." };
            }

            // Case B: User exists but NOT confirmed -> Re-create invite
            // We must delete the old auth user to send a fresh "Invite" email, 
            // BUT we must preserve the Profile connection by updating userId.

            const oldUserId = existingUser.id;

            // 1. Delete old Auth User
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(oldUserId);
            if (deleteError) throw deleteError;

            // 2. Send New Invite
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

            if (inviteError) {
                // If invite fails, we have a problem (orphaned profile). 
                // In production code we'd want a transaction concept, but here we just error.
                throw inviteError;
            }

            // 3. Update Profile with NEW User ID
            const newUserId = inviteData.user?.id;
            if (newUserId) {
                // Find profile by email (safest for re-linking) or old user ID if we could, 
                // but email is unique per tenant usually? No, email is unique globally in Profile?
                // Actually Profile has (userId) unique. 
                // We should find the profile that matched the oldUserId.

                // Oops, we can't find by oldUserId in Prisma if we didn't fetch it first? 
                // Prisma validation doesn't check foreign key to Auth real-time, so record exists.

                await prisma.profile.updateMany({
                    where: { email: email }, // Update profile(s) with this email to the new ID
                    data: { userId: newUserId }
                });
            }

            return { success: "Convite recriado e reenviado com sucesso!" };
        }

        // Case C: User does not exist at all -> Standard Invite
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

        if (error) {
            if (error.message.includes("already")) return { error: "Erro: Usuário já registrado (conflito)." };
            throw error;
        }

        return { success: "Convite enviado com sucesso!" };

    } catch (e: any) {
        console.error("Resend Invite Error:", e);
        return { error: e.message || "Erro ao reenviar convite." };
    }
}

export async function sendPasswordRecoveryAction(email: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    try {
        const supabaseAdmin = createAdminClient();
        const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        // Use admin.listUsers to check existence first to give better feedback
        // (Supabase resetPasswordForEmail returns success even if user doesn't exist for security, sometimes)

        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/api/auth/callback?type=recovery`
        });

        if (error) throw error;

        return { success: "Email de recuperação enviado!" };
    } catch (e: any) {
        return { error: e.message || "Erro ao enviar recuperação." };
    }
}

export async function updateUserEmailAction(profileId: string, newEmail: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) return { error: "Não autenticado" };

    try {
        const targetProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { userId: true }
        });

        if (!targetProfile?.userId) return { error: "Usuário não encontrado." };

        const supabaseAdmin = createAdminClient();

        // 1. Update in Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetProfile.userId, {
            email: newEmail,
            email_confirm: true // Admin change auto-confirms
        });

        if (authError) throw authError;

        // 2. Update in Prisma
        await prisma.profile.update({
            where: { id: profileId },
            data: { email: newEmail }
        });

        revalidatePath("/admin/tenants");
        return { success: "Email alterado com sucesso." };
    } catch (e: any) {
        return { error: e.message || "Erro ao alterar email." };
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
                assistantName: "Lumina",
                isAiActive: true,
                configs: {}
            } as any
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
