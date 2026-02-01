"use client";


import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, User, Loader2, RefreshCw, Share2, Check } from "lucide-react";
import { sendAIPreviewMessage, generatePublicChatLink, checkAIResponse } from "@/app/actions/ai-chat";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function AIPreview() {
    const [chatId, setChatId] = useState(() => crypto.randomUUID());
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, timestamp: Date }[]>([
        { role: 'ai', text: "Olá! Sou sua assistente virtual. Como posso ajudar com os agendamentos hoje?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [copied, setCopied] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    function handleReset() {
        setMessages([
            { role: 'ai', text: "Olá! Sou sua assistente virtual. Como posso ajudar com os agendamentos hoje?", timestamp: new Date() }
        ]);
        setChatId(crypto.randomUUID());
    }

    async function handleShare() {
        setGeneratingLink(true);
        const res = await generatePublicChatLink();

        if (res.success && res.token) {
            const link = `${window.location.origin}/public/chat/${res.token}`;
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            alert("Erro ao gerar link de compartilhamento.");
        }
        setGeneratingLink(false);
    }

    async function handleSend() {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
        setLoading(true);

        // Fire and forget (backend will trigger N8N, which triggers API, which triggers Realtime)
        const res = await sendAIPreviewMessage(userMsg, chatId);

        if (!res.success) {
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Erro: ${res.error}`, timestamp: new Date() }]);
            setLoading(false);
        }
        // Loading state remains true until Realtime event arrives (or timeout)
    }

    // Track if message was already received (prevent duplicates from Realtime + Polling)
    const messageReceivedRef = useRef(false);

    // Reset the flag when loading changes to true (new message sent)
    useEffect(() => {
        if (loading) {
            messageReceivedRef.current = false;
        }
    }, [loading]);

    // Realtime Subscription (persistent, only depends on chatId)
    useEffect(() => {
        let isCancelled = false;
        const supabase = createClient();
        console.log(`Subscribing to chat_${chatId}...`);

        const channel = supabase.channel(`chat_${chatId}`)
            .on('broadcast', { event: 'ai-response' }, (payload) => {
                console.log("Received AI response payload:", payload);
                const msg = payload.payload?.message || payload.message || payload.payload;

                if (!isCancelled && typeof msg === 'string' && !messageReceivedRef.current) {
                    messageReceivedRef.current = true;
                    console.log("Realtime: Adding message to UI");
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: msg,
                        timestamp: new Date()
                    }]);
                    setLoading(false);
                } else if (messageReceivedRef.current) {
                    console.log("Realtime: Message already received, ignoring duplicate");
                }
            })
            .subscribe((status) => {
                console.log(`Subscription status for chat_${chatId}:`, status);
            });

        return () => {
            isCancelled = true;
            console.log(`Unsubscribing from chat_${chatId}`);
            supabase.removeChannel(channel);
        };
    }, [chatId]); // Only chatId, not loading!

    // Polling Fallback (only when loading)
    useEffect(() => {
        if (!loading) {
            console.log("Polling: Not starting because loading is false");
            return;
        }

        console.log(`Polling: Starting for chatId=${chatId}, loading=${loading}`);
        let isCancelled = false;
        let pollCount = 0;

        const pollInterval = setInterval(async () => {
            if (isCancelled || messageReceivedRef.current) {
                if (messageReceivedRef.current) {
                    console.log("Polling: Message already received via Realtime, stopping");
                    clearInterval(pollInterval);
                }
                return;
            }
            pollCount++;
            console.log(`Polling: Attempt #${pollCount} for chatId=${chatId}`);

            const res = await checkAIResponse(chatId);
            console.log(`Polling: Result for attempt #${pollCount}:`, res);

            if (!isCancelled && res.success && res.message && !messageReceivedRef.current) {
                messageReceivedRef.current = true;
                console.log("Polling: SUCCESS! Message received:", res.message);
                setMessages(prev => [...prev, { role: 'ai', text: res.message!, timestamp: new Date() }]);
                setLoading(false);
            } else if (messageReceivedRef.current) {
                console.log("Polling: Message already received via Realtime, ignoring");
            } else {
                console.log(`Polling: No message yet (attempt #${pollCount})`);
            }
        }, 3000);

        return () => {
            isCancelled = true;
            clearInterval(pollInterval);
            console.log(`Polling: Stopped after ${pollCount} attempts`);
        };
    }, [chatId, loading]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="hidden md:flex gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-white rounded-full ml-4 cursor-pointer">
                    <Sparkles className="w-4 h-4" />
                    Testar IA
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#0A0A0A] border-l border-[#1F1F1F] text-white w-full sm:max-w-md p-0 flex flex-col h-full z-[100]">
                <SheetHeader className="p-4 border-b border-[#1F1F1F] bg-[#121212]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <SheetTitle className="text-white text-sm">Preview da Conversa</SheetTitle>
                                <p className="text-xs text-gray-500">Simulação em tempo real</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleShare}
                            disabled={generatingLink}
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            title="Compartilhar link de teste"
                        >
                            {generatingLink ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Share2 className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </SheetHeader>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A]">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={cn(
                            "flex flex-col max-w-[85%]", // Changed to flex-col to align Time
                            msg.role === 'user' ? "ml-auto items-end" : "items-start"
                        )}>
                            <div className={cn(
                                "flex items-start gap-3",
                                msg.role === 'user' ? "flex-row-reverse" : ""
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === 'user' ? "bg-[#2a2a2a]" : "bg-amber-500/20"
                                )}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-amber-400" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-[#2a2a2a] text-gray-200 rounded-tr-none"
                                        : "bg-amber-500/10 text-amber-100 border border-amber-500/20 rounded-tl-none whitespace-pre-wrap"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                            {/* Timestamp */}
                            <span className={cn(
                                "text-[10px] text-gray-600 mt-1",
                                msg.role === 'user' ? "mr-12" : "ml-12"
                            )}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs ml-12">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Digitando...
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#121212] border-t border-[#1F1F1F]">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Mande uma mensagem..."
                            className="bg-[#0A0A0A] border-[#2a2a2a] text-white rounded-full focus:ring-amber-500/50"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            size="icon"
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full w-10 h-10 shrink-0 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="mt-2 flex justify-center">
                        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-gray-600 h-6 hover:text-gray-400">
                            <RefreshCw className="w-3 h-3 mr-1" /> Reiniciar Conversa
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
