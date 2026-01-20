import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/lumina/sidebar"
import { Header } from "@/components/lumina/header"
import { MobileNav } from "@/components/lumina/mobile-nav"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    let profile;
    try {
        profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            include: { tenant: true }
        })

        // If no profile, they belong in onboarding
        if (!profile) {
            return redirect("/onboarding")
        }
    } catch (error) {
        console.error("Dashboard Layout Database Error:", error);
        // Throwing error here will trigger error.tsx
        throw new Error("Falha ao carregar perfil do usuário. Por favor, tente novamente.");
    }

    return (
        <div className="flex h-screen bg-[#121212] overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-0">
                <Header tenantName={profile.tenant.name} />
                <main className="flex-1 overflow-y-auto bg-[#121212] p-4 md:p-8 text-white scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent mb-16 md:mb-0">
                    {children}
                </main>
                <MobileNav />
            </div>
        </div>
    )
}
