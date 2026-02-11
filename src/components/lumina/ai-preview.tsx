"use client";


import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles, User, Loader2, RefreshCw, Share2, Check, ExternalLink } from "lucide-react";
import { sendAIPreviewMessage, generatePublicChatLink, checkAIResponse } from "@/app/actions/ai-chat";
import { getMessages } from "@/app/actions/messages";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getAssistantStatus } from "@/app/actions/profile";

export function AIPreview() {
    const [chatId, setChatId] = useState<string>("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, timestamp: Date }[]>([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [copied, setCopied] = useState(false);
    const [assistantName, setAssistantName] = useState("Lumina");
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
        // 1. Load or Generate ChatId
        let storedId = typeof window !== 'undefined' ? localStorage.getItem("ai-preview-chat-id") : null;
        if (!storedId) {
            storedId = crypto.randomUUID();
            if (typeof window !== 'undefined') localStorage.setItem("ai-preview-chat-id", storedId);
        }
        setChatId(storedId);

        // 2. Fetch Assistant Name and History
        async function initChat(id: string) {
            const statusRes = await getAssistantStatus();
            const currentAssistantName = statusRes.success && statusRes.name ? statusRes.name : "Lumina";
            setAssistantName(currentAssistantName);

            const msgRes = await getMessages(id);
            if (msgRes.success && msgRes.messages && msgRes.messages.length > 0) {
                // Map database messages to UI format
                const mapped = msgRes.messages
                    .filter(m => m.sender !== 'system')
                    .map(m => ({
                        role: (m.sender === 'assistant' ? 'ai' : 'user') as 'ai' | 'user',
                        text: m.text,
                        timestamp: new Date(m.createdAt!)
                    }));
                setMessages(mapped);
            } else {
                // Default welcome message
                setMessages([{
                    role: 'ai' as const,
                    text: `Olá! Sou ${currentAssistantName}, sua assistente virtual. Como posso ajudar com os agendamentos hoje?`,
                    timestamp: new Date()
                }]);
            }
            setHistoryLoaded(true);
        }

        if (storedId) initChat(storedId);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    function handleReset() {
        if (!confirm("Deseja realmente reiniciar a conversa? O histórico atual será perdido.")) return;

        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        const newId = crypto.randomUUID();
        localStorage.setItem("ai-preview-chat-id", newId);

        setLoading(false);
        setMessages([
            { role: 'ai' as const, text: `Olá! Sou ${assistantName}, sua assistente virtual. Como posso ajudar com os agendamentos hoje?`, timestamp: new Date() }
        ]);
        setChatId(newId);
        messageReceivedRef.current = false;
    }

    async function handleShare(action: 'copy' | 'visit') {
        setGeneratingLink(true);
        const res = await generatePublicChatLink();

        if (res.success && res.token) {
            const link = `${window.location.origin}/public/chat/${res.token}`;

            if (action === 'copy') {
                navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                window.open(link, '_blank');
            }
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

        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Fire and forget (backend will trigger N8N, which triggers API, which triggers Realtime)
            const res = await sendAIPreviewMessage(userMsg, chatId);

            if (!res.success && !controller.signal.aborted) {
                setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Erro: ${res.error}`, timestamp: new Date() }]);
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
        // Loading state remains true until Realtime event arrives (or timeout)
    }

    // Auto-resize textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // Track if message was already received (prevent duplicates from Realtime + Polling)
    const messageReceivedRef = useRef(false);

    // Reset the flag and label when loading changes to true (new message sent)
    useEffect(() => {
        if (loading) {
            messageReceivedRef.current = false;
            setLoadingLabel(statusLabels[0]);

            let currentIdx = 0;
            const interval = setInterval(() => {
                currentIdx = (currentIdx + 1) % statusLabels.length;
                setLoadingLabel(statusLabels[currentIdx]);
            }, 2500); // Change label every 2.5 seconds

            return () => clearInterval(interval);
        }
    }, [loading]);

    // Realtime Subscription (persistent, only depends on chatId)
    useEffect(() => {
        let isCancelled = false;
        const supabase = createClient();
        console.log(`Subscribing to chat_${chatId}...`);

        const channel = supabase.channel(`chat_${chatId}`)
            .on('broadcast', { event: 'ai-response' }, async (payload) => {
                console.log("Received AI response payload:", payload);
                const msg = payload.payload?.message || payload.message || payload.payload;

                if (!isCancelled && typeof msg === 'string' && !messageReceivedRef.current) {
                    messageReceivedRef.current = true;
                    console.log("Realtime: Adding message to UI");

                    // Also consume the database entry to prevent polling from finding it
                    try {
                        await checkAIResponse(chatId);
                        console.log("Realtime: Consumed database entry");
                    } catch (e) {
                        console.warn("Realtime: Failed to consume database entry", e);
                    }

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
                <SheetHeader className="p-4 pr-14 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-900/20">
                                <Bot className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex flex-col text-left">
                                <SheetTitle className="text-white text-sm font-bold tracking-tight text-left">Assistente {assistantName}</SheetTitle>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <p className="text-[10px] text-amber-500/70 font-medium uppercase tracking-wider">Preview em Tempo Real</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Copy Feedback */}
                            {copied && (
                                <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-right-2 duration-300">
                                    Link Copiado
                                </span>
                            )}

                            {/* Visit Site Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleShare('visit')}
                                disabled={generatingLink}
                                className="h-8 w-8 text-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all rounded-lg"
                                title="Abrir no Navegador"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>

                            {/* Copy Link Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleShare('copy')}
                                disabled={generatingLink}
                                className="h-8 w-8 text-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all rounded-lg"
                                title="Copiar Link"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Share2 className="w-4 h-4" />
                                )}
                            </Button>

                            {/* Empty space for the SheetClose X button (top-4 right-4) */}
                            <div className="w-8" />
                        </div>
                    </div>
                </SheetHeader>

                {/* Chat Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A]">
                    {!historyLoaded ? (
                        <div className="flex flex-col items-center justify-center h-full text-amber-500/50 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs uppercase tracking-widest font-bold">Carregando Histórico...</span>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn(
                                    "flex flex-col max-w-[85%]",
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
                                <div className="flex items-center gap-2 text-gray-500 text-xs ml-12 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {loadingLabel}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                    <div className="flex gap-2">
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
                            placeholder="Mande uma mensagem..."
                            rows={1}
                            className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-amber-500/30 min-h-[40px] max-h-[120px] transition-all placeholder:text-gray-600 resize-none py-2.5 overflow-y-auto"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            size="icon"
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl w-10 h-10 shrink-0 cursor-pointer shadow-lg shadow-amber-900/30 transition-transform active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="mt-3 flex justify-center">
                        <Button variant="ghost" size="sm" onClick={handleReset} className="text-[10px] text-gray-500 h-6 hover:text-amber-500/80 hover:bg-amber-500/5 rounded-full px-3 uppercase tracking-tighter transition-colors">
                            <RefreshCw className="w-3 h-3 mr-1.5 opacity-50" /> Reiniciar Conversa
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
