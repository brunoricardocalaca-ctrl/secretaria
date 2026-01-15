"use client";

import { updateTenantAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useState } from "react";

export function TenantForm({ tenant }: { tenant: any }) {
    const [loading, setLoading] = useState(false);

    return (
        <form
            action={async (formData) => {
                setLoading(true);
                await updateTenantAction(formData);
                setLoading(false);
            }}
            className="space-y-6"
        >
            <input type="hidden" name="tenantId" value={tenant.id} />

            <Card className="bg-[#121212] border-[#1F1F1F]">
                <CardHeader>
                    <CardTitle className="text-white">Dados da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Nome da Empresa</Label>
                            <Input name="name" defaultValue={tenant.name} className="bg-[#050505] border-[#2a2a2a] text-white" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Slug (URL)</Label>
                            <Input defaultValue={tenant.slug} disabled className="bg-[#050505] border-[#2a2a2a] text-gray-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Plano Atual</Label>
                        <Select name="planStatus" defaultValue={tenant.planStatus}>
                            <SelectTrigger className="bg-[#050505] border-[#2a2a2a] text-white">
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#121212] border-[#2a2a2a] text-white">
                                <SelectItem value="trial">Trial (Avaliação)</SelectItem>
                                <SelectItem value="active">Pro (Ativo)</SelectItem>
                                <SelectItem value="inactive">Suspenso / Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Webhook n8n (Override)</Label>
                        <Input
                            name="n8nWebhookUrl"
                            placeholder="Deixe em branco para usar o padrão global"
                            defaultValue={(tenant.configs as any)?.n8nWebhookUrl || ""}
                            className="bg-[#050505] border-[#2a2a2a] text-white"
                        />
                        <p className="text-xs text-gray-600">Este valor sobrescreve a configuração global apenas para este cliente.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
