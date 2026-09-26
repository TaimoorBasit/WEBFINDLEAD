import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const SCRAPPA_KEY = process.env.SCRAPPA_API_KEY;

export interface SerpApiBusiness {
    title: string;
    type?: string;
    address?: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviews?: number; // Count of reviews
    place_id: string;
    link: string;
    price?: string; // e.g. "$$"
    hours?: string; // e.g. "Open until 9 PM"
    description?: string;
    socials?: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string };
}

async function scrappaSearch(query: string, location: string, start: number) {
    // One call returns the whole result set (~200); the API ignores `page`, so never call again.
    if (start > 0) return { results: [], nextStart: undefined };
    const { data } = await axios.get('https://scrappa.co/api/maps/simple-search', {
        headers: { 'x-api-key': SCRAPPA_KEY },
        params: { query: location ? `${query} in ${location}` : query, gl: 'us', hl: 'en' },
        timeout: 60000,
    });
    const results = (data?.items ?? []).map((b: any) => ({
        title: b.name,
        type: b.type,
        address: b.full_address,
        phone: b.phone_numbers?.[0],
        website: b.website || undefined,
        rating: b.rating,
        reviews: b.review_count,
        price: b.price_level_text || undefined,
        description: b.short_description || undefined,
        place_id: b.place_id ?? b.business_id,
        link: `https://www.google.com/maps/place/?q=place_id:${b.place_id}`,
    }));
    return { results, nextStart: undefined };
}

async function serpApiSearch(query: string, location: string, start: number) {
    const response = await axios.get('https://serpapi.com/search', {
        params: {
            engine: 'google_maps',
            q: location ? `${query} in ${location}` : query,
            type: 'search',
            api_key: SERPAPI_KEY,
            start,
        },
    });
    if (response.data.error) {
        if (/hasn't returned any results/i.test(response.data.error)) return { results: [], nextStart: undefined };
        throw new Error(response.data.error);
    }
    return {
        results: response.data.local_results || [],
        nextStart: response.data.serpapi_pagination?.next ? start + 20 : undefined,
    };
}

// Scrappa first, SerpAPI as fallback. No fake data: failures surface as errors.
export async function searchBusinesses(query: string, location: string, start: number = 0) {
    let lastError: unknown = new Error('No search API key configured (SCRAPPA_API_KEY / SERPAPI_API_KEY)');
    if (SCRAPPA_KEY) {
        try { return await scrappaSearch(query, location, start); }
        catch (e) { console.error('Scrappa failed:', (e as any)?.response?.data || e); lastError = e; }
    }
    if (SERPAPI_KEY && !SERPAPI_KEY.includes('YOUR_SERPAPI_KEY_HERE')) {
        try { return await serpApiSearch(query, location, start); }
        catch (e) { console.error('SerpAPI failed:', e); lastError = e; }
    }
    throw new Error('Search provider failed: ' + ((lastError as any)?.response?.data?.message || (lastError as Error).message));
}

/**
 * Fetches multiple pages of results recursively or in a loop.
 * @param maxResults Desired total results (will be rounded up to nearest 20)
 */
export async function searchManyBusinesses(query: string, location: string, maxResults: number = 20) {
    const BATCH = 5; // pages fetched in parallel
    const PAGE = 20;
    let allResults: any[] = [];
    let nextStart: number | undefined = 0;

    while (allResults.length < maxResults && nextStart !== undefined) {
        const offsets = Array.from({ length: BATCH }, (_, i) => nextStart! + i * PAGE);
        const pages = await Promise.all(offsets.map((o) => searchBusinesses(query, location, o)));

        // Consume in order and stop at the first page that ends the listing
        for (const page of pages) {
            if (page.results.length === 0) { nextStart = undefined; break; }
            allResults = allResults.concat(page.results);
            nextStart = page.nextStart;
            if (nextStart === undefined || allResults.length >= maxResults) break;
        }
    }

    return {
        results: allResults.slice(0, maxResults),
        nextStart
    };
}
