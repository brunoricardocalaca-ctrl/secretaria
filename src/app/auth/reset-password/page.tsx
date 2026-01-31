"use client"

import { updatePassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import { useFormState } from "react-dom"

export default function ResetPasswordPage() {
    const [state, formAction] = useFormState(updatePassword, null)

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="absolute top-8 left-8 flex flex-col items-start leading-none group cursor-default">
                <div className="flex items-center gap-1.5 font-black text-xl tracking-tighter text-white">
                    <span>NEXUS</span>
                    <span className="text-amber-500 font-light translate-y-[-1px] text-lg">|</span>
                    <span className="text-amber-500 font-medium text-sm uppercase tracking-widest ml-1">secretar.ia</span>
                </div>
            </div>
            <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Nova Senha</CardTitle>
                    <CardDescription>
                        Digite sua nova senha abaixo.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="grid gap-4">
                        {state?.error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {state.error}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">
                            <Lock className="mr-2 h-4 w-4" /> Atualizar Senha
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
