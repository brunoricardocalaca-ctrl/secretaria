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
                <Card className="bg-[#121212] border-[#1F1F1F]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Receita Recorrente (MRR)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(revenueValue)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Baseada nos planos ativos atuais</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#121212] border-[#1F1F1F]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Pagantes Ativos</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{activeSubs}</div>
                        <p className="text-xs text-gray-500 mt-1">Clientes com status 'active'</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#121212] border-[#1F1F1F]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Em Atraso (Vencidos)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{overdueCount}</div>
                        <p className="text-xs text-gray-500 mt-1">Vencimentos passados não renovados</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-gray-400" />
                        Próximos Vencimentos (30 dias)
                    </h2>
                    <div className="rounded-2xl border border-[#1F1F1F] overflow-hidden bg-[#121212]">
                        <Table>
                            <TableHeader className="bg-[#1a1a1a]">
                                <TableRow className="border-[#2a2a2a]">
                                    <TableHead className="text-gray-400">Cliente</TableHead>
                                    <TableHead className="text-gray-400">Valor</TableHead>
                                    <TableHead className="text-gray-400">Vence em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingInvoices.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                                            Nenhum vencimento próximo.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {upcomingInvoices.map((t) => (
                                    <TableRow key={t.id} className="border-[#2a2a2a]">
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
                    <div className="rounded-2xl border border-red-900/20 overflow-hidden bg-[#121212]">
                        <Table>
                            <TableHeader className="bg-red-950/10">
                                <TableRow className="border-red-900/20">
                                    <TableHead className="text-red-300">Cliente</TableHead>
                                    <TableHead className="text-red-300">Valor</TableHead>
                                    <TableHead className="text-red-300">Venceu em</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {overdueTenants.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                                            Tudo em dia! Nenhum atraso.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {overdueTenants.map((t) => (
                                    <TableRow key={t.id} className="border-red-900/10 hover:bg-red-900/5">
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
