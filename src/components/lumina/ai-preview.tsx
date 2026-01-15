"use client";


import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, User, Loader2, RefreshCw, Share2, Check } from "lucide-react";
import { sendAIPreviewMessage, generatePublicChatLink } from "@/app/actions/ai-chat";
import { cn } from "@/lib/utils";

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

        const res = await sendAIPreviewMessage(userMsg, chatId);

        if (res.success) {
            setMessages(prev => [...prev, { role: 'ai', text: res.response, timestamp: new Date() }]);
        } else {
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ Erro: ${res.error}`, timestamp: new Date() }]);
        }
        setLoading(false);
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="hidden md:flex gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-white rounded-full ml-4 cursor-pointer">
                    <Sparkles className="w-4 h-4" />
                    Testar IA
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#0A0A0A] border-l border-[#1F1F1F] text-white w-full sm:max-w-md p-0 flex flex-col h-full z-[100]">
                <SheetHeader className="p-4 border-b border-[#1F1F1F] bg-[#121212]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
                                    msg.role === 'user' ? "bg-[#2a2a2a]" : "bg-purple-500/20"
                                )}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-purple-400" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-[#2a2a2a] text-gray-200 rounded-tr-none"
                                        : "bg-purple-500/10 text-purple-100 border border-purple-500/20 rounded-tl-none whitespace-pre-wrap"
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
                            className="bg-[#0A0A0A] border-[#2a2a2a] text-white rounded-full focus:ring-purple-500/50"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            size="icon"
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 shrink-0 cursor-pointer"
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
