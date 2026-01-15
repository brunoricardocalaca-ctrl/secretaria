import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, Building } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function AdminChatDetailPage({ params }: { params: { leadId: string } }) {
    const { leadId } = await params;

    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
            tenant: true,
            conversations: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!lead) {
        return <div className="p-8 text-white">Lead não encontrado.</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-[#121212] border border-[#1F1F1F] rounded-t-2xl p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link href="/admin/chats">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" />
                            {lead.name || "Cliente sem Nome"}
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.whatsapp}
                            </span>
                            <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {lead.tenant.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#0a0a0a] border-x border-b border-[#1F1F1F] rounded-b-2xl overflow-y-auto p-4 space-y-4">
                {lead.conversations.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-600">
                        Nenhuma mensagem trocada.
                    </div>
                )}

                {lead.conversations.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full",
                                isUser ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                isUser
                                    ? "bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-sm"
                                    : "bg-[#1F1F1F] text-gray-200 border border-[#2A2A2A] rounded-tl-sm"
                            )}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <span className={cn(
                                    "text-[10px] block text-right mt-1 opacity-60",
                                    isUser ? "text-blue-300" : "text-gray-500"
                                )}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
