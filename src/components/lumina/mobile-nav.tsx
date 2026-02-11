"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    MessageSquare,
    CalendarDays,
    Menu,
    Briefcase,
    Brain,
    Settings,
    UserCog,
    Bell,
    Repeat,
    Radio
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/lumina/sidebar";
import { useState } from "react";

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const navItems = [
        { name: "Início", icon: LayoutDashboard, href: "/dashboard" },
        { name: "Mensagens", icon: MessageSquare, href: "/dashboard/messages" },
        { name: "Agenda", icon: CalendarDays, href: "/dashboard/agenda" },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F0F0F] border-t border-[#1f1f1f] pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-amber-400" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-300">
                            <Menu className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Menu</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-[#1f1f1f] bg-[#0F0F0F] w-[80%] max-w-[300px]">
                        <SidebarContent isMobile={true} onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
