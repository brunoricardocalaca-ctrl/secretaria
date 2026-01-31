"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackClient() {
    const router = useRouter()

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient()

            // Check if we have hash-based tokens (invite flow)
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get("access_token")
            const refreshToken = hashParams.get("refresh_token")
            const type = hashParams.get("type")

            if (accessToken && refreshToken) {
                console.log("✅ Hash tokens found, setting session...")

                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                })

                if (error) {
                    console.error("❌ Session error:", error)
                    router.push(`/login?error=auth&error_description=${encodeURIComponent(error.message)}`)
                    return
                }

                console.log("✅ Session set successfully")

                // Redirect based on type
                if (type === "invite") {
                    router.push("/auth/reset-password")
                } else {
                    router.push("/dashboard")
                }
                return
            }

            // If no hash tokens, let the server-side route handle it
            console.log("⚠️ No hash tokens, page will reload for server-side handling")
        }

        handleAuth()
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
            <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
                <p className="mt-4 text-white">Autenticando...</p>
            </div>
        </div>
    )
}
