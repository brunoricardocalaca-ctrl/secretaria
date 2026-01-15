import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"

export default async function SetupPage() {
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

    // Redireciona para a etapa atual ou para a etapa 1
    const currentStep = profile.tenant.setupStep || 1;
    return redirect(`/setup/etapa-${currentStep}`)
}
