import prisma from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink, Calendar, Users as UsersIcon, Mail, Phone, CheckCircle2, LogIn } from "lucide-react";
import { activateTenantAction, impersonateAction } from "@/app/actions/admin";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function AdminTenantsPage() {
    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: { users: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Clientes (Tenants)</h1>
                    <p className="text-gray-400 mt-2">Gerencie todas as empresas cadastradas na plataforma.</p>
                </div>
                <Link href="/admin/tenants/new">
                    <Button className="bg-amber-500 text-black hover:bg-amber-600 font-medium">
                        + Novo Cliente (Manual)
                    </Button>
                </Link>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5 border-b border-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-gray-400 font-medium">Empresa</TableHead>
                            <TableHead className="text-gray-400 font-medium">Responsável</TableHead>
                            <TableHead className="text-gray-400 font-medium">Status</TableHead>
                            <TableHead className="text-gray-400 font-medium">Usuários</TableHead>
                            <TableHead className="text-gray-400 font-medium">Criado em</TableHead>
                            <TableHead className="text-right text-gray-400 font-medium">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.length === 0 && (
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    Nenhuma empresa encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white">{tenant.name}</span>
                                        <span className="text-xs text-gray-500">/{tenant.slug}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {tenant.ownerEmail && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Mail className="w-3 h-3" />
                                                {tenant.ownerEmail}
                                            </div>
                                        )}
                                        {tenant.ownerPhone && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <Phone className="w-3 h-3" />
                                                {tenant.ownerPhone}
                                            </div>
                                        )}
                                        {!tenant.ownerEmail && !tenant.ownerPhone && (
                                            <span className="text-xs text-gray-600 italic">Sem contato</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={`
                                            ${tenant.planStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                                            ${tenant.planStatus === 'trial' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                                            ${tenant.planStatus === 'inactive' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                        `}
                                    >
                                        {tenant.planStatus.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <UsersIcon className="w-4 h-4" />
                                        {tenant._count.users}
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {tenant.planStatus === 'trial' && (
                                            <form action={async () => {
                                                "use server";
                                                await activateTenantAction(tenant.id);
                                            }}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:text-green-300"
                                                >
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Liberar
                                                </Button>
                                            </form>
                                        )}
                                        {tenant.ownerEmail && (
                                            <form action={async () => {
                                                "use server";
                                                await impersonateAction(tenant.ownerEmail!);
                                            }}>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                                                    title="Acessar como Usuário"
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                </Button>
                                            </form>
                                        )}
                                        <Link href={`/admin/tenants/${tenant.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
