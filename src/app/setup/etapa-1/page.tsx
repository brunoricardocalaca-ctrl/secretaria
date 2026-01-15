import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Etapa1Client from "./etapa-1-client"

export default async function Etapa1Page() {
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

    return <Etapa1Client initialData={profile.tenant.configs as any} />
}
