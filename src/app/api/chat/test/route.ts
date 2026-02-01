import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const chatId = searchParams.get('chatId');
    const message = searchParams.get('message') || "Mensagem de teste!";

    if (!chatId) {
        return NextResponse.json({ error: "Missing chatId parameter" }, { status: 400 });
    }

    console.log("=== TEST ENDPOINT CALLED ===");
    console.log("ChatId:", chatId);
    console.log("Message:", message);

    try {
        // 1. Write to database
        const dbResult = await prisma.systemConfig.upsert({
            where: { key: `chat_response_${chatId}` },
            create: {
                key: `chat_response_${chatId}`,
                value: message
            },
            update: {
                value: message,
                updatedAt: new Date()
            }
        });
        console.log("Database write successful:", dbResult.id);

        // 2. Broadcast via Realtime
        const supabase = createAdminClient();
        const channel = supabase.channel(`chat_${chatId}`);

        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                console.log("Broadcast timeout");
                resolve();
            }, 2000);

            channel.subscribe(async (status) => {
                console.log("Channel status:", status);
                if (status === 'SUBSCRIBED') {
                    try {
                        await channel.send({
                            type: 'broadcast',
                            event: 'ai-response',
                            payload: { message }
                        });
                        console.log("Broadcast sent");
                        clearTimeout(timeout);
                        setTimeout(resolve, 500);
                    } catch (err) {
                        console.error("Broadcast error:", err);
                        clearTimeout(timeout);
                        resolve();
                    }
                }
            });
        });

        await supabase.removeChannel(channel);

        return NextResponse.json({
            success: true,
            chatId,
            message,
            dbWritten: true,
            broadcastAttempted: true
        });

    } catch (e: any) {
        console.error("Test endpoint error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
