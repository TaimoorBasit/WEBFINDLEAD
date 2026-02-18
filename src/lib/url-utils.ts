/**
 * Normalizes a Google Maps URL by removing unnecessary query parameters
 * that can vary between searches (like entry=gps, authuser, etc.)
 */
export function normalizeMapsUrl(url?: string): string | null {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        // Remove common varying parameters
        const paramsToRemove = ['entry', 'authuser', 'hl', 'gl', 'short_url'];
        paramsToRemove.forEach(p => urlObj.searchParams.delete(p));

        // Remove trailing slashes and normalize to lowercase for comparison
        return urlObj.toString().replace(/\/$/, '').toLowerCase();
    } catch (e) {
        // Fallback if URL is invalid - just return lowercase and trimmed
        return url.trim().replace(/\/$/, '').toLowerCase();
    }
}
