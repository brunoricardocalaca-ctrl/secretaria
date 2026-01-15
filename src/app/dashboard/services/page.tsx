import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { ServicesClient } from "./services-client";

export default async function ServicesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { tenantId: true }
    });

    if (!profile) return null;

    const services = await prisma.service.findMany({
        where: { tenantId: profile.tenantId },
        orderBy: { createdAt: "desc" }
    });

    // Serialize Decimal for Client Component
    const serializedServices = services.map(s => ({
        ...s,
        price: s.price ? Number(s.price) : null
    }));

    return <ServicesClient initialServices={serializedServices as any} />;
}
