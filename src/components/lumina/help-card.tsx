"use client";

import { ReactNode } from "react";
import { Info } from "lucide-react";

export function HelpCard({ children, variant = "info" }: { children: ReactNode, variant?: "info" | "tip" | "warning" }) {
    const colors = {
        info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        tip: "bg-green-500/10 border-green-500/20 text-green-400",
        warning: "bg-orange-500/10 border-orange-500/20 text-orange-400"
    };

    const icons = {
        info: "ℹ️",
        tip: "💡",
        warning: "⚠️"
    };

    return (
        <div className={`p-4 rounded-xl border-2 ${colors[variant]} flex gap-3`}>
            <div className="text-2xl flex-shrink-0 mt-0.5">{icons[variant]}</div>
            <div className="text-sm leading-relaxed flex-1">
                {children}
            </div>
        </div>
    );
}
