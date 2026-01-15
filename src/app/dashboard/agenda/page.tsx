import { Suspense } from "react";
import { getAgendaData } from "@/app/actions/agenda";
import { AgendaClient } from "@/components/lumina/agenda/agenda-client";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
    const data = await getAgendaData();

    if (!data) return <div>Erro ao carregar agenda.</div>;

    return (
        <div className="space-y-6">
            <AgendaClient
                initialProfessionals={data.professionals}
                initialResources={data.resources}
                initialAppointments={JSON.parse(JSON.stringify(data.appointments))}
            />
        </div>
    );
}
