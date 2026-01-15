"use client";

import { User, LayoutGrid, Phone, MessageSquare } from "lucide-react";

export function SetupSummary({ tenant }: { tenant: any }) {
    const configs = tenant?.configs as any || {};
    const services = tenant?.services || [];

    return (
        <div className="space-y-8 text-left">
            {/* Identity */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <User className="w-4 h-4" /> Identidade
                </h3>
                <div className="bg-[#121212] rounded-xl p-4 border border-[#1F1F1F] space-y-3">
                    <div>
                        <p className="text-xs text-gray-500">Nome da Assistente</p>
                        <p className="text-white">{configs.assistantName || "Não definido"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Mensagem Inicial</p>
                        <p className="text-gray-300 text-sm line-clamp-3 italic">
                            "{configs.initialMessage || "..."}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" /> Serviços ({services.length})
                </h3>
                <div className="bg-[#121212] rounded-xl p-4 border border-[#1F1F1F]">
                    {services.length > 0 ? (
                        <div className="space-y-2">
                            {services.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center py-2 border-b border-[#1F1F1F] last:border-0 last:pb-0 first:pt-0">
                                    <span className="text-sm text-gray-300">{s.name}</span>
                                    {!s.priceHidden && s.price && (
                                        <span className="text-xs font-mono bg-[#1F1F1F] px-2 py-1 rounded text-green-400">
                                            R$ {Number(s.price).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 italic">Nenhum serviço cadastrado.</p>
                    )}
                </div>
            </div>

            {/* General Settings */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Notificações
                </h3>
                <div className="bg-[#121212] rounded-xl p-4 border border-[#1F1F1F] space-y-3">
                    <div>
                        <p className="text-xs text-gray-500">WhatsApp de Notificação</p>
                        <p className="text-white font-mono">{configs.notificationPhone || "Não definido"}</p>
                    </div>
                    <div className="pt-2 border-t border-[#1F1F1F]">
                        <div className="flex items-center gap-2 text-xs text-purple-400">
                            <MessageSquare className="w-3 h-3" />
                            <span>Transbordo Inteligente Ativo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
