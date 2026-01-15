import prisma from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink, Calendar, Users as UsersIcon } from "lucide-react";
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
                    <Button className="bg-white text-black hover:bg-gray-200">
                        + Novo Cliente (Manual)
                    </Button>
                </Link>
            </div>

            <div className="rounded-2xl border border-[#1F1F1F] overflow-hidden bg-[#121212]">
                <Table>
                    <TableHeader className="bg-[#1a1a1a]">
                        <TableRow className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                            <TableHead className="text-gray-400">Empresa</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Usuários</TableHead>
                            <TableHead className="text-gray-400">Criado em</TableHead>
                            <TableHead className="text-right text-gray-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    Nenhuma empresa encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]/50">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white">{tenant.name}</span>
                                        <span className="text-xs text-gray-500">/{tenant.slug}</span>
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
                                    <Link href={`/admin/tenants/${tenant.id}`}>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
