"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado no Painel</h2>
            <p className="text-gray-400 max-w-md mb-8">
                Tivemos um problema ao carregar as informações do seu dashboard.
                Isso pode ser uma instabilidade temporária na conexão.
            </p>

            {error.digest && (
                <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-lg px-4 py-2 mb-8">
                    <p className="text-xs font-mono text-gray-500">ID do Erro: {error.digest}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={() => reset()}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8"
                >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                </Button>

                <Button
                    variant="outline"
                    onClick={() => window.location.href = "/dashboard"}
                    className="border-[#3a3a3a] bg-[#222] text-gray-300 hover:bg-[#333] hover:text-white rounded-xl px-8"
                >
                    Recarregar Página
                </Button>
            </div>
        </div>
    );
}
