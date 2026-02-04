"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquare,
    Radio,
    Settings,
    UserCog,
    Sparkles,
    Bot,
    Brain,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    CalendarDays,
    Repeat,
    Bell
} from "lucide-react";

export const menuItems = [
    {
        category: "PRINCIPAL",
        items: [
            { name: "Início", icon: LayoutDashboard, href: "/dashboard" },
            { name: "Mensagens", icon: MessageSquare, href: "/dashboard/messages" },
            { name: "Conectar IA", icon: Radio, href: "/dashboard/channels" },
        ],
    },
    {
        category: "CONHECIMENTO IA",
        items: [
            { name: "Serviços", icon: Briefcase, href: "/dashboard/services" },
            { name: "Perguntas Frequentes", icon: Brain, href: "/dashboard/knowledge" },
        ],
    },
    {
        category: "GESTÃO",
        items: [
            { name: "Agenda", icon: CalendarDays, href: "/dashboard/agenda" },
            { name: "Follow Up", icon: Repeat, href: "#", badge: "Em Breve" },
            { name: "Lembretes", icon: Bell, href: "#", badge: "Em Breve" },
        ],
    },
    {
        category: "CONFIGURAÇÕES",
        items: [
            { name: "Configurações", icon: Settings, href: "/dashboard/settings" },
            { name: "Meu Perfil", icon: UserCog, href: "/dashboard/profile" },
        ],
    },
];

import { getAssistantStatus, toggleAssistantStatus, updateAssistantName } from "@/app/actions/profile";
import { Power, PowerOff, Edit2, Check, X } from "lucide-react";

interface SidebarContentProps {
    isCollapsed?: boolean;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export function SidebarContent({ isCollapsed = false, isMobile = false, onNavigate }: SidebarContentProps) {
    const pathname = usePathname();
    const [attendant, setAttendant] = useState<{ name: string; isOnline: boolean; isWhatsappConnected: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        async function loadStatus() {
            const res = await getAssistantStatus();
            if (res.success) {
                setAttendant({
                    name: res.name!,
                    isOnline: res.isOnline!,
                    isWhatsappConnected: res.isWhatsappConnected!
                });
                setNewName(res.name!);
            }
            setLoading(false);
        }
        loadStatus();
    }, []);

    const handleToggleStatus = async () => {
        if (!attendant) return;
        const newStatus = !attendant.isOnline;
        setAttendant({ ...attendant, isOnline: newStatus });
        await toggleAssistantStatus();
    };

    const handleSaveName = async () => {
        if (!newName.trim()) return;

        // Optimistic update
        setAttendant(prev => ({
            name: newName,
            isOnline: prev?.isOnline ?? true,
            isWhatsappConnected: prev?.isWhatsappConnected ?? true
        }));

        setEditingName(false);
        const res = await updateAssistantName(newName);

        if (res?.error) {
            console.error("Failed to save assistant name:", res.error);
            // Optionally reload status to revert optimistic UI if failed
            const retry = await getAssistantStatus();
            if (retry.success) {
                setAttendant({
                    name: retry.name!,
                    isOnline: retry.isOnline!,
                    isWhatsappConnected: retry.isWhatsappConnected!
                });
            }
        }
    };

    // Rule: Offline if toggle is off OR whatsapp is disconnected
    const effectiveOnline = attendant?.isOnline && attendant?.isWhatsappConnected;

