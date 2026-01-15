"use client";

import { useState, useCallback, useEffect } from "react";
import { CalendarGrid } from "./calendar-grid";
import { AppointmentModal } from "./appointment-modal";
import { AppointmentDetailsModal } from "./appointment-details-modal";
import { CancellationModal } from "./cancellation-modal";
import { PaymentModal } from "./payment-modal";
import { ResourceManager } from "./resource-manager";
import { AvailabilitySettings } from "./availability-settings";
import {
    updateAppointmentStatus,
    deleteAppointment,
    createSimpleAppointment,
    getAppointments
} from "@/app/actions/agenda";
// Toast fallback since sonner is not available
const toast = {
    success: (msg: string) => console.log("SUCCESS:", msg),
    error: (msg: string) => console.error("ERROR:", msg),
};

// Stubs for remaining missing components
const HolidayManager = ({ open, onClose }: any) => null;
const BlockDetailsModal = ({ open, onClose }: any) => null;
const AttendanceModal = ({ open, onClose }: any) => null;

interface AgendaClientProps {
    initialProfessionals: any[];
    initialResources: any[];
    initialAppointments: any[];
}

export function AgendaClient({ initialProfessionals, initialResources, initialAppointments }: AgendaClientProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [professionals] = useState(initialProfessionals);
    const [resources] = useState(initialResources);

    const [selectedProfessional, setSelectedProfessional] = useState("");
    const [selectedResource, setSelectedResource] = useState("");

    const [currentView, setCurrentView] = useState<{ date: Date; view: 'day' | 'week' | 'month' }>({
        date: new Date(),
        view: 'week'
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [resourceManagerOpen, setResourceManagerOpen] = useState(false);
    const [availabilityOpen, setAvailabilityOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

    const handleAction = async (action: string, appointment: any) => {
        setSelectedAppointment(appointment);
        if (action === 'cancel') {
            setCancelModalOpen(true);
        } else if (action === 'payment') {
            setPaymentModalOpen(true);
        } else if (action === 'confirm') {
            try {
                const updated = await updateAppointmentStatus(appointment.id, 'CONFIRMED');
                setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
                toast.success("Presença confirmada!");
                setDetailsModalOpen(false);
            } catch (error) {
                toast.error("Erro ao confirmar presença");
            }
        }
    };

    const handleReschedule = () => {
        if (!selectedAppointment) return;
        setCancelModalOpen(false);
        setDetailsModalOpen(false);
        setSelectedDate(new Date(selectedAppointment.startTime));
        setModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedAppointment) return;
        try {
            const updated = await updateAppointmentStatus(selectedAppointment.id, 'CANCELLED');
            setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
            toast.success("Agendamento cancelado");
            setCancelModalOpen(false);
            setDetailsModalOpen(false);
        } catch (error) {
            toast.error("Erro ao cancelar agendamento");
        }
    };

    const handleDelete = async () => {
        if (!selectedAppointment) return;
        try {
            await deleteAppointment(selectedAppointment.id);
            setAppointments(prev => prev.filter(a => a.id !== selectedAppointment.id));
            toast.success("Agendamento excluído");
            setCancelModalOpen(false);
            setDetailsModalOpen(false);
        } catch (error) {
            toast.error("Erro ao excluir agendamento");
        }
    };

    // Refresh data when view changes
    useEffect(() => {
        const refreshData = async () => {
            let start, end;
            if (currentView.view === 'week') {
                const s = new Date(currentView.date);
                s.setDate(s.getDate() - s.getDay());
                s.setHours(0, 0, 0, 0);
                start = s;
                const e = new Date(s);
                e.setDate(s.getDate() + 6);
                e.setHours(23, 59, 59, 999);
                end = e;
            } else {
                // Simplified for now
                start = new Date(currentView.date);
                start.setHours(0, 0, 0, 0);
                end = new Date(currentView.date);
                end.setHours(23, 59, 59, 999);
            }

            const newApts = await getAppointments({
                startDate: start,
                endDate: end,
                profileId: selectedProfessional || undefined
            });
            setAppointments(JSON.parse(JSON.stringify(newApts)));
        };
        refreshData();
    }, [currentView, selectedProfessional]);

    return (
        <>
            <CalendarGrid
                professionals={professionals}
                resources={resources}
                appointments={appointments}
                holidays={[]}
                availability={[]}
                selectedProfessional={selectedProfessional}
                onSelectProfessional={setSelectedProfessional}
                selectedResource={selectedResource}
                onSelectResource={setSelectedResource}
                onNewAppointment={useCallback((date?: Date) => {
                    setSelectedDate(date);
                    setModalOpen(true);
                }, [])}
                onSelectAppointment={useCallback((appointment: any) => {
                    setSelectedAppointment(appointment);
                    setDetailsModalOpen(true);
                }, [])}
                onOpenResourceManager={() => setResourceManagerOpen(true)}
                onOpenAvailability={() => setAvailabilityOpen(true)}
                onOpenHolidays={() => { }}
                onAction={handleAction}
                onMoveAppointment={() => { }}
                onViewChange={useCallback((date: Date, view: 'day' | 'week' | 'month') => {
                    setCurrentView({ date, view });
                }, [])}
                showHolidays={true}
                onToggleHolidays={() => { }}
                onBlockedSlotClick={() => { }}
            />

            <AppointmentModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                professionals={professionals}
                onSave={(newApt) => {
                    // If it's an update, replace; if new, add
                    setAppointments(prev => {
                        const exists = prev.find(a => a.id === newApt.id);
                        if (exists) {
                            return prev.map(a => a.id === newApt.id ? newApt : a);
                        }
                        return [...prev, newApt];
                    });
                    setModalOpen(false);
                }}
                initialDate={selectedDate}
                appointment={selectedAppointment}
            />

            <AppointmentDetailsModal
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                appointment={selectedAppointment}
                onAction={handleAction}
                onEdit={(apt) => {
                    setSelectedAppointment(apt);
                    setDetailsModalOpen(false);
                    setModalOpen(true);
                }}
            />

            <CancellationModal
                open={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onConfirmCancel={handleConfirmCancel}
                onReschedule={handleReschedule}
                onDelete={handleDelete}
            />

            <PaymentModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                appointment={selectedAppointment}
                onSuccess={() => {
                    if (selectedAppointment) {
                        setAppointments(prev => prev.map(a =>
                            a.id === selectedAppointment.id ? { ...a, status: 'COMPLETED' } : a
                        ));
                        toast.success("Pagamento registrado com sucesso!");
                    }
                }}
            />

            <ResourceManager
                open={resourceManagerOpen}
                onClose={() => setResourceManagerOpen(false)}
            />

            <AvailabilitySettings
                open={availabilityOpen}
                onClose={() => setAvailabilityOpen(false)}
                professionals={professionals}
            />
        </>
    );
}
