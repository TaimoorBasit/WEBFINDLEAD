
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMapsUrl } from "@/lib/url-utils";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { leads, userId } = await req.json();

        if (!leads || !Array.isArray(leads)) {
            return NextResponse.json({ error: "Invalid leads data" }, { status: 400 });
        }

        // In a real app, validate userId or session here
        console.log(`Syncing ${leads.length} leads for user ${userId}`);

        let savedCount = 0;

        for (const lead of leads) {
            // Skip if already exists logic (simplified from existing POST)
            const mapsUrl = normalizeMapsUrl(lead.mapsLink);

            // Check duplication
            const existing = await prisma.lead.findFirst({
                where: { OR: [{ mapsUrl: mapsUrl }, { name: lead.name }] } // loose check
            });

            if (!existing) {
                await prisma.lead.create({
                    data: {
                        name: lead.name,
                        category: lead.category,
                        website: lead.website || null,
                        websiteStatus: lead.status,
                        mapsUrl: lead.mapsLink,
                        rating: parseFloat(lead.rating) || 0,
                        reviews: parseInt(lead.reviews) || 0,
                        phone: lead.phone,
                        // address is skipped for now as maps list view doesn't always show it cleanly
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
                savedCount++;
            }
        }

        return NextResponse.json({ success: true, savedCount });
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
