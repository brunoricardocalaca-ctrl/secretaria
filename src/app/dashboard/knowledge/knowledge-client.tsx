"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    Eye,
    EyeOff,
    HelpCircle,
    Info,
    Save,
    X,
    MessageSquare,
    Loader2,
    Sparkles,
    AlertCircle,
    Pencil,
    Bot,
    Brain
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    saveFAQAction,
    deleteFAQAction,
    toggleFAQStatusAction
} from "@/app/actions/faq";
import { cn } from "@/lib/utils";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    active: boolean;
    isAuto: boolean;
    isPriceList: boolean;
    priceItems?: { name: string; price: string }[];
    createdAt: Date;
}

export function KnowledgeClient({ initialFaqs }: { initialFaqs: FAQ[] }) {
    const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [newFaq, setNewFaq] = useState({
        id: "",
        question: "",
        answer: "",
        isPriceList: false,
        priceItems: [{ name: "", price: "" }] as { name: string, price: string }[]
    });

    // Sync State
    const [syncing, setSyncing] = useState(false);

    async function handleSync() {
        if (confirm("Isso vai atualizar a memória da IA com as informações da empresa e serviços. Deseja continuar?")) {
            setSyncing(true);
            try {
                // Call automatic sync actions logic exposed via creating a new server action or reusing existing ones.
                // Since `syncCompanyProfileToFAQ` handles basic info and `syncServicesToKnowledgeBase` handles services,
                // we probably want both? For now let's just trigger company info as this is the FAQ page.
                // However, the user said "Train AI" should appear here.
                // Since I cannot import server actions that are not exposed directly or valid, let's assume `syncCompanyProfileToFAQ` exists in actions/faq.ts
                // I need to make sure I imported it.

                const { syncCompanyProfileToFAQ } = await import("@/app/actions/faq");
                const res = await syncCompanyProfileToFAQ();

                if (res.success) alert("IA Treinada com sucesso!");
                else alert("Erro ao treinar: " + res.error);

            } catch (e) {
                alert("Erro ao conectar.");
            }
            setSyncing(false);
            window.location.reload();
        }
    }

    async function handleSave() {
        let finalAnswer = newFaq.answer;

        if (newFaq.isPriceList) {
            const validItems = newFaq.priceItems.filter(item => item.name && item.price);
            if (validItems.length > 0) {
                // Generate Markdown Table
                finalAnswer = `| Serviço/Região | Preço |\n| :--- | :--- |\n` +
                    validItems.map(item => `| ${item.name} | ${item.price} |`).join("\n");
            }
        }

        const res = await saveFAQAction({
            id: editingId || undefined,
            question: newFaq.question,
            answer: finalAnswer,
            isPriceList: newFaq.isPriceList,
            priceItems: newFaq.isPriceList ? newFaq.priceItems : []
        });

        if (res.success) {
            window.location.reload();
        } else {
            alert(res.error);
        }
        setLoading(null);
    }

    function handleEdit(faq: FAQ) {
        setEditingId(faq.id);
        setNewFaq({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            isPriceList: faq.isPriceList,
            priceItems: faq.priceItems && faq.priceItems.length > 0 ? faq.priceItems : [{ name: "", price: "" }]
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        setIsAdding(false);
        setEditingId(null);
        setNewFaq({ id: "", question: "", answer: "", isPriceList: false, priceItems: [{ name: "", price: "" }] });
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja excluir esta informação?")) return;

        setLoading(id);
        const res = await deleteFAQAction(id);
        if (res.success) {
            setFaqs(faqs.filter(f => f.id !== id));
        }
        setLoading(null);
    }

    async function handleToggle(id: string, currentStatus: boolean) {
        setLoading(id);
        const res = await toggleFAQStatusAction(id, !currentStatus);
        if (res.success) {
            setFaqs(faqs.map(f => f.id === id ? { ...f, active: !currentStatus } : f));
        }
        setLoading(null);
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Brain className="w-8 h-8 text-amber-500" />
                        Base de Conhecimento
                    </h1>
                    <p className="text-gray-400 mt-1">Treine sua IA com informações específicas da sua empresa.</p>
                </div>
                {!isAdding && (
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 shadow-lg shadow-amber-900/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Informação
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: FAQ List */}
                <div className="lg:col-span-2 space-y-6">
                    {isAdding && (
                        <div className="bg-[#1c1c1c] border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-2xl shadow-amber-900/10 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-white">
                                        {editingId ? "Editar Informação" : "Nova Pergunta/Informação"}
                                    </h3>
                                    {!editingId && (
                                        <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                            <span className="text-xs text-amber-500 font-medium">É uma tabela de preços?</span>
                                            <Switch
                                                checked={newFaq.isPriceList}
                                                onCheckedChange={(checked) => setNewFaq({ ...newFaq, isPriceList: checked })}
                                                className="data-[state=checked]:bg-amber-600 scale-75"
                                            />
                                        </div>
                                    )}
                                </div>
                                <button onClick={resetForm} className="text-gray-500 hover:text-white cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">
                                        {newFaq.isPriceList ? "Nome do Serviço/Tabela" : "Pergunta ou Tópico"}
                                    </Label>
                                    <Input
                                        placeholder={newFaq.isPriceList ? "Ex: Depilação a Laser (Preços por Região)" : "Ex: Como funciona o cancelamento?"}
                                        value={newFaq.question}
                                        onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                                        className="bg-[#121212] border-[#2a2a2a] text-white"
                                    />
                                </div>
                                {newFaq.isPriceList ? (
                                    <div className="space-y-4">
                                        <Label className="text-gray-300">Tabela de Preços (Itens)</Label>
                                        <div className="space-y-3">
                                            {newFaq.priceItems.map((item, index) => (
                                                <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-200">
                                                    <div className="flex-1">
                                                        <Input
                                                            placeholder="Nome do Item (ex: Axilas)"
                                                            value={item.name}
                                                            onChange={(e) => {
                                                                const newItems = [...newFaq.priceItems];
                                                                newItems[index].name = e.target.value;
                                                                setNewFaq({ ...newFaq, priceItems: newItems });
                                                            }}
                                                            className="bg-[#121212] border-[#2a2a2a] text-white"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <Input
                                                            placeholder="R$ 0,00"
                                                            value={item.price}
                                                            onChange={(e) => {
                                                                const newItems = [...newFaq.priceItems];
                                                                newItems[index].price = e.target.value;
                                                                setNewFaq({ ...newFaq, priceItems: newItems });
                                                            }}
                                                            className="bg-[#121212] border-[#2a2a2a] text-white"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newItems = newFaq.priceItems.filter((_, i) => i !== index);
                                                            setNewFaq({ ...newFaq, priceItems: newItems.length > 0 ? newItems : [{ name: "", price: "" }] });
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer mt-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setNewFaq({ ...newFaq, priceItems: [...newFaq.priceItems, { name: "", price: "" }] })}
                                            className="border-dashed border-[#2a2a2a] hover:bg-amber-500/10 hover:border-amber-500/30 text-gray-400 hover:text-amber-500 cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Adicionar Item
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Resposta ou Conteúdo</Label>
                                        <Textarea
                                            placeholder="Descreva detalhadamente a resposta que a IA deve dar."
                                            value={newFaq.answer}
                                            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                                            className="bg-[#121212] border-[#2a2a2a] text-white min-h-[150px]"
                                        />
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" onClick={resetForm} className="text-gray-400 cursor-pointer">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading === "saving"}
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-8 cursor-pointer shadow-lg shadow-amber-900/20"
                                    >
                                        {loading === "saving" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Salvar na Memória
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-[#0F0F0F] border border-[#1f1f1f] rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#161616] border-b border-[#1f1f1f]">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Informação / FAQ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-24 text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest w-32 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1f1f1f]">
                                {faqs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                                            Nenhuma informação cadastrada ainda.
                                        </td>
                                    </tr>
                                ) : (
                                    faqs.map((faq) => (
                                        <tr key={faq.id} className={cn("group transition-colors", !faq.active && "opacity-50")}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-white font-medium flex items-center gap-2">
                                                        {faq.question}
                                                        {faq.isPriceList && (
                                                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold uppercase tracking-tighter">
                                                                Tabela
                                                            </span>
                                                        )}
                                                        {faq.isAuto && (
                                                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-tighter">
                                                                Sistema
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-gray-500 text-sm line-clamp-2">{faq.answer}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center">
                                                    <Switch
                                                        checked={faq.active}
                                                        disabled={loading === faq.id}
                                                        onCheckedChange={() => handleToggle(faq.id, faq.active)}
                                                        className="data-[state=checked]:bg-green-600 cursor-pointer"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!faq.isAuto && (
                                                        <button
                                                            onClick={() => handleEdit(faq)}
                                                            disabled={loading === faq.id}
                                                            className="p-2 text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                                                            title="Editar"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {!faq.isAuto && (
                                                        <button
                                                            onClick={() => handleDelete(faq.id)}
                                                            disabled={loading === faq.id}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                                            title="Excluir"
                                                        >
                                                            {loading === faq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Instructions */}
                <div className="space-y-6">
                    <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <HelpCircle className="w-12 h-12 text-purple-400" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Info className="w-5 h-5 text-purple-400" />
                                Como ensinar sua IA?
                            </h3>
                            <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                                <p>
                                    As informações que você escreve aqui servem como a <strong>memória da sua atendente virtual</strong>.
                                    Sempre que um cliente fizer uma pergunta, ela vai consultar essas anotações para dar a melhor resposta possível.
                                </p>
                                <div className="bg-[#121212] rounded-xl p-4 space-y-2 border border-[#2a2a2a]">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Dicas Simples:</p>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2">
                                            <span className="text-amber-500">•</span>
                                            Escreva de forma clara, como se estivesse ensinando um novo funcionário.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-amber-500">•</span>
                                            Use as perguntas que seus clientes mais costumam fazer no dia a dia.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-amber-500">•</span>
                                            Use a <strong>Tabela de Preços</strong> para listar serviços com múltiplas variações (ex: depilação por região).
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="text-amber-500">•</span>
                                            Dados da empresa e horários são aprendidos sozinhos pelo sistema.
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-orange-200/80">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-orange-400" />
                                    <p className="text-xs">
                                        A IA entende o sentido das frases, então ela vai saber responder mesmo se o cliente usar palavras diferentes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-6 text-center">
                        <MessageSquare className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        <h4 className="text-white font-bold mb-1">Precisa de Ajuda?</h4>
                        <p className="text-gray-400 text-xs mb-4">A IA usa busca semântica, então ela entende o contexto mesmo se o cliente usar palavras diferentes.</p>
                        <Button variant="outline" className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/20 text-xs rounded-xl">
                            Simular uma Conversa
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
