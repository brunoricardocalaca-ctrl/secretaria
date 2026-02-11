"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical, ChevronLeft, Phone, Video, Paperclip, Send, Mic, Smile, Check, CheckCheck, Clock, User, FlaskConical, Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getChats, getMessages, sendMessageAction, updateLeadName, sendDocument } from "@/app/actions/messages";
import { resetService } from "@/app/actions/reset-service";

export function MessagesClient({ tenantId }: { tenantId?: string }) {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState<'whatsapp' | 'test'>('whatsapp');
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [resetting, setResetting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initial load: Fetch Chats
    async function loadChats() {
        setLoadingChats(true);
        const res = await getChats(tenantId);
        if (res.success) {
            setChats(res.chats || []);
            // Se tiver chats e nenhum selecionado, seleciona o primeiro
            if (res.chats && res.chats.length > 0 && !selectedChat) {
                // setSelectedChat(res.chats[0].id);
            }
        }
        setLoadingChats(false);
    }

    useEffect(() => {
        loadChats();
    }, [tenantId]); // Reload if tenantId changes

    // Load Messages when chat changes
    useEffect(() => {
        if (!selectedChat) return;

        async function loadMessages() {
            setLoadingMessages(true);
            const res = await getMessages(selectedChat!, tenantId);
            if (res.success) {
                setMessages(res.messages || []);
            }
            setLoadingMessages(false);
        }

        loadMessages();

        // Polling simples a cada 5 segundos para novas mensagens (Opcional, mas útil sem Realtime configurado agora)
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedChat, tenantId]);

    async function handleSend() {
        if (!input.trim() || !selectedChat || sending) return;

        const content = input;
        setInput("");
        setSending(true);

        const res = await sendMessageAction(selectedChat, content, tenantId);
        if (res.success) {
            setMessages(prev => [...prev, res.message]);
        } else {
            alert("Erro ao enviar: " + res.error);
            setInput(content); // Devolve o texto se der erro
        }
        setSending(false);
    }

    async function handleSaveName() {
        if (!selectedChat || !tempName.trim()) {
            setEditingName(false);
            return;
        }

        const res = await updateLeadName(selectedChat, tempName, tenantId);
        if (res.success) {
            // Atualizar na lista
            setChats(prev => prev.map(c =>
                c.id === selectedChat ? { ...c, name: tempName } : c
            ));
        }
        setEditingName(false);
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;

        setUploading(true);

        try {
            // Para simplificar, vamos enviar a URL do arquivo diretamente
            // Em produção, você faria upload para Supabase Storage ou outro serviço
            // Por enquanto, vamos usar um placeholder
            const fileUrl = URL.createObjectURL(file);

            const res = await sendDocument(selectedChat, fileUrl, `Documento: ${file.name}`, file.name, tenantId);
            if (res.success) {
                setMessages(prev => [...prev, res.message]);
            } else {
                alert("Erro ao enviar documento: " + res.error);
            }
        } catch (error) {
            alert("Erro ao processar arquivo");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    const activeChat = chats.find(c => c.id === selectedChat);

    function getAvatarColor(name: string) {
        const colors = ["bg-pink-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-green-500"];
        const charCode = name.charCodeAt(0) || 0;
        return colors[charCode % colors.length];
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-full bg-[#0F0F0F] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                {/* Chat List - Hidden on mobile if chat selected */}
                <div className={cn(
                    "w-full md:w-80 border-r border-[#1f1f1f] flex flex-col bg-[#121212]",
                    selectedChat ? "hidden md:flex" : "flex"
                )}>
                    {/* Header */}
                    <div className="p-4 border-b border-[#2a2a2a] space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white px-2">Mensagens</h2>
                            <Button variant="ghost" size="icon" onClick={loadChats} className="h-8 w-8 text-gray-400 hover:text-white rounded-full">
                                <RefreshCw className={cn("w-4 h-4", loadingChats && "animate-spin")} />
                            </Button>
                        </div>
                        <div className="flex p-1 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                            <button
                                onClick={() => setActiveTab('whatsapp')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                                    activeTab === 'whatsapp' ? "bg-amber-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <MessageSquare className="w-3 h-3" /> Mensagens
                            </button>
                            <button
                                onClick={() => setActiveTab('test')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                                    activeTab === 'test' ? "bg-amber-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <FlaskConical className="w-3 h-3" /> Testes IA
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Buscar conversa..."
                                className="bg-[#1a1a1a] border-none pl-9 h-10 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-amber-500/50 placeholder:text-gray-600"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingChats ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-2 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs">Carregando conversas...</span>
                            </div>
                        ) : chats.filter(c => (activeTab === 'test' ? c.isTest : !c.isTest) && !c.whatsapp.includes('@g.us')).length === 0 ? (
                            <div className="p-8 text-center space-y-3">
                                <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto border border-[#2a2a2a] opacity-50">
                                    {activeTab === 'whatsapp' ? <MessageSquare className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {activeTab === 'whatsapp' ? "Nenhuma mensagem de WhatsApp ainda." : "Nenhum chat de teste gerado."}
                                </p>
                            </div>
                        ) : (
                            chats
                                .filter(chat => (activeTab === 'test' ? chat.isTest : !chat.isTest) && !chat.whatsapp.includes('@g.us'))
                                .map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => {
                                            setSelectedChat(chat.id);
                                            setTempName(chat.name);
                                            setEditingName(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-[#1a1a1a] group",
                                            selectedChat === chat.id ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "border border-transparent"
                                        )}
                                    >
                                        <div className="relative">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs",
                                                chat.isTest ? "bg-amber-600/20 border border-amber-500/30" : getAvatarColor(chat.name)
                                            )}>
                                                {chat.isTest ? <FlaskConical className="w-4 h-4 text-amber-500" /> : chat.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className={cn(
                                                "absolute bottom-0 right-0 w-3 h-3 border-2 border-[#1a1a1a] rounded-full",
                                                chat.isTest ? "bg-amber-500" : "bg-green-500"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={cn(
                                                    "text-sm font-medium truncate",
                                                    selectedChat === chat.id ? "text-white" : "text-gray-300",
                                                    chat.isTest && "text-amber-200/90"
                                                )}>
                                                    {chat.name}
                                                </span>
                                                <span className="text-[10px] text-gray-500">{chat.time}</span>
                                            </div>
                                            {chat.isTest && (
                                                <div className="text-[10px] text-amber-500/70 truncate mb-1">
                                                    {chat.displayPhone}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 truncate group-hover:text-gray-400">
                                                {chat.lastMessage}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0A0A0A] relative">
                    {!selectedChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <p className="text-sm">Selecione uma conversa para começar</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#0F0F0F]/80 backdrop-blur-md z-10">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden text-gray-400 hover:text-white -ml-2"
                                        onClick={() => setSelectedChat(null)}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>

                                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs", getAvatarColor(activeChat?.name || ""))}>
                                        {(activeChat?.name || "").substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        {editingName ? (
                                            <Input
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                onBlur={handleSaveName}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveName();
                                                    if (e.key === 'Escape') setEditingName(false);
                                                }}
                                                className="h-7 w-48 bg-[#1a1a1a] border-[#2a2a2a] text-sm"
                                                autoFocus
                                            />
                                        ) : (
                                            <h3
                                                className="text-sm font-semibold text-white cursor-pointer hover:text-amber-400 transition-colors"
                                                onClick={() => {
                                                    setTempName(activeChat?.name || "");
                                                    setEditingName(true);
                                                }}
                                                title="Clique para editar"
                                            >
                                                {activeChat?.name}
                                            </h3>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs text-gray-400">{activeChat?.displayPhone || activeChat?.whatsapp.replace('@s.whatsapp.net', '')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={resetting}
                                        onClick={async () => {
                                            if (!confirm("Tem certeza? Isso irá apagar o histórico da IA e iniciar um novo atendimento.")) return;

                                            setResetting(true);
                                            try {
                                                const res = await resetService(activeChat?.whatsapp || "", tenantId);
                                                if (res.success) {
                                                    alert("Atendimento zerado com sucesso!");
                                                    // Opcional: recarregar mensagens ou limpar mensagens
                                                    setMessages([]); // Limpa a tela localmente
                                                } else {
                                                    alert("Erro ao zerar atendimento: " + res.error);
                                                }
                                            } catch (err) {
                                                alert("Erro ao executar ação.");
                                            } finally {
                                                setResetting(false);
                                            }
                                        }}
                                        className="hidden md:flex text-red-400 border-red-900/30 hover:bg-red-950/20 hover:text-red-300"
                                    >
                                        {resetting ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
                                        Zerar Atendimento
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-full">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
                                {/* Decoration: Subtle gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A] pointer-events-none" />

                                {loadingMessages && messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span className="text-sm">Carregando histórico...</span>
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg) => {
                                            const isCustomer = msg.sender === 'user';
                                            const isAi = msg.sender === 'assistant';
                                            const isHuman = msg.sender === 'human';

                                            // Alignment: Human (agent) and AI (assistant) messages on the right? 
                                            // Usually client prefers User on left, and anything from the system (Human/AI) on the right
                                            // OR: Client on Left, Agent/Human on Right, and AI on Right with a badge.
                                            const isRight = isHuman || isAi;

                                            return (
                                                <div key={msg.id} className={cn("flex w-full", isRight ? "justify-end" : "justify-start")}>
                                                    <div className={cn(
                                                        "max-w-[70%] rounded-2xl p-4 relative group shadow-lg transition-all",
                                                        isRight
                                                            ? (isHuman ? "bg-amber-600 text-white rounded-br-sm" : "bg-amber-600 text-white rounded-br-sm shadow-amber-900/20")
                                                            : "bg-[#1a1a1a] text-gray-200 border border-[#2a2a2a] rounded-bl-sm"
                                                    )}>
                                                        {isAi && (
                                                            <div className="flex items-center gap-1.5 mb-2 text-amber-200 text-[10px] font-bold uppercase tracking-wider">
                                                                <FlaskConical className="w-3 h-3" /> IA Resposta
                                                            </div>
                                                        )}
                                                        {isHuman && (
                                                            <div className="flex items-center gap-1.5 mb-2 text-amber-200 text-[10px] font-bold uppercase tracking-wider">
                                                                <User className="w-3 h-3" /> Enviado por Humano
                                                            </div>
                                                        )}
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                        <div className="flex items-center justify-end gap-1 mt-1">
                                                            <span className={cn("text-[10px]", isRight ? "text-amber-200" : "text-gray-500")}>
                                                                {msg.time}
                                                            </span>
                                                            {isRight && <CheckCheck className="w-3 h-3 text-amber-200" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-[#0F0F0F] border-t border-[#2a2a2a]">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                />
                                <div className="flex items-end gap-2 bg-[#1a1a1a] p-2 rounded-3xl border border-[#2a2a2a] focus-within:border-amber-500/30 transition-colors">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-white rounded-full h-10 w-10 shrink-0"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading || sending}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </Button>
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        placeholder="Digite uma mensagem..."
                                        className="bg-transparent border-none focus-visible:ring-0 text-white min-h-[40px] max-h-32 py-2.5 placeholder:text-gray-600"
                                        disabled={sending || uploading}
                                    />
                                    <div className="flex items-center gap-1">
                                        {sending || uploading ? (
                                            <div className="h-10 w-10 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                            </div>
                                        ) : input.trim() ? (
                                            <Button onClick={handleSend} size="icon" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full h-10 w-10 shrink-0 animate-in zoom-in spin-in-90 duration-300">
                                                <Send className="w-4 h-4 ml-0.5" />
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
