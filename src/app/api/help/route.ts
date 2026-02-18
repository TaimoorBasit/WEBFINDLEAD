import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { subject, message } = await req.json();

    try {
        const helpRequest = await prisma.helpRequest.create({
            data: {
                userId: session.user.id,
                subject,
                message,
                status: "OPEN",
            },
        });
        return NextResponse.json(helpRequest);
    } catch (error) {
        return NextResponse.json({ message: "Error submitting help request" }, { status: 500 });
    }
}
