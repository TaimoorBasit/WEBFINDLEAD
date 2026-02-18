import axios from 'axios';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

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

// Mock data for demonstration when API key is missing or fails
const MOCK_RESULTS: SerpApiBusiness[] = [
    {
        title: "The Golden Spoon (Demo)",
        type: "Restaurant",
        address: "123 Baker Street, London, UK",
        phone: "+44 20 7123 4567",
        website: "http://www.goldenspoon-demo.com",
        rating: 4.5,
        place_id: "mock_1",
        link: "https://maps.google.com/?q=The+Golden+Spoon"
    },
    {
        title: "City Coffee Bankers (Demo)",
        type: "Cafe",
        address: "45 Financial District, London, UK",
        phone: "+44 20 7987 6543",
        website: "https://www.citycoffee-demo.co.uk",
        rating: 4.2,
        place_id: "mock_2",
        link: "https://maps.google.com/?q=City+Coffee+Bankers"
    },
    {
        title: "Tech Solutions Ltd (Demo - No Site)",
        type: "IT Services",
        address: "789 Innovation Way, London, UK",
        phone: "+44 20 7555 1212",
        website: undefined,
        rating: 3.8,
        place_id: "mock_3",
        link: "https://maps.google.com/?q=Tech+Solutions+Ltd"
    },
    {
        title: "Elite Barber Shop (Demo)",
        type: "Barber",
        address: "12 High Street, London, UK",
        phone: "+44 20 7111 2222",
        website: "http://www.elitebarber-demo.com",
        rating: 4.8,
        place_id: "mock_4",
        link: "https://maps.google.com/?q=Elite+Barber+Shop"
    }
];

export async function searchBusinesses(query: string, location: string, start: number = 0) {
    if (!SERPAPI_KEY || SERPAPI_KEY.includes('YOUR_SERPAPI_KEY_HERE')) {
        console.warn('SerpAPI key is missing or invalid. Using MOCK data.');
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simple mock pagination
        if (start > 0) return { results: [], nextStart: undefined };
        return { results: MOCK_RESULTS, nextStart: undefined };
    }

    try {
        const finalQuery = location ? `${query} in ${location}` : query;

        const response = await axios.get('https://serpapi.com/search', {
            params: {
                engine: 'google_maps',
                q: finalQuery,
                type: 'search',
                api_key: SERPAPI_KEY,
                start: start, // Pagination offset
            },
        });

        if (!response.data.local_results) {
            console.warn('SerpAPI returned no local_results. Response:', response.data);
            if (response.data.error) throw new Error(response.data.error);
        }

        const results = response.data.local_results || [];

        // serpapi local_results usually returns 20 items. 
        // If we got results, assume there might be a next page.
        // Google Maps pagination via SerpAPI typically increments by 20.
        const nextStart = results.length > 0 ? start + 20 : undefined;

        // Check if serpapi response has 'serpapi_pagination' to be sure
        const hasNextPage = response.data.serpapi_pagination?.next;

        return {
            results,
            nextStart: hasNextPage ? nextStart : undefined
        };

    } catch (error) {
        console.error('Error fetching from SerpAPI, falling back to MOCK data:', error);
        return { results: MOCK_RESULTS, nextStart: undefined };
    }
}
