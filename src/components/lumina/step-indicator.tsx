"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function StepIndicator({ currentStep, totalSteps = 4 }: { currentStep: number, totalSteps?: number }) {
    return (
        <div className="flex items-center justify-center gap-4 mb-20">
            {Array.from({ length: totalSteps }).map((_, index) => {
                const step = index + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                const content = (
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 border",
                        isActive
                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110"
                            : isCompleted
                                ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-500 cursor-pointer"
                                : "bg-transparent text-gray-600 border-[#2a2a2a]"
                    )}>
                        {isCompleted ? <Check className="w-5 h-5" /> : step}
                    </div>
                );

                return (
                    <div key={step} className="flex items-center gap-4">
                        {/* Step Circle */}
                        {isCompleted ? (
                            <Link href={`/setup/etapa-${step}`}>
                                {content}
                            </Link>
                        ) : content}

                        {/* Connector Line */}
                        {step < totalSteps && (
                            <div className={cn(
                                "w-16 h-[1px] transition-all duration-500",
                                isCompleted ? "bg-purple-600" : "bg-[#2a2a2a]"
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
