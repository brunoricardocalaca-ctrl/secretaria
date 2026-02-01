import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/dashboard";
    const type = searchParams.get("type");

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // If Invite or Recovery, redirect to reset password
            if (type === "invite" || type === "recovery") {
                console.log(`Auth Callback: Type ${type} detected. Redirecting to reset-password.`);
                return NextResponse.redirect(`${origin}/auth/reset-password`);
            }

            const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === "development";

            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        } else {
            console.error("Auth Callback Error for code exchange:", error.message);

            // Fallback: If exchange code fails (e.g. missing PKCE verifier for Admin-initiated flows),
            // try verifyOtp with the code as the token.
            if (type === 'recovery') {
                console.log("Attempting verifyOtp fallback for recovery...");
                const { error: otpError } = await supabase.auth.verifyOtp({
                    token: code,
                    type: 'recovery',
                    options: {
                        redirectTo: `${origin}/auth/reset-password` // Not used for session but good practice
                    }
                });

                if (!otpError) {
                    console.log("verifyOtp fallback successful! Redirecting...");
                    return NextResponse.redirect(`${origin}/auth/reset-password`);
                } else {
                    console.error("verifyOtp fallback failed:", otpError.message);
                }
            }

            console.error("Auth Callback Details:", { type, code: code?.substring(0, 5) + "..." });
            // Redirect to error page or login with error
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=AuthCodeError`);
}
