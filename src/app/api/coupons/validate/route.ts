import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { code, planId } = await req.json();

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon || !coupon.active) {
            return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 400 });
        }

        if (coupon.maxUses !== -1 && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ valid: false, error: "Coupon usage limit reached" }, { status: 400 });
        }

        // Check plan validity if planId is provided
        if (planId && coupon.validPlan && coupon.validPlan !== "ALL" && coupon.validPlan !== planId) {
            return NextResponse.json({ valid: false, error: `This coupon is only valid for the ${coupon.validPlan} plan.` }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            percent: coupon.percent,
            code: coupon.code
        });

    } catch (error) {
        console.error("Coupon Validation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
