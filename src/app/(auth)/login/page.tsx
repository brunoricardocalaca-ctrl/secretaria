"use client"

import Link from "next/link"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, EyeOff } from "lucide-react"
import { useFormState } from "react-dom"
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
    const [state, formAction] = useFormState(login, null)

    const searchParams = useSearchParams();
    const errorParam = searchParams.get('error');
    const logs = searchParams.get('error_description');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-4 py-12">
            {/* Logo Section */}
            <div className="mb-8 flex flex-col items-center">
                <div className="relative group cursor-default text-center">
                    <div className="absolute -inset-x-8 -inset-y-4 bg-amber-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative flex flex-col items-center">
                        <h2 className="text-5xl font-black tracking-tighter text-white">NEXUS</h2>
                        <div className="h-[2px] w-12 bg-amber-500 my-1"></div>
                        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-[0.4em] ml-1">secretar.ia</h3>
                    </div>
                </div>
                <h1 className="mt-8 text-2xl font-medium tracking-tight text-white/80">
                    Bem-vindo de volta
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Acesse sua central de inteligência
                </p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[400px] rounded-[2.5rem] border border-white/[0.03] bg-[#121212]/40 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-3xl transition-all hover:border-white/[0.06]">
                <form action={formAction} className="space-y-6">
                    {errorParam === 'auth' && (
                        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                            {logs ? decodeURIComponent(logs) : "Erro de autenticação. Tente novamente."}
                        </div>
                    )}
                    {state?.error && (
                        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                            {state.error}
                        </div>
                    )}
                    <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                            E-mail de acesso
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="exemplo@servidor.com"
                            required
                            className="h-14 rounded-2xl border-white/[0.05] bg-white/[0.01] px-5 text-white placeholder:text-gray-700 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/30 transition-all duration-300"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between ml-1">
                            <Label htmlFor="password" className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                Senha
                            </Label>
                        </div>
                        <div className="relative group/pass">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="h-14 rounded-2xl border-white/[0.05] bg-white/[0.01] px-5 pr-12 text-white placeholder:text-gray-700 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/30 transition-all duration-300"
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors hover:text-amber-400"
                            >
                                <EyeOff className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <Button className="group h-14 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-600 bg-[length:200%_auto] text-base font-bold text-white shadow-xl shadow-amber-900/20 transition-all duration-500 hover:bg-[100%_center] hover:scale-[1.01] hover:shadow-amber-600/30 active:scale-[0.99]">
                        Entrar na Plataforma <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-gray-500 transition-colors hover:text-amber-400"
                    >
                        Esqueceu sua senha?
                    </Link>
                </div>

                <div className="mt-10 flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.05]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">ou</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/[0.05]"></div>
                </div>

                <div className="mt-10 text-center text-sm text-gray-500">
                    Ainda não possui conta?{" "}
                    <Link href="/register" className="font-bold text-gray-300 transition-all hover:text-amber-400">
                        Começar agora
                    </Link>
                </div>
            </div>

            {/* Footer Copyright */}
            <footer className="mt-16 text-center text-[10px] text-gray-700 uppercase tracking-[0.3em]">
                Nexus | <span className="text-amber-900/50">Secretar.ia</span> • © 2026
            </footer>
        </div>
    )
}
