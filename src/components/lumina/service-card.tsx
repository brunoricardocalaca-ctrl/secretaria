"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Need to create Badge
import { Palette, Clock, EyeOff, Edit, Trash2 } from "lucide-react";
import { deleteService } from "@/app/actions/services";
import { useState } from "react";

// Mocking Badge since it's simple
const BadgeUI = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${variant === 'outline' ? 'border border-gray-600 text-gray-400' : 'bg-green-500/20 text-green-500'
        }`}>
        {children}
    </span>
);

export function ServiceCard({ service, onEdit }: { service: any, onEdit: (s: any) => void }) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
        setLoading(true);
        await deleteService(service.id);
        setLoading(false);
    }

    return (
        <Card className="overflow-hidden border-[#2a2a2a] bg-[#1c1c1c] transition-all hover:border-[#3a3a3a]">
            <div className="aspect-video w-full bg-[#2a2a2a] relative overflow-hidden">
                {service.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={service.imageUrl} alt={service.name} className="object-cover w-full h-full" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-600">
                        <Palette className="w-8 h-8 opacity-20" />
                    </div>
                )}
                {service.priceHidden && (
                    <div className="absolute top-2 right-2">
                        <BadgeUI variant="outline">Preço Oculto</BadgeUI>
                    </div>
                )}
            </div>

            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg font-bold text-white leading-tight">{service.name}</CardTitle>
                    <div className="text-right">
                        <div className="text-green-500 font-bold">
                            {service.price ? `R$ ${parseFloat(service.price).toFixed(2)}` : "R$ 0,00"}
                        </div>
                    </div>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
                    {service.description || "Nenhuma descrição informada."}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {service.durationMin || 0} min
                    </div>
                    {service.requiresEval && (
                        <div className="flex items-center gap-1 text-yellow-500/80">
                            <EyeOff className="w-3.5 h-3.5" />
                            Avaliação Obrigatória
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 gap-2 border-t border-[#2a2a2a] mt-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#2a2a2a] hover:bg-[#2a2a2a] hover:text-white"
                    onClick={() => onEdit(service)}
                >
                    <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </CardFooter>
        </Card>
    );
}
