import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { searchBusinesses } from '@/lib/serpapi';

export async function GET(req: NextRequest) {
    // 1. Check Authentication.
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const startStr = searchParams.get('start');
    const start = startStr ? parseInt(startStr, 10) : 0;

    // Allow search if at least one parameter is provided
    if (!query && !location) {
        return NextResponse.json({ error: 'At least a query or location is required' }, { status: 400 });
    }

    // 2. Check Subscription Logic
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Determine if user has unlimited searches
    const isUnlimited =
        user.role === 'ADMIN' ||
        (user.planType === 'pro' && user.subscriptionStatus === 'active'); // 'pro' corresponds to Agency plan in activate route

    // If not unlimited, check and consume balance
    if (!isUnlimited) {
        if (user.leadsBalance < 1) {
            return NextResponse.json({
                error: isSubscriptionActive(user) ? 'Monthly limit reached. Upgrade to Agency for unlimited.' : 'Trial expired. Please upgrade to continue searching.',
                code: 'LIMIT_REACHED'
            }, { status: 403 });
        }

        // Decrement balance
        await prisma.user.update({
            where: { id: user.id },
            data: { leadsBalance: { decrement: 1 } }
        });
    }

    // Helper for error message context
    function isSubscriptionActive(u: any) {
        return u.subscriptionStatus === 'active';
    }

    try {
        const effectiveQuery = query || "Local Businesses";
        const { results: rawResults, nextStart } = await searchBusinesses(effectiveQuery, location || "", start);

        const processedResults = rawResults.map((biz: any) => {
            const hasWebsite = !!biz.website;
            const initialStatus = hasWebsite ? 'PENDING' : 'NO_WEBSITE';

            return {
                id: biz.place_id_search || biz.place_id,
                name: biz.title,
                category: biz.type,
                address: biz.address,
                phone: biz.phone,
                email: null,
                website: biz.website,
                mapsUrl: biz.link,
                rating: biz.rating,
                reviews: biz.reviews,
                price: biz.price,
                hours: biz.operating_hours?.today || biz.hours,
                description: biz.description,
                websiteStatus: initialStatus,
                socials: biz.socials || {},
            };
        });

        return NextResponse.json({
            results: processedResults,
            nextStart,
            // Send remaining balance to frontend for update
            remainingBalance: !isUnlimited ? Math.max(0, user.leadsBalance - 1) : undefined
        });
    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch results' }, { status: 500 });
    }
}
