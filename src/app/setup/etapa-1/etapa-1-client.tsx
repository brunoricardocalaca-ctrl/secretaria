"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/lumina/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, MessageSquare, Building2, Instagram, Check } from "lucide-react";
import { saveSetupStep1 } from "@/app/actions/setup";
import { cn } from "@/lib/utils";

const conversationStyles = [
    { id: "friendly", name: "Amiga", emoji: "🥰", description: "Próxima e carinhosa" },
    { id: "casual", name: "Casual", emoji: "✨", description: "Leve e educada" },
    { id: "formal", name: "Formal", emoji: "👔", description: "Séria e direta" }
];

export default function Etapa1Client({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Default values
    const defaultData = {
        assistantName: "",
        companyInfo: "",
        initialMessage: "",
        instagramLink: "",
        conversationStyle: "casual",
        weekdayStart: "09:00",
        weekdayEnd: "18:00",
        saturdayStart: "09:00",
        saturdayEnd: "13:00",
        sundayClosed: true
    };

    // Merge initialData with defaults
    const [formData, setFormData] = useState({
        ...defaultData,
        ...initialData,
        // Ensure businessHours structure is flattened if needed, or handle deep merge
        weekdayStart: initialData?.businessHours?.weekday?.start || defaultData.weekdayStart,
        weekdayEnd: initialData?.businessHours?.weekday?.end || defaultData.weekdayEnd,
        saturdayStart: initialData?.businessHours?.saturday?.start || defaultData.saturdayStart,
        saturdayEnd: initialData?.businessHours?.saturday?.end || defaultData.saturdayEnd,
        sundayClosed: initialData?.businessHours?.sunday?.closed ?? defaultData.sundayClosed,
    });

    const [error, setError] = useState("");

    async function handleNext() {
        setLoading(true);
        setError("");
        try {
            const res = await saveSetupStep1(formData);
            if (res.success) {
                router.push("/setup/etapa-2");
            } else {
                setError(res.error || "Unknown error");
                console.error("Setup Error:", res.error);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    }

    const isValid = formData.assistantName && formData.companyInfo;

    return (
        <div className="min-h-screen bg-[#0A0A0A] selection:bg-purple-500/30">
            <div className="container max-w-4xl mx-auto px-6 py-20">
                <StepIndicator currentStep={1} totalSteps={4} />

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-extralight tracking-tight text-white">
                        Personalize sua <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">secretar.ia</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
                        Defina a identidade da sua assistente virtual para que ela atenda seus clientes exatamente como você faria.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Assistant Name Section */}
                    <div className="group bg-[#121212] border border-[#1F1F1F] hover:border-purple-500/30 transition-colors rounded-3xl p-10 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MessageSquare className="w-32 h-32 text-purple-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-2xl font-light text-white mb-2">Identidade</h3>
                                <p className="text-sm text-gray-500">Como sua assistente se apresentará.</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Nome da Assistente</Label>
                                <Input
                                    value={formData.assistantName}
                                    onChange={(e) => setFormData({ ...formData, assistantName: e.target.value })}
                                    placeholder="Ex: Ana"
                                    className="bg-[#0A0A0A] border-transparent focus:border-purple-500/50 hover:bg-[#161616] text-white h-14 text-lg rounded-xl transition-all placeholder:text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Company Info Section */}
                    <div className="group bg-[#121212] border border-[#1F1F1F] hover:border-blue-500/30 transition-colors rounded-3xl p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Building2 className="w-32 h-32 text-blue-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-2xl font-light text-white mb-2">Sobre o Negócio</h3>
                                <p className="text-sm text-gray-500">Contexto essencial para o atendimento.</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Informações Principais</Label>
                                <Textarea
                                    value={formData.companyInfo}
                                    onChange={(e) => setFormData({ ...formData, companyInfo: e.target.value })}
                                    placeholder="Descreva seu negócio, especialidades e diferenciais..."
                                    className="bg-[#0A0A0A] border-transparent focus:border-blue-500/50 hover:bg-[#161616] text-white min-h-[160px] resize-none text-base rounded-xl transition-all placeholder:text-gray-700 leading-relaxed"
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Instagram <span className="text-gray-700 normal-case tracking-normal">(Opcional)</span></Label>
                                <div className="relative">
                                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                                    <Input
                                        value={formData.instagramLink}
                                        onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
                                        placeholder="instagram.com/seuperfil"
                                        className="bg-[#0A0A0A] border-transparent focus:border-pink-500/50 hover:bg-[#161616] text-white h-14 text-base pl-12 rounded-xl transition-all placeholder:text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Message Section */}
                    <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-10 space-y-6">
                        <div>
                            <h3 className="text-xl font-light text-white mb-2">Mensagem Inicial</h3>
                            <p className="text-sm text-gray-500">Boas-vindas enviada apenas na primeira interação.</p>
                        </div>
                        <Textarea
                            value={formData.initialMessage}
                            onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
                            placeholder="Ex: Olá! Sou a assistente virtual. Como posso ajudar?"
                            className="bg-[#0A0A0A] border-transparent focus:border-purple-500/50 text-white min-h-[100px] resize-none rounded-xl text-base"
                        />
                    </div>

                    {/* Hours & Style Grid */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Hours */}
                        <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-8 space-y-6">
                            <div>
                                <h3 className="text-xl font-light text-white mb-2">Horários</h3>
                                <p className="text-xs text-gray-500">Disponibilidade de atendimento.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Segunda a Sexta</Label>
                                    <div className="flex items-center gap-3">
                                        <Input type="time" value={formData.weekdayStart} onChange={(e) => setFormData({ ...formData, weekdayStart: e.target.value })} className="bg-[#0A0A0A] border-transparent text-white rounded-lg" />
                                        <span className="text-gray-600">-</span>
                                        <Input type="time" value={formData.weekdayEnd} onChange={(e) => setFormData({ ...formData, weekdayEnd: e.target.value })} className="bg-[#0A0A0A] border-transparent text-white rounded-lg" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Sábado</Label>
                                    <div className="flex items-center gap-3">
                                        <Input type="time" value={formData.saturdayStart} onChange={(e) => setFormData({ ...formData, saturdayStart: e.target.value })} className="bg-[#0A0A0A] border-transparent text-white rounded-lg" />
                                        <span className="text-gray-600">-</span>
                                        <Input type="time" value={formData.saturdayEnd} onChange={(e) => setFormData({ ...formData, saturdayEnd: e.target.value })} className="bg-[#0A0A0A] border-transparent text-white rounded-lg" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500">Domingo</Label>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer p-2 rounded-lg hover:bg-[#1F1F1F] transition-colors w-full">
                                            <input
                                                type="checkbox"
                                                checked={formData.sundayClosed}
                                                onChange={(e) => setFormData({ ...formData, sundayClosed: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600 bg-[#2a2a2a] checked:bg-purple-500"
                                            />
                                            Fechado aos Domingos
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Style */}
                        <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-8 space-y-6">
                            <div>
                                <h3 className="text-xl font-light text-white mb-2">Personalidade</h3>
                                <p className="text-xs text-gray-500">Tom de voz da inteligência.</p>
                            </div>

                            <div className="grid gap-3">
                                {conversationStyles.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setFormData({ ...formData, conversationStyle: style.id })}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                                            formData.conversationStyle === style.id
                                                ? "bg-purple-500/10 border-purple-500/50"
                                                : "bg-[#0A0A0A] border-transparent hover:bg-[#161616]"
                                        )}
                                    >
                                        <span className="text-2xl">{style.emoji}</span>
                                        <div>
                                            <p className={cn("font-medium text-sm", formData.conversationStyle === style.id ? "text-purple-400" : "text-gray-300")}>{style.name}</p>
                                            <p className="text-xs text-gray-500">{style.description}</p>
                                        </div>
                                        {formData.conversationStyle === style.id && <Check className="ml-auto w-4 h-4 text-purple-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col items-end pt-12 pb-20 gap-4">
                        {error && <p className="text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}

                        {/* DEBUG DATA */}
                        <div className="w-full text-left p-4 bg-gray-900 rounded-lg overflow-auto max-h-40 text-xs font-mono text-gray-500">
                            <strong>Debug Initial Data:</strong>
                            <pre>{JSON.stringify(initialData || "No Data", null, 2)}</pre>
                        </div>

                        <Button
                            onClick={handleNext}
                            disabled={!isValid || loading}
                            className="bg-white hover:bg-gray-200 text-black px-12 h-16 text-lg font-medium rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:bg-gray-800 disabled:text-gray-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            {loading ? "Salvando..." : "Continuar"}
                            <ChevronRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
