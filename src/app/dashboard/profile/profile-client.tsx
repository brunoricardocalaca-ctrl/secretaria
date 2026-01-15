"use client";

import { UserCircle, Building2, Mail, Shield, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileClientProps {
    profile: {
        email: string;
        role: string;
        tenant: {
            name: string;
            planStatus: string;
        }
    }
}

export function ProfileClient({ profile }: ProfileClientProps) {
    const router = useRouter();
    const supabase = createClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                    <UserCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Meu Perfil</h1>
                    <p className="text-gray-400">Gerencie suas informações de acesso</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Info Card */}
                <div className="glass-card rounded-3xl p-8 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors" />

                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Dados da Conta</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] flex items-center gap-4 group/item hover:border-purple-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</p>
                                <p className="text-gray-200 font-medium">{profile.email}</p>
                            </div>
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

            <div className="flex justify-end pt-8">
                <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                </Button>
            </div>
        </div>
    );
}
