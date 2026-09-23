import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendAdminTicketNotice } from "@/lib/mail";

// Create a new ticket
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { subject, message } = await req.json();
    if (typeof subject !== "string" || typeof message !== "string" || !subject.trim() || !message.trim()) {
        return NextResponse.json({ message: "Subject and message are required" }, { status: 400 });
    }

    try {
        const ticket = await prisma.helpRequest.create({
            data: { userId: session.user.id, subject: subject.trim(), message: message.trim(), status: "OPEN" },
        });
        await sendAdminTicketNotice(session.user.email || session.user.id, ticket.subject, ticket.message);
        return NextResponse.json(ticket);
    } catch (error) {
        return NextResponse.json({ message: "Error submitting help request" }, { status: 500 });
    }
}

// List the current user's tickets with their threads
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const tickets = await prisma.helpRequest.findMany({
        where: { userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(tickets);
}
