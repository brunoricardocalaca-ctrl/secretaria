"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/lumina/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, MessageSquare, Phone, User, ThumbsUp, AlertCircle } from "lucide-react";
import { saveSetupStep3 } from "@/app/actions/setup";

export default function Etapa3Client({ tenantName, initialPhone }: { tenantName: string, initialPhone: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [notificationPhone, setNotificationPhone] = useState(initialPhone);

    async function handleNext() {
        setLoading(true);
        try {
            const res = await saveSetupStep3({ notificationPhone });
            if (res.success) {
                router.push("/setup/etapa-4");
            } else {
                alert("Erro ao salvar: " + res.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erro inesperado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] selection:bg-purple-500/30">
            <div className="container max-w-4xl mx-auto px-6 py-20">
                <StepIndicator currentStep={3} totalSteps={4} />

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-extralight tracking-tight text-white">
                        Configurações <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Gerais</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
                        Defina como o atendimento deve se comportar em situações especiais.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Notification & Phone Unified Section */}
                    <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl overflow-hidden">
                        <div className="p-8 md:p-10 grid md:grid-cols-2 gap-10">
                            {/* Left: Explanation & Input */}
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <h3 className="text-xl font-light text-white">Notificações no WhatsApp</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Sempre que um cliente pedir para falar com um humano ou solicitar um agendamento, enviaremos um <strong>resumo completo</strong> para um número de sua escolha.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Onde devemos enviar?</Label>
                                    <Input
                                        value={notificationPhone}
                                        onChange={(e) => setNotificationPhone(e.target.value)}
                                        placeholder="Seu WhatsApp (Ex: 554199999999)"
                                        className="bg-[#0A0A0A] border-transparent focus:border-blue-500/50 text-white h-14 text-lg rounded-xl pl-4 shadow-inner"
                                    />
                                    <p className="text-xs text-gray-600 pl-1">Digite apenas números com DDD.</p>
                                </div>
                            </div>

                            {/* Right: Preview Card */}
                            <div className="bg-[#0A0A0A] rounded-2xl p-6 border border-[#1F1F1F] md:mt-2 relative">
                                <div className="absolute top-3 right-4 text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Preview</div>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400 mb-2">Você receberá exatamente assim:</p>

                                    {/* Mock Message Bubble */}
                                    <div className="bg-[#0F2027] rounded-xl rounded-tl-none p-4 border border-blue-500/20 text-sm space-y-3 font-mono text-blue-100/90 shadow-lg relative ml-2">
                                        <p>🤖 <strong>Lumina Info:</strong></p>
                                        <p className="text-white">💬 Usuário aguardando atendimento</p>
                                        <hr className="border-blue-500/20" />
                                        <p>📄 <strong>Resumo:</strong> Cliente quer agendar Botox mas tem dúvidas sobre valores.</p>
                                        <p>📞 <strong>Contato:</strong> <span className="text-blue-400 underline decoration-blue-400/30">wa.me/5541988887777</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interruption & Resume Logic */}
                    <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-light text-white">Transição para Humano</h3>
                                <p className="text-sm text-gray-500">Como assumir e devolver o controle para a IA.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 pt-4">
                            {/* Step 1: Pausing */}
                            <div className="space-y-4">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#1F1F1F] text-xs flex items-center justify-center text-gray-400">1</span>
                                    Interrupção Automática
                                </h4>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Se você responder o cliente <strong>diretamente pelo seu WhatsApp</strong> (ou pelo celular), a IA detecta sua presença e <strong>pausa imediatamente</strong> para não interferir na sua conversa.
                                </p>
                                <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl flex gap-3 text-yellow-200/80 text-xs">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>A IA ficará silenciada até você autorizar o retorno.</p>
                                </div>
                            </div>

                            {/* Step 2: Resuming (Visual Example) */}
                            <div className="space-y-4">
                                <h4 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#1F1F1F] text-xs flex items-center justify-center text-gray-400">2</span>
                                    Como fazer a Secretar.IA retornar?
                                </h4>
                                <p className="text-sm text-gray-400">
                                    Simples: Para a <strong>Secretar.IA assumir o atendimento novamente</strong>, basta reagir com 👍 na última mensagem do cliente.
                                </p>

                                {/* WhatsApp Mock Visual */}
                                <div className="mt-4 relative bg-[#0d1418] rounded-xl overflow-hidden border border-[#1F2C33] shadow-2xl max-w-sm mx-auto md:mx-0">
                                    {/* Fake Header */}
                                    <div className="bg-[#1f2c34] h-10 flex items-center px-4 gap-3 border-b border-[#2a3942]">
                                        <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                                        <div className="h-2 w-24 bg-gray-600 rounded-full opacity-50"></div>
                                    </div>

                                    {/* Message Area */}
                                    <div className="p-4 space-y-4 relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", opacity: 0.9 }}>
                                        <div className="absolute inset-0 bg-[#0d1418]/90"></div> {/* Dimmer */}

                                        {/* Client Message */}
                                        <div className="relative z-10 flex justify-start">
                                            <div className="bg-[#1f2c34] text-white text-xs p-3 rounded-lg rounded-tl-none max-w-[85%] shadow-sm">
                                                <p>Entendi! Vou ver certinho e te aviso então.</p>
                                                <div className="text-[10px] text-gray-400 text-right mt-1">10:42</div>

                                                {/* Reaction Pill */}
                                                <div className="absolute -bottom-3 left-2 bg-[#1f2c34] border border-[#0d1418] px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-1 z-20">
                                                    <span className="text-sm">👍</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Helper Pointer/Tooltip */}
                                        <div className="relative z-10 pl-6 pt-2">
                                            <div className="text-xs text-green-400 font-medium animate-pulse flex items-center gap-2">
                                                <span className="text-xl">👆</span>
                                                Basta reagir assim!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end pt-8 pb-20">
                        <Button
                            onClick={handleNext}
                            disabled={!notificationPhone || loading}
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
