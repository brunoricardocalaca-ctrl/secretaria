"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Clock,
    User,
    Briefcase,
    FileText,
    X,
    Trash2,
    CheckCircle2,
    XCircle,
    Pencil,
    CreditCard,
    PlayCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppointmentDetailsModalProps {
    open: boolean;
    onClose: () => void;
    appointment: any;
    onEdit?: (appointment: any) => void;
    onAction?: (action: string, appointment: any) => void;
}

export function AppointmentDetailsModal({ open, onClose, appointment, onEdit, onAction }: AppointmentDetailsModalProps) {
    if (!appointment) return null;

    const isCanceled = appointment.status === 'CANCELLED';
    const isCompleted = appointment.status === 'COMPLETED';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#121212] border-[#1f1f1f] text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                <div className="p-6 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-tight flex items-center gap-2">
                            Detalhes do Agendamento
                        </DialogTitle>
                    </DialogHeader>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex justify-start">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                                appointment.status === 'CONFIRMED' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                    appointment.status === 'CANCELLED' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                        appointment.status === 'COMPLETED' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                            "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            )}
                        >
                            {appointment.status}
                        </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-start gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                        <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                            <User className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-white">{appointment.lead?.name || 'Cliente Sem Nome'}</span>
                            <span className="text-sm text-gray-500">{appointment.lead?.whatsapp}</span>
                        </div>
                    </div>

                    {/* DateTime & Professional */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Data
                            </span>
                            <p className="text-sm font-medium text-gray-200">
                                {format(new Date(appointment.startTime), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Horário
                            </span>
                            <p className="text-sm font-medium text-gray-200">
                                {format(new Date(appointment.startTime), "HH:mm")} - {format(new Date(appointment.endTime), "HH:mm")}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-[#1f1f1f] pt-4">
                        <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Profissional
                        </span>
                        <p className="text-sm font-medium text-gray-200">
                            {appointment.profile?.email?.split('@')[0] || 'Profissional'}
                        </p>
                    </div>

                    {/* Services */}
                    <div className="space-y-3 border-t border-[#1f1f1f] pt-4">
                        <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3" /> Serviços
                        </span>
                        <div className="space-y-2">
                            {appointment.services?.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center text-sm p-3 bg-white/[0.02] rounded-xl border border-white/[0.03]">
                                    <span className="text-gray-300">{s.service?.name}</span>
                                    <span className="font-bold text-purple-400">{formatCurrency(Number(s.price || 0))}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                        <div className="space-y-1 border-t border-[#1f1f1f] pt-4">
                            <span className="text-[10px] uppercase font-bold text-gray-600 tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Observações
                            </span>
                            <p className="text-sm text-gray-400 italic">"{appointment.notes}"</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-[#1f1f1f] bg-[#0a0a0a]/50 flex flex-wrap gap-3">
                    <div className="flex-1 flex gap-2">
                        {!isCanceled && !isCompleted && onAction && (
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-10 px-3 rounded-xl"
                                onClick={() => onAction('cancel', appointment)}
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Cancelar
                            </Button>
                        )}
                        {!isCanceled && !isCompleted && onEdit && (
                            <Button
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-white/5 h-10 px-3 rounded-xl"
                                onClick={() => onEdit(appointment)}
                            >
                                <Pencil className="w-4 h-4 mr-2" /> Editar
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {!isCanceled && !isCompleted && appointment.status !== 'CONFIRMED' && onAction && (
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 rounded-xl font-bold shadow-lg shadow-emerald-900/20"
                                onClick={() => onAction('confirm', appointment)}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
