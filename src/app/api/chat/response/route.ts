import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatId, message, output } = body;

        // Support both mapped 'message' or raw 'output' from n8n
        const content = message || output;

        if (!chatId || !content) {
            return NextResponse.json({ error: "Missing chatId or message" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Broadcast to Supabase Realtime
        const channel = supabase.channel(`chat_${chatId}`);

        // Use a Promise to await the subscription and broadcast
        await new Promise<void>((resolve, reject) => {
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    try {
                        console.log(`Broadcasting to ${chatId}:`, content);
                        await channel.send({
                            type: 'broadcast',
                            event: 'ai-response',
                            payload: { message: content }
                        });
                        // Give a larger buffer for the WebSocket frame to be sent
                        setTimeout(() => {
                            console.log("Broadcast success, resolving");
                            resolve();
                        }, 500);
                    } catch (err) {
                        reject(err);
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    reject(new Error("Channel subscription error"));
                } else if (status === 'TIMED_OUT') {
                    reject(new Error("Channel subscription timeout"));
                }
            });
        });

        // Clean up
        await supabase.removeChannel(channel);

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Chat Response Error:", e);
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
    }
}
