"use client";

import { UserCircle, Building2, Mail, Shield, LogOut, Sparkles, Key, Users, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { changePassword, changeEmail, inviteUser } from "@/app/actions/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
    id: string;
    email: string;
    role: string;
    userId: string;
}

interface ProfileClientProps {
    profile: {
        id: string;
        email: string;
        role: string;
        tenant: {
            id: string;
            name: string;
            planStatus: string;
        }
    },
    teamMembers?: TeamMember[];
}

function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending} type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {children}
        </Button>
    );
}

export function ProfileClient({ profile, teamMembers = [] }: ProfileClientProps) {
    const router = useRouter();
    const supabase = createClient();
    const [passwordState, formActionPassword] = useFormState(changePassword, null);
    const [emailState, formActionEmail] = useFormState(changeEmail, null);
    const [inviteState, formActionInvite] = useFormState(inviteUser, null);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                        <UserCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Meu Perfil</h1>
                        <p className="text-gray-400">Gerencie suas informações de acesso</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                </Button>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="bg-[#141414] border border-[#2a2a2a] p-1 rounded-xl">
                    <TabsTrigger value="account" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white rounded-lg">Dados da Conta</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white rounded-lg">Segurança</TabsTrigger>
                    {profile.role === 'admin' && (
                        <TabsTrigger value="team" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white rounded-lg">Sua Equipe</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="account" className="mt-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Personal Info Card */}
                        <div className="glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <h2 className="text-lg font-semibold text-white">Seus Dados</h2>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between group/item hover:border-purple-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</p>
                                            <p className="text-gray-200 font-medium">{profile.email}</p>
                                        </div>
                                    </div>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:text-purple-300">Alterar</Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-[#121212] border-[#2a2a2a] text-white">
                                            <DialogHeader>
                                                <DialogTitle>Alterar Email de Acesso</DialogTitle>
                                            </DialogHeader>
                                            <form action={formActionEmail} className="space-y-4 pt-4">
                                                {emailState?.error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{emailState.error}</p>}
                                                {emailState?.success && <p className="text-green-400 text-sm bg-green-500/10 p-2 rounded">{emailState.success}</p>}
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Novo Email</Label>
                                                    <Input id="email" name="email" type="email" required className="bg-[#0a0a0a] border-[#333]" />
                                                </div>
                                                <SubmitButton>Salvar Alteração</SubmitButton>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center gap-4 group/item hover:border-purple-500/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Permissão</p>
                                        <p className="text-gray-200 font-medium capitalize">{profile.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tenant Info Card */}
                        <div className="glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                            <div className="flex items-center gap-3 mb-6">
                                <Building2 className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Organização</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center gap-4 hover:border-blue-500/30 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Empresa</p>
                                        <p className="text-gray-200 font-medium">{profile.tenant.name}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex justify-between items-center hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400">
                                            <Sparkles className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Plano Atual</p>
                                            <p className="text-gray-200 font-medium capitalize">{profile.tenant.planStatus}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="text-xs border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-500/20">
                                        Upgrade
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                    <div className="glass-card rounded-3xl p-8 max-w-2xl mx-auto space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Key className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-semibold text-white">Alterar Senha</h2>
                        </div>

                        <form action={formActionPassword} className="space-y-4">
                            {passwordState?.error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{passwordState.error}</p>}
                            {passwordState?.success && <p className="text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">{passwordState.success}</p>}

                            <div className="grid gap-2">
                                <Label htmlFor="password">Nova Senha</Label>
                                <Input id="password" name="password" type="password" required className="bg-[#0a0a0a] border-[#333]" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" required className="bg-[#0a0a0a] border-[#333]" />
                            </div>
                            <div className="pt-2">
                                <SubmitButton>Atualizar Senha</SubmitButton>
                            </div>
                        </form>
                    </div>
                </TabsContent>

                {profile.role === 'admin' && (
                    <TabsContent value="team" className="mt-6">
                        <div className="glass-card rounded-3xl p-8 space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-green-400" />
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Membros da Equipe</h2>
                                        <p className="text-xs text-gray-500">Convide outros usuários para acessar sua clínica</p>
                                    </div>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Convidar Usuário
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-[#121212] border-[#2a2a2a] text-white">
                                        <DialogHeader>
                                            <DialogTitle>Convidar Novo Usuário</DialogTitle>
                                        </DialogHeader>
                                        <form action={formActionInvite} className="space-y-4 pt-4">
                                            {inviteState?.error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{inviteState.error}</p>}
                                            {inviteState?.success && <p className="text-green-400 text-sm bg-green-500/10 p-2 rounded">{inviteState.success}</p>}
                                            <div className="space-y-2">
                                                <Label htmlFor="inviteEmail">Email do Usuário</Label>
                                                <Input id="inviteEmail" name="email" type="email" required placeholder="exemplo@clinica.com" className="bg-[#0a0a0a] border-[#333]" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="role">Nível de Acesso</Label>
                                                <Select name="role" defaultValue="user">
                                                    <SelectTrigger className="bg-[#0a0a0a] border-[#333]">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#121212] border-[#2a2a2a] text-white">
                                                        <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                                                        <SelectItem value="user">Usuário (Restrito)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <SubmitButton>Enviar Convite</SubmitButton>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
                                <div className="bg-[#141414] p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider grid grid-cols-4">
                                    <div className="col-span-2">Usuário</div>
                                    <div>Permissão</div>
                                    <div className="text-right">Ações</div>
                                </div>
                                {teamMembers.map((member) => (
                                    <div key={member.id} className="p-4 border-t border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors grid grid-cols-4 items-center">
                                        <div className="col-span-2 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                                                {member.email.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{member.email}</p>
                                                <p className="text-xs text-gray-500">{member.userId === profile.id ? 'Você' : ''}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 capitalize">
                                                {member.role}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <Button variant="ghost" size="sm" disabled className="text-gray-600">Remover</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
