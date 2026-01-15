import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SetupHeader } from "@/components/lumina/setup-header"

export default async function SetupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: {
            tenant: {
                include: {
                    services: true
                }
            }
        }
    })

    if (!profile) {
        return redirect("/onboarding")
    }

    // Se setup já foi completado, redireciona para dashboard
    if (profile.tenant.setupCompleted) {
        return redirect("/dashboard")
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col">
            <SetupHeader
                userName={profile.name || undefined}
                userEmail={user.email || ""}
                tenant={profile.tenant}
            />
            <div className="flex-1">
                {children}
            </div>
        </div>
    )
}
