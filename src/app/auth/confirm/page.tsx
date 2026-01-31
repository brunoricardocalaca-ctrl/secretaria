"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthConfirmPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleHashTokens = async () => {
            // Get the hash fragment from the URL
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get("access_token")
            const refreshToken = hashParams.get("refresh_token")
            const type = hashParams.get("type")

            console.log("🔍 Hash params:", { accessToken: accessToken ? "present" : "missing", refreshToken: refreshToken ? "present" : "missing", type })

            if (accessToken && refreshToken) {
                try {
                    const supabase = createClient()

                    // Set the session using the tokens from the hash
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })

                    if (error) {
                        console.error("❌ Session error:", error)
                        setError(error.message)
                        return
                    }

                    console.log("✅ Session set successfully")

                    // If this is an invite, redirect to password reset
                    if (type === "invite") {
                        router.push("/auth/reset-password")
                    } else {
                        const next = searchParams.get("next") || "/dashboard"
                        router.push(next)
                    }
                } catch (err: any) {
                    console.error("❌ Error:", err)
                    setError(err.message)
                }
            } else {
                setError("No authentication tokens found")
            }
        }

        handleHashTokens()
    }, [router, searchParams])

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Erro de Autenticação</h1>
                    <p className="text-red-400">{error}</p>
                    <a href="/login" className="mt-4 inline-block text-amber-500 hover:text-amber-400">
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
