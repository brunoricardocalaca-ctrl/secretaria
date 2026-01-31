import { Suspense } from "react"
import AuthCallbackClient from "./callback-client"

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
            <AuthCallbackClient />
        </Suspense>
    )
}
