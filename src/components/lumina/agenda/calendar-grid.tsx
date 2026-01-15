"use client";

import { useState, useCallback, useMemo } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Settings,
    Plus,
    Clock,
    Users,
    ShieldCheck,
    X,
    MoreVertical,
    Coffee
} from "lucide-react";
import {
    format,
    addDays,
    startOfWeek,
    isSameDay,
    isToday,
    addWeeks,
    subWeeks,
    eachDayOfInterval,
    endOfWeek,
    isSameMonth,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
    professionals: any[];
    resources: any[];
    appointments: any[];
    holidays: any[];
    availability: any[];
    selectedProfessional: string;
    onSelectProfessional: (id: string) => void;
    selectedResource: string;
    onSelectResource: (id: string) => void;
    onNewAppointment: (date?: Date) => void;
    onSelectAppointment: (appointment: any) => void;
    onOpenResourceManager: () => void;
    onOpenAvailability: () => void;
    onOpenHolidays: () => void;
    onAction: (action: any, appointment: any) => void;
    onMoveAppointment: (id: string, newDate: Date) => void;
    onViewChange: (date: Date, view: 'day' | 'week' | 'month') => void;
    showHolidays: boolean;
    onToggleHolidays: () => void;
    onBlockedSlotClick: (date: Date, holiday: any) => void;
}

