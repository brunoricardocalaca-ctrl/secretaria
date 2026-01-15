"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarClock, Trash2, XCircle, X } from "lucide-react";

interface CancellationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirmCancel: () => void;
    onReschedule: () => void;
    onDelete: () => void;
}

export function CancellationModal({ open, onClose, onConfirmCancel, onReschedule, onDelete }: CancellationModalProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#121212] border-[#1f1f1f] text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                <div className="p-6 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-tight flex items-center gap-2 text-white">
                            Cancelar Agendamento
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium">
                            Como você deseja prosseguir com este cancelamento?
                        </DialogDescription>
                    </DialogHeader>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start h-auto py-4 px-6 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all rounded-2xl group"
                        onClick={onReschedule}
                    >
                        <CalendarClock className="mr-4 h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <div className="font-bold text-base">Reagendar Cliente</div>
                            <div className="text-xs text-gray-500">Abre novo agendamento com dados preenchidos</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start h-auto py-4 px-6 border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 transition-all rounded-2xl group"
                        onClick={onConfirmCancel}
                    >
                        <XCircle className="mr-4 h-6 w-6 text-purple-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <div className="font-bold text-base">Apenas Cancelar</div>
                            <div className="text-xs text-gray-500">Mantém na agenda com status Cancelado (Vermelho)</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start h-auto py-4 px-6 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all rounded-2xl group"
                        onClick={onDelete}
                    >
                        <Trash2 className="mr-4 h-6 w-6 text-rose-500 group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <div className="font-bold text-base">Excluir da Agenda</div>
                            <div className="text-xs text-gray-500">Remove permanentemente o registro</div>
                        </div>
                    </Button>
                </div>

                <DialogFooter className="p-6 border-t border-[#1f1f1f] bg-[#0a0a0a]/50">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-500 hover:text-white hover:bg-white/5 rounded-xl w-full"
                    >
                        Voltar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
