"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2, Loader2, Clock } from "lucide-react";
import { getAvailabilities, upsertAvailability } from "@/app/actions/resources";

interface AvailabilitySettingsProps {
    open: boolean;
    onClose: () => void;
    professionals?: any[];
}

const DAYS = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
];

export function AvailabilitySettings({ open, onClose, professionals = [] }: AvailabilitySettingsProps) {
    const [loading, setLoading] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
    const [availabilities, setAvailabilities] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadAvailabilities();
        }
    }, [open, selectedProfile]);

    const loadAvailabilities = async () => {
        setLoading(true);
        try {
            const data = await getAvailabilities(selectedProfile);

            // Initialize all days if not present
            const allDays = DAYS.map(day => {
                const existing = data.find((a: any) => a.dayOfWeek === day.value);
                return existing || {
                    dayOfWeek: day.value,
                    startTime: '09:00',
                    endTime: '18:00',
                    isWorkingDay: day.value >= 1 && day.value <= 5, // Mon-Fri default
                    pauses: []
                };
            });
            setAvailabilities(allDays);
        } finally {
            setLoading(false);
        }
    };

    const updateDay = (dayIndex: number, updates: Partial<any>) => {
        setAvailabilities(prev => prev.map((day, i) =>
            i === dayIndex ? { ...day, ...updates } : day
        ));
    };

    const addPause = (dayIndex: number) => {
        setAvailabilities(prev => prev.map((day, i) => {
            if (i === dayIndex) {
                const pauses = Array.isArray(day.pauses) ? day.pauses : [];
                return {
                    ...day,
                    pauses: [...pauses, { start: '12:00', end: '13:00' }]
                };
            }
            return day;
        }));
    };

    const removePause = (dayIndex: number, pauseIndex: number) => {
        setAvailabilities(prev => prev.map((day, i) => {
            if (i === dayIndex) {
                const pauses = Array.isArray(day.pauses) ? day.pauses : [];
                return {
                    ...day,
                    pauses: pauses.filter((_: any, pi: number) => pi !== pauseIndex)
                };
            }
            return day;
        }));
    };

    const updatePause = (dayIndex: number, pauseIndex: number, field: 'start' | 'end', value: string) => {
        setAvailabilities(prev => prev.map((day, i) => {
            if (i === dayIndex) {
                const pauses = Array.isArray(day.pauses) ? day.pauses : [];
                return {
                    ...day,
                    pauses: pauses.map((p: any, pi: number) =>
                        pi === pauseIndex ? { ...p, [field]: value } : p
                    )
                };
            }
            return day;
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            for (const day of availabilities) {
                await upsertAvailability({
                    dayOfWeek: day.dayOfWeek,
                    startTime: day.startTime,
                    endTime: day.endTime,
                    isWorkingDay: day.isWorkingDay,
                    pauses: day.pauses,
                    profileId: selectedProfile
                });
            }
            onClose();
        } catch (error) {
            alert("Erro ao salvar disponibilidade");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[#121212] border-[#1f1f1f] text-white p-0 overflow-hidden rounded-3xl shadow-2xl max-h-[90vh]">
                <div className="p-6 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-tight flex items-center gap-3">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Horários de Atendimento
                        </DialogTitle>
                    </DialogHeader>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Professional Selector */}
                    {professionals.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                Configurar para
                            </Label>
                            <div className="flex gap-2">
                                <Button
                                    variant={selectedProfile === null ? "default" : "outline"}
                                    onClick={() => setSelectedProfile(null)}
                                    className={selectedProfile === null ? "bg-purple-600" : ""}
                                >
                                    Padrão da Clínica
                                </Button>
                                {professionals.map(prof => (
                                    <Button
                                        key={prof.id}
                                        variant={selectedProfile === prof.id ? "default" : "outline"}
                                        onClick={() => setSelectedProfile(prof.id)}
                                        className={selectedProfile === prof.id ? "bg-purple-600" : ""}
                                    >
                                        {prof.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availabilities.map((day, dayIndex) => (
                                <div
                                    key={day.dayOfWeek}
                                    className={`p-4 rounded-2xl border transition-all ${day.isWorkingDay
                                            ? 'bg-[#0a0a0a] border-[#1f1f1f]'
                                            : 'bg-[#0a0a0a]/30 border-transparent opacity-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex items-center gap-3 w-40">
                                            <input
                                                type="checkbox"
                                                checked={day.isWorkingDay}
                                                onChange={(e) => updateDay(dayIndex, { isWorkingDay: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600"
                                            />
                                            <span className="text-sm font-medium">
                                                {DAYS[day.dayOfWeek].label}
                                            </span>
                                        </div>

                                        {day.isWorkingDay && (
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="time"
                                                        value={day.startTime}
                                                        onChange={(e) => updateDay(dayIndex, { startTime: e.target.value })}
                                                        className="w-32 bg-[#121212] border-[#1f1f1f]"
                                                    />
                                                    <span className="text-gray-500">até</span>
                                                    <Input
                                                        type="time"
                                                        value={day.endTime}
                                                        onChange={(e) => updateDay(dayIndex, { endTime: e.target.value })}
                                                        className="w-32 bg-[#121212] border-[#1f1f1f]"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addPause(dayIndex)}
                                                        className="text-purple-400 hover:text-purple-300"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Pausa
                                                    </Button>
                                                </div>

                                                {day.pauses && day.pauses.length > 0 && (
                                                    <div className="pl-4 space-y-2">
                                                        {day.pauses.map((pause: any, pauseIndex: number) => (
                                                            <div key={pauseIndex} className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">Pausa:</span>
                                                                <Input
                                                                    type="time"
                                                                    value={pause.start}
                                                                    onChange={(e) => updatePause(dayIndex, pauseIndex, 'start', e.target.value)}
                                                                    className="w-28 bg-[#121212] border-[#1f1f1f] text-sm"
                                                                />
                                                                <span className="text-gray-500 text-xs">até</span>
                                                                <Input
                                                                    type="time"
                                                                    value={pause.end}
                                                                    onChange={(e) => updatePause(dayIndex, pauseIndex, 'end', e.target.value)}
                                                                    className="w-28 bg-[#121212] border-[#1f1f1f] text-sm"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removePause(dayIndex, pauseIndex)}
                                                                    className="h-8 w-8 text-red-400 hover:text-red-300"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[#1f1f1f] bg-[#0a0a0a]/50 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 border-[#1f1f1f]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
