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
                    name: true,
                    planStatus: true
                }
            }
        }
    });

    if (!profile) {
        redirect("/login");
    }

    return <ProfileClient profile={profile} />;
}
