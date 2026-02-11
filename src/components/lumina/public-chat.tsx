"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, User, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { sendPublicAIPreviewMessage, checkAIResponse, getPublicChatInfo } from "@/app/actions/ai-chat";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function PublicChat({ token }: { token: string }) {
    const [chatId, setChatId] = useState(() => {
        try {
            const decoded = JSON.parse(atob(token));
            return decoded.chatId || crypto.randomUUID();
        } catch (e) {
            // Fallback for old tokens
            return crypto.randomUUID();
        }
    });
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, timestamp: Date }[]>([
        { role: 'ai', text: "Olá! Sou a assistente virtual. Como posso ajudar?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [assistantName, setAssistantName] = useState("Assistente Virtual");
    const [loadingLabel, setLoadingLabel] = useState("Pensando...");
    const abortControllerRef = useRef<AbortController | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const statusLabels = [
        "Pensando...",
        "Buscando dados...",
        "Estruturando resposta...",
        "Quase lá...",
        "Digitando..."
    ];

    useEffect(() => {
        async function fetchInfo() {
            const res = await getPublicChatInfo(token);
            if (res.success && res.assistantName) {
                setAssistantName(res.assistantName);
                setMessages([{ role: 'ai', text: `Olá! Sou ${res.assistantName}, sua assistente virtual. Como posso ajudar?`, timestamp: new Date() }]);
            }
        }
        fetchInfo();
    }, [token]);

    // Track if message was already received (prevent duplicates from Realtime + Polling)
    const messageReceivedRef = useRef(false);

    // Reset label when loading changes
    useEffect(() => {
        if (loading) {
            messageReceivedRef.current = false;
            setLoadingLabel(statusLabels[0]);

            let currentIdx = 0;
            const interval = setInterval(() => {
                currentIdx = (currentIdx + 1) % statusLabels.length;
                setLoadingLabel(statusLabels[currentIdx]);
            }, 2500);

            return () => clearInterval(interval);
        }
    }, [loading]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    function handleReset() {
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setLoading(false);
        setMessages([
            { role: 'ai', text: `Olá! Sou ${assistantName}, sua assistente virtual. Como posso ajudar?`, timestamp: new Date() }
        ]);
        setChatId(crypto.randomUUID());
        messageReceivedRef.current = false;
    }

    async function handleSend() {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
        setLoading(true);

        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const res = await sendPublicAIPreviewMessage(userMsg, token, chatId);

            if (!res.success && !controller.signal.aborted) {
                setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${res.error}`, timestamp: new Date() }]);
                setLoading(false);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Failed to send message:", error);
                setLoading(false);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
        // Loading state remains true until Realtime event arrives
    }

    // Auto-resize textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // Realtime Subscription (persistent, only depends on chatId)
    useEffect(() => {
        let isCancelled = false;
        const supabase = createClient();

        const channel = supabase.channel(`chat_${chatId}`)
            .on('broadcast', { event: 'ai-response' }, async (payload) => {
                const msg = payload.payload?.message || payload.message || payload.payload;
                if (!isCancelled && typeof msg === 'string' && !messageReceivedRef.current) {
                    messageReceivedRef.current = true;

                    // Consume database entry to prevent polling from finding it
                    try {
                        await checkAIResponse(chatId);
                    } catch (e) { }

                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: msg,
                        timestamp: new Date()
                    }]);
                    setLoading(false);
                }
            })
            .subscribe();

        return () => {
            isCancelled = true;
            supabase.removeChannel(channel);
        };
    }, [chatId]); // Only chatId!

    // Polling Fallback (only when loading)
    useEffect(() => {
        if (!loading) return;

        let isCancelled = false;
        const pollInterval = setInterval(async () => {
            if (isCancelled || messageReceivedRef.current) {
                if (messageReceivedRef.current) clearInterval(pollInterval);
                return;
            }

            const res = await checkAIResponse(chatId);
            if (!isCancelled && res.success && res.message && !messageReceivedRef.current) {
                messageReceivedRef.current = true;
                setMessages(prev => [...prev, { role: 'ai', text: res.message!, timestamp: new Date() }]);
                setLoading(false);
            }
        }, 3000);

        return () => {
            isCancelled = true;
            clearInterval(pollInterval);
        };
    }, [chatId, loading]);

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A]">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-900/20">
                        <Bot className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold tracking-tight">{assistantName}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">Sempre Online</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn(
                        "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                    )}>
                        <div className={cn(
                            "flex items-start gap-3",
                            msg.role === 'user' ? "flex-row-reverse" : ""
                        )}>
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg border border-white/5",
                                msg.role === 'user' ? "bg-[#1a1a1a]" : "bg-amber-500/10"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-gray-500" /> : <Bot className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div className={cn(
                                "p-3.5 rounded-2xl text-sm leading-relaxed shadow-xl transition-all duration-300",
                                msg.role === 'user'
                                    ? "bg-[#1a1a1a] text-gray-300 rounded-tr-none border border-white/5"
                                    : "bg-gradient-to-br from-amber-500/10 to-transparent text-amber-100 border border-amber-500/20 rounded-tl-none whitespace-pre-wrap"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                        {/* Timestamp */}
                        <span className={cn(
                            "text-[10px] text-gray-600 mt-1 opacity-60",
                            msg.role === 'user' ? "mr-12" : "ml-12"
                        )}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs ml-12 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {loadingLabel}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                <div className="flex gap-2 relative">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Digite sua mensagem..."
                        rows={1}
                        className="bg-white/5 border-white/10 text-white rounded-xl pl-6 pr-14 min-h-[48px] max-h-[120px] focus:ring-amber-500/30 focus:border-amber-500/50 transition-all shadow-2xl placeholder:text-gray-600 resize-none py-3.5 overflow-y-auto"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="absolute right-1 top-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl w-10 h-10 shadow-lg shadow-amber-900/30 transition-all hover:scale-105 active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-[10px] text-gray-600 h-6 hover:text-amber-500/80 hover:bg-amber-500/5 rounded-full px-4 uppercase tracking-tighter">
                        <RefreshCw className="w-3 h-3 mr-1.5 opacity-50" /> Reiniciar Conversa
                    </Button>
                    <p className="text-[9px] text-gray-800 uppercase tracking-[0.2em] font-bold">
                        Powered by <span className="text-amber-500/40 font-black">{assistantName} AI</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
