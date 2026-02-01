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
                    <CardDescription>Informações principais para criação da conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-gray-300">Nome da Empresa *</Label>
                            <Input name="name" required placeholder="Ex: Clínica Exemplo" className="bg-[#050505] border-[#2a2a2a] text-white h-11" />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-gray-300">Email do Administrador / Responsável *</Label>
                            <Input name="ownerEmail" type="email" required placeholder="admin@empresa.com" className="bg-[#050505] border-[#2a2a2a] text-white h-11" />
                            <p className="text-xs text-gray-500">Este email será convidado automaticamente com acesso de Administrador.</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-gray-300">Telefone / WhatsApp</Label>
                            <Input name="ownerPhone" placeholder="(00) 00000-0000" className="bg-[#050505] border-[#2a2a2a] text-white h-11" />
                        </div>

                        <div className="pt-4 border-t border-[#1f1f1f] space-y-4">
                            <div className="space-y-3">
                                <Label className="text-gray-300">Valor da Mensalidade (R$)</Label>
                                <Input name="planPrice" type="number" step="0.01" defaultValue="297.00" className="bg-[#050505] border-[#2a2a2a] text-white h-11" />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-gray-300">Data de Vencimento</Label>
                                <Input name="planDueDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-[#050505] border-[#2a2a2a] text-white h-11" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-gray-300">Slug (URL - Opcional)</Label>
                            <Input name="slug" placeholder="clinica-exemplo" className="bg-[#050505] border-[#2a2a2a] text-white h-11" />
                        </div>

                        {error && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full bg-amber-500 text-black hover:bg-amber-600 font-medium h-12 text-base transition-colors">
                                {loading ? "Criando..." : "Criar Empresa e Convidar Admin"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
