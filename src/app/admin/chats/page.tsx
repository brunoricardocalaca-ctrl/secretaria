import prisma from "@/lib/prisma";
import { AdminChatMirror } from "./admin-chat-mirror";

export default async function AdminChatsPage() {
    // Fetch all active tenants for the selector
    const tenants = await prisma.tenant.findMany({
        where: {
            planStatus: { not: 'inactive' }
        },
        select: {
            id: true,
            name: true,
            slug: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-6 h-screen overflow-hidden flex flex-col">
            <AdminChatMirror tenants={tenants} />
        </div>
    );
}
