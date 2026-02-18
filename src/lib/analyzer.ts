import axios from 'axios';

export type WebsiteStatus = 'NO_WEBSITE' | 'LOW_QUALITY' | 'GOOD';

export interface WebsiteAnalysis {
    status: WebsiteStatus;
    emails: string[];
    socials: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; tiktok?: string; youtube?: string };
}

export async function analyzeWebsite(url?: string): Promise<WebsiteAnalysis> {
    if (!url) return { status: 'NO_WEBSITE', emails: [], socials: {} };

    try {
        const startTime = Date.now();
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const duration = Date.now() - startTime;
        const html = response.data.toString();
        const lowerHtml = html.toLowerCase();

        // Heuristics for Low Quality
        const isHttps = url.startsWith('https');
        const slowLoad = duration > 3000;
        const hasViewport = lowerHtml.includes('viewport');

        let status: WebsiteStatus = 'GOOD';
        if (!isHttps || slowLoad || !hasViewport) {
            status = 'LOW_QUALITY';
        }

        // Extract Emails
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
        const emails = [...new Set((html.match(emailRegex) || []) as string[])].slice(0, 3); // Limit to unique 3

        // Extract Socials
        const socials: WebsiteAnalysis['socials'] = {};
        if (lowerHtml.includes('facebook.com')) socials.facebook = extractLink(html, 'facebook.com');
        if (lowerHtml.includes('instagram.com')) socials.instagram = extractLink(html, 'instagram.com');
        if (lowerHtml.includes('twitter.com') || lowerHtml.includes('x.com')) socials.twitter = extractLink(html, 'twitter.com') || extractLink(html, 'x.com');
        if (lowerHtml.includes('linkedin.com')) socials.linkedin = extractLink(html, 'linkedin.com');
        if (lowerHtml.includes('tiktok.com')) socials.tiktok = extractLink(html, 'tiktok.com');
        if (lowerHtml.includes('youtube.com')) socials.youtube = extractLink(html, 'youtube.com');

        return { status, emails, socials };
    } catch (error) {
        return { status: 'LOW_QUALITY', emails: [], socials: {} };
    }
}

function extractLink(html: string, domain: string): string | undefined {
    const regex = new RegExp(`href=["'](https?:\/\/(?:www\.)?${domain}[^"']+)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : undefined;
}
