import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendHelpReply } from "@/lib/mail";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const requests = await prisma.helpRequest.findMany({
            include: {
                user: { select: { name: true, email: true } },
                messages: { orderBy: { createdAt: "asc" } },
            },
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching help requests" }, { status: 500 });
    }
}

// Admin: reply { id, reply } or change state { id, status: "OPEN" | "CLOSED" }
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id, reply, status } = await req.json().catch(() => ({}));
    if (typeof id !== "string") {
        return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    try {
        if (typeof reply === "string" && reply.trim()) {
            const [, updated] = await prisma.$transaction([
                prisma.helpMessage.create({ data: { requestId: id, sender: "ADMIN", body: reply.trim() } }),
                prisma.helpRequest.update({
                    where: { id },
                    data: { status: "ANSWERED", userUnread: true },
                    include: { user: { select: { email: true } } },
                }),
            ]);
            if (updated.user.email) await sendHelpReply(updated.user.email, updated.subject, reply.trim());
        } else if (status === "OPEN" || status === "CLOSED") {
            await prisma.helpRequest.update({ where: { id }, data: { status } });
        } else {
            return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
        }
        return NextResponse.json({ message: "Success" });
    } catch (error) {
        return NextResponse.json({ message: "Error updating help request" }, { status: 500 });
    }
}
