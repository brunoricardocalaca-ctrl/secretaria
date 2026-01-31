import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
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
            console.error("Auth Callback Error:", error.message);
            return NextResponse.redirect(`${origin}/login?error=auth&error_description=${encodeURIComponent(error.message)}`);
        }
    }

    // Check for upstream errors from Supabase (e.g. link expired, bad redirect)
    const upstreamError = searchParams.get("error");
    const upstreamErrorDesc = searchParams.get("error_description");

    if (upstreamError || upstreamErrorDesc) {
        console.error("Supabase Upstream Error:", upstreamError, upstreamErrorDesc);
        return NextResponse.redirect(`${origin}/login?error=auth&error_description=${encodeURIComponent(upstreamErrorDesc || upstreamError || "Unknown upstream error")}`);
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth&error_code=no_code_detected`);
}
