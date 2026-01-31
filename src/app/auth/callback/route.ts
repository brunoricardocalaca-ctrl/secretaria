import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    console.log("🔍 Auth Callback Debug:", {
        origin,
        code: code ? "present" : "missing",
        next,
        allParams: Object.fromEntries(searchParams.entries())
    });

    // Check for upstream errors from Supabase FIRST
    const upstreamError = searchParams.get("error");
    const upstreamErrorDesc = searchParams.get("error_description");

    if (upstreamError || upstreamErrorDesc) {
        console.error("❌ Supabase Upstream Error:", upstreamError, upstreamErrorDesc);
        return NextResponse.redirect(`${origin}/login?error=auth&error_description=${encodeURIComponent(upstreamErrorDesc || upstreamError || "Unknown upstream error")}`);
    }

    if (code) {
        console.log("✅ Code found, attempting exchange...");
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            console.log("✅ Session exchange successful, redirecting to:", next);
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            console.error("❌ Session Exchange Error:", error.message, error);
            return NextResponse.redirect(`${origin}/login?error=auth&error_description=${encodeURIComponent(error.message)}`);
        }
    }

    // No code means this is likely an invite link with hash-based tokens
    // We can't read hash fragments server-side, so redirect to client-side handler
    console.log("⚠️ No code found, redirecting to client-side handler for hash tokens");
    return NextResponse.redirect(`${origin}/auth/confirm?next=${encodeURIComponent(next)}`);
}
