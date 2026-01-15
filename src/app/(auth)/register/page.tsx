import Link from "next/link"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bot, Sparkles } from "lucide-react"

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="absolute top-8 left-8 flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Lumina</span>
            </div>

            <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Teste Grátis
                        </span>
                    </div>
                    <CardTitle className="text-2xl">Criar Conta</CardTitle>
                    <CardDescription>
                        Experimente a automação premium para seu negócio.
                    </CardDescription>
                </CardHeader>
                <form action={signup}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <Input id="email" name="email" type="email" placeholder="voce@empresa.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full bg-primary hover:bg-primary/90">Começar Agora</Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                Entrar
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
