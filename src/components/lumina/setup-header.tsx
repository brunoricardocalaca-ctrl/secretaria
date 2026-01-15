"use client";

import { User, Eye, X, Phone, LayoutGrid, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { SetupSummary } from "./setup-summary";

export function SetupHeader({ userName, userEmail, tenant }: { userName?: string, userEmail: string, tenant?: any }) {
    const configs = tenant?.configs as any || {};
    const services = tenant?.services || [];

    return (
        <header className="bg-[#1c1c1c] border-b border-[#2a2a2a]">
            <div className="container max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">S</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    secretar<span className="text-purple-400">.ia</span>
                                </h1>
                                <p className="text-xs text-gray-500">Sua assistente inteligente</p>
                            </div>
                        </div>

                        {/* Summary Trigger (Only if there is data) */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-white rounded-full">
                                    <Eye className="w-4 h-4" />
                                    Ver Resumo
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-[#0A0A0A] border-l border-[#1F1F1F] text-white overflow-y-auto w-full md:max-w-md p-0">
                                <SheetHeader className="p-6 border-b border-[#1F1F1F]">
                                    <SheetTitle className="text-white text-xl font-light">Resumo do Setup</SheetTitle>
                                </SheetHeader>

                                <div className="p-6">
                                    <SetupSummary tenant={tenant} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            {userName && <p className="text-sm font-medium text-white">{userName}</p>}
                            <p className="text-xs text-gray-500">{userEmail}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
