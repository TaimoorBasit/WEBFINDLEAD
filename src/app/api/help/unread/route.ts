import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ count: 0 });
    const count = await prisma.helpRequest.count({ where: { userId: session.user.id, userUnread: true } });
    return NextResponse.json({ count });
}
