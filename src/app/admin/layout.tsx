import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminSidebar } from "./components/admin-sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true }
    });

    if (!profile || profile.role !== 'super_admin') {
        // Redirect unauthorized users back to normal dashboard
        return redirect("/dashboard");
    }

    return (
        <div className="flex h-screen bg-black overflow-hidden">
            <aside className="hidden md:block shrink-0 h-full w-64 z-20">
                <AdminSidebar />
            </aside>
            <main className="flex-1 overflow-y-auto min-h-screen">
                {children}
            </main>
        </div>
    );
}
