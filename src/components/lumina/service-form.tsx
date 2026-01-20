"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { upsertService } from "@/app/actions/services";
import { ArrowRight, Bot, Check, ChevronDown, Clock, CloudLightning, DollarSign, HelpCircle, LayoutGrid, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { BrainCircuit, Flag, MessageCircle, User as UserIcon, Send, Ban, Info, Wand2, Loader2, Camera, RefreshCw, Copy } from "lucide-react";
import { generateServiceDraft, generateAssessmentDescription } from "@/app/actions/ai-service-generator";
import { ExpandableTextarea } from "@/components/ui/expandable-textarea";

// Preview Component defined outside to prevent re-renders
const PreviewChat = ({ data }: { data: any }) => {
    return (
        <div className="space-y-6 sticky top-8">
            <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Header */}
                <div className="bg-[#1A1A1A] p-4 border-b border-[#2A2A2A] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">Assistente Virtual</h4>
                            <p className="text-[10px] text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Online agora
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="p-6 space-y-6 bg-[#0A0A0A] min-h-[400px] text-sm">

                    {/* Intro */}
                    <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500">
                        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="space-y-2 max-w-[85%]">
                            <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                Olá! Sou a assistente virtual da clínica. Como posso ajudar você hoje? ✨
                            </div>
                        </div>
                    </div>

                    {/* User Intent */}
                    <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-right-2 duration-500 delay-150 fill-mode-backwards">
                        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="bg-purple-600/20 text-purple-100 p-3 rounded-2xl rounded-tr-none border border-purple-500/20">
                            Olá! Queria saber mais sobre o <strong>{data.name || "serviço"}</strong>.
                        </div>
                    </div>

                    {/* AI Confirmation & Context */}
                    <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500 delay-300 fill-mode-backwards">
                        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="space-y-2 max-w-[85%]">
                            <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                Excelente escolha! O <strong>{data.name || "procedimento"}</strong> é fantástico.
                            </div>
                            <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                Antes de te passar os valores, me conta: <strong>o que exatamente te incomoda hoje</strong> ou qual resultado você espera alcançar?
                            </div>
                        </div>
                    </div>

                    {/* User Problem */}
                    <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-right-2 duration-500 delay-500 fill-mode-backwards">
                        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="bg-purple-600/20 text-purple-100 p-3 rounded-2xl rounded-tr-none border border-purple-500/20">
                            <em>(Cliente descreve o problema/desejo...)</em>
                        </div>
                    </div>

                    {/* Diagnostic Questions Simulation */}
                    {data.hasDiagnosticQuestions && data.diagnosticQuestions.length > 0 && (
                        <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500 delay-700 fill-mode-backwards">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="space-y-2 max-w-[85%]">
                                <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                    <p className="text-xs text-purple-400 font-bold mb-1 uppercase tracking-wider">Qualificação Ativada</p>
                                    Entendi perfeitamente. Para eu te orientar melhor:
                                    <br /><br />
                                    "{data.diagnosticQuestions[0]}"
                                </div>
                                {data.diagnosticQuestions.length > 1 && (
                                    <div className="text-[10px] text-gray-500 text-center pt-2">
                                        *A IA fará as outras perguntas conforme a conversa flui.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!data.hasDiagnosticQuestions && (
                        <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500 delay-700 fill-mode-backwards">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                Entendi! O {data.name || "serviço"} funciona assim... [Explicação do Serviço]
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Input Mock */}
                <div className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex gap-3">
                    <div className="h-10 bg-[#0A0A0A] rounded-full flex-1 border border-[#2A2A2A] px-4 flex items-center text-gray-600 text-xs">
                        Digite sua resposta...
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                        <Send className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>

            {/* Explanation Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                    <BrainCircuit className="w-5 h-5" />
                    <h5 className="font-semibold text-sm">Entenda a Mágica</h5>
                </div>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                    Este é apenas um exemplo visual. Na prática, a <strong>Inteligência Artificial</strong> analisa o sentimento, a urgência e o perfil de cada cliente para conduzir essa conversa de forma única.
                </p>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                    Ao ativar a <strong>Qualificação do Cliente</strong>, você garante que a IA não seja apenas uma "respondedora de preços", mas sim uma consultora que entende o problema antes de vender a solução.
                </p>
            </div>
        </div>
    );
};

export function ServiceForm({
    service,
    onSuccess,
    onCancel
}: {
    service?: any,
    onSuccess: (updatedService: any) => void,
    onCancel: () => void
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatingAssessment, setGeneratingAssessment] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [showImage, setShowImage] = useState(!!service?.imageUrl);

    // Parse existing rules if available
    const rules = service?.rules ? (typeof service.rules === 'string' ? JSON.parse(service.rules) : service.rules) : {};

    // Data Migration Logic for Pricing Table
    // If opening an old service with flat structure, wrap it in a "Geral" group
    const initialPriceTableItems = (() => {
        let items = service?.id ? (rules.priceTableItems || []) : [];
        if (items.length > 0 && !items[0].items) {
            return [{ title: "Geral", items: items }];
        }
        if (items.length === 0) {
            return [{ title: "Geral", items: [] }];
        }
        return items;
    })();

    const [formData, setFormData] = useState({
        id: service?.id || "",
        name: service?.name || "",
        description: service?.description || "",
        price: service?.price?.toString() || "",
        durationMin: service?.durationMin?.toString() || "30",
        priceHidden: service?.priceHidden || false,
        requiresEval: service?.requiresEval || false,
        imageUrl: service?.imageUrl || "",
        tags: service?.tags || "",
        active: service?.active ?? true,

        // Evaluation & Advanced Rules
        hasEvaluation: rules.hasEvaluation || false,
        evaluationName: rules.evaluationName || "Avaliação",
        evaluationDescription: rules.evaluationDescription || "",
        evalIsPaid: rules.evalIsPaid || false,
        evalPrice: rules.evalPrice || "",
        evalHasDuration: rules.evalHasDuration || false,
        evalDuration: rules.evalDuration || "",
        informProcedurePrice: rules.informProcedurePrice || false,
        pricingModel: rules.pricingModel || "fixed", // fixed, range, table
        priceMin: rules.priceMin || "",
        priceMax: rules.priceMax || "",
        priceTableContent: rules.priceTableContent || "",
        priceTableItems: initialPriceTableItems,
        // Default durationHidden to true for new services so it starts "off" if interpreted as "Show Duration"
        // Initializing with 'true' (hidden) by default unless explicitly false
        durationHidden: service?.id ? (rules.durationHidden ?? true) : true,

        // Tags configuration
        positiveTags: rules.positiveTags || service?.tags || "",
        negativeTags: rules.negativeTags || "",
        showNegativeTags: !!rules.negativeTags,

        // Diagnostic Questions
        hasDiagnosticQuestions: service?.id ? (rules.hasDiagnosticQuestions ?? true) : true,
        diagnosticQuestions: (rules.diagnosticQuestions && rules.diagnosticQuestions.length > 0)
            ? rules.diagnosticQuestions
            : [
                "Resuma pra mim um pouco do teu contexto, o que vem te incomodando?",
                "Você já tentou resolver isso antes? Se sim, o que funcionou ou não?",
                "O que você mais espera alcançar com isso?"
            ],
    });

    const defaultQuestions = [
        "Resuma pra mim um pouco do teu contexto, o que vem te incomodando?",
        "Você já tentou resolver isso antes? Se sim, o que funcionou ou não?",
        "O que você mais espera alcançar com isso?"
    ];

    const supabase = createClient();

    async function handleGenerateAI() {
        console.log("DEBUG: handleGenerateAI formData:", formData);
        if (!formData.description && !formData.name) {
            alert("Por favor, preencha o nome ou uma breve descrição do serviço para a IA entender o que criar.");
            return;
        }

        setGenerating(true);
        console.log("DEBUG: Calling generateServiceDraft with:", { name: formData.name, description: formData.description });
        const res = await generateServiceDraft({ name: formData.name, description: formData.description });
        setGenerating(false);

        if (res.success) {
            const data = res.data;
            setFormData(prev => ({
                ...prev,
                name: (prev.name && prev.name.length > 3) ? prev.name : data.suggestedName, // Only replace if name is empty/short
                description: data.description || prev.description, // AI Suggested Description
                durationMin: data.durationMin ? data.durationMin.toString() : prev.durationMin,
                positiveTags: data.tags || prev.positiveTags,
                negativeTags: data.negativeTags || prev.negativeTags,
                showNegativeTags: !!data.negativeTags, // Auto-open negative tags

                // AI Questions
                hasDiagnosticQuestions: true,
                diagnosticQuestions: data.diagnosticQuestions && data.diagnosticQuestions.length > 0 ? data.diagnosticQuestions : prev.diagnosticQuestions
            }));
        } else {
            alert("Erro na geração IA: " + res.error);
        }
    }

    async function handleGenerateAssessmentAI() {
        if (!formData.name) {
            alert("Defina um nome para o serviço antes de gerar a descrição da avaliação.");
            return;
        }
        setGeneratingAssessment(true);
        const res = await generateAssessmentDescription({
            serviceName: formData.name,
            evaluationName: formData.evaluationName,
            description: formData.evaluationDescription || formData.description
        });
        setGeneratingAssessment(false);

        if (res.success) {
            setFormData(prev => ({ ...prev, evaluationDescription: res.data }));
        } else {
            alert("Erro na geração: " + res.error);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `service-images/${fileName}`;

            const { error } = await supabase.storage
                .from('services')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('services')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imageUrl: publicUrl });
        } catch (error: any) {
            console.error("Upload error:", error);
            alert("Erro no upload: " + error.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        // Construct rules object
        const rules: any = {
            hasEvaluation: formData.hasEvaluation,
            evaluationName: formData.evaluationName,
            evaluationDescription: formData.evaluationDescription,
            requiresEval: formData.requiresEval,
            evalIsPaid: formData.evalIsPaid,
            evalPrice: formData.evalPrice,
            evalHasDuration: formData.evalHasDuration,
            evalDuration: formData.evalDuration,
            informProcedurePrice: formData.informProcedurePrice,
            pricingModel: formData.pricingModel,
            priceMin: formData.priceMin,
            priceMax: formData.priceMax,
            // Ensure priceTableItems is always saved as our new grouped structure
            priceTableItems: formData.priceTableItems,
            durationHidden: formData.durationHidden,
            hasDiagnosticQuestions: formData.hasDiagnosticQuestions,
            diagnosticQuestions: formData.diagnosticQuestions,
            positiveTags: formData.positiveTags,
            negativeTags: formData.negativeTags,
        };

        // If it's a table, generate the priceTableContent as Markdown
        if (formData.pricingModel === 'table') {
            const validItems = formData.priceTableItems.filter((item: any) => item.name && item.price);
            if (validItems.length > 0) {
                rules.priceTableContent = `| Serviço/Região | Preço |\n| :--- | :--- |\n` +
                    validItems.map((item: any) => `| ${item.name} | ${item.price} |`).join("\n");
            }
        }

        const res = await upsertService({
            id: formData.id,
            name: formData.name,
            description: formData.description,
            price: formData.pricingModel === 'fixed' && formData.price ? parseFloat(formData.price) : null,
            durationMin: formData.durationMin ? parseInt(formData.durationMin) : null,
            priceHidden: formData.priceHidden,
            requiresEval: formData.requiresEval,
            imageUrl: formData.imageUrl,
            tags: formData.positiveTags, // Still updating top-level tags for legacy support
            active: formData.active,
            rules: rules,
        });

        if (res.success) {
            onSuccess(res.service);
        } else {
            alert("Erro ao salvar serviço: " + res.error);
        }
        setLoading(false);
    }

    const PreviewChat = ({ data }: { data: typeof formData }) => {
        return (
            <div className="space-y-6 sticky top-8">
                <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                    {/* Header */}
                    <div className="bg-[#1A1A1A] p-4 border-b border-[#2A2A2A] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-white">Assistente Virtual</h4>
                                <p className="text-[10px] text-green-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Online agora
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="p-6 space-y-6 bg-[#0A0A0A] min-h-[400px] text-sm">

                        {/* Intro */}
                        <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="space-y-2 max-w-[85%]">
                                <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                    Olá! Sou a assistente virtual da clínica. Como posso ajudar você hoje? ✨
                                </div>
                            </div>
                        </div>

                        {/* User Intent */}
                        <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-right-2 duration-500 delay-150 fill-mode-backwards">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="bg-purple-600/20 text-purple-100 p-3 rounded-2xl rounded-tr-none border border-purple-500/20">
                                Olá! Queria saber mais sobre o <strong>{data.name || "serviço"}</strong>.
                            </div>
                        </div>

                        {/* AI Confirmation & Context */}
                        <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500 delay-300 fill-mode-backwards">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="space-y-2 max-w-[85%]">
                                <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                    Excelente escolha! O <strong>{data.name || "procedimento"}</strong> é fantástico.
                                </div>
                                <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                    Antes de te passar os valores, me conta: <strong>o que exatamente te incomoda hoje</strong> ou qual resultado você espera alcançar?
                                </div>
                            </div>
                        </div>

                        {/* User Problem */}
                        <div className="flex gap-4 flex-row-reverse animate-in slide-in-from-right-2 duration-500 delay-500 fill-mode-backwards">
                            <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="bg-purple-600/20 text-purple-100 p-3 rounded-2xl rounded-tr-none border border-purple-500/20">
                                <em>(Cliente descreve o problema/desejo...)</em>
                            </div>
                        </div>

                        {/* Diagnostic Questions Simulation */}
                        {data.hasDiagnosticQuestions && data.diagnosticQuestions.length > 0 && (
                            <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500 delay-700 fill-mode-backwards">
                                <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                </div>
                                <div className="space-y-2 max-w-[85%]">
                                    <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                        <p className="text-xs text-purple-400 font-bold mb-1 uppercase tracking-wider">Qualificação Ativada</p>
                                        Entendi perfeitamente. Para eu te orientar melhor:
                                        <br /><br />
                                        "{data.diagnosticQuestions[0]}"
                                    </div>
                                    {data.diagnosticQuestions.length > 1 && (
                                        <div className="text-[10px] text-gray-500 text-center pt-2">
                                            *A IA fará as outras perguntas conforme a conversa flui.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!data.hasDiagnosticQuestions && (
                            <div className="flex gap-4 animate-in slide-in-from-left-2 duration-500 delay-700 fill-mode-backwards">
                                <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="bg-[#1F1F1F] p-3 rounded-2xl rounded-tl-none text-gray-200">
                                    Entendi! O {data.name} funciona assim... [Explicação do Serviço]
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Input Mock */}
                    <div className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A] flex gap-3">
                        <div className="h-10 bg-[#0A0A0A] rounded-full flex-1 border border-[#2A2A2A] px-4 flex items-center text-gray-600 text-xs">
                            Digite sua resposta...
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                            <Send className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>

                {/* Explanation Box */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2 text-blue-400">
                        <BrainCircuit className="w-5 h-5" />
                        <h5 className="font-semibold text-sm">Entenda a Mágica</h5>
                    </div>
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                        Este é apenas um exemplo visual. Na prática, a <strong>Inteligência Artificial</strong> analisa o sentimento, a urgência e o perfil de cada cliente para conduzir essa conversa de forma única.
                    </p>
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                        Ao ativar a <strong>Qualificação do Cliente</strong>, você garante que a IA não seja apenas uma "respondedora de preços", mas sim uma consultora que entende o problema antes de vender a solução.
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 items-start max-w-[1600px] mx-auto p-6 animate-in fade-in duration-700">
            {/* Main Form */}
            <div className="flex-1 w-full max-w-3xl mx-auto xl:mx-0">
                <form id="service-form" onSubmit={handleSubmit} className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-8 space-y-8 pb-32">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-light text-white mb-2">
                                {formData.id ? "Editar Serviço" : "Novo Serviço"}
                            </h3>
                            <p className="text-sm text-gray-500">Detalhes do procedimento.</p>
                        </div>
                        <Button variant="ghost" type="button" onClick={onCancel} className="text-gray-500 hover:text-white">
                            <X className="w-5 h-5 mr-2" /> Cancelar
                        </Button>
                    </div>

                    {/* ... (existing content) ... */}

                    {/* Sticky Footer was here, moving to bottom */}

                    <div className="space-y-10">

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                            <div className="space-y-1">
                                <Label className="text-white font-medium">Status do Serviço</Label>
                                <p className="text-xs text-gray-400">Ative para permitir agendamentos e vendas pela IA</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn("text-xs font-bold uppercase", formData.active ? "text-green-400" : "text-gray-500")}>
                                    {formData.active ? "Ativado" : "Desativado"}
                                </span>
                                <Switch
                                    checked={formData.active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                                    className="data-[state=checked]:bg-green-600 scale-110"
                                />
                            </div>
                        </div>

                        {/* Main Info */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Nome do Serviço</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Harmonização Facial"
                                    className="bg-[#0A0A0A] border-transparent focus:border-purple-500/50 text-white h-14 text-lg rounded-xl"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Descrição (Fundamental para IA)</Label>
                                    <Button
                                        type="button"
                                        onClick={handleGenerateAI}
                                        disabled={generating}
                                        className="h-7 text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-pink-500/20 px-3 rounded-full transition-all hover:scale-105 active:scale-95"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                Criando mágica...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-3 h-3 mr-1.5 text-yellow-300" />
                                                Gerar tudo com IA
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <ExpandableTextarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva TODOS os detalhes do serviço. Quanto mais informação, melhor a IA conseguirá vender e tirar dúvidas do cliente."
                                    className="bg-[#0A0A0A] border-transparent focus:border-purple-500/50 text-white text-base leading-relaxed p-4 shadow-inner"
                                    compactHeight="min-h-[80px]"
                                    expandedHeight="min-h-[250px]"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Duração do Serviço</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Exibir</span>
                                            <Switch
                                                checked={!formData.durationHidden}
                                                onCheckedChange={(checked) => setFormData({ ...formData, durationHidden: !checked })}
                                                className="scale-75 data-[state=checked]:bg-purple-600"
                                            />
                                        </div>
                                    </div>
                                    {!formData.durationHidden && (
                                        <Input
                                            type="number"
                                            value={formData.durationMin}
                                            onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                                            className="bg-[#0A0A0A] border-transparent focus:border-purple-500/50 text-white h-12 rounded-xl animate-in zoom-in-95 duration-200"
                                            placeholder="Minutos"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3 col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <Label className="text-xs uppercase tracking-widest text-purple-400 font-semibold">Tags Positivas</Label>
                                </div>

                                <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 flex gap-3 mb-2">
                                    <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-purple-200/80 leading-relaxed">
                                        <strong>Sinônimos e Variações:</strong> Use tags positivas para ensinar a IA como seu cliente pode chamar este serviço (ex: para "Corte", adicione "tesoura, aparar, mudar visual").
                                    </p>
                                </div>

                                <Textarea
                                    value={formData.positiveTags}
                                    onChange={(e) => setFormData({ ...formData, positiveTags: e.target.value })}
                                    placeholder="Ex: protocolo de emagrecimento, perda de peso, secar barriga"
                                    className="bg-[#0A0A0A] border-transparent focus:border-purple-500/50 text-white min-h-[80px] rounded-xl resize-none"
                                />
                            </div>
                        </div>

                        {/* Negative Tags Section */}
                        <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ban className="w-4 h-4 text-red-400" />
                                    <Label className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Tags Negativas</Label>
                                </div>
                                <Switch
                                    checked={formData.showNegativeTags}
                                    onCheckedChange={(checked) => setFormData({ ...formData, showNegativeTags: checked })}
                                    className="scale-75 data-[state=checked]:bg-red-500"
                                />
                            </div>

                            {formData.showNegativeTags && (
                                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex gap-3">
                                        <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-200/80 leading-relaxed">
                                            <strong>Para que serve?</strong> Use tags negativas para ensinar a IA o que <u>NÃO</u> é este serviço.
                                            Isso evita que ela confunda procedimentos parecidos.
                                        </p>
                                    </div>
                                    <Textarea
                                        value={formData.negativeTags}
                                        onChange={(e) => setFormData({ ...formData, negativeTags: e.target.value })}
                                        placeholder="Ex: massagem modeladora, drenagem linfática (Adicione serviços parecidos para evitar confusão)"
                                        className="bg-[#0A0A0A] border-transparent focus:border-red-500/30 text-white min-h-[80px] rounded-xl resize-none placeholder:text-gray-600"
                                    />
                                </div>
                            )}
                        </div>

                        {/* AI Diagnostic Section */}
                        <div className="pt-8 border-t border-[#1F1F1F] space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                                        <h4 className="text-lg text-white font-medium">Qualificação do Cliente (IA)</h4>
                                    </div>
                                    <p className="text-sm text-gray-500">Perguntas estratégicas para a IA entender a necessidade do lead.</p>
                                </div>
                                <Switch
                                    checked={formData.hasDiagnosticQuestions}
                                    onCheckedChange={(checked) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            hasDiagnosticQuestions: checked,
                                            // Pre-fill if empty when turning on
                                            diagnosticQuestions: checked && prev.diagnosticQuestions.length === 0
                                                ? defaultQuestions
                                                : prev.diagnosticQuestions
                                        }));
                                    }}
                                    className="data-[state=checked]:bg-purple-600"
                                />
                            </div>

                            {formData.hasDiagnosticQuestions && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-sm font-medium text-purple-300 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Perguntas de Aprofundamento
                                            </h5>
                                            <span className="text-xs text-gray-500">{formData.diagnosticQuestions.length} perguntas</span>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.diagnosticQuestions.map((question: string, index: number) => (
                                                <div key={index} className="flex gap-2 group">
                                                    <div className="flex-none pt-3 text-gray-600 text-xs font-mono w-4">{index + 1}.</div>
                                                    <Textarea
                                                        value={question}
                                                        onChange={(e) => {
                                                            const newQuestions = [...formData.diagnosticQuestions];
                                                            newQuestions[index] = e.target.value;
                                                            setFormData({ ...formData, diagnosticQuestions: newQuestions });
                                                        }}
                                                        className="bg-[#0A0A0A] border-[#2a2a2a] text-sm min-h-[60px] resize-none focus-visible:ring-purple-500/30"
                                                        placeholder={`Ex: ${defaultQuestions[index % defaultQuestions.length]}`}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const newQuestions = formData.diagnosticQuestions.filter((_: string, i: number) => i !== index);
                                                            setFormData({ ...formData, diagnosticQuestions: newQuestions });
                                                        }}
                                                        className="text-gray-600 hover:text-red-400 hover:bg-red-500/10 self-start mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                diagnosticQuestions: [...formData.diagnosticQuestions, ""]
                                            })}
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-dashed border-[#333] hover:border-purple-500/50 hover:bg-purple-500/5 text-gray-400 hover:text-purple-400"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Adicionar Nova Pergunta
                                        </Button>
                                    </div>

                                    <div className="flex bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 gap-3">
                                        <Flag className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-200 leading-relaxed">
                                            <strong className="text-blue-400 block mb-1">Dica de Ouro:</strong>
                                            Essas perguntas serão feitas pela IA durante a conversa para coletar informações cruciais antes de sugerir agendamento.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pricing Section */}
                        <div className="pt-8 border-t border-[#1F1F1F] space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg text-white font-medium">Precificação</h4>
                                    <p className="text-sm text-gray-500">Defina como o valor do serviço será exibido.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-[#0A0A0A] p-2 px-4 rounded-xl border border-[#1F1F1F]">
                                    <Label className="text-xs text-gray-400 font-medium">Ocultar Valor</Label>
                                    <Switch
                                        checked={formData.priceHidden}
                                        onCheckedChange={(checked) => setFormData({ ...formData, priceHidden: checked })}
                                        className="scale-90 data-[state=checked]:bg-purple-600"
                                    />
                                </div>
                            </div>

                            {!formData.priceHidden && (
                                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: "fixed", label: "Preço Fixo" },
                                            { id: "range", label: "Faixa de Preço" },
                                            { id: "table", label: "Tabela" },
                                        ].map((model) => (
                                            <button
                                                key={model.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, pricingModel: model.id })}
                                                className={cn(
                                                    "px-6 py-3 rounded-xl text-sm font-medium transition-all border",
                                                    formData.pricingModel === model.id
                                                        ? "bg-white text-black border-white shadow-lg shadow-white/5"
                                                        : "bg-[#0A0A0A] text-gray-400 border-[#2A2A2A] hover:border-gray-600"
                                                )}
                                            >
                                                {model.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="animate-in fade-in duration-300">
                                        {formData.pricingModel === 'fixed' && (
                                            <div className="space-y-3">
                                                <Label className="text-xs text-gray-500">Valor (R$)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="bg-[#0A0A0A] border-transparent text-white h-14 text-lg w-full md:w-1/2 rounded-xl"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        )}

                                        {formData.pricingModel === 'range' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <Label className="text-xs text-gray-500">De (R$)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.priceMin}
                                                        onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                                                        className="bg-[#0A0A0A] border-transparent text-white h-12 rounded-xl"
                                                        placeholder="Mínimo"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-xs text-gray-500">Até (R$)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.priceMax}
                                                        onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                                                        className="bg-[#0A0A0A] border-transparent text-white h-12 rounded-xl"
                                                        placeholder="Máximo"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {formData.pricingModel === 'table' && (
                                            <div className="space-y-8">
                                                {/* Group Loop */}
                                                {formData.priceTableItems.map((group: any, groupIndex: number) => (
                                                    <div key={groupIndex} className="space-y-4 bg-[#0A0A0A] p-4 rounded-xl border border-[#222]">
                                                        {/* Group Header */}
                                                        <div className="flex items-center gap-3">
                                                            <Input
                                                                placeholder="Nome do Grupo (ex: Feminino)"
                                                                value={group.title || ""}
                                                                onChange={(e) => {
                                                                    const newGroups = [...formData.priceTableItems];
                                                                    newGroups[groupIndex].title = e.target.value;
                                                                    setFormData({ ...formData, priceTableItems: newGroups });
                                                                }}
                                                                className="bg-transparent border-none text-purple-400 font-semibold text-sm placeholder:text-gray-700 p-0 h-auto focus-visible:ring-0 w-full"
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    title="Duplicar Grupo"
                                                                    onClick={() => {
                                                                        const newGroups = [...formData.priceTableItems];
                                                                        // Deep copy the group
                                                                        const groupCopy = JSON.parse(JSON.stringify(group));
                                                                        groupCopy.title = `${group.title} (Cópia)`;
                                                                        newGroups.splice(groupIndex + 1, 0, groupCopy);
                                                                        setFormData({ ...formData, priceTableItems: newGroups });
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Remover Grupo"
                                                                    onClick={() => {
                                                                        const newGroups = formData.priceTableItems.filter((_: any, i: number) => i !== groupIndex);
                                                                        // Ensure at least one group exists
                                                                        setFormData({
                                                                            ...formData,
                                                                            priceTableItems: newGroups.length > 0 ? newGroups : [{ title: "Geral", items: [] }]
                                                                        });
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Items Loop */}
                                                        <div className="space-y-3 pl-4 border-l border-[#222]">
                                                            {group.items?.map((item: any, itemIndex: number) => (
                                                                <div key={itemIndex} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-200">
                                                                    <div className="flex-1">
                                                                        <Input
                                                                            placeholder="Item (ex: Axilas)"
                                                                            value={item.name}
                                                                            onChange={(e) => {
                                                                                const newGroups = [...formData.priceTableItems];
                                                                                newGroups[groupIndex].items[itemIndex].name = e.target.value;
                                                                                setFormData({ ...formData, priceTableItems: newGroups });
                                                                            }}
                                                                            className="bg-[#121212] border-[#2a2a2a] text-white h-10 rounded-lg text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="w-28">
                                                                        <Input
                                                                            placeholder="R$ 0,00"
                                                                            value={item.price}
                                                                            onChange={(e) => {
                                                                                const newGroups = [...formData.priceTableItems];
                                                                                newGroups[groupIndex].items[itemIndex].price = e.target.value;
                                                                                setFormData({ ...formData, priceTableItems: newGroups });
                                                                            }}
                                                                            className="bg-[#121212] border-[#2a2a2a] text-white h-10 rounded-lg text-sm"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newGroups = [...formData.priceTableItems];
                                                                            newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_: any, i: number) => i !== itemIndex);
                                                                            setFormData({ ...formData, priceTableItems: newGroups });
                                                                        }}
                                                                        className="p-2.5 text-gray-600 hover:text-red-400 rounded-lg transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const newGroups = [...formData.priceTableItems];
                                                                    if (!newGroups[groupIndex].items) newGroups[groupIndex].items = [];
                                                                    newGroups[groupIndex].items.push({ name: "", price: "" });
                                                                    setFormData({ ...formData, priceTableItems: newGroups });
                                                                }}
                                                                className="text-xs text-gray-500 hover:text-purple-400 hover:bg-transparent px-0"
                                                            >
                                                                + Adicionar Item
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        priceTableItems: [...formData.priceTableItems, { title: "Novo Grupo", items: [{ name: "", price: "" }] }]
                                                    })}
                                                    className="w-full border-dashed border-[#2a2a2a] hover:bg-purple-500/10 hover:border-purple-500/30 text-gray-400 hover:text-purple-400 cursor-pointer h-12 rounded-xl"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Adicionar Novo Grupo
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Evaluation Section */}
                        <div className="pt-8 border-t border-[#1F1F1F] space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg text-white font-medium">Fluxo de Avaliação</h4>
                                    <p className="text-sm text-gray-500">Defina se este serviço exige uma análise prévia.</p>
                                </div>
                                <Switch
                                    checked={formData.hasEvaluation}
                                    onCheckedChange={(checked) => setFormData({ ...formData, hasEvaluation: checked, requiresEval: checked })}
                                    className="data-[state=checked]:bg-purple-600 scale-110"
                                />
                            </div>

                            {formData.hasEvaluation && (
                                <div className="space-y-8 p-6 bg-[#0A0A0A] rounded-2xl border border-[#2A2A2A] animate-in slide-in-from-top-4 fade-in duration-500">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-white font-medium">Nome da Avaliação</Label>
                                            <Input
                                                value={formData.evaluationName}
                                                onChange={(e) => setFormData({ ...formData, evaluationName: e.target.value })}
                                                placeholder="Ex: Avaliação, Consulta Estética, Diagnóstico, etc."
                                                className="bg-[#121212] border-transparent focus:border-purple-500/50 text-white rounded-xl h-12"
                                            />
                                            <p className="text-[10px] text-gray-500 italic">
                                                Exemplos: Consulta Estética, Diagnóstico do Envelhecimento, Consulta Anti-Pochete, Avaliação Tricoscópica.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Descrição da Avaliação</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.preventDefault(); handleGenerateAssessmentAI(); }}
                                                    disabled={generatingAssessment}
                                                    className="h-7 text-xs bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-pink-500/20 px-3 rounded-full transition-all hover:scale-105 active:scale-95"
                                                >
                                                    {generatingAssessment ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                            Criando mágica...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-3 h-3 mr-1.5 text-yellow-300" />
                                                            Gerar com IA
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                            <ExpandableTextarea
                                                value={formData.evaluationDescription}
                                                onChange={(e) => setFormData({ ...formData, evaluationDescription: e.target.value })}
                                                placeholder="Explique como funciona a avaliação (ex: 'Analisamos a pele para determinar o número de sessões')."
                                                className="bg-[#121212] border-transparent focus:border-purple-500/50 text-white rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-[#1F1F1F]">
                                            <div className="space-y-1">
                                                <Label className="text-white">Avaliação é Obrigatória?</Label>
                                                <p className="text-xs text-gray-500">Impede o agendamento direto do serviço</p>
                                            </div>
                                            <Switch
                                                checked={formData.requiresEval}
                                                onCheckedChange={(checked) => setFormData({ ...formData, requiresEval: checked })}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-[#1F1F1F]">
                                            <div className="space-y-1">
                                                <Label className="text-white">Avaliação tem Custo?</Label>
                                                <p className="text-xs text-gray-500">Cobrar pela consulta inicial</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {formData.evalIsPaid && (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                        <span className="text-gray-500 text-sm">R$</span>
                                                        <Input
                                                            type="number"
                                                            className="w-24 h-10 bg-[#0A0A0A] border-transparent text-white rounded-lg"
                                                            placeholder="0,00"
                                                            value={formData.evalPrice}
                                                            onChange={(e) => setFormData({ ...formData, evalPrice: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                                <Switch
                                                    checked={formData.evalIsPaid}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, evalIsPaid: checked })}
                                                    className="data-[state=checked]:bg-green-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-[#121212] rounded-xl border border-[#1F1F1F]">
                                            <div className="space-y-1">
                                                <Label className="text-white">Informar Duração da Avaliação?</Label>
                                                <p className="text-xs text-gray-500">Tempo estimado da consulta</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {formData.evalHasDuration && (
                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                        <Input
                                                            type="number"
                                                            className="w-20 h-10 bg-[#0A0A0A] border-transparent text-white rounded-lg"
                                                            placeholder="min"
                                                            value={formData.evalDuration}
                                                            onChange={(e) => setFormData({ ...formData, evalDuration: e.target.value })}
                                                        />
                                                        <span className="text-gray-500 text-xs">min</span>
                                                    </div>
                                                )}
                                                <Switch
                                                    checked={formData.evalHasDuration}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, evalHasDuration: checked })}
                                                    className="data-[state=checked]:bg-orange-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-8 border-t border-[#1F1F1F] space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-lg text-white font-medium">Foto do Serviço</h4>
                                    <p className="text-sm text-gray-500">Deseja adicionar uma imagem ilustrativa?</p>
                                </div>
                                <Switch
                                    checked={showImage}
                                    onCheckedChange={setShowImage}
                                    className="data-[state=checked]:bg-purple-600 scale-110"
                                />
                            </div>

                            {showImage && (
                                <div className="flex flex-col items-center justify-center p-6 border border-[#1F1F1F] rounded-2xl bg-[#0A0A0A]/50 animate-in slide-in-from-top-4 fade-in duration-500">
                                    <div className="w-40 h-40 relative group bg-[#0A0A0A] rounded-2xl border-2 border-dashed border-[#2a2a2a] hover:border-purple-500/30 transition-colors flex items-center justify-center overflow-hidden cursor-pointer">
                                        {formData.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-gray-500 group-hover:text-purple-400 transition-colors">
                                                <Camera className="w-8 h-8 mx-auto mb-2 opacity-30 group-hover:opacity-60" />
                                                <p className="text-xs">Foto do Serviço</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            disabled={uploading}
                                        />
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                                            </div>
                                        )}
                                    </div>
                                    {formData.imageUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, imageUrl: "" })}
                                            className="mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-2"
                                        >
                                            Remover Foto
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="flex gap-4 pt-10">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-14 rounded-2xl border-gray-800 text-white hover:bg-[#1F1F1F]">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-14 rounded-2xl shadow-xl shadow-purple-900/20 font-semibold tracking-tight">
                            {loading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : "Salvar Serviço"}
                        </Button>
                    </div>
                    {/* Sticky Footer */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#121212]/90 backdrop-blur-md border-t border-[#1F1F1F] z-50 flex justify-center animate-in slide-in-from-bottom-5">
                        <div className="flex gap-4 w-full max-w-3xl items-center justify-between">
                            <div className="text-xs text-gray-500 hidden md:block">
                                <Info className="w-4 h-4 inline mr-2 text-purple-500" />
                                Lembre-se de salvar as alterações.
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button type="button" variant="outline" onClick={onCancel} className="flex-1 md:w-32 h-12 rounded-xl border-gray-800 text-white hover:bg-[#1F1F1F]">
                                    Cancelar
                                </Button>
                                <Button type="submit" form="service-form" disabled={loading} className="flex-1 md:w-48 bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl shadow-xl shadow-purple-900/20 font-semibold tracking-tight transition-all hover:scale-105 active:scale-95">
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div >

            {/* Sidebar Preview - Disabled for now as per user request */}
            {/* <div className="hidden xl:block w-[400px] 2xl:w-[480px] shrink-0">
            <PreviewChat data={formData} />
        </div> */}
        </div >
    );
}
