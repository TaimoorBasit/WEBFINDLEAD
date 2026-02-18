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
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                subscriptionStatus: 'canceled',
                planType: 'basic', // Fallback to basic? Or keep planType 'pro' but 'canceled'? 
                // Usually canceled means benefits stop at end of period. 
                // For simplicity, we'll set status to 'canceled' and frontend can show 'Canceled'.
            }
        });

        return NextResponse.json({ success: true, message: "Subscription canceled" });

    } catch (error) {
        return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
}
