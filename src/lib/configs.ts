import prisma from "./prisma";

/**
 * Internal utility to get system configurations WITHOUT authentication checks.
 * Use only within other server-side functions/actions.
 */
export async function getInternalSystemConfig(key: string): Promise<string> {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });
        return config?.value || "";
    } catch (error) {
        console.error(`Error fetching internal config ${key}:`, error);
        return "";
    }
}
