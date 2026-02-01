"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { sendPublicAIPreviewMessage } from "@/app/actions/ai-chat";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function PublicChat({ token }: { token: string }) {
    const [chatId, setChatId] = useState(() => crypto.randomUUID());
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, timestamp: Date }[]>([
        { role: 'ai', text: "Olá! Sou a assistente virtual. Como posso ajudar?", timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    function handleReset() {
        setMessages([
            { role: 'ai', text: "Olá! Sou a assistente virtual. Como posso ajudar?", timestamp: new Date() }
        ]);
        setChatId(crypto.randomUUID());
    }

    async function handleSend() {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: new Date() }]);
        setLoading(true);

        const res = await sendPublicAIPreviewMessage(userMsg, token, chatId);

        if (!res.success) {
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${res.error}`, timestamp: new Date() }]);
            setLoading(false);
        }
        // Loading state remains true until Realtime event arrives
    }

    // Realtime Subscription
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase.channel(`chat_${chatId}`)
            .on('broadcast', { event: 'ai-response' }, (payload) => {
                if (payload.payload?.message) {
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: payload.payload.message,
                        timestamp: new Date()
                    }]);
                    setLoading(false);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatId]);

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A]">
            {/* Header */}
            <div className="p-4 border-b border-[#1F1F1F] bg-[#121212] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-white font-medium">Chat de Teste</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-green-400 font-medium">Online</p>
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
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                msg.role === 'user' ? "bg-[#2a2a2a]" : "bg-purple-500/20"
                            )}>
                                {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-purple-400" />}
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-[#2a2a2a] text-gray-200 rounded-tr-none"
                                    : "bg-purple-500/10 text-purple-100 border border-purple-500/20 rounded-tl-none whitespace-pre-wrap"
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
                        <span className="italic">Digitando...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#121212] border-t border-[#1F1F1F]">
                <div className="flex gap-2 relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua mensagem de teste..."
                        className="bg-[#0A0A0A] border-[#2a2a2a] text-white rounded-full pl-6 pr-14 h-12 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-inner"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="absolute right-1 top-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="mt-3 flex justify-center">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-[10px] text-gray-600 h-6 hover:text-gray-400 hover:bg-white/5 rounded-full px-4">
                        <RefreshCw className="w-3 h-3 mr-1.5" /> Reiniciar Conversa
                    </Button>
                </div>
            </div>
        </div>
    );
}
