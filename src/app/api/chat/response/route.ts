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

        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'ai-response',
                    payload: { message: content }
                });
                // Clean up
                supabase.removeChannel(channel);
            }
        });

        // Since subscribe is async and might take a moment, we can try firing and forgetting?
        // Actually, on server side, the 'subscribe' might behave differently or we might need to wait.
        // The standard way to *send* a broadcast from server is using the REST API or client.
        // Using the client: channel.subscribe -> .send() is correct. 
        // We need to wait for subscription-confirmed usually?

        // Faster way: use triggers? No, broadcast is ephemeral.
        // Let's rely on the subscribe callback promise, but we need to keep the function alive.

        // Correct pattern for server-side broadcast via client:
        return new Promise((resolve) => {
            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.send({
                        type: 'broadcast',
                        event: 'ai-response',
                        payload: { message: content }
                    });
                    // Give it a tiny buffer to flush?
                    setTimeout(async () => {
                        await supabase.removeChannel(channel);
                        resolve(NextResponse.json({ success: true }));
                    }, 100);
                } else if (status === 'CHANNEL_ERROR') {
                    resolve(NextResponse.json({ error: "Channel error" }, { status: 500 }));
                } else if (status === 'TIMED_OUT') {
                    resolve(NextResponse.json({ error: "Timeout" }, { status: 504 }));
                }
            });
        });

    } catch (e: any) {
        console.error("Chat Response Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
