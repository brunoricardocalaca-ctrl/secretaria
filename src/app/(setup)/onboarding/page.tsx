"use client"

import { createTenantAction } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bot, Building2 } from "lucide-react"
import { useFormState } from "react-dom"

export default function OnboardingPage() {
    const [state, formAction] = useFormState(createTenantAction, null)

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="mb-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                        <Bot className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo ao Lumina</h1>
                <p className="text-muted-foreground max-w-md">
                    Para começar, precisamos configurar o ambiente da sua empresa. Isso leva menos de 1 minuto.
                </p>
            </div>

            <Card className="w-full max-w-lg border-border/50 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Criar sua Empresa
                    </CardTitle>
                    <CardDescription>
                        Defina o nome que será usado para identificar seu negócio no sistema.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        {state?.error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {state.error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nome da Empresa / Clínica</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                placeholder="Ex: Clínica Dermatológica Silva"
                                required
                                className="text-lg py-6"
                            />
                            <p className="text-xs text-muted-foreground">
                                Seu link será: lumina.ai/
                                <span className="text-primary font-mono ml-1">clinica-dermatologica-silva</span>
                            </p>
                        </div>
                        {/* Slug hidden or editable could go here, keeping simple for now */}
                        <input type="hidden" name="slug" />
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full py-6 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]">
                            Criar Ambiente e Continuar
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="mt-8 flex gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-muted" />
                <div className="h-2 w-2 rounded-full bg-muted" />
            </div>
        </div>
    )
}
