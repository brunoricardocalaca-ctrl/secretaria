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
        redirectTo: `${origin}/auth/reset-password`,
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

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect("/login");
}
