import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { normalizeMapsUrl } from '@/lib/url-utils';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const leads = await prisma.lead.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(leads);
    } catch (error) {
        console.error("API GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { leadsBalance: true, role: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Note: Balance check removed as we now charge per SEARCH. Saving is free for found items.
    // if (user.role !== 'ADMIN' && user.leadsBalance < 1) ...

    try {
        const body = await req.json();
        const outputMapsUrl = normalizeMapsUrl(body.mapsUrl);
        const placeId = body.placeId || body.id;

        console.log("Processing lead:", body.name, { placeId, mapsUrl: outputMapsUrl, user: session.user.email });

        // Check for existing lead by placeId FOR THIS USER
        if (placeId) {
            const existingLead = await prisma.lead.findFirst({
                where: { placeId: placeId, userId: session.user.id }
            });
            if (existingLead) {
                console.log("Lead already exists (placeId match):", body.name);
                return NextResponse.json(existingLead);
            }
        }

        // Deduct 1 lead
        // Decrement removed. We charge on SEARCH now.

        const rating = body.rating ? parseFloat(body.rating) : null;
        const reviews = body.reviews ? parseInt(body.reviews) : null;

        const lead = await prisma.lead.create({
            data: {
                userId: session.user.id,
                name: body.name,
                category: body.category,
                address: body.address,
                phone: body.phone,
                email: body.email,
                website: body.website,
                websiteStatus: body.websiteStatus || "NO_WEBSITE",
                placeId: placeId,
                mapsUrl: outputMapsUrl,
                rating: rating,
                reviews: reviews,
                socials: body.socials ? JSON.stringify(body.socials) : null,
                notes: body.notes,
            },
        });

        return NextResponse.json({ ...lead, remainingBalance: user.leadsBalance - 1 });
    } catch (error: unknown) {
        const err = error as { message?: string; stack?: string; code?: string };
        console.error("Save Lead Error:", err);
        return NextResponse.json({
            error: 'Failed to save lead',
            details: err.message,
            stack: err.stack,
            code: err.code
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await prisma.lead.deleteMany({ where: { id, userId: session.user.id } }); // use deleteMany to avoid error if not owner
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, ...data } = body;
        const lead = await prisma.lead.updateMany({
            where: { id, userId: session.user.id },
            data,
        });
        return NextResponse.json(lead);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
}
