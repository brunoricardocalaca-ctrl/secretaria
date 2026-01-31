"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function AuthCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient()

            // First, check for hash-based tokens (invite flow)
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get("access_token")
            const refreshToken = hashParams.get("refresh_token")
            const type = hashParams.get("type")

            console.log("🔍 Callback Debug:", {
                hasHashTokens: !!(accessToken && refreshToken),
                type,
                searchParams: Object.fromEntries(searchParams.entries())
            })

            if (accessToken && refreshToken) {
                console.log("✅ Hash tokens found, setting session...")

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                })

                if (sessionError) {
                    console.error("❌ Session error:", sessionError)
                    setError(sessionError.message)
                    return
                }

                console.log("✅ Session set successfully")

                // Redirect based on type
                if (type === "invite") {
                    router.push("/auth/reset-password")
                } else {
                    const next = searchParams.get("next") || "/dashboard"
                    router.push(next)
                }
                return
            }

            // Check for query param code (PKCE flow)
            const code = searchParams.get("code")

            if (code) {
                console.log("✅ Code found, exchanging for session...")

                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

                if (exchangeError) {
                    console.error("❌ Exchange error:", exchangeError)
                    setError(exchangeError.message)
                    return
                }

                console.log("✅ Code exchange successful")
                const next = searchParams.get("next") || "/dashboard"
                router.push(next)
                return
            }

            // Check for upstream errors
            const upstreamError = searchParams.get("error")
            const upstreamErrorDesc = searchParams.get("error_description")

            if (upstreamError || upstreamErrorDesc) {
                console.error("❌ Upstream error:", upstreamError, upstreamErrorDesc)
                setError(upstreamErrorDesc || upstreamError || "Authentication error")
                return
            }

            // No tokens or code found
            console.error("❌ No authentication data found")
            setError("No authentication data received")
        }

        handleAuth()
    }, [router, searchParams])

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-white mb-4">Erro de Autenticação</h1>
                    <p className="text-red-400 mb-6">{error}</p>
                    <a
                        href="/login"
                        className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
                    >
                        Voltar para o login
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
            <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
                <p className="mt-4 text-white">Autenticando...</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
                    <p className="mt-4 text-white">Carregando...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    )
}

import { Suspense } from "react"
