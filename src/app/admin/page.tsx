import prisma from "@/lib/prisma";
import { DollarSign, Users, Building2, TrendingUp, Calendar, LogIn } from "lucide-react";
import { impersonateAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
    // 1. Fetch Basic Totals
    const tenantsCount = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({ where: { planStatus: { not: "inactive" } } });

    // 2. Fetch Active Tenants & Sum Prices for MRR
    // Prisma aggregate is cleaner
    const mrrAggregate = await prisma.tenant.aggregate({
        _sum: {
            planPrice: true
        },
        where: {
            planStatus: 'active' // Only sum ACTIVE/PAYING tenants
        }
    });

    const estimatedMRR = mrrAggregate._sum.planPrice || 0;

    // 3. Simple Growth Calculation (Tenants created this month vs total? Or vs last month?)
    // Let's do: Tenants created in the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newTenantsCount = await prisma.tenant.count({
        where: {
            createdAt: {
                gte: startOfMonth
            }
        }
    });

    // 4. Recent Tenants for the list
    const recentTenants = await prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, planStatus: true, createdAt: true, planPrice: true, ownerEmail: true }
    });

    const stats = [
        {
            title: "Faturamento Mensal (MRR)",
            value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(estimatedMRR)),
            icon: DollarSign,
            color: "text-green-400",
            bg: "bg-green-400/10"
        },
        {
            title: "Empresas Ativas",
            value: activeTenants.toString(),
            icon: Building2,
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
        {
            title: "Total de Empresas",
            value: tenantsCount.toString(),
            icon: Users,
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        },
        {
            title: "Novos este Mês",
            value: `+${newTenantsCount}`,
            icon: TrendingUp,
            color: "text-orange-400",
            bg: "bg-orange-400/10"
        }
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
                <p className="text-gray-400 mt-2">Acompanhe as métricas principais do seu SaaS.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.title} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
                                <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity ${stat.color.replace('text-', 'bg-')}`} />

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className={`p-3 rounded-xl border border-white/5 ${stat.bg}`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Cadastros Recentes</h2>
                <div className="glass-card rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white/5 border-b border-white/5">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-gray-400 font-medium">Empresa</TableHead>
                                <TableHead className="text-gray-400 font-medium">E-mail</TableHead>
                                <TableHead className="text-gray-400 font-medium">Plano</TableHead>
                                <TableHead className="text-gray-400 font-medium">Valor</TableHead>
                                <TableHead className="text-gray-400 font-medium">Data</TableHead>
                                <TableHead className="text-right text-gray-400 font-medium">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTenants.length === 0 && (
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                        Nenhuma atividade recente.
                                    </TableCell>
                                </TableRow>
                            )}
                            {recentTenants.map((t) => (
                                <TableRow key={t.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium text-white">{t.name}</TableCell>
                                    <TableCell className="text-gray-400 text-xs">{t.ownerEmail || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            t.planStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                t.planStatus === 'inactive' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }>
                                            {t.planStatus === 'trial' ? 'TRIAL' : t.planStatus.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-300">
                                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(t.planPrice))}
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-xs">
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {t.ownerEmail && (
                                            <form action={async () => {
                                                "use server";
                                                await impersonateAction(t.ownerEmail!);
                                            }}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10" title="Acessar como Usuário">
                                                    <LogIn className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
