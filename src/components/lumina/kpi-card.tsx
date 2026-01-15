import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    iconColorClass: string; // e.g., "bg-purple-500", "bg-pink-500"
    footer?: string;
}

export function KPICard({ title, value, icon: Icon, iconColorClass, footer }: KPICardProps) {
    return (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-6 flex flex-col justify-between hover:border-[#3a3a3a] transition-colors relative group overflow-hidden">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <div className={cn("p-2.5 rounded-lg text-white shadow-lg", iconColorClass)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            {footer && (
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <p className="text-xs text-gray-400">{footer}</p>
                </div>
            )}

            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all pointer-events-none" />
        </div>
    );
}
