import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Etapa2Client from "./etapa-2-client"

export default async function Etapa2Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect("/login")
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    })

    if (!profile) {
        return redirect("/onboarding")
    }

    // Buscar serviços do tenant
    const services = await prisma.service.findMany({
        where: { tenantId: profile.tenantId },
        orderBy: { createdAt: "asc" }
    })

    // Serializar Decimal para passar ao Client Component
    const serializedServices = services.map(service => ({
        ...service,
        price: service.price ? Number(service.price) : null,
        // rules: service.rules // JSON is fine
    }))

    return <Etapa2Client initialServices={serializedServices as any} />
}
