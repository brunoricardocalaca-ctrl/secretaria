"use client";

import { useState } from "react";
import { addUserAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function AddUserForm({ tenantId }: { tenantId: string }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setMessage(null);

        const email = formData.get("email") as string;

        if (!email) {
            setLoading(false);
            return;
        }

        const res = await addUserAction(tenantId, email);

        if (res.error) {
            setMessage({ type: 'error', text: res.error });
        } else {
            setMessage({ type: 'success', text: res.success || "Usuário convidado!" });
            const form = document.getElementById("add-user-form") as HTMLFormElement;
            if (form) form.reset();
        }
        setLoading(false);
    }

    return (
        <div className="flex flex-col gap-2">
            <form
                id="add-user-form"
                action={handleSubmit}
                className="flex w-full sm:w-auto gap-2 bg-[#0A0A0A] p-1.5 rounded-lg border border-white/10"
            >
                <Input
                    name="email"
                    type="email"
                    placeholder="Novo e-mail..."
                    className="bg-transparent border-none text-white h-8 w-full sm:w-[220px] text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-600"
                    required
                    disabled={loading}
                />
                <Button
                    size="sm"
                    type="submit"
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-600 h-8 text-black font-semibold px-4 rounded-md transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                    {loading ? "..." : "Convidar"}
                </Button>
            </form>
            {message && (
                <div className={`text-xs flex items-center gap-1.5 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {message.text}
                </div>
            )}
        </div>
    );
}
