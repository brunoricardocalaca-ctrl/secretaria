"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "./agenda";
import { revalidatePath } from "next/cache";

export async function getBankAccounts() {
    const { tenantId } = await getTenantContext();

    let accounts = await prisma.bankAccount.findMany({
        where: { tenantId },
        orderBy: { name: "asc" },
    });

    // Seed a default account if none exists
    if (accounts.length === 0) {
        const defaultAccount = await prisma.bankAccount.create({
            data: {
                name: "Conta Principal",
                tenantId,
            }
        });
        accounts = [defaultAccount];
    }

    return accounts;
}

export async function createTransaction(data: {
    description: string;
    amount: number;
    type?: "INCOME" | "EXPENSE";
    status?: "PAID" | "PENDING";
    bankAccountId: string;
    leadId?: string;
    appointmentId?: string;
    date?: string;
}) {
    const { tenantId } = await getTenantContext();

    try {
        const transaction = await prisma.transaction.create({
            data: {
                description: data.description,
                amount: data.amount,
                type: data.type || "INCOME",
                status: data.status || "PAID",
                bankAccountId: data.bankAccountId,
                leadId: data.leadId,
                appointmentId: data.appointmentId,
                date: data.date ? new Date(data.date) : new Date(),
                tenantId,
            }
        });

        // Update bank account balance if PAID
        if (data.status === "PAID" || !data.status) {
            await prisma.bankAccount.update({
                where: { id: data.bankAccountId },
                data: {
                    balance: {
                        [data.type === "EXPENSE" ? "decrement" : "increment"]: data.amount
                    }
                }
            });
        }

        revalidatePath("/dashboard/agenda");
        return { success: true, transaction };
    } catch (error) {
        console.error("Error creating transaction:", error);
        throw error;
    }
}
