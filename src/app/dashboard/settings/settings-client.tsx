"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateTenantConfig, syncWebhooksAction } from "@/app/actions/settings";
import { Bot, Clock, Phone, Webhook, Save, Loader2, Instagram, MessageSquare, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsClient({ initialConfigs, initialTenantName }: { initialConfigs: any, initialTenantName: string }) {
    const [configs, setConfigs] = useState(initialConfigs || {});
    const [tenantName, setTenantName] = useState(initialTenantName || "");
    const [loading, setLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    async function handleSave() {
        setLoading(true);
        const res = await updateTenantConfig(configs, tenantName);
        if (res.success) {
            // Success
        } else {
            alert("Erro ao salvar: " + res.error);
        }
        setLoading(false);
    }

    async function handleSync() {
        if (!configs.n8nWebhookUrl) {
            alert("Configure a URL do Webhook antes de sincronizar.");
            return;
        }
        setSyncLoading(true);
        const res = await syncWebhooksAction();
        if (res.success) {
            alert(`Sincronização concluída! ${res.count} conexões atualizadas.`);
        } else {
            alert("Erro na sincronização: " + res.error);
        }
        setSyncLoading(false);
    }

    const handleChange = (key: string, value: any) => {
        setConfigs((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleNestedChange = (parent: string, key: string, value: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            [parent]: {
                ...(prev[parent] || {}),
                [key]: value
            }
        }));
    };

    // Business Hours Helpers
    const handleHoursChange = (dayType: 'weekday' | 'saturday' | 'sunday', field: string, value: any) => {
        setConfigs((prev: any) => ({
            ...prev,
            businessHours: {
                ...(prev.businessHours || {}),
                [dayType]: {
                    ...(prev.businessHours?.[dayType] || {}),
                    [field]: value
                }
            }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Configurações
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie o comportamento e identidade da sua IA.</p>
                </div>
                <Button onClick={handleSave} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 shadow-lg shadow-amber-900/20 cursor-pointer transition-all">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Alterações
                </Button>
            </div>

            <Tabs defaultValue="identity" className="space-y-6">
                <TabsList className="bg-[#121212] border border-[#2a2a2a] p-1 h-auto rounded-full sticky top-4 z-10 backdrop-blur-md">
                    <TabsTrigger value="identity" className="rounded-full px-6 py-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-400 cursor-pointer">
                        <Bot className="w-4 h-4 mr-2" /> Identidade
                    </TabsTrigger>
                    <TabsTrigger value="hours" className="rounded-full px-6 py-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-400 cursor-pointer">
                        <Clock className="w-4 h-4 mr-2" /> Horários
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-full px-6 py-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white text-gray-400 cursor-pointer">
                        <Phone className="w-4 h-4 mr-2" /> Notificações
                    </TabsTrigger>
                </TabsList>

                {/* --- IDENTIDADE --- */}
                <TabsContent value="identity" className="space-y-6">
                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-white">Nome da Clínica</Label>
                            <Input
                                value={tenantName}
                                onChange={(e) => setTenantName(e.target.value)}
                                className="bg-[#121212] border-[#2a2a2a] text-white"
                                placeholder="Nome da sua clínica"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-white">Nome da Assistente</Label>
                            <Input
                                value={configs.assistantName || ""}
                                onChange={(e) => handleChange("assistantName", e.target.value)}
                                className="bg-[#121212] border-[#2a2a2a] text-white"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-white">Sobre a Empresa (Contexto)</Label>
                            <Textarea
                                value={configs.companyInfo || ""}
                                onChange={(e) => handleChange("companyInfo", e.target.value)}
                                className="bg-[#121212] border-[#2a2a2a] text-white min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-white">Endereço da Unidade</Label>
                            <Input
                                value={configs.address || ""}
                                onChange={(e) => handleChange("address", e.target.value)}
                                placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                                className="bg-[#121212] border-[#2a2a2a] text-white"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-white">Mensagem Inicial (Boas-vindas)</Label>
                            <Textarea
                                value={configs.initialMessage || ""}
                                onChange={(e) => handleChange("initialMessage", e.target.value)}
                                className="bg-[#121212] border-[#2a2a2a] text-white min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-white">Link do Instagram (Contexto)</Label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    value={configs.instagramLink || ""}
                                    onChange={(e) => handleChange("instagramLink", e.target.value)}
                                    placeholder="instagram.com/seuperfil"
                                    className="bg-[#121212] border-[#2a2a2a] text-white pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-white">Estilo de Conversa</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { id: "friendly", name: "Amiga", emoji: "🥰" },
                                    { id: "casual", name: "Casual", emoji: "✨" },
                                    { id: "formal", name: "Formal", emoji: "👔" }
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => handleChange("conversationStyle", style.id)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border transition-all text-left group cursor-pointer",
                                            configs.conversationStyle === style.id
                                                ? "bg-amber-500/10 border-amber-500/50"
                                                : "bg-[#121212] border-[#2a2a2a] hover:bg-[#1a1a1a]"
                                        )}
                                    >
                                        <span className="text-xl">{style.emoji}</span>
                                        <span className={cn("text-sm font-medium", configs.conversationStyle === style.id ? "text-amber-400" : "text-gray-300")}>
                                            {style.name}
                                        </span>
                                        {configs.conversationStyle === style.id && <Check className="ml-auto w-4 h-4 text-amber-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* --- HORÁRIOS --- */}
                <TabsContent value="hours" className="space-y-6">
                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-6 space-y-8">
                        {/* Weekday */}
                        <div className="space-y-4">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full" /> Segunda a Sexta
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Abertura</Label>
                                    <Input
                                        type="time"
                                        value={configs.businessHours?.weekday?.start || "08:00"}
                                        onChange={(e) => handleHoursChange('weekday', 'start', e.target.value)}
                                        className="bg-[#121212] border-[#2a2a2a] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Fechamento</Label>
                                    <Input
                                        type="time"
                                        value={configs.businessHours?.weekday?.end || "18:00"}
                                        onChange={(e) => handleHoursChange('weekday', 'end', e.target.value)}
                                        className="bg-[#121212] border-[#2a2a2a] text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Saturday */}
                        <div className="space-y-4 pt-6 border-t border-[#2a2a2a]">
                            <h3 className="text-white font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full" /> Sábados
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Abertura</Label>
                                    <Input
                                        type="time"
                                        value={configs.businessHours?.saturday?.start || "08:00"}
                                        onChange={(e) => handleHoursChange('saturday', 'start', e.target.value)}
                                        className="bg-[#121212] border-[#2a2a2a] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Fechamento</Label>
                                    <Input
                                        type="time"
                                        value={configs.businessHours?.saturday?.end || "12:00"}
                                        onChange={(e) => handleHoursChange('saturday', 'end', e.target.value)}
                                        className="bg-[#121212] border-[#2a2a2a] text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sunday */}
                        <div className="space-y-4 pt-6 border-t border-[#2a2a2a]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full" /> Domingos
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Fechado?</span>
                                    <Switch
                                        checked={configs.businessHours?.sunday?.closed !== false}
                                        onCheckedChange={(checked) => handleHoursChange('sunday', 'closed', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* --- NOTIFICAÇÕES --- */}
                <TabsContent value="notifications" className="space-y-6">
                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-white">WhatsApp de Notificação</Label>
                            <p className="text-xs text-gray-500">Número que receberá avisos quando a IA precisar de ajuda humana.</p>
                            <Input
                                value={configs.notificationPhone || ""}
                                onChange={(e) => handleChange("notificationPhone", e.target.value)}
                                className="bg-[#121212] border-[#2a2a2a] text-white font-mono"
                                placeholder="5511999999999"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}
