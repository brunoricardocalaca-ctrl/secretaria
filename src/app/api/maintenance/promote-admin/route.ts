
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const targetEmail = "brunoricardocalaca@gmail.com";

        const profile = await prisma.profile.findFirst({
            where: { email: targetEmail }
        });

        if (!profile) {
            return NextResponse.json({ error: "Target still not found?" });
        }

        const updated = await prisma.profile.update({
            where: { id: profile.id },
            data: { role: "super_admin" }
        });

        return NextResponse.json({ success: true, updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
