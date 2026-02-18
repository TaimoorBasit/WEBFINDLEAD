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
        const { cardNumber, expiry, cvc } = await req.json();

        // Basic validation
        if (!cardNumber || cardNumber.length < 12) {
            return NextResponse.json({ error: "Invalid Card Number" }, { status: 400 });
        }

        // Simulate save to Stripe
        const last4 = cardNumber.slice(-4);
        const brand = "Visa"; // Simulated

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                cardLast4: last4,
                cardBrand: brand
            }
        });

        return NextResponse.json({ success: true, message: "Card updated successfully" });

    } catch (error) {
        return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
    }
}
