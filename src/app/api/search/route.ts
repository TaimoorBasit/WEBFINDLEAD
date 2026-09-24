import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { expirePlanIfDue } from '@/lib/plan';
import { searchBusinesses, searchManyBusinesses } from '@/lib/serpapi';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');
    const startStr = searchParams.get('start');
    const start = startStr ? parseInt(startStr, 10) : 0;
    const fetchAll = start === 0; // first search always fetches everything

    // Allow search if at least one parameter is provided
    if (!query && !location) {
        return NextResponse.json({ error: 'At least a query or location is required' }, { status: 400 });
    }

    // 2. Check Subscription Logic
    await expirePlanIfDue(session.user.id);
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        console.warn('Search API: User not found for ID:', session.user.id);
        return NextResponse.json({ error: 'User record missing' }, { status: 401 });
    }

    // Determine if user has unlimited searches
    const isUnlimited =
        user.role === 'ADMIN' ||
        (user.planType === 'pro' && user.subscriptionStatus === 'active'); // 'pro' corresponds to Agency plan in activate route

    // If not unlimited, check and consume balance
    if (!isUnlimited && start === 0) {
        if (user.leadsBalance < 1) {
            return NextResponse.json({
                error: isSubscriptionActive(user) ? 'Monthly limit reached. Upgrade to Agency for unlimited.' : 'Trial expired. Please upgrade to continue searching.',
                code: 'LIMIT_REACHED'
            }, { status: 403 });
        }

        // Decrement balance only for new searches
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
        let rawResults, nextStart;

        // Allow Deep Search for everyone if requested, as long as it's the first page (start=0)
        // or if they are unlimited.
        if (fetchAll) {
            // Fetch up to 1000 results in one go
            const many = await searchManyBusinesses(effectiveQuery, location || "", 1000);
            rawResults = many.results;
            nextStart = many.nextStart;
        } else {
            // Normal search fetches 20
            const single = await searchBusinesses(effectiveQuery, location || "", start);
            rawResults = single.results;
            nextStart = single.nextStart;
        }

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
