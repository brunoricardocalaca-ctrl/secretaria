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

    // Handle invite links that use hash fragments instead of query params
    // These links have tokens in the URL hash (#access_token=...) which we can't read server-side
    // So we redirect to a client-side page that can process them
    const type = searchParams.get("type");
    if (type === "invite" || searchParams.has("access_token") || request.url.includes("#access_token")) {
        console.log("✅ Invite link detected, redirecting to client-side handler");
        return NextResponse.redirect(`${origin}/auth/confirm?next=${encodeURIComponent(next)}`);
    }

    console.error("❌ No code detected in callback");
    return NextResponse.redirect(`${origin}/login?error=auth&error_description=${encodeURIComponent("No authentication code received")}`);
}