    return (
        <div className="flex flex-col h-full bg-glass">
            {/* Gradient Line */}
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />

            {/* Logo Area */}
            <div className={cn("p-8 pb-4 transition-all duration-300", isCollapsed ? "px-4 flex justify-center" : "p-8", isMobile && "p-6 pt-10")}>
                <Link href="/dashboard" className="group cursor-pointer block" onClick={onNavigate}>
                    {!isCollapsed ? (
                        <>
                            <div className="flex flex-col items-start leading-none group cursor-pointer transition-all duration-300">
                                <div className="flex items-center gap-1.5 font-black text-2xl tracking-tighter">
                                    <span className="text-white">NEXUS</span>
                                    <span className="text-amber-500 font-light translate-y-[-1px] text-xl">|</span>
                                    <span className="text-amber-500 font-medium text-sm uppercase tracking-widest ml-1">secretar.ia</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-6 scrollbar-none mt-4">
                {menuItems.map((section) => (
                    <div key={section.category}>
                        {!isCollapsed && (
                            <h3 className="text-[10px] font-bold text-gray-600 mb-4 px-4 uppercase tracking-widest animate-in fade-in duration-500">
                                {section.category}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onNavigate}
                                        title={isCollapsed ? item.name : ""}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden cursor-pointer",
                                            isCollapsed && "justify-center px-0",
                                            isActive
                                                ? "text-white shadow-lg shadow-amber-900/10"
                                                : "text-gray-500 hover:text-gray-200"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500" />
                                        )}

                                        <item.icon
                                            className={cn(
                                                "w-5 h-5 relative z-10 transition-colors shrink-0",
                                                isActive ? "text-amber-400" : "text-gray-600 group-hover:text-gray-400"
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-left-2 duration-300">
                                                <span>{item.name}</span>
                                                {(item as any).badge && (
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-tighter">
                                                        {(item as any).badge}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Area / Floating Card */}
            <div className="p-4">
                <div
                    className={cn(
                        "relative overflow-hidden rounded-2xl bg-[#0F0F0F] border border-[#1f1f1f] group transition-all duration-300",
                        isCollapsed ? "p-3" : "p-4"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className={cn("flex items-center gap-3 relative z-10", isCollapsed && "justify-center")}>
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#2a2a2a] group-hover:border-amber-500/50 transition-colors shrink-0 overflow-hidden">
                            <Bot className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="flex items-center gap-1 group/name">
                                    {editingName ? (
                                        <div className="flex items-center gap-1 flex-1">
                                            <input
                                                autoFocus
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                                className="bg-transparent border-b border-amber-500 text-xs text-white focus:outline-none py-0.5 w-full"
                                            />
                                            <button onClick={handleSaveName}><Check className="w-3 h-3 text-green-500" /></button>
                                            <button onClick={() => setEditingName(false)}><X className="w-3 h-3 text-red-500" /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold text-gray-200 truncate">
                                                {loading ? "Carregando..." : (attendant?.name || "Secretária")}
                                            </p>
                                            <button
                                                onClick={() => setEditingName(true)}
                                                className="opacity-0 group-hover/name:opacity-100 transition-opacity"
                                            >
                                                <Edit2 className="w-3 h-3 text-gray-500 hover:text-amber-400" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        effectiveOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                                    )} />
                                    <p className={cn(
                                        "text-[10px] font-medium uppercase tracking-wider",
                                        effectiveOnline ? "text-green-500" : "text-red-500"
                                    )}>
                                        {effectiveOnline ? "Online" : (attendant?.isWhatsappConnected === false ? "WhatsApp Offline" : "Modo Offline")}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Toggle Button */}
                        {!isCollapsed && !loading && (
                            <button
                                onClick={handleToggleStatus}
                                title={attendant?.isOnline ? "Desativar Modo Online" : "Ativar Modo Online"}
                                className={cn(
                                    "p-2 rounded-lg border transition-all relative z-20",
                                    attendant?.isOnline
                                        ? "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                                        : "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                                )}
                            >
                                {attendant?.isOnline ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved === "true") setIsCollapsed(true);
        setIsMounted(true);
    }, []);

    // Save to localStorage
    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    if (!isMounted) return <aside className="hidden md:flex flex-col h-screen glass border-r-0 relative z-20 w-72" />;

    return (
        <aside
            className={cn(
                "hidden md:flex h-screen flex-col glass border-r-0 relative z-20 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            <SidebarContent isCollapsed={isCollapsed} />

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-[#1c1c1c] border border-amber-500/50 flex items-center justify-center text-gray-400 hover:text-amber-400 transition-colors z-[100] shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </aside>
    );
}
