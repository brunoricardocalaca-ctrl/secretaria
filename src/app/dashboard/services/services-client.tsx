"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, MoreVertical, Briefcase, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceForm } from "@/components/lumina/service-form";
import { upsertService, deleteService } from "@/app/actions/services";
import { syncServicesToKnowledgeBase } from "@/app/actions/knowledge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ServicesClient({ initialServices }: { initialServices: any[] }) {
    const [services, setServices] = useState(initialServices);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingService, setEditingService] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const sortedServices = services.sort((a, b) => {
        if (a.active === b.active) return 0;
        return a.active ? -1 : 1;
    });

    const filteredServices = sortedServices.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleToggleActive(id: string, currentStatus: boolean) {
        const serviceToUpdate = services.find(s => s.id === id);
        if (!serviceToUpdate) return;

        const updatedData = { ...serviceToUpdate, active: !currentStatus };
        const res = await upsertService(updatedData);

        if (res.success) {
            setServices(services.map(s => s.id === id ? res.service : s));
        } else {
            alert("Erro ao alterar status: " + res.error);
        }
    }

    async function handleSync() {
        setSyncing(true);
        const res = await syncServicesToKnowledgeBase();
        setSyncing(false);

        if (res.success) {
            alert(`Sucesso! ${res.count} serviços sincronizados com o cérebro da IA.`);
        } else {
            alert("Erro na sincronização: " + res.error);
        }
    }

    function handleEdit(service: any) {
        setEditingService(service);
        setView("form");
    }

    function handleAddNew() {
        setEditingService(null);
        setView("form");
    }

    async function handleDelete() {
        if (!deletingId) return;

        await deleteService(deletingId);
        setServices(services.filter(s => s.id !== deletingId));
        setDeletingId(null);
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-amber-500" />
                        Serviços
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie os procedimentos que a IA pode oferecer.</p>
                </div>

                {view === "list" && (
                    <div className="flex items-center gap-3">
                        <Button onClick={handleAddNew} className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-6 shadow-lg shadow-amber-900/20">
                            <Plus className="w-4 h-4 mr-2" /> Novo Serviço
                        </Button>
                    </div>
                )}
            </div>

            {view === "list" ? (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Buscar serviço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1c1c1c] border-[#2a2a2a] pl-10 h-12 rounded-xl text-white focus:border-amber-500/50"
                        />
                    </div>

                    {/* List */}
                    <div className="grid gap-4">
                        {filteredServices.length === 0 ? (
                            <div className="text-center py-20 bg-[#1c1c1c] rounded-2xl border border-[#2a2a2a] border-dashed">
                                <p className="text-gray-500">Nenhum serviço encontrado.</p>
                            </div>
                        ) : (
                            filteredServices.map((service) => (
                                <div
                                    key={service.id}
                                    className={cn(
                                        "bg-[#1c1c1c] border border-[#2a2a2a] p-5 rounded-2xl flex items-center justify-between group hover:border-amber-500/20 transition-all",
                                        !service.active && "opacity-50 grayscale-[0.5]"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center overflow-hidden">
                                            {service.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Briefcase className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white text-lg">{service.name}</h3>
                                                {!service.active && (
                                                    <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 uppercase font-bold tracking-wider">
                                                        Desativado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <span>{service.durationMin} min</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                <span className="text-green-400 font-mono">
                                                    {service.price ? `R$ ${service.price.toFixed(2)}` : "A Consultar"}
                                                </span>
                                                {service.priceHidden && (
                                                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">Preço Oculto</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end gap-1 px-4 border-r border-[#2a2a2a]">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Status</span>
                                            <Switch
                                                checked={service.active}
                                                onCheckedChange={() => handleToggleActive(service.id, service.active)}
                                                className="data-[state=checked]:bg-green-600"
                                            />
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(service)} className="text-gray-400 hover:text-white hover:bg-white/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#1c1c1c] border-[#2a2a2a] text-white">
                                                    <DropdownMenuItem onClick={() => handleEdit(service)} className="hover:bg-[#2a2a2a] cursor-pointer">
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingId(service.id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/10 cursor-pointer"
                                                    >
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <ServiceForm
                    service={editingService}
                    onCancel={() => setView("list")}
                    onSuccess={(updatedService) => {
                        if (editingService) {
                            setServices(services.map(s => s.id === updatedService.id ? updatedService : s));
                        } else {
                            setServices([updatedService, ...services]);
                        }
                        setView("list");
                    }}
                />
            )}

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent className="bg-[#1c1c1c] border-[#2a2a2a] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Serviço?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Esta ação não pode ser desfeita. A IA deixará de oferecer este serviço imediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a]">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
