import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        console.log("=== CHAT RESPONSE API CALLED ===");
        const body = await request.json();
        console.log("Raw body received:", JSON.stringify(body, null, 2));

        const { chatId, message, output } = body;

        // Support both mapped 'message' or raw 'output' from n8n
        const content = message || output;

        console.log("Extracted chatId:", chatId);
        console.log("Extracted content:", content);

        // Clean chatId if it has "=" prefix (n8n expression error)
        const cleanChatId = typeof chatId === 'string' ? chatId.replace(/^=/, '') : chatId;
        const cleanContent = typeof content === 'string' ? content.replace(/^=/, '') : content;

        console.log("Cleaned chatId:", cleanChatId);
        console.log("Cleaned content:", cleanContent);

        if (!cleanChatId || !cleanContent) {
            console.error("Missing required fields after cleaning");
            return NextResponse.json({ error: "Missing chatId or message" }, { status: 400 });
        }

        // 1. PERSIST TO DATABASE (Polling Fallback)
        console.log("Writing to database...");
        try {
            const dbResult = await prisma.systemConfig.upsert({
                where: { key: `chat_response_${cleanChatId}` },
                create: {
                    key: `chat_response_${cleanChatId}`,
                    value: cleanContent
                },
                update: {
                    value: cleanContent,
                    updatedAt: new Date()
                }
            });
            console.log("Database write successful:", dbResult.id);
        } catch (dbError) {
            console.error("Database write failed:", dbError);
        }

        // 2. BROADCAST VIA REALTIME
        console.log("Attempting Realtime broadcast...");
        const supabase = createAdminClient();
        const channel = supabase.channel(`chat_${cleanChatId}`);

        try {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.warn("Broadcast timeout after 3s");
                    resolve(); // Don't fail, we have DB fallback
                }, 3000);

                channel.subscribe(async (status) => {
                    console.log(`Channel status: ${status}`);
                    if (status === 'SUBSCRIBED') {
                        try {
                            console.log(`Broadcasting to chat_${cleanChatId}:`, cleanContent);
                            await channel.send({
                                type: 'broadcast',
                                event: 'ai-response',
                                payload: { message: cleanContent }
                            });
                            console.log("Broadcast sent successfully");
                            clearTimeout(timeout);
                            setTimeout(resolve, 500);
                        } catch (err) {
                            console.error("Broadcast send error:", err);
                            clearTimeout(timeout);
                            resolve(); // Don't fail, we have DB fallback
                        }
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.error(`Channel error: ${status}`);
                        clearTimeout(timeout);
                        resolve(); // Don't fail, we have DB fallback
                    }
                });
            });
        } catch (realtimeError) {
            console.error("Realtime error:", realtimeError);
            // Continue anyway, DB fallback will work
        }

        // Clean up
        try {
            await supabase.removeChannel(channel);
            console.log("Channel cleaned up");
        } catch (e) {
            console.warn("Channel cleanup warning:", e);
        }

        console.log("=== CHAT RESPONSE API COMPLETE ===");
        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("=== CHAT RESPONSE API ERROR ===", e);
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
    }
}
