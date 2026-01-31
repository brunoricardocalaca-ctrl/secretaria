import { KPICard } from "@/components/lumina/kpi-card";
import { Button } from "@/components/ui/button";
import { Settings, DollarSign, Users, MessageSquare, Bot } from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboard";

export default async function DashboardHome() {
    const stats = await getDashboardStats();

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">

            {/* Top Section: Title & Actions */}
            <div className="rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-600/10 rounded-2xl border border-amber-500/20 shadow-inner">
                        <Bot className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Painel IA</h1>
                        <p className="text-gray-400 mt-1">Monitoramento de Automação e Conversão</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-[#3a3a3a] bg-[#222] text-gray-300 hover:bg-[#333] hover:text-white rounded-xl">
                        <Settings className="w-4 h-4 mr-2" />
                        Personalizar
                    </Button>
                </div>
            </div>

            {/* AI KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Mensagens Recebidas"
                    value={stats.totalReceived}
                    icon={MessageSquare}
                    iconColorClass="bg-blue-600 shadow-blue-900/20"
                    footer="Mensagens enviadas pelos Leads"
                />
                <KPICard
                    title="Respostas da IA"
                    value={stats.totalSentByAI}
                    icon={Bot}
                    iconColorClass="bg-amber-600 shadow-amber-900/20"
                    footer="Interações respondidas pela IA"
                />
                <KPICard
                    title="Contatos Atendidos"
                    value={stats.totalLeadsAttended}
                    icon={Users}
                    iconColorClass="bg-emerald-600 shadow-emerald-900/20"
                    footer="Leads únicos atendidos pela IA"
                />
                <KPICard
                    title="Custo Evitado"
                    value={stats.avoidedCostFormatted}
                    icon={DollarSign}
                    iconColorClass="bg-amber-500 shadow-amber-900/20"
                    footer="Economia estimada (Humano)"
                />
            </div>


        </div>
    );
}
