import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, CheckCircle2, Shield, User, XCircle } from "lucide-react";
import { TenantForm } from "./tenant-form";
import { activateTenantAction, deleteTenantAction, updateUserRoleAction, impersonateAction, addUserAction, deleteUserAction, resetUserPasswordAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { LogIn, Plus, Lock } from "lucide-react";

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
                        <Badge variant="outline" className={`
                            ${tenant.planStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                            ${tenant.planStatus === 'trial' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                            ${tenant.planStatus === 'inactive' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                        `}>
                            {tenant.planStatus.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-gray-400 mt-1">Gerencie os detalhes e o plano desta conta.</p>
                </div>

                {tenant.planStatus === 'trial' && (
                    <div className="ml-auto">
                        <form action={async () => {
                            "use server";
                            await activateTenantAction(tenant.id);
                        }}>
                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Liberar Conta
                            </Button>
                        </form>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info - Now using Client Form */}
                <div className="lg:col-span-2 space-y-6">
                    <TenantForm tenant={tenant} />

                    <Card className="bg-[#121212] border-[#1F1F1F]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">Usuários com Acesso</CardTitle>
                            <form action={async (formData) => {
                                "use server";
                                const email = formData.get("email") as string;
                                if (email) await addUserAction(tenant.id, email);
                            }} className="flex gap-2">
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="e-mail do novo usuário"
                                    className="bg-[#050505] border-[#2a2a2a] text-white h-8 w-[200px] text-xs"
                                    required
                                />
                                <Button size="sm" type="submit" className="bg-red-600 hover:bg-red-700 h-8 text-xs">
                                    <Plus className="w-3 h-3 mr-1" /> Invitar
                                </Button>
                            </form>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {tenant.users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-[#050505] border border-[#2a2a2a]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#121212] rounded-full border border-[#2a2a2a]">
                                                {u.role === 'admin' ? <Shield className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-200 text-sm">{u.email}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{u.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <form action={async () => {
                                                "use server";
                                                await impersonateAction(u.email);
                                            }}>
                                                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-7 w-7" title="Acessar Dashboard">
                                                    <LogIn className="w-3.5 h-3.5" />
                                                </Button>
                                            </form>

                                            <form action={async () => {
                                                "use server";
                                                if (confirm("Resetar senha para '123mudar?'?")) {
                                                    await resetUserPasswordAction(u.id);
                                                }
                                            }}>
                                                <Button size="icon" variant="ghost" className="text-gray-400 hover:text-yellow-400 h-7 w-7" title="Resetar Senha (123mudar?)">
                                                    <Lock className="w-3.5 h-3.5" />
                                                </Button>
                                            </form>

                                            {u.role !== 'admin' ? (
                                                <form action={async () => {
                                                    "use server";
                                                    await updateUserRoleAction(u.id, 'admin');
                                                }}>
                                                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs">
                                                        Tornar Admin
                                                    </Button>
                                                </form>
                                            ) : (
                                                <form action={async () => {
                                                    "use server";
                                                    await updateUserRoleAction(u.id, 'user');
                                                }}>
                                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a] text-xs">
                                                        Remover Admin
                                                    </Button>
                                                </form>
                                            )}

                                            <form action={async () => {
                                                "use server";
                                                await deleteUserAction(u.id);
                                            }}>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 h-8 px-2" title="Remover Usuário">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                                {tenant.users.length === 0 && (
                                    <p className="text-center text-gray-500 py-4 text-sm italic">Nenhum usuário vinculado.</p>
                                )}
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
                            <form action={async () => {
                                "use server";
                                await deleteTenantAction(tenant.id);
                                redirect("/admin/tenants");
                            }}>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="w-full justify-start text-red-500 border-red-900/50 hover:bg-red-950/30"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir Empresa Permanentemente
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
