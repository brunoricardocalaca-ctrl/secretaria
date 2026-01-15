import { listInstances } from "@/app/actions/whatsapp";
import { InstanceManager } from "@/components/lumina/instance-manager";
import { Radio } from "lucide-react";

export default async function ChannelsPage() {
    const instances = await listInstances();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                        <Radio className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Canais de Comunicação</h1>
                        <p className="text-gray-400">Gerencie suas conexões de WhatsApp</p>
                    </div>
                </div>
            </div>

            <InstanceManager initialInstances={Array.isArray(instances) ? instances : []} />
        </div>
    );
}
