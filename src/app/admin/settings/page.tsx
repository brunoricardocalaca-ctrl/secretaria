"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Webhook, Bot, Lock } from "lucide-react";
import { getSystemConfig, upsertSystemConfig } from "@/app/actions/admin-settings";
import { useEffect } from "react";
import { Textarea as TextInput } from "@/components/ui/textarea";

export default function AdminSettingsPage() {
    // State
    const [n8nUrl, setN8nUrl] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");

    // Prompt State
    const [prompt, setPrompt] = useState("");
    const [serviceDescPrompt, setServiceDescPrompt] = useState("");
    const [assessmentPrompt, setAssessmentPrompt] = useState("");
    const [loadingPrompt, setLoadingPrompt] = useState(true);

    // Fetch configs on load
    useEffect(() => {
        setLoadingPrompt(true);
        // Fetch Prompt
        getSystemConfig("service_gen_prompt").then(val => {
            if (val) setPrompt(val);
            else setPrompt(`Você é uma IA especialista em criar catálogos de serviços para clínicas e estúdios.
Sua tarefa é analisar uma descrição (mesmo que rascunho) e estruturar um serviço profissional.

Retorne APENAS um JSON válido com a seguinte estrutura, sem markdown ou explicações:
{
    "suggestedName": "Nome curto e comercial do serviço",
    "description": "Texto persuasivo em um parágrafo usando técnicas de copywriting. Use emojis e bullet points se necessário para vender o serviço via WhatsApp.",
    "durationMin": 30, // Estimativa em minutos (number)
    "tags": "tag1, tag2, tag3", // 5 a 8 tags positivas separadas por vírgula
    "negativeTags": "tag1, tag2, tag3", // 3 a 5 tags negativas (o que NÃO é o serviço)
    "diagnosticQuestions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"] // Array de 3 perguntas para qualificar o lead
}`);
        });

        getSystemConfig("service_description_prompt").then(val => {
            if (val) setServiceDescPrompt(val);
        });

        getSystemConfig("assessment_gen_prompt").then(val => {
            if (val) setAssessmentPrompt(val);
            // Default value fallback logic is handled in backend if empty here, 
            // but nice to show something if we want. For now leave empty or fetched.
        });

        setLoadingPrompt(false); // Rough approximation, better to wait for all

        // Fetch Keys
        getSystemConfig("n8n_webhook_url").then(val => setN8nUrl(val));
        getSystemConfig("openai_api_key").then(val => setOpenaiKey(val));
    }, []);

    const handleSavePrompt = async () => {
        await upsertSystemConfig("service_gen_prompt", prompt);
        await upsertSystemConfig("service_description_prompt", serviceDescPrompt);
        await upsertSystemConfig("assessment_gen_prompt", assessmentPrompt);
        alert("Prompts atualizados!");
    };

    const handleSaveN8n = async () => {
        const res = await upsertSystemConfig("n8n_webhook_url", n8nUrl);
        if (res.success) alert("Webhook n8n atualizado!");
        else alert("Erro ao salvar: " + res.error);
    };

    const handleSaveOpenAI = async () => {
        const res = await upsertSystemConfig("openai_api_key", openaiKey);
        if (res.success) alert("API Key OpenAI atualizada!");
        else alert("Erro ao salvar: " + res.error);
    };

    return (
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg border border-red-500/20 bg-red-500/10">
                        <Webhook className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">n8n - Webhook Padrão</h3>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                    URL utilizada para processamento de filas e automações globais.
                </p>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-gray-300">Webhook URL (Production)</Label>
                        <Input
                            value={n8nUrl}
                            onChange={e => setN8nUrl(e.target.value)}
                            className="bg-black/50 border-white/10 text-gray-300 focus-visible:ring-amber-500/50"
                            placeholder="https://webhook.n8n.cloud/..."
                        />
                    </div>
                    <Button onClick={handleSaveN8n} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg border border-green-500/20 bg-green-500/10">
                        <Bot className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">OpenAI - API Key Global</h3>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                    Chave mestra para inteligência artificial (caso o cliente não forneça a dele).
                </p>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-gray-300">API Key</Label>
                        <div className="relative">
                            <Input
                                type="password"
                                value={openaiKey}
                                onChange={e => setOpenaiKey(e.target.value)}
                                className="bg-black/50 border-white/10 text-gray-300 pr-10 focus-visible:ring-amber-500/50"
                                placeholder="sk-..."
                            />
                            <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
                        </div>
                    </div>
                    <Button onClick={handleSaveOpenAI} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Chave
                    </Button>
                </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg border border-purple-500/20 bg-purple-500/10">
                        <Bot className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Prompt do Gerador de Serviços</h3>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                    Edite o prompt "system" enviado para a IA ao clicar em "Gerar tudo com IA".
                </p>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-gray-300">Prompt do Servico (Geral - JSON)</Label>
                        <TextInput
                            disabled={loadingPrompt}
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            className="bg-black/50 border-white/10 text-gray-300 min-h-[200px] font-mono text-xs focus-visible:ring-amber-500/50"
                            placeholder="Carregando prompt..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Prompt da Descrição do Serviço (Copywriting)</Label>
                        <p className="text-xs text-gray-500">
                            Instruções específicas para o campo "description" no JSON.
                        </p>
                        <TextInput
                            disabled={loadingPrompt}
                            value={serviceDescPrompt}
                            onChange={e => setServiceDescPrompt(e.target.value)}
                            className="bg-black/50 border-white/10 text-gray-300 min-h-[150px] font-mono text-xs focus-visible:ring-amber-500/50"
                            placeholder="Ex: Use linguagem persuasiva, emojis e bullet points..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-300">Prompt da Avaliação (Assessment)</Label>
                        <p className="text-xs text-gray-500">
                            Instruções para gerar a descrição persuasiva da avaliação.
                        </p>
                        <TextInput
                            disabled={loadingPrompt}
                            value={assessmentPrompt}
                            onChange={e => setAssessmentPrompt(e.target.value)}
                            className="bg-black/50 border-white/10 text-gray-300 min-h-[150px] font-mono text-xs focus-visible:ring-amber-500/50"
                            placeholder="Deixe em branco para usar o padrão do sistema..."
                        />
                    </div>

                    <Button onClick={handleSavePrompt} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Prompts
                    </Button>
                </div>
            </div>
        </div >
    );
}
