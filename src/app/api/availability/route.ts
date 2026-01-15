import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getAuthContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    return profile;
}

export async function GET(request: NextRequest) {
    const profile = await getAuthContext();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get("profileId");

    const availabilities = await prisma.availability.findMany({
        where: {
            tenantId: profile.tenantId,
            profileId: professionalId || null,
        },
        orderBy: {
            dayOfWeek: 'asc',
        },
    });

    return NextResponse.json(availabilities);
}

export async function POST(request: NextRequest) {
    const profile = await getAuthContext();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();
    const { profileId, availabilities } = data; // availabilities: array of objects

    // Update or Create many (simplest way is delete and recreate for the specific target)
    await prisma.$transaction(async (tx) => {
        await tx.availability.deleteMany({
            where: {
                tenantId: profile.tenantId,
                profileId: profileId || null,
            },
        });

        await tx.availability.createMany({
            data: availabilities.map((a: any) => ({
                dayOfWeek: a.dayOfWeek,
                startTime: a.startTime,
                endTime: a.endTime,
                isWorkingDay: a.isWorkingDay,
                pauses: a.pauses ? (typeof a.pauses === 'string' ? JSON.parse(a.pauses) : a.pauses) : undefined,
                tenantId: profile.tenantId,
                profileId: profileId || null,
            })),
        });
    });

    return NextResponse.json({ success: true });
}
