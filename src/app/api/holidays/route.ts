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

    const holidays = await prisma.holiday.findMany({
        where: {
            tenantId: profile.tenantId,
        },
    });

    return NextResponse.json(holidays);
}

export async function POST(request: NextRequest) {
    const profile = await getAuthContext();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await request.json();

    const holiday = await prisma.holiday.create({
        data: {
            ...data,
            tenantId: profile.tenantId,
            date: new Date(data.date),
        },
    });

    return NextResponse.json(holiday);
}

export async function DELETE(request: NextRequest) {
    const profile = await getAuthContext();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.holiday.delete({
        where: {
            id,
            tenantId: profile.tenantId,
        },
    });

    return NextResponse.json({ success: true });
}
