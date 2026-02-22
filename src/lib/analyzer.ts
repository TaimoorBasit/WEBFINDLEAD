import axios from 'axios';

export type WebsiteStatus = 'NO_WEBSITE' | 'LOW_QUALITY' | 'GOOD' | 'PENDING';

export interface WebsiteAnalysis {
    status: WebsiteStatus;
    emails: string[];
    socials: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; tiktok?: string; youtube?: string };
    pixels: { facebook: boolean; google: boolean; tiktok: boolean };
    ads: { facebook: boolean; google: boolean };
    hosting?: string;
    emailProvider?: string;
}

export async function analyzeWebsite(url?: string): Promise<WebsiteAnalysis> {
    if (!url) return { status: 'NO_WEBSITE', emails: [], socials: {}, pixels: { facebook: false, google: false, tiktok: false }, ads: { facebook: false, google: false } };

    try {
        const startTime = Date.now();
        const response = await axios.get(url, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            validateStatus: () => true // Allow non-200 responses for analysis
        });
        const duration = Date.now() - startTime;
        const html = response.data.toString();
        const lowerHtml = html.toLowerCase();
        const headers = response.headers;

        // Heuristics for Low Quality
        const isHttps = url.startsWith('https');
        const slowLoad = duration > 4000;
        const hasViewport = lowerHtml.includes('viewport');

        let status: WebsiteStatus = 'GOOD';
        if (!isHttps || slowLoad || !hasViewport) {
            status = 'LOW_QUALITY';
        }

        // Extract Emails
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
        const emails = [...new Set((html.match(emailRegex) || []) as string[])].slice(0, 5); // Limit to unique 5

        // Extract Socials
        const socials: WebsiteAnalysis['socials'] = {};
        if (lowerHtml.includes('facebook.com')) socials.facebook = extractLink(html, 'facebook.com');
        if (lowerHtml.includes('instagram.com')) socials.instagram = extractLink(html, 'instagram.com');
        if (lowerHtml.includes('twitter.com') || lowerHtml.includes('x.com')) socials.twitter = extractLink(html, 'twitter.com') || extractLink(html, 'x.com');
        if (lowerHtml.includes('linkedin.com')) socials.linkedin = extractLink(html, 'linkedin.com');
        if (lowerHtml.includes('tiktok.com')) socials.tiktok = extractLink(html, 'tiktok.com');
        if (lowerHtml.includes('youtube.com')) socials.youtube = extractLink(html, 'youtube.com');

        // Detect Pixels
        const pixels = {
            facebook: lowerHtml.includes('fbevents.js') || lowerHtml.includes('connect.facebook.net'),
            google: lowerHtml.includes('gtm.js') || lowerHtml.includes('analytics.js') || lowerHtml.includes('googletagmanager.com'),
            tiktok: lowerHtml.includes('ttq.instance') || lowerHtml.includes('analytics.tiktok.com')
        };

        // Detect Ads (Markers for active ads / ad platforms)
        const ads = {
            facebook: lowerHtml.includes('fb-root') && lowerHtml.includes('facebook.com/tr?'),
            google: lowerHtml.includes('adsbygoogle') || lowerHtml.includes('googlesyndication.com')
        };

        // Email Provider Detection (Simplified via markers or could use MX later)
        let emailProvider = 'Unknown';
        if (lowerHtml.includes('google-site-verification') || lowerHtml.includes('google.com/a/')) emailProvider = 'Google Workspace';
        if (lowerHtml.includes('outlook.office365.com') || lowerHtml.includes('office.com')) emailProvider = 'Microsoft 365';
        if (lowerHtml.includes('zoho.com')) emailProvider = 'Zoho Mail';

        // Hosting Detection (Basic markers)
        let hosting = 'Other';
        const serverHeader = headers['server']?.toString().toLowerCase() || '';
        if (serverHeader.includes('cloudflare')) hosting = 'Cloudflare';
        else if (serverHeader.includes('nginx')) hosting = 'Nginx (Custom)';
        else if (lowerHtml.includes('wp-content')) hosting = 'WordPress';
        else if (lowerHtml.includes('shopify.com')) hosting = 'Shopify';
        else if (lowerHtml.includes('wix.com')) hosting = 'Wix';

        return { status, emails, socials, pixels, ads, hosting, emailProvider };
    } catch (error) {
        return { status: 'LOW_QUALITY', emails: [], socials: {}, pixels: { facebook: false, google: false, tiktok: false }, ads: { facebook: false, google: false } };
    }
}

function extractLink(html: string, domain: string): string | undefined {
    const regex = new RegExp(`href=["'](https?:\/\/(?:www\.)?${domain}[^"']+)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : undefined;
}
