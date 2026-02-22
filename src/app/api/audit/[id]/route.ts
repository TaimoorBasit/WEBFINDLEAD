import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    props: any
) {
    try {
        const { id } = await props.params;
        const lead = await prisma.lead.findUnique({
            where: { id: id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!lead) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Return lead data for public audit
        return NextResponse.json(lead);
    } catch (error) {
        console.error("Audit Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
