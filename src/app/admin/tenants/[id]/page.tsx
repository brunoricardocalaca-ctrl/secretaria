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
import { LogIn, Plus, Lock, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Usuários com Acesso</h3>
                                <p className="text-gray-400 text-sm">Gerencie quem pode acessar esta conta.</p>
                            </div>

                            <form action={async (formData) => {
                                "use server";
                                const email = formData.get("email") as string;
                                if (email) await addUserAction(tenant.id, email);
                            }} className="flex w-full sm:w-auto gap-2 bg-[#0A0A0A] p-1.5 rounded-lg border border-white/10">
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="Novo e-mail..."
                                    className="bg-transparent border-none text-white h-8 w-full sm:w-[220px] text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-600"
                                    required
                                />
                                <Button size="sm" type="submit" className="bg-amber-500 hover:bg-amber-600 h-8 text-black font-semibold px-4 rounded-md transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Convidar
                                </Button>
                            </form>
                        </div>

                        <div className="p-0">
                            <div className="flex flex-col">
                                {tenant.users.map((u, index) => (
                                    <div key={u.id} className={cn(
                                        "flex flex-col md:flex-row items-center justify-between p-4 gap-4 hover:bg-white/5 transition-colors",
                                        index !== tenant.users.length - 1 && "border-b border-white/5"
                                    )}>
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shrink-0">
                                                {u.role === 'admin' ?
                                                    <Shield className="w-5 h-5 text-amber-500" /> :
                                                    <User className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium text-sm">{u.email}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-1.5 py-0 h-4 border-0 uppercase tracking-wider font-bold",
                                                        u.role === 'admin' ? "bg-amber-500/10 text-amber-500" : "bg-gray-800 text-gray-400"
                                                    )}>
                                                        {u.role}
                                                    </Badge>
                                                    <span className="text-[10px] text-gray-600">ID: ...{u.id.slice(-4)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                            <form action={async () => {
                                                "use server";
                                                await impersonateAction(u.email);
                                            }}>
                                                <Button size="sm" variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 h-8 text-xs font-medium">
                                                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                                    Acessar
                                                </Button>
                                            </form>

                                            <form action={async () => {
                                                "use server";
                                                if (confirm("Resetar senha para '123mudar?'?")) {
                                                    await resetUserPasswordAction(u.id);
                                                }
                                            }}>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10" title="Resetar Senha (123mudar?)">
                                                    <Lock className="w-4 h-4" />
                                                </Button>
                                            </form>

                                            {u.role !== 'admin' ? (
                                                <form action={async () => {
                                                    "use server";
                                                    await updateUserRoleAction(u.id, 'admin');
                                                }}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10" title="Tornar Admin">
                                                        <Shield className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            ) : (
                                                <form action={async () => {
                                                    "use server";
                                                    await updateUserRoleAction(u.id, 'user');
                                                }}>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-300 hover:bg-white/5" title="Remover Admin">
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            )}

                                            <div className="w-px h-4 bg-white/10 mx-1" />

                                            <form action={async () => {
                                                "use server";
                                                await deleteUserAction(u.id);
                                            }}>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 hover:bg-red-500/10" title="Remover Usuário">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                                {tenant.users.length === 0 && (
                                    <div className="p-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <UsersIcon className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <h4 className="text-white font-medium">Nenhum usuário encontrado</h4>
                                        <p className="text-gray-500 text-sm mt-1">Convide o primeiro usuário acima.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
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
