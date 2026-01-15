"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { getResources, upsertResource, deleteResource } from "@/app/actions/resources";

interface ResourceManagerProps {
    open: boolean;
    onClose: () => void;
}

export function ResourceManager({ open, onClose }: ResourceManagerProps) {
    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: 'ROOM',
        exclusive: true,
        capacity: 1,
        description: ''
    });

    useEffect(() => {
        if (open) {
            loadResources();
        }
    }, [open]);

    const loadResources = async () => {
        setLoading(true);
        try {
            const data = await getResources();
            setResources(data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await upsertResource(formData);
            await loadResources();
            setView('list');
            resetForm();
        } catch (error) {
            alert("Erro ao salvar recurso");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (resource: any) => {
        setFormData(resource);
        setView('form');
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Deseja excluir este recurso?")) return;
        setLoading(true);
        try {
            await deleteResource(id);
            await loadResources();
        } catch (error) {
            alert("Erro ao excluir recurso");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            type: 'ROOM',
            exclusive: true,
            capacity: 1,
            description: ''
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#121212] border-[#1f1f1f] text-white p-0 overflow-hidden rounded-3xl shadow-2xl">
                <div className="p-6 border-b border-[#1f1f1f] bg-[#0a0a0a]/50 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light tracking-tight">
                            {view === 'list' ? 'Gerenciar Recursos' : (formData.id ? 'Editar Recurso' : 'Novo Recurso')}
                        </DialogTitle>
                    </DialogHeader>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {view === 'list' ? (
                        <div className="space-y-4">
                            <Button onClick={() => setView('form')} className="w-full bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Recurso
                            </Button>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {resources.map(resource => (
                                        <div key={resource.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl">
                                            <div>
                                                <div className="font-medium">{resource.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {resource.type === 'ROOM' ? 'Sala' : 'Equipamento'} •
                                                    {resource.exclusive ? ' Uso Exclusivo' : ' Compartilhado'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {resources.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            Nenhum recurso cadastrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label>Nome</Label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-[#0a0a0a] border-[#1f1f1f]"
                                        placeholder="Ex: Sala 1, Laser..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Tipo</Label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md text-white"
                                        >
                                            <option value="ROOM">Sala</option>
                                            <option value="EQUIPMENT">Equipamento</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Capacidade</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.capacity}
                                            onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                            className="bg-[#0a0a0a] border-[#1f1f1f]"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="exclusive"
                                        checked={formData.exclusive}
                                        onChange={e => setFormData({ ...formData, exclusive: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="exclusive" className="cursor-pointer">
                                        Uso Exclusivo (bloqueia durante atendimento)
                                    </Label>
                                </div>

                                <div>
                                    <Label>Descrição (Opcional)</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-[#0a0a0a] border-[#1f1f1f]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-[#1f1f1f]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setView('list'); resetForm(); }}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
