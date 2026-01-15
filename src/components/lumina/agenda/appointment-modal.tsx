"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Search,
    Plus,
    X,
    Clock,
    Calendar as CalendarIcon,
    User,
    Briefcase,
    Loader2,
    Check
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { searchLeads, searchServices, createSimpleAppointment } from "@/app/actions/agenda";

interface AppointmentModalProps {
    open: boolean;
    onClose: () => void;
    professionals: any[];
    onSave: (appointment: any) => void;
    initialDate?: Date;
    appointment?: any;
}

export function AppointmentModal({ open, onClose, professionals, onSave, initialDate, appointment: editAppointment }: AppointmentModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [selectedProfessional, setSelectedProfessional] = useState<string>("");
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [date, setDate] = useState<string>(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState<string>(initialDate ? format(initialDate, 'HH:mm') : "09:00");
    const [endTime, setEndTime] = useState<string>("");
    const [notes, setNotes] = useState("");

    // Search State
    const [leadQuery, setLeadQuery] = useState("");
    const [leadResults, setLeadResults] = useState<any[]>([]);
    const [serviceQuery, setServiceQuery] = useState("");
    const [serviceResults, setServiceResults] = useState<any[]>([]);
    const [searchingLeads, setSearchingLeads] = useState(false);
    const [searchingServices, setSearchingServices] = useState(false);

    // Initialize Professionals
    useEffect(() => {
        if (professionals && professionals.length > 0 && !selectedProfessional) {
            setSelectedProfessional(professionals[0].id);
        }
    }, [professionals, selectedProfessional]);

    // Initialize from initialDate/appointment
    useEffect(() => {
        if (open) {
            if (editAppointment) {
                setSelectedLead(editAppointment.lead);
                setSelectedProfessional(editAppointment.profileId);
                setSelectedServices(editAppointment.services?.map((s: any) => ({
                    ...s.service,
                    price: s.price,
                    durationMin: s.duration
                })) || []);
                setDate(format(new Date(editAppointment.startTime), 'yyyy-MM-dd'));
                setStartTime(format(new Date(editAppointment.startTime), 'HH:mm'));
                setEndTime(format(new Date(editAppointment.endTime), 'HH:mm'));
                setNotes(editAppointment.notes || "");
            } else if (initialDate) {
                setDate(format(initialDate, 'yyyy-MM-dd'));
                setStartTime(format(initialDate, 'HH:mm'));

                const end = new Date(initialDate);
                end.setHours(end.getHours() + 1);
                setEndTime(format(end, 'HH:mm'));

                // Reset other fields
                setSelectedLead(null);
                setSelectedServices([]);
                setNotes("");
            }
        }
    }, [open, initialDate, editAppointment]);

    const handleLeadSearch = useCallback(async (q: string) => {
        setLeadQuery(q);
        if (q.length < 2) {
            setLeadResults([]);
            return;
        }
        setSearchingLeads(true);
        try {
            const results = await searchLeads(q);
            setLeadResults(results);
        } finally {
            setSearchingLeads(false);
        }
    }, []);

    const handleServiceSearch = useCallback(async (q: string) => {
        setServiceQuery(q);
        if (q.length < 2) {
            setServiceResults([]);
            return;
        }
        setSearchingServices(true);
        try {
            const results = await searchServices(q);
            setServiceResults(results);
        } finally {
            setSearchingServices(false);
        }
    }, []);

    const toggleService = (service: any) => {
        if (selectedServices.find(s => s.id === service.id)) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else {
            setSelectedServices([...selectedServices, service]);
            // Auto-update end time based on total duration
            const totalDuration = [...selectedServices, service].reduce((acc, s) => acc + (s.durationMin || 60), 0);
            if (startTime) {
                const [h, m] = startTime.split(':').map(Number);
                const end = new Date();
                end.setHours(h, m + totalDuration);
                setEndTime(format(end, 'HH:mm'));
            }
        }
        setServiceQuery("");
        setServiceResults([]);
    };

    const handleSave = async () => {
        if (!selectedLead || !selectedProfessional || selectedServices.length === 0 || !date || !startTime || !endTime) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            const data = {
                id: editAppointment?.id,
                date,
                startTime,
                endTime,
                leadId: selectedLead.id,
                profileId: selectedProfessional,
                notes,
                services: selectedServices.map(s => ({
                    serviceId: s.id,
                    price: Number(s.price || 0),
                    duration: Number(s.durationMin || 60)
                }))
            };

            const savedAppointment = await createSimpleAppointment(data);
            onSave(savedAppointment);
            onClose();
            // Reset form
            setSelectedLead(null);
            setSelectedServices([]);
            setNotes("");
        } catch (error: any) {
            alert("Erro ao criar agendamento: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#121212] border-[#1f1f1f] text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                <div className="p-6 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-tight flex items-center gap-3">
                            <Plus className="w-5 h-5 text-purple-400" />
                            Novo Agendamento
                        </DialogTitle>
                    </DialogHeader>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1f1f1f]">
                    {/* Customer Selection */}
                    <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                            <User className="w-4 h-4" /> Cliente *
                        </Label>
                        {selectedLead ? (
                            <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl animate-in zoom-in-95 duration-200">
                                <div className="flex flex-col">
                                    <span className="font-bold text-purple-100">{selectedLead.name || 'Sem nome'}</span>
                                    <span className="text-xs text-purple-400/70">{selectedLead.whatsapp}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedLead(null)} className="text-gray-500 hover:text-red-400">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input
                                    placeholder="Buscar por nome ou WhatsApp..."
                                    value={leadQuery}
                                    onChange={(e) => handleLeadSearch(e.target.value)}
                                    className="pl-11 h-14 bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl"
                                />
                                {searchingLeads && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                    </div>
                                )}
                                {leadResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        {leadResults.map(lead => (
                                            <div
                                                key={lead.id}
                                                onClick={() => { setSelectedLead(lead); setLeadResults([]); setLeadQuery(""); }}
                                                className="p-4 hover:bg-purple-500/10 cursor-pointer flex flex-col border-b border-[#2a2a2a] last:border-0"
                                            >
                                                <span className="font-medium text-white">{lead.name || 'Sem nome'}</span>
                                                <span className="text-xs text-gray-500">{lead.whatsapp}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Professional & Services */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Profissional *
                            </Label>
                            <select
                                value={selectedProfessional}
                                onChange={(e) => setSelectedProfessional(e.target.value)}
                                className="w-full h-14 px-4 bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl text-white appearance-none cursor-pointer outline-none"
                            >
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Serviços *
                            </Label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <Input
                                    placeholder="Adicionar serviço..."
                                    value={serviceQuery}
                                    onChange={(e) => handleServiceSearch(e.target.value)}
                                    className="pl-11 h-14 bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl"
                                />
                                {serviceResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        {serviceResults.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => toggleService(s)}
                                                className="p-4 hover:bg-purple-500/10 cursor-pointer flex items-center justify-between border-b border-[#2a2a2a] last:border-0"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{s.name}</span>
                                                    <span className="text-xs text-gray-500">{s.durationMin} min • R$ {Number(s.price).toFixed(2)}</span>
                                                </div>
                                                <Plus className="w-4 h-4 text-purple-400" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedServices.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2 transition-all">
                                    {selectedServices.map(s => (
                                        <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs font-medium text-purple-300">
                                            {s.name}
                                            <button onClick={() => toggleService(s)} className="p-0.5 hover:text-white transition-colors cursor-pointer">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DateTime Section */}
                    <div className="pt-6 border-t border-[#1f1f1f] space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4" /> Data *
                                </Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-14 bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl text-white"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Início *
                                </Label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="h-14 bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl text-white"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Término *
                                </Label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="h-14 bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2">
                            Observações
                        </Label>
                        <Textarea
                            placeholder="Informações adicionais para este atendimento..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-[#0a0a0a] border-transparent focus:border-purple-500/50 rounded-2xl min-h-[100px] resize-none"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[#1f1f1f] bg-[#0a0a0a]/50 flex gap-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-14 bg-transparent border-[#1f1f1f] text-gray-400 hover:bg-[#1f1f1f] hover:text-white rounded-2xl"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold shadow-xl shadow-purple-900/20"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Agendar Horário"
                        )}
                    </Button>
                </div>
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
