import Link from "next/link"
import { resetPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
                    <CardDescription>
                        Digite seu email e enviaremos um link para resetar sua senha.
                    </CardDescription>
                </CardHeader>
                <form action={resetPassword}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full">
                            <Mail className="mr-2 h-4 w-4" /> Enviar Link
                        </Button>
                        <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
