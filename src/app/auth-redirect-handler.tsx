"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthRedirectHandler() {
    const router = useRouter()

    useEffect(() => {
        // Check if there are auth tokens in the URL hash
        const hash = window.location.hash
        if (hash.includes("access_token")) {
            console.log("✅ Auth tokens detected in landing page, redirecting to callback...")
            // Redirect to callback with the hash intact
            router.push(`/auth/callback${hash}`)
        }
    }, [router])

    return null
}