export function CalendarGrid({
    professionals,
    resources,
    appointments,
    holidays,
    availability,
    selectedProfessional,
    onSelectProfessional,
    onNewAppointment,
    onSelectAppointment,
    onOpenResourceManager,
    onOpenAvailability,
    onOpenHolidays,
    onAction,
    onViewChange,
    showHolidays,
    onToggleHolidays,
    onBlockedSlotClick
}: CalendarGridProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [currentDate]);

    const navigate = (direction: 'prev' | 'next') => {
        let nextDate: Date;
        if (view === 'week') {
            nextDate = direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
        } else if (view === 'day') {
            nextDate = direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
        } else {
            nextDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        }
        setCurrentDate(nextDate);
        onViewChange(nextDate, view);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        onViewChange(today, view);
    };

    const getAppointmentsForDay = (date: Date) => {
        return appointments.filter(apt => isSameDay(new Date(apt.startTime || apt.date), date));
    };

    const getHolidayForDay = (date: Date) => {
        return holidays?.find(h => {
            const hDate = new Date(h.date);
            return isSameDay(hDate, date) || (h.isRecurring && hDate.getDate() === date.getDate() && hDate.getMonth() === date.getMonth());
        });
    };

    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 to 21:00

    return (
        <div className="flex flex-col h-full bg-[#0F0F0F] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a2a] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F0F]/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-4 justify-between md:justify-start w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a]">
                        <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="h-8 w-8 hover:bg-[#2a2a2a] rounded-lg">
                            <ChevronLeft className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-3 text-xs font-medium hover:bg-[#2a2a2a] rounded-lg">
                            Hoje
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="h-8 w-8 hover:bg-[#2a2a2a] rounded-lg">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-lg font-semibold text-white tracking-tight capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a] shrink-0">
                        <Button
                            variant={view === 'day' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setView('day'); onViewChange(currentDate, 'day'); }}
                            className={cn("h-8 text-xs rounded-lg transition-all", view === 'day' ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-400 hover:text-white")}
                        >
                            Dia
                        </Button>
                        <Button
                            variant={view === 'week' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setView('week'); onViewChange(currentDate, 'week'); }}
                            className={cn("h-8 text-xs rounded-lg transition-all hidden md:flex", view === 'week' ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-400 hover:text-white")}
                        >
                            Semana
                        </Button>
                        <Button
                            variant={view === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => { setView('month'); onViewChange(currentDate, 'month'); }}
                            className={cn("h-8 text-xs rounded-lg transition-all hidden md:flex", view === 'month' ? "bg-[#2a2a2a] text-white shadow-sm" : "text-gray-400 hover:text-white")}
                        >
                            Mês
                        </Button>
                    </div>

                    <div className="h-4 w-[1px] bg-[#2a2a2a] shrink-0" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenAvailability}
                        className="h-9 w-9 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl"
                        title="Horários de Atendimento"
                    >
                        <Clock className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenHolidays}
                        className="h-9 w-9 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl"
                        title="Feriados e Bloqueios"
                    >
                        <ShieldCheck className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={() => onNewAppointment()}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 h-9 shadow-lg shadow-purple-900/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo
                    </Button>
                </div>
            </div>

            {/* Calendar View Area */}
            <div className="flex-1 overflow-auto bg-[#0a0a0a] scrollbar-thin scrollbar-thumb-[#1f1f1f]">
                {view === 'week' && (
                    <div className="min-w-[800px]">
                        {/* Days Header */}
                        <div className="sticky top-0 z-20 flex bg-[#121212] border-b border-[#1f1f1f]">
                            <div className="w-20 border-r border-[#1f1f1f]" />
                            {weekDays.map((day) => (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "flex-1 py-4 text-center border-r border-[#1f1f1f] last:border-r-0",
                                        isToday(day) ? "bg-purple-500/5" : ""
                                    )}
                                >
                                    <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-1">
                                        {format(day, 'eee', { locale: ptBR })}
                                    </span>
                                    <span className={cn(
                                        "inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold",
                                        isToday(day) ? "bg-purple-600 text-white shadow-lg" : "text-gray-300"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div className="relative flex">
                            {/* Time Column */}
                            <div className="w-20 bg-[#121212]/30 border-r border-[#1f1f1f]">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 border-b border-[#1f1f1f]/50 text-[10px] font-bold text-gray-600 flex justify-center pt-2">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            {/* Days Columns */}
                            {weekDays.map((day) => {
                                const dayAppointments = getAppointmentsForDay(day);
                                const holiday = getHolidayForDay(day);

                                return (
                                    <div key={day.toString()} className="flex-1 relative border-r border-[#1f1f1f] last:border-r-0 group">
                                        {/* Background Grid Lines */}
                                        {hours.map(hour => (
                                            <div
                                                key={hour}
                                                className="h-20 border-b border-[#1f1f1f]/30 hover:bg-white/[0.02] cursor-crosshair transition-colors"
                                                onClick={() => {
                                                    const d = new Date(day);
                                                    d.setHours(hour, 0, 0, 0);
                                                    onNewAppointment(d);
                                                }}
                                            />
                                        ))}

                                        {/* Holiday Layer */}
                                        {holiday && (holiday.blocking || showHolidays) && (
                                            <div
                                                className={cn(
                                                    "absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center",
                                                    holiday.blocking ? "bg-red-950/20 backdrop-blur-[2px]" : "bg-purple-950/10"
                                                )}
                                                onClick={(e) => {
                                                    if (holiday.blocking) {
                                                        e.stopPropagation();
                                                        onBlockedSlotClick(day, holiday);
                                                    }
                                                }}
                                            >
                                                <div className={cn(
                                                    "px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest",
                                                    holiday.blocking
                                                        ? "bg-red-500/20 border-red-500/30 text-red-400"
                                                        : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                                                )}>
                                                    {holiday.name}
                                                </div>
                                            </div>
                                        )}

                                        {/* Appointments */}
                                        {dayAppointments.map(apt => {
                                            const start = new Date(apt.startTime);
                                            const end = new Date(apt.endTime);
                                            const top = (start.getHours() - 7) * 80 + (start.getMinutes() / 60) * 80;
                                            const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
                                            const height = (durationMin / 60) * 80;

                                            return (
                                                <div
                                                    key={apt.id}
                                                    className={cn(
                                                        "absolute left-1 right-1 z-20 rounded-xl border p-2 shadow-xl cursor-pointer transition-all hover:scale-[1.02] overflow-hidden group/apt",
                                                        apt.status === 'CONFIRMED' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" :
                                                            apt.status === 'CANCELLED' ? "bg-red-500/10 border-red-500/20 text-red-400 opacity-60" :
                                                                "bg-purple-600/30 border-purple-500/40 text-white"
                                                    )}
                                                    style={{ top: `${top}px`, height: `${height}px` }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectAppointment(apt);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-bold opacity-80">
                                                            {format(start, 'HH:mm')}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            {apt.status === 'SCHEDULED' && (
                                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-bold truncate mb-0.5">{apt.lead?.name || 'Cliente Sem Nome'}</p>
                                                    <p className="text-[10px] opacity-70 truncate">
                                                        {apt.services?.map((s: any) => s.service?.name).join(', ')}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Day View */}
                {view === 'day' && (
                    <div className="min-w-[600px]">
                        <div className="sticky top-0 z-20 flex bg-[#121212] border-b border-[#1f1f1f]">
                            <div className="w-20 border-r border-[#1f1f1f]" />
                            <div className={cn(
                                "flex-1 py-4 text-center",
                                isToday(currentDate) ? "bg-purple-500/5" : ""
                            )}>
                                <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-1">
                                    {format(currentDate, 'eeee', { locale: ptBR })}
                                </span>
                                <span className={cn(
                                    "inline-flex items-center justify-center w-10 h-10 rounded-full text-xl font-bold",
                                    isToday(currentDate) ? "bg-purple-600 text-white shadow-lg" : "text-gray-300"
                                )}>
                                    {format(currentDate, 'd')}
                                </span>
                            </div>
                        </div>

                        <div className="relative flex">
                            <div className="w-20 bg-[#121212]/30 border-r border-[#1f1f1f]">
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 border-b border-[#1f1f1f]/50 text-[10px] font-bold text-gray-600 flex justify-center pt-2">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 relative">
                                {hours.map(hour => (
                                    <div
                                        key={hour}
                                        className="h-20 border-b border-[#1f1f1f]/30 hover:bg-white/[0.02] cursor-crosshair transition-colors"
                                        onClick={() => {
                                            const d = new Date(currentDate);
                                            d.setHours(hour, 0, 0, 0);
                                            onNewAppointment(d);
                                        }}
                                    />
                                ))}

                                {getAppointmentsForDay(currentDate).map(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const top = (start.getHours() - 7) * 80 + (start.getMinutes() / 60) * 80;
                                    const durationMin = (end.getTime() - start.getTime()) / (1000 * 60);
                                    const height = (durationMin / 60) * 80;

                                    return (
                                        <div
                                            key={apt.id}
                                            className={cn(
                                                "absolute left-2 right-2 z-20 rounded-xl border p-3 shadow-xl cursor-pointer transition-all hover:scale-[1.01]",
                                                apt.status === 'CONFIRMED' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" :
                                                    apt.status === 'CANCELLED' ? "bg-red-500/10 border-red-500/20 text-red-400 opacity-60" :
                                                        "bg-purple-600/30 border-purple-500/40 text-white"
                                            )}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectAppointment(apt);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-bold">
                                                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-base font-bold mb-1">{apt.lead?.name || 'Cliente Sem Nome'}</p>
                                            <p className="text-xs opacity-70">
                                                {apt.services?.map((s: any) => s.service?.name).join(', ')}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Month View */}
                {view === 'month' && (
                    <div className="p-4">
                        <div className="grid grid-cols-7 gap-px bg-[#1f1f1f] rounded-2xl overflow-hidden">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="bg-[#121212] p-3 text-center">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">
                                        {day}
                                    </span>
                                </div>
                            ))}
                            {eachDayOfInterval({
                                start: startOfWeek(startOfMonth(currentDate)),
                                end: endOfWeek(endOfMonth(currentDate))
                            }).map(day => {
                                const dayAppointments = getAppointmentsForDay(day);
                                const holiday = getHolidayForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentDate);

                                return (
                                    <div
                                        key={day.toString()}
                                        className={cn(
                                            "bg-[#0a0a0a] min-h-[120px] p-2 cursor-pointer hover:bg-white/[0.02] transition-colors",
                                            !isCurrentMonth && "opacity-30",
                                            isToday(day) && "ring-2 ring-purple-500"
                                        )}
                                        onClick={() => {
                                            setCurrentDate(day);
                                            setView('day');
                                            onViewChange(day, 'day');
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn(
                                                "text-sm font-bold",
                                                isToday(day) ? "text-purple-400" : "text-gray-300"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            {dayAppointments.length > 0 && (
                                                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                                                    {dayAppointments.length}
                                                </span>
                                            )}
                                        </div>

                                        {holiday && (
                                            <div className="mb-1">
                                                <div className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                                                    holiday.blocking
                                                        ? "bg-red-500/20 text-red-400"
                                                        : "bg-purple-500/20 text-purple-400"
                                                )}>
                                                    {holiday.name.substring(0, 12)}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            {dayAppointments.slice(0, 3).map(apt => (
                                                <div
                                                    key={apt.id}
                                                    className={cn(
                                                        "text-[10px] font-medium px-2 py-1 rounded-lg truncate",
                                                        apt.status === 'CONFIRMED' ? "bg-emerald-500/20 text-emerald-300" :
                                                            apt.status === 'CANCELLED' ? "bg-red-500/10 text-red-400" :
                                                                "bg-purple-600/30 text-purple-200"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectAppointment(apt);
                                                    }}
                                                >
                                                    {format(new Date(apt.startTime), 'HH:mm')} {apt.lead?.name}
                                                </div>
                                            ))}
                                            {dayAppointments.length > 3 && (
                                                <div className="text-[9px] text-gray-500 text-center font-bold">
                                                    +{dayAppointments.length - 3} mais
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function subDays(date: Date, amount: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - amount);
    return d;
}
