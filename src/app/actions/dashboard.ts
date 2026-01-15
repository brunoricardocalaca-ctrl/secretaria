"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function getTenantContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        include: { tenant: true }
    });
    if (!profile || !profile.tenant) throw new Error("Tenant not found");

    return { tenantId: profile.tenantId };
}

export async function getDashboardStats() {
    try {
        const { tenantId } = await getTenantContext();

        // 1. Total Messages Received (from Leads)
        const totalReceived = await prisma.conversation.count({
            where: {
                tenantId,
                role: 'user'
            }
        });

        // 2. Total Messages Sent by AI
        const totalSentByAI = await prisma.conversation.count({
            where: {
                tenantId,
                role: 'assistant'
            }
        });

        // 3. Unique Leads Attended by AI
        // We count leads that have at least one 'assistant' message
        const attendedLeadsCount = await prisma.conversation.groupBy({
            by: ['leadId'],
            where: {
                tenantId,
                role: 'assistant'
            }
        });
        const totalLeadsAttended = attendedLeadsCount.length;

        // 4. Calculations
        // Estimated 2.5 minutes saved per AI message
        const totalMinutesSaved = totalSentByAI * 2.5;
        const totalHoursSaved = Math.round(totalMinutesSaved / 60);

        // Estimated cost avoided (based on R$ 15.00/hour human cost)
        const avoidedCostValue = Math.round((totalHoursSaved * 15));

        return {
            totalReceived: totalReceived.toLocaleString('pt-BR'),
            totalSentByAI: totalSentByAI.toLocaleString('pt-BR'),
            totalLeadsAttended: totalLeadsAttended.toLocaleString('pt-BR'),
            totalHoursSaved: `${totalHoursSaved}h`,
            avoidedCostFormatted: avoidedCostValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        };

    } catch (e: any) {
        console.error("Dashboard Stats Error:", e);
        return {
            totalReceived: "0",
            totalSentByAI: "0",
            totalLeadsAttended: "0",
            totalHoursSaved: "0h",
            avoidedCostFormatted: "R$ 0,00",
        };
    }
}
