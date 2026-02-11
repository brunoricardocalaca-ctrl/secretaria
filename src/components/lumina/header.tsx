import { LayoutGrid } from "lucide-react";
import { AIPreview } from "./ai-preview";

export function Header({ tenantName = "Minha Clínica" }: { tenantName?: string }) {
    return (
        <header className="h-20 border-b border-[#2a2a2a] bg-[#1c1c1c]/50 backdrop-blur-xl flex items-center justify-between px-8 text-white relative z-50">
            {/* Left Area (Clean) */}
            <div className="flex items-center gap-2 text-gray-400">
                <LayoutGrid className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium tracking-wide uppercase">Painel de Controle</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">

                <AIPreview />

                <div className="h-8 w-[1px] bg-[#2a2a2a]" />

                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">{tenantName}</p>
                        <p className="text-xs text-gray-500">Administrador</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 border-2 border-[#1c1c1c] shadow-lg group-hover:scale-105 transition-transform" />
                </div>
            </div>
        </header>
    );
}
