"use client";

import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { upsertService } from "@/app/actions/services";
import { Camera, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ServiceDialog({ service, onOpenChange }: { service?: any, onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        id: service?.id || "",
        name: service?.name || "",
        description: service?.description || "",
        price: service?.price?.toString() || "0",
        durationMin: service?.durationMin?.toString() || "30",
        priceHidden: service?.priceHidden || false,
        requiresEval: service?.requiresEval || false,
        imageUrl: service?.imageUrl || "",
    });

    const supabase = createClient();

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `service-images/${fileName}`;

            const { data, error } = await supabase.storage
                .from('services')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('services')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imageUrl: publicUrl });
        } catch (error: any) {
            // If bucket doesn't exist, this might fail. We should ideally create it or handle it.
            // For now, alert the user about the storage setup.
            console.error("Upload error:", error);
            alert("Erro no upload. Verifique se o bucket 'services' existe no Supabase Storage.");
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const res = await upsertService({
            ...formData,
            price: parseFloat(formData.price),
            durationMin: parseInt(formData.durationMin),
        });

        if (res.success) {
            onOpenChange(false);
        } else {
            alert("Erro ao salvar serviço: " + res.error);
        }
        setLoading(false);
    }

    return (
        <DialogContent className="bg-[#1c1c1c] border-[#2a2a2a] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{formData.id ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column: Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome do Serviço</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Corte e Barba"
                                className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detalhes para a IA passar ao cliente..."
                                className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[200px] resize-none"
                            />
                            <p className="text-xs text-gray-500">Este texto será usado pela IA para informar o cliente sobre o serviço.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Preço (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Duração (min)</Label>
                                <Input
                                    type="number"
                                    value={formData.durationMin}
                                    onChange={(e) => setFormData({ ...formData, durationMin: e.target.value })}
                                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Photo & Flags */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Foto do Serviço</Label>
                            <div className="relative group aspect-video bg-[#2a2a2a] rounded-xl border-2 border-dashed border-[#3a3a3a] flex items-center justify-center overflow-hidden">
                                {formData.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs">Clique para fazer upload</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a]">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">Preço Oculto</Label>
                                    <p className="text-[10px] text-gray-400">Não informar valor no WhatsApp</p>
                                </div>
                                <Switch
                                    checked={formData.priceHidden}
                                    onCheckedChange={(checked) => setFormData({ ...formData, priceHidden: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#2a2a2a]">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">Requer Avaliação</Label>
                                    <p className="text-[10px] text-gray-400">IA dirá que precisa avaliar antes</p>
                                </div>
                                <Switch
                                    checked={formData.requiresEval}
                                    onCheckedChange={(checked) => setFormData({ ...formData, requiresEval: checked })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                        {loading ? "Salvando..." : "Salvar Serviço"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
