"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    return redirect("/dashboard");
}

export async function signup(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const origin = (await headers()).get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    // For simplicity in this rough implementation, we assume auto-signin or simple flow
    // Ideally, check for session establishment.
    return redirect("/dashboard/onboarding");
}

// Google OAuth
export async function signInWithGoogle() {
    const origin = (await headers()).get("origin");
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.url) {
        return redirect(data.url);
    }
}

// Forgot Password
export async function resetPassword(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const origin = (await headers()).get("origin");
    const email = formData.get("email") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?type=recovery`,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: "Verifique seu email para o link de recuperação." };
}

// Update Password (after clicking reset link)
export async function updatePassword(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { error: error.message };
    }

    return redirect("/dashboard");
}

// Update Password (authenticated user)
export async function changePassword(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const supabase = await createClient();

    if (password !== confirmPassword) {
        return { error: "As senhas não coincidem." };
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: "Senha atualizada com sucesso!" };
}

// Update Email (authenticated user)
export async function changeEmail(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const email = formData.get("email") as string;
    const origin = (await headers()).get("origin");
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        email: email,
    }, {
        emailRedirectTo: `${origin}/auth/callback?type=email_change`
    });

    if (error) {
        return { error: error.message };
    }

    return { success: "Verifique seu novo email (e o antigo) para confirmar a alteração." };
}

// Invite User (Admin only - simplified via Supabase Admin optional, but here using Invite RPC or similar if available, otherwise just manual signup flow wrapper is often needed without service key)
// Note: Client-side `inviteUserByEmail` requires service_role key usually. We should check if we can use it here.
// Actually, `supabase.auth.admin` is available in server component if using service role, but standard `createClient` uses connection string or anon key?
// Standard `createClient()` in `@/lib/supabase/server` usually uses cookie-based auth (user context).
// Users cannot invite other users unless they are admins AND we use the Admin API with service role.
// For now, let's assume we need to use a Service Role client for invitations.
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function inviteUser(
    prevState: { error?: string; success?: string } | null,
    formData: FormData
) {
    const email = formData.get("email") as string;
    const role = formData.get("role") as string || "user"; // Default role
    const origin = (await headers()).get("origin");

    // We need a SERVICE_ROLE client to invite users by email
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        return { error: "Configuração de servidor incompleta (Service Role)." };
    }

    const supabaseAdmin = createServiceClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 1. Invite User via Supabase Auth
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/auth/callback?type=invite` // Important: type=invite for our callback handler
    });

    if (inviteError) {
        return { error: inviteError.message };
    }

    // 2. Add to Profile table (we need the current user's tenantId)
    const supabase = await createClient(); // Current user session
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return { error: "Unauthorized" };

    const currentProfile = await import("@/lib/prisma").then(m => m.default.profile.findUnique({
        where: { userId: currentUser.id }
    }));

    if (!currentProfile) return { error: "Perfil não encontrado." };

    const prisma = (await import("@/lib/prisma")).default;

    // Check if profile exists (maybe invited before)
    const existingProfile = await prisma.profile.findUnique({
        where: { userId: authData.user.id }
    });

    if (!existingProfile) {
        await prisma.profile.create({
            data: {
                userId: authData.user.id,
                email: email,
                tenantId: currentProfile.tenantId, // Add to SAME tenant
                role: role
            }
        });
    }

    return { success: `Convite enviado para ${email}!` };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/login");
}
