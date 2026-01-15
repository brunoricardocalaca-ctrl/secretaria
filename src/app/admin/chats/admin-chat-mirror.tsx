"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { MessagesClient } from "@/app/dashboard/messages/messages-client";
import { MessageSquare } from "lucide-react";

interface AdminChatMirrorProps {
    tenants: { id: string; name: string; slug: string }[];
}

export function AdminChatMirror({ tenants }: AdminChatMirrorProps) {
    const [selectedTenantId, setSelectedTenantId] = useState<string>("");

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
            {/* Backdrop / Selector */}
            <div className="flex items-center justify-between bg-[#121212] p-4 rounded-xl border border-[#1F1F1F]">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-white">Espelhamento de Atendimento</h2>
                        <p className="text-xs text-gray-400">Selecione uma empresa para ver o chat dela em tempo real.</p>
                    </div>
                </div>

                <div className="w-[300px]">
                    <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                        <SelectTrigger className="bg-[#050505] border-[#2a2a2a] text-white">
                            <SelectValue placeholder="Selecione o Cliente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-[#2a2a2a] text-white">
                            {tenants.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    {t.name} <span className="text-gray-500 text-xs ml-2">@{t.slug}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Mirror Area */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-[#1F1F1F] bg-[#050505] relative">
                {!selectedTenantId ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 space-y-4 bg-[#0a0a0a]">
                        <div className="w-16 h-16 rounded-full bg-[#121212] flex items-center justify-center border border-[#1F1F1F]">
                            <MessageSquare className="w-8 h-8 opacity-20" />
                        </div>
                        <p>Selecione um cliente acima para carregar as mensagens.</p>
                    </div>
                ) : (
                    // We key by tenantId to force a full re-mount when tenant changes, ensuring clean state
                    <MessagesClient key={selectedTenantId} tenantId={selectedTenantId} />
                )}
            </div>
        </div>
    );
}
