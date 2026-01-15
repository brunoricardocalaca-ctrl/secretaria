import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { SettingsClient } from "./settings-client";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: {
            tenant: {
                select: {
                    id: true,
                    configs: true
                }
            }
        }
    });

    if (!profile) return redirect("/onboarding");

    return <SettingsClient initialConfigs={profile.tenant.configs as any} />;
}
