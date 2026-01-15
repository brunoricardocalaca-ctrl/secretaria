import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { TenantForm } from "./tenant-form";

export default async function AdminTenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: { users: true, whatsappInstances: true }
    });

    if (!tenant) {
        return <div className="p-8 text-white">Empresa não encontrada.</div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-5xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/tenants">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{tenant.name}</h1>
                        <span className="text-gray-500 text-sm">#{tenant.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-gray-400 mt-1">Gerencie os detalhes e o plano desta conta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info - Now using Client Form */}
                <div className="lg:col-span-2 space-y-6">
                    <TenantForm tenant={tenant} />

                    <Card className="bg-[#121212] border-[#1F1F1F]">
                        <CardHeader>
                            <CardTitle className="text-white">Usuários com Acesso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {tenant.users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-[#050505] border border-[#2a2a2a]">
                                        <div className="flex flex-col">
                                            <span className="text-gray-200 text-sm">{u.email}</span>
                                            <span className="text-xs text-gray-500 capitalize">{u.role}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                            Resetar Senha
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Stats/Actions */}
                <div className="space-y-6">
                    <Card className="bg-[#121212] border-[#1F1F1F] border-l-4 border-l-purple-500">
                        <CardHeader>
                            <CardTitle className="text-white text-base">Instâncias WhatsApp</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {tenant.whatsappInstances.map(i => (
                                    <div key={i.id} className="text-sm bg-purple-500/10 p-2 rounded text-purple-200 border border-purple-500/20">
                                        {i.internalName} <span className="opacity-50">({i.status})</span>
                                    </div>
                                ))}
                                {tenant.whatsappInstances.length === 0 && (
                                    <p className="text-gray-500 text-sm">Nenhuma instância conectada.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#121212] border-[#1F1F1F] border-red-900/30">
                        <CardHeader>
                            <CardTitle className="text-red-400 text-base">Zona de Perigo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start text-red-500 border-red-900/50 hover:bg-red-950/30">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Empresa
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
