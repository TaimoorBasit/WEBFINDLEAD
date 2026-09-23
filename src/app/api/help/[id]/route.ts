import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendAdminTicketNotice } from "@/lib/mail";

async function ownTicket(id: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    const ticket = await prisma.helpRequest.findFirst({ where: { id, userId: session.user.id } });
    if (!ticket) return { error: NextResponse.json({ message: "Not found" }, { status: 404 }) };
    return { session, ticket };
}

// User replies on their own ticket (reopens it if it was closed)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const r = await ownTicket(id);
    if (r.error) return r.error;

    const { body } = await req.json().catch(() => ({}));
    if (typeof body !== "string" || !body.trim()) {
        return NextResponse.json({ message: "Message is required" }, { status: 400 });
    }

    await prisma.$transaction([
        prisma.helpMessage.create({ data: { requestId: id, sender: "USER", body: body.trim() } }),
        prisma.helpRequest.update({ where: { id }, data: { status: "OPEN" } }),
    ]);
    await sendAdminTicketNotice(r.session!.user.email || r.session!.user.id, `Re: ${r.ticket!.subject}`, body.trim());
    return NextResponse.json({ ok: true });
}

// User closes / reopens the ticket, or marks admin replies as read
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const r = await ownTicket(id);
    if (r.error) return r.error;

    const { action } = await req.json().catch(() => ({}));
    if (action === "close") await prisma.helpRequest.update({ where: { id }, data: { status: "CLOSED", userUnread: false } });
    else if (action === "reopen") await prisma.helpRequest.update({ where: { id }, data: { status: "OPEN" } });
    else if (action === "seen") await prisma.helpRequest.update({ where: { id }, data: { userUnread: false } });
    else return NextResponse.json({ message: "Invalid action" }, { status: 400 });

    return NextResponse.json({ ok: true });
}
