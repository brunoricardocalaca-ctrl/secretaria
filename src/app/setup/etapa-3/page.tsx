import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Etapa3Client from "./etapa-3-client"

export default async function Etapa3Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: { tenant: true }
    })

    if (!profile) {
        return redirect("/onboarding")
    }

    // Pass existing configs if needed
    const configs = profile.tenant.configs as any || {}

    return <Etapa3Client
        tenantName={profile.tenant.name}
        initialPhone={configs.notificationPhone || ""}
    />
}
