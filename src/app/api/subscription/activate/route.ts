import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { planId, couponCode } = await req.json();

        // planId: 'Pro Scanner' or 'Agency'
        // Map to plan types
        let planType = 'basic';
        let leadsAmount = 75;

        if (planId === 'Agency') {
            planType = 'pro';
            leadsAmount = 999999; // Unlimited
        }

        // Validate Coupon
        let discountPercent = 0;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode }
            });

            if (coupon) {
                if (!coupon.active) {
                    return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });
                }
                if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
                    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
                }
                if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
                    return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
                }

                if (coupon.validPlan && coupon.validPlan !== "ALL" && coupon.validPlan !== planId) {
                    return NextResponse.json({ error: `Coupon only valid for ${coupon.validPlan}` }, { status: 400 });
                }

                discountPercent = coupon.percent;

                // Increment usage
                await prisma.coupon.update({
                    where: { id: coupon.id },
                    data: { usedCount: { increment: 1 } }
                });
            } else {
                return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
            }
        }

        // Simulate Payment Check (if not 100% off)
        // In real app, verify Stripe session here.
        // For now, assume payment success if endpoint hit.

        // Update User
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                subscriptionStatus: 'active',
                planType: planType,
                leadsBalance: leadsAmount,
                // Map legacy plan field too
                plan: planType === 'pro' ? 'PRO_MONTHLY_99' : 'PRO_MONTHLY_20'
            }
        });

        return NextResponse.json({ success: true, message: "Subscription activated!" });

    } catch (error) {
        console.error("Subscription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
