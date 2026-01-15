"use client";

import { PublicChat } from "@/components/lumina/public-chat";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicChatPage() {
    const params = useParams();
    const token = params.token as string;
    const [valid, setValid] = useState<boolean | null>(null);

    // Basic client-side check if token exists, real validation happens on server action
    useEffect(() => {
        if (token) setValid(true);
        else setValid(false);
    }, [token]);

    if (valid === null) return <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-gray-500">Carregando...</div>;
    if (valid === false) return <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-red-500">Link inválido.</div>;

    return (
        <div className="h-screen w-full bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-md h-[80vh] bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10">
                <PublicChat token={token} />
            </div>
        </div>
    );
}
