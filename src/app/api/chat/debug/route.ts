import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        // Get all system_configs that start with chat_response_
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: {
                    startsWith: "chat_response_"
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 10
        });

        return NextResponse.json({
            success: true,
            count: configs.length,
            configs: configs.map(c => ({
                key: c.key,
                value: c.value.substring(0, 50) + (c.value.length > 50 ? '...' : ''),
                updatedAt: c.updatedAt
            }))
        });

    } catch (e: any) {
        console.error("Debug endpoint error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
