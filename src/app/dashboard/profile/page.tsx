import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                    planStatus: true
                }
            }
        }
    });

    if (!profile || !profile.tenant) {
        redirect("/login");
    }

    // Fetch Team Members
    const teamMembers = await prisma.profile.findMany({
        where: { tenantId: profile.tenantId },
        select: {
            id: true,
            email: true,
            role: true,
            userId: true
        }
    });

    return <ProfileClient profile={profile} teamMembers={teamMembers} />;
}
