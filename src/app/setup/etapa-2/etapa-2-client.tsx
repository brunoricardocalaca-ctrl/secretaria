"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/lumina/step-indicator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Tags, Search, MoreHorizontal } from "lucide-react";
import { ServiceForm } from "@/components/lumina/service-form";
import { Input } from "@/components/ui/input";

export default function Etapa2Client({ initialServices }: { initialServices: any[] }) {
    const router = useRouter();
    const [services, setServices] = useState(initialServices);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [search, setSearch] = useState("");

    async function handleNext() {
        router.push("/setup/etapa-3");
    }

    function handleAddService() {
        setSelectedService(null);
        setIsEditing(true);
    }

    function handleEditService(service: any) {
        setSelectedService(service);
        setIsEditing(true);
    }

    function handleFormSuccess(updatedService: any) {
        // Atualizar lista local
        const index = services.findIndex(s => s.id === updatedService.id);
        if (index >= 0) {
            const newServices = [...services];
            newServices[index] = updatedService;
            setServices(newServices);
        } else {
            setServices([...services, updatedService]);
        }
        setIsEditing(false);
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const hasServices = services.length > 0;

    return (
        <div className="min-h-screen bg-[#0A0A0A] selection:bg-purple-500/30">
            <div className="container max-w-5xl mx-auto px-6 py-20">
                <StepIndicator currentStep={2} totalSteps={4} />

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-extralight tracking-tight text-white">
                        Menu de <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Serviços</span>
                    </h1>
                    <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
                        Cadastre o que sua empresa oferece. A IA usará essas informações para agendar e tirar dúvidas.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-8">
                    {isEditing ? (
                        <ServiceForm
                            service={selectedService}
                            onSuccess={handleFormSuccess}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            {/* Header Actions */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#121212] p-4 rounded-2xl border border-[#1F1F1F]">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        placeholder="Buscar serviços..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="bg-[#0A0A0A] border-transparent pl-10 text-white rounded-xl h-12 focus:border-purple-500/30"
                                    />
                                </div>

                                <Button
                                    onClick={handleAddService}
                                    className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-8 rounded-xl font-medium shadow-lg shadow-purple-900/20 w-full md:w-auto"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Novo Serviço
                                </Button>
                            </div>

                            {/* Services Grid */}
                            {!hasServices ? (
                                <div className="bg-[#121212] border border-[#1F1F1F] border-dashed rounded-3xl p-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-[#1F1F1F] rounded-full flex items-center justify-center mx-auto">
                                        <Tags className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-light text-white">Comece por aqui</h3>
                                        <p className="text-gray-500">Cadastre seu primeiro serviço para continuar.</p>
                                    </div>
                                    <Button
                                        onClick={handleAddService}
                                        variant="outline"
                                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 h-12 px-8 rounded-full"
                                    >
                                        Adicionar Serviço
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {filteredServices.map((service) => (
                                        <div
                                            key={service.id}
                                            onClick={() => handleEditService(service)}
                                            className="group bg-[#121212] border border-[#1F1F1F] hover:border-purple-500/30 p-5 rounded-2xl transition-all hover:bg-[#161616] cursor-pointer flex gap-4"
                                        >
                                            {service.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={service.imageUrl}
                                                    alt={service.name}
                                                    className="w-20 h-20 rounded-xl object-cover bg-[#1F1F1F]"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl bg-[#1F1F1F] flex items-center justify-center text-2xl font-bold text-gray-700 group-hover:text-purple-500/50 transition-colors">
                                                    {service.name.charAt(0)}
                                                </div>
                                            )}

                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="font-medium text-white text-lg mb-1 group-hover:text-purple-400 transition-colors">{service.name}</h4>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    {!service.priceHidden && (
                                                        <span className="font-semibold text-gray-300">
                                                            R$ {service.price?.toFixed(2)}
                                                        </span>
                                                    )}
                                                    {service.durationMin && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                                                            <span>{service.durationMin} min</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center w-10 text-gray-600 group-hover:text-white transition-colors">
                                                <MoreHorizontal />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-end pt-8 pb-20">
                                <Button
                                    onClick={handleNext}
                                    disabled={!hasServices}
                                    className="bg-white hover:bg-gray-200 text-black px-12 h-16 text-lg font-medium rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:bg-gray-800 disabled:text-gray-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                >
                                    Continuar
                                    <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
