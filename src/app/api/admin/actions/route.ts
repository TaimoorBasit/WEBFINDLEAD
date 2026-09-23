import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { userId, action, amount } = await req.json();

    try {
        if (action === "BLOCK") {
            await prisma.user.update({
                where: { id: userId },
                data: { isBlocked: true },
            });
        } else if (action === "UNBLOCK") {
            await prisma.user.update({
                where: { id: userId },
                data: { isBlocked: false },
            });
        } else if (action === "ADD_LEADS" || action === "SUB_LEADS") {
            const n = Math.floor(Number(amount));
            if (!Number.isFinite(n) || n <= 0) {
                return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
            }
            if (action === "ADD_LEADS") {
                await prisma.user.update({ where: { id: userId }, data: { leadsBalance: { increment: n } } });
            } else {
                // Never go below 0
                await prisma.user.updateMany({ where: { id: userId, leadsBalance: { gte: n } }, data: { leadsBalance: { decrement: n } } });
                await prisma.user.updateMany({ where: { id: userId, leadsBalance: { lt: n } }, data: { leadsBalance: 0 } });
            }
        } else if (action === "DELETE") {
            // Optional: Add safety check to prevent deleting self?
            if (userId === session.user.id) {
                return NextResponse.json({ message: "Cannot delete yourself" }, { status: 400 });
            }
            await prisma.user.delete({
                where: { id: userId }
            });
        }

        return NextResponse.json({ message: "Success" });
    } catch (error) {
        return NextResponse.json({ message: "Error updating user" }, { status: 500 });
    }
}
