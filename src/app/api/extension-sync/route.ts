
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMapsUrl } from "@/lib/url-utils";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { leads, userId } = body;

        if (!leads || !Array.isArray(leads)) {
            return NextResponse.json({ error: "Invalid leads data" }, { status: 400 });
        }

        console.log(`Syncing ${leads.length} leads for user ${userId}`);

        let savedCount = 0;

        for (const lead of leads) {
            // Basic deduplication logic
            const existing = await prisma.lead.findFirst({
                where: {
                    OR: [
                        { mapsUrl: lead.mapsLink },
                        { name: lead.name }
                    ]
                }
            });

            if (!existing) {
                await prisma.lead.create({
                    data: {
                        name: lead.name,
                        category: lead.category || "Local Business",
                        website: lead.website || null,
                        websiteStatus: lead.status,
                        mapsUrl: lead.mapsLink,

                        rating: parseFloat(lead.rating) || 0,
                        reviews: parseInt(lead.reviews) || 0,
                        phone: lead.phone || null,
                        email: null,
                        address: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                savedCount++;
            }
        }

        return NextResponse.json({ success: true, savedCount }, {
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    } catch (error: unknown) {
        console.error("Sync error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
