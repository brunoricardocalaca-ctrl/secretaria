"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    CreditCard,
    Wallet,
    QrCode,
    Banknote,
    Check,
    Loader2,
    X,
    TrendingUp,
    ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { getBankAccounts, createTransaction } from "@/app/actions/finance";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    appointment: any;
    onSuccess?: () => void;
}

const paymentMethods = [
    { id: 'PIX', label: 'Pix', icon: QrCode },
    { id: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'DEBIT_CARD', label: 'Cartão de Débito', icon: CreditCard },
    { id: 'CASH', label: 'Dinheiro', icon: Banknote },
];

export function PaymentModal({ open, onClose, appointment, onSuccess }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [selectedMethod, setSelectedMethod] = useState<string>("PIX");

    const total = appointment?.services?.reduce((acc: number, s: any) => acc + Number(s.price || 0), 0) || 0;

    useEffect(() => {
        if (open) {
            const fetchAccounts = async () => {
                setFetching(true);
                try {
                    const accounts = await getBankAccounts();
                    setBankAccounts(accounts);
                    if (accounts.length > 0) setSelectedAccount(accounts[0].id);
                } finally {
                    setFetching(false);
                }
            };
            fetchAccounts();
        }
    }, [open]);

    const handlePayment = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            await createTransaction({
                description: `Pagamento: ${appointment.lead?.name} - ${appointment.services?.[0]?.service?.name || 'Serviço'}`,
                amount: total,
                type: "INCOME",
                status: "PAID",
                bankAccountId: selectedAccount,
                leadId: appointment.leadId,
                appointmentId: appointment.id
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert("Erro ao processar pagamento");
        } finally {
            setLoading(false);
        }
    };

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#121212] border-[#1f1f1f] text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                <div className="p-6 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-tight flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Receber Pagamento
                        </DialogTitle>
                    </DialogHeader>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Summary */}
                    <div className="flex flex-col items-center justify-center py-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Total a Receber</span>
                        <div className="text-4xl font-black text-emerald-400 tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                        </div>
                    </div>

                    {/* Method Selection */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Forma de Pagamento</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {paymentMethods.map(method => {
                                const Icon = method.icon;
                                const isSelected = selectedMethod === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                                            isSelected
                                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                                : "bg-[#0a0a0a] border-transparent text-gray-500 hover:border-white/10 hover:bg-white/5"
                                        )}
                                    >
                                        <Icon className={cn("w-6 h-6", isSelected ? "text-emerald-400" : "text-gray-600 transition-colors group-hover:text-gray-400")} />
                                        <span className="text-xs font-bold">{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Account Selection */}
                    <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Conta de Destino</Label>
                        {fetching ? (
                            <div className="h-14 bg-[#0a0a0a] rounded-2xl flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                            </div>
                        ) : (
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full h-14 px-4 bg-[#0a0a0a] border-transparent focus:border-emerald-500/50 rounded-2xl text-white appearance-none cursor-pointer outline-none"
                            >
                                {bankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-[#1f1f1f] bg-[#0a0a0a]/50">
                    <Button
                        onClick={handlePayment}
                        disabled={loading || !selectedAccount}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-900/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                <Check className="w-5 h-5" />
                                Confirmar Recebimento
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
