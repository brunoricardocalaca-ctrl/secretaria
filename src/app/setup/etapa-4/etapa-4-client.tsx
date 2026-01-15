"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/lumina/step-indicator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Smartphone, Loader2, Check } from "lucide-react";
import { createWhatsappInstance, getConnectQR, getInstanceStatus } from "@/app/actions/whatsapp";
import { completeSetup } from "@/app/actions/setup";
import { SetupSummary } from "@/components/lumina/setup-summary";

export default function Etapa4Client({ tenant }: { tenant: any }) {
    const [loading, setLoading] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!instanceName || connected) return;

        const interval = setInterval(async () => {
            const status = await getInstanceStatus(instanceName);
            if (status === "open") {
                setConnected(true);
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [instanceName, connected]);

    async function handleConnect() {
        setLoading(true);
        const formData = new FormData();
        formData.append("name", `WhatsApp - ${tenant.name}`);

        try {
            const res = await createWhatsappInstance(formData);
            if (res?.instance?.instanceName) {
                setInstanceName(res.instance.instanceName);

                const qrRes = await getConnectQR(res.instance.instanceName);
                if (qrRes?.base64 || qrRes?.qrcode?.base64) {
                    setQrCode(qrRes.base64 || qrRes.qrcode.base64);
                }
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao criar instância. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    async function handleFinish() {
        if (finishing) return;
        setFinishing(true);
        console.log("Finishing setup...");
        try {
            const res = await completeSetup();
            console.log("Finish result:", res);

            if (res.success) {
                // Force hard navigation if router.push fails or is slow
                window.location.href = "/dashboard";
            } else {
                alert("Erro ao finalizar: " + (res.error || "Erro desconhecido"));
                setFinishing(false);
            }
        } catch (e: any) {
            console.error("Finish Exception:", e);
            alert("Erro inesperado: " + e.message);
            setFinishing(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] selection:bg-purple-500/30">
            <div className="container max-w-4xl mx-auto px-6 py-20">
                <StepIndicator currentStep={4} totalSteps={4} />

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-extralight tracking-tight text-white">
                        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">WhatsApp</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
                        Conecte o número que sua secretar.ia utilizará para atender seus clientes automaticamente 24h por dia.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {!qrCode && !connected && (
                        <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-16 text-center space-y-8 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-[#1F1F1F] rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Smartphone className="w-10 h-10 text-gray-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl text-white font-light">Vamos Conectar</h3>
                                <p className="text-gray-500 text-sm">Gere um QR Code único para vincular seu WhatsApp.</p>
                            </div>

                            <Button
                                onClick={handleConnect}
                                disabled={loading}
                                className="bg-white hover:bg-gray-200 text-black px-12 h-16 text-lg font-medium rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                        Gerando QR Code...
                                    </>
                                ) : "Gerar QR Code"}
                            </Button>
                        </div>
                    )}

                    {qrCode && !connected && (
                        <div className="bg-[#121212] border border-[#1F1F1F] rounded-3xl p-10 backdrop-blur-sm">
                            <h3 className="text-center text-xl font-light text-white mb-8">
                                Setup via Aplicativo
                            </h3>

                            <div className="flex justify-center mb-10">
                                <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-purple-500/20 relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64 mix-blend-multiply" />
                                    <div className="absolute inset-0 border-4 border-transparent group-hover:border-purple-500/20 rounded-xl transition-all" />

                                    {/* Scan Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_10px_#a855f7] animate-[scan_2s_ease-in-out_infinite]" />
                                </div>
                            </div>

                            <div className="space-y-4 bg-[#0A0A0A] p-8 rounded-2xl border border-[#1F1F1F]">
                                <div className="space-y-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-[#1F1F1F] flex items-center justify-center text-xs font-bold text-white">1</span>
                                        <span>Abra o WhatsApp no seu celular</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-[#1F1F1F] flex items-center justify-center text-xs font-bold text-white">2</span>
                                        <span>Toque em <strong className="text-white">Aparelhos conectados</strong></span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-[#1F1F1F] flex items-center justify-center text-xs font-bold text-white">3</span>
                                        <span>Toque em <strong className="text-white">Conectar um aparelho</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-3 text-yellow-500/80 bg-yellow-500/5 py-3 rounded-full border border-yellow-500/10">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                </span>
                                <span className="text-xs font-medium uppercase tracking-widest">Aguardando Conexão</span>
                            </div>
                        </div>
                    )}

                    {connected && (
                        <div className="bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 rounded-3xl p-10 text-center backdrop-blur-sm space-y-8">

                            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>

                            <div>
                                <h3 className="text-3xl font-light text-white mb-2">
                                    Configuração Concluída!
                                </h3>
                                <p className="text-gray-400">
                                    Sua secretária já está pronta. Confira o resumo abaixo e finalize.
                                </p>
                            </div>

                            {/* SETUP SUMMARY INLINE */}
                            <div className="text-left bg-black/40 rounded-2xl p-6 border border-white/10 max-h-96 overflow-y-auto">
                                <SetupSummary tenant={tenant} />
                            </div>

                            <Button
                                onClick={handleFinish}
                                disabled={finishing}
                                className="bg-white hover:bg-gray-200 text-black px-12 h-16 text-lg font-medium rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all w-full"
                            >
                                {finishing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                        Finalizando...
                                    </>
                                ) : (
                                    <>
                                        Ir para o Painel
                                        <ChevronRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
