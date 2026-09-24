import { prisma } from "@/lib/prisma";

export const PLAN_DAYS = 30;
export const addPlanMonth = (from: Date) => new Date(from.getTime() + PLAN_DAYS * 86400000);

// Expire active plans past their month. Legacy promo users (no planExpiresAt) count from couponUsedAt.
// Users with neither date are left alone. ponytail: lazy check on login/search, no cron; add a cron if you need emails/charges at expiry.
export async function expirePlanIfDue(userId: string) {
    const now = new Date();
    await prisma.user.updateMany({
        where: {
            id: userId,
            role: { not: "ADMIN" },
            subscriptionStatus: "active",
            OR: [
                { planExpiresAt: { lt: now } },
                { planExpiresAt: null, couponUsedAt: { lt: new Date(now.getTime() - PLAN_DAYS * 86400000) } },
            ],
        },
        data: { subscriptionStatus: "expired", planType: "basic", plan: "FREE", leadsBalance: 0 },
    });
}
