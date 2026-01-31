"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    DollarSign,
    Settings,
    LogOut,
    ShieldCheck,
    MessageSquare
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

const adminItems = [
    {
        title: "Visão Geral",
        href: "/admin",
        icon: LayoutDashboard
    },
    {
        title: "Clientes (Tenants)",
        href: "/admin/tenants",
        icon: Building2
    },
    {
        title: "Atendimentos",
        href: "/admin/chats",
        icon: MessageSquare
    },
    {
        title: "Financeiro",
        href: "/admin/finance",
        icon: DollarSign
    },
    {
        title: "Configurações",
        href: "/admin/settings",
        icon: Settings
    }
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-full bg-[#050505] border-r border-[#1F1F1F] flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                    <span className="font-bold text-white text-lg tracking-tight">
                        Lumina <span className="text-amber-500">Admin</span>
                    </span>
                </div>

                <nav className="space-y-1">
                    {adminItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                                pathname === item.href
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "text-gray-400 hover:text-white hover:bg-[#121212]"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-[#1F1F1F]">
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#121212] rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </div>
        </div>
    );
}
