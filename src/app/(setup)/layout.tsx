import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

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

    // If user already has a profile linked to a tenant, they shouldn't be here
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    })

    if (profile) {
        return redirect("/dashboard")
    }

    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    )
}
