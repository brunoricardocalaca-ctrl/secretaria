"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Mail, RefreshCcw, Loader2, Shield, Trash2, LogIn, Lock, Check, X } from "lucide-react";
import {
    resendInviteAction,
    sendPasswordRecoveryAction,
    updateUserEmailAction,
    deleteUserAction,
    updateUserRoleAction,
    impersonateAction,
    resetUserPasswordAction
} from "@/app/actions/admin";
import { toast } from "sonner";

interface UserRowActionsProps {
    user: {
        id: string;
        email: string;
        role: string;
    }
}

export function UserRowActions({ user }: UserRowActionsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [openEmailDialog, setOpenEmailDialog] = useState(false);
    const [newEmail, setNewEmail] = useState(user.email);

    async function handleResendInvite() {
        setLoading('invite');
        try {
            const res = await resendInviteAction(user.email);
            if (res.error) toast.error(res.error);
            else toast.success(res.success);
        } catch {
            toast.error("Erro ao reenviar convite");
        }
        setLoading(null);
    }

    async function handleSendRecovery() {
        setLoading('recovery');
        try {
            const res = await sendPasswordRecoveryAction(user.email);
            if (res.error) toast.error(res.error);
            else toast.success(res.success);
        } catch {
            toast.error("Erro ao enviar recuperação");
        }
        setLoading(null);
    }

    async function handleResetPasswordManual() {
        if (!confirm("Resetar senha para '123mudar?'?")) return;
        setLoading('reset-manual');
        try {
            const res = await resetUserPasswordAction(user.id);
            if (res.error) toast.error(res.error);
            else toast.success(res.success);
        } catch {
            toast.error("Erro ao resetar senha");
        }
        setLoading(null);
    }

    async function handleUpdateEmail() {
        if (!newEmail || newEmail === user.email) return;
        setLoading('email');
        try {
            const res = await updateUserEmailAction(user.id, newEmail);
            if (res.error) toast.error(res.error);
            else {
                toast.success(res.success);
                setOpenEmailDialog(false);
            }
        } catch {
            toast.error("Erro ao atualizar email");
        }
        setLoading(null);
    }

    async function handleToggleRole() {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setLoading('role');
        try {
            const res = await updateUserRoleAction(user.id, newRole);
            if (res.error) toast.error(res.error);
            else toast.success("Permissão atualizada!");
        } catch {
            toast.error("Erro ao alterar permissão");
        }
        setLoading(null);
    }

    async function handleDeleteUser() {
        if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
        setLoading('delete');
        try {
            const res = await deleteUserAction(user.id);
            if (res.error) toast.error(res.error);
            else toast.success(res.success);
        } catch {
            toast.error("Erro ao excluir usuário");
        }
        setLoading(null);
    }

    async function handleImpersonate() {
        setLoading('impersonate');
        // This is a server action that redirects, so we might never finish 'loading' here if successful
        await impersonateAction(user.email);
        setLoading(null);
    }


    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121212] border-[#2a2a2a] text-gray-200">
                    <DropdownMenuLabel>Ações da Conta</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleImpersonate} disabled={!!loading}>
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Acessar como Usuário</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleResendInvite} disabled={!!loading}>
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Reenviar Convite</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendRecovery} disabled={!!loading}>
                        <Lock className="mr-2 h-4 w-4" />
                        <span>Enviar Recuperação de Senha</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenEmailDialog(true)} disabled={!!loading}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        <span>Alterar Email de Acesso</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleToggleRole} disabled={!!loading}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>{user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResetPasswordManual} disabled={!!loading}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        <span>Resetar Senha Manual (123mudar?)</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleDeleteUser} disabled={!!loading} className="text-red-400 focus:text-red-400 focus:bg-red-900/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir Usuário</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openEmailDialog} onOpenChange={setOpenEmailDialog}>
                <DialogContent className="bg-[#121212] border-[#2a2a2a] text-white">
                    <DialogHeader>
                        <DialogTitle>Alterar Email de Acesso</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Isso atualizará o email de login e contato deste usuário.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Input
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="bg-[#050505] border-[#2a2a2a] text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpenEmailDialog(false)}>Cancelar</Button>
                        <Button
                            onClick={handleUpdateEmail}
                            disabled={loading === 'email'}
                            className="bg-amber-500 text-black hover:bg-amber-600"
                        >
                            {loading === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
