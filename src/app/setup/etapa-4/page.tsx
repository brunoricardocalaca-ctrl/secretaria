import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Etapa4Client from "./etapa-4-client"

export default async function Etapa4Page() {
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

    // Serializar Decimal dentro do objeto tenant
    const serializedTenant = {
        ...profile.tenant,
        services: profile.tenant.services.map(s => ({
            ...s,
            price: s.price ? Number(s.price) : null
        }))
    }

    return <Etapa4Client tenant={serializedTenant as any} />
}
