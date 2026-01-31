import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CreditCard, CalendarClock, DollarSign, AlertCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function AdminFinancePage() {
    // 1. Calculate Expected Revenue (Sum of Active Plans)
    const activeRevenue = await prisma.tenant.aggregate({
        _sum: { planPrice: true },
        where: { planStatus: 'active' }
    });

    const revenueValue = Number(activeRevenue._sum.planPrice || 0);

    // 2. Count Active Subscriptions
    const activeSubs = await prisma.tenant.count({ where: { planStatus: 'active' } });

    // 3. Upcoming Billings (Next 30 days)
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const upcomingInvoices = await prisma.tenant.findMany({
        where: {
            planStatus: 'active',
            nextBillingDate: {
                gte: today,
                lte: next30Days
            }
        },
        orderBy: { nextBillingDate: 'asc' },
        take: 10
    });

    // 4. Overdue (Late Payments) - simplified logic: active but nextBillingDate < today
    // In a real system, we'd have a grace period or separate status.
    // For now, let's just list them as "Attention Needed".
    const overdueTenants = await prisma.tenant.findMany({
        where: {
            planStatus: 'active',
            nextBillingDate: {
                lt: today
            }
        },
        orderBy: { nextBillingDate: 'asc' },
        take: 5
    });

    const overdueCount = await prisma.tenant.count({
        where: { planStatus: 'active', nextBillingDate: { lt: today } }
    });

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Financeiro do SaaS</h1>
                <p className="text-gray-400 mt-2">Projection de receita e controle de vencimentos.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-green-500 ">
                    <div className="flex items-center justify-between pb-2 mb-2">
                        <span className="text-sm font-medium text-gray-400">Receita Recorrente (MRR)</span>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(revenueValue)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Baseada nos planos ativos atuais</p>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between pb-2 mb-2">
                        <span className="text-sm font-medium text-gray-400">Pagantes Ativos</span>
                        <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{activeSubs}</div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Clientes com status 'active'</p>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-6 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between pb-2 mb-2">
                        <span className="text-sm font-medium text-gray-400">Em Atraso (Vencidos)</span>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-white tracking-tight">{overdueCount}</div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Vencimentos passados não renovados</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming */}
                {/* Upcoming */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-gray-400" />
                        Próximos Vencimentos (30 dias)
                    </h2>
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5 border-b border-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-gray-400 font-medium">Cliente</TableHead>
                                    <TableHead className="text-gray-400 font-medium">Valor</TableHead>
                                    <TableHead className="text-gray-400 font-medium">Vence em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingInvoices.length === 0 && (
                                    <TableRow className="hover:bg-transparent border-white/5">
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                                            Nenhum vencimento próximo.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {upcomingInvoices.map((t) => (
                                    <TableRow key={t.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-medium text-white">{t.name}</TableCell>
                                        <TableCell className="text-green-400">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(t.planPrice))}
                                        </TableCell>
                                        <TableCell className="text-gray-300 text-xs">
                                            {t.nextBillingDate ? new Date(t.nextBillingDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Overdue */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Atenção Necessária
                    </h2>
                    <div className="glass-card rounded-2xl overflow-hidden border-red-500/20">
                        <Table>
                            <TableHeader className="bg-red-500/5 border-b border-red-500/10">
                                <TableRow className="border-red-500/10 hover:bg-transparent">
                                    <TableHead className="text-red-300 font-medium">Cliente</TableHead>
                                    <TableHead className="text-red-300 font-medium">Valor</TableHead>
                                    <TableHead className="text-red-300 font-medium">Venceu em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {overdueTenants.length === 0 && (
                                    <TableRow className="hover:bg-transparent border-red-500/10">
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                                            Tudo em dia! Nenhum atraso.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {overdueTenants.map((t) => (
                                    <TableRow key={t.id} className="border-red-500/10 hover:bg-red-500/5 transition-colors">
                                        <TableCell className="font-medium text-white">{t.name}</TableCell>
                                        <TableCell className="text-red-400">
                                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(t.planPrice))}
                                        </TableCell>
                                        <TableCell className="text-red-300 text-xs">
                                            {t.nextBillingDate ? new Date(t.nextBillingDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
