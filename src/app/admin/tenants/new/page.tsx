"use client";

import { createTenantManualAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTenantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        const res = await createTenantManualAction(formData);

        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            // Success
            router.push(`/admin/tenants/${res.tenantId}`);
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/tenants">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Novo Cliente</h1>
                    <p className="text-gray-400 mt-1">Cadastre uma nova empresa e defina o plano.</p>
                </div>
            </div>

            <Card className="bg-[#121212] border-[#1F1F1F]">
                <CardHeader>
                    <CardTitle className="text-white">Dados da Empresa</CardTitle>
                    <CardDescription>Informações de contato e cobrança.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Nome da Empresa *</Label>
                            <Input name="name" required placeholder="Ex: Clínica Exemplo" className="bg-[#050505] border-[#2a2a2a] text-white" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Email do Responsável</Label>
                                <Input name="ownerEmail" type="email" placeholder="contato@empresa.com" className="bg-[#050505] border-[#2a2a2a] text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Telefone / WhatsApp</Label>
                                <Input name="ownerPhone" placeholder="(00) 00000-0000" className="bg-[#050505] border-[#2a2a2a] text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1f1f1f]">
                            <div className="space-y-2">
                                <Label className="text-gray-300">Valor da Mensalidade (R$)</Label>
                                <Input name="planPrice" type="number" step="0.01" defaultValue="297.00" className="bg-[#050505] border-[#2a2a2a] text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-300">Data de Vencimento</Label>
                                <Input name="planDueDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-[#050505] border-[#2a2a2a] text-white" />
                                <p className="text-xs text-gray-500">Padrão: Hoje (Data de criação)</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label className="text-gray-300">Slug (URL - Opcional)</Label>
                            <Input name="slug" placeholder="clinica-exemplo" className="bg-[#050505] border-[#2a2a2a] text-white" />
                        </div>

                        {error && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full bg-amber-500 text-black hover:bg-amber-600 font-medium transition-colors">
                                {loading ? "Criando..." : "Criar Empresa e Plano"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
