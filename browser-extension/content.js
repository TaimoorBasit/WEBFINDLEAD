
// WebFindLead Content Script - Google Maps Scraper
(function () {
    console.log("WebFindLead Scanner Injecting...");

    // Helper: Wait for a short duration
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Async Scraper Logic
    async function getVisibleLeads() {
        if (window.location.href.includes("/maps/")) {
            return await scanGoogleMaps();
        } else if (window.location.href.includes("/search")) {
            return scanGoogleSearch();
        }
        return [];
    }


    async function scanGoogleMaps() {
        const leads = [];

        // --- 1. Identify the Scrollable Feed ---
        let feed = document.querySelector('div[role="feed"]');
        if (!feed) {
            const potentialFeeds = document.querySelectorAll('div');
            for (let d of potentialFeeds) {
                if (d.querySelectorAll('div[role="article"]').length > 3) {
                    feed = d;
                    break;
                }
            }
        }

        if (feed) {
            console.log("Found feed, scrolling...", feed);
            // Try to scroll to load more results
            const MAX_SCROLLS = 5;
            for (let i = 0; i < MAX_SCROLLS; i++) {
                feed.scrollTop = feed.scrollHeight;
                await delay(800);
            }
        } else {
            console.warn("Could not find scrollable feed. Scanning visible only.");
        }

        // --- 2. Extract Data ---
        // Selector for both Maps sidebar items and "Search" map items
        const articleElements = Array.from(document.querySelectorAll('div[role="article"], div.Nv2PK, a.hfpxzc'));
        const uniquePlaces = new Map();

        articleElements.forEach(card => {
            let link = card.tagName === 'A' ? card : card.querySelector('a[href*="/maps/place/"]');
            if (!link && card.tagName !== 'A') link = card.querySelector('a');
            if (!link) return;

            const url = link.getAttribute('href');
            if (!url || !url.includes('/maps/place/')) return;

            const idMatch = url.match(/\/maps\/place\/([^/]+)\//);
            const id = idMatch ? idMatch[1] : url;

            let container = card.tagName === 'A' ? card.parentElement : card;
            if (container.getAttribute('role') !== 'article' && !container.classList.contains('Nv2PK')) {
                const parent = container.closest('div[role="article"], div.Nv2PK');
                if (parent) container = parent;
            }

            if (!uniquePlaces.has(id)) {
                uniquePlaces.set(id, { card: container, link });
            }
        });

        uniquePlaces.forEach((data) => {
            const { card, link } = data;

            // 1. Name Analysis
            let name = "";
            const ariaLabel = link.getAttribute('aria-label');
            const fontHeadline = card.querySelector('div.fontHeadlineSmall');

            if (ariaLabel) name = ariaLabel;
            else if (fontHeadline) name = fontHeadline.innerText;
            else name = link.innerText.split('\n')[0];

            // Cleanup Name
            if (name) name = name.replace(/Visited link/gi, '').trim();


            // 2. Website Detection (Improved)
            let website = null;
            const allLinks = Array.from(card.querySelectorAll('a'));

            for (const l of allLinks) {
                const href = l.getAttribute('href') || "";
                if (!href) continue;

                const text = l.innerText.toLowerCase();
                const aria = (l.getAttribute('aria-label') || "").toLowerCase();
                const dataVal = l.getAttribute('data-value');

                // Strong signals
                if (
                    text.includes("visit site") ||
                    text.includes("website") ||
                    aria.includes("website") ||
                    dataVal === "Website"
                ) {
                    website = href;
                    break;
                }

                // Heuristic: Link that is NOT google maps/search/reviews and starts with http
                if (!href.includes("google.com/") && href.startsWith("http")) {
                    // Check if it's not an internal navigation link
                    if (!href.startsWith("javascript")) website = href;
                }
            }

            // 3. Rating & Reviews
            let rating = 0;
            let reviews = 0;
            const ratingEl = card.querySelector('span[role="img"]');
            if (ratingEl && ratingEl.getAttribute('aria-label')) {
                const label = ratingEl.getAttribute('aria-label');
                const rMatch = label.match(/(\d+\.?\d*) stars/);
                const revMatch = label.match(/([\d,]+)\s+reviews/);

                if (rMatch) rating = parseFloat(rMatch[1]);
                if (revMatch) reviews = parseInt(revMatch[1].replace(/,/g, ''));
            }

            // 4. Phone
            let phone = null;
            const textContent = card.innerText;
            const phoneMatch = textContent.match(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
            if (phoneMatch) phone = phoneMatch[0];

            leads.push({
                name: name || "Unknown",
                category: "Local Business",
                rating: rating || 0,
                reviews: reviews || 0,
                website: website,
                phone: phone,
                mapsLink: link.href,
                status: !website ? 'NO_WEBSITE' : (website.startsWith('http') ? 'LOW_QUALITY' : 'GOOD')
            });
        });

        console.log(`Scanned ${leads.length} leads from Maps.`);
        return leads;
    }


    function scanGoogleSearch() {
        const leads = [];
        console.log("Scanning Google Search results...");

        // Strategy: 'VkpGBb' (Common Local Pack) + others
        let items = document.querySelectorAll('.VkpGBb, div[jscontroller="AtSb"], div.C75aDd');

        // Fallback: Broad search for local listing containers
        if (items.length < 2) {
            const potentialItems = [];
            // Look for 'Directions' buttons which are common in local listings
            document.querySelectorAll('a, div[role="button"]').forEach(btn => {
                const txt = btn.innerText.trim().toLowerCase();
                if (txt === 'directions' || txt === 'website') {
                    // Move up to find the container card
                    const container = btn.closest('div.g') || btn.closest('div.VkpGBb') || btn.parentElement.parentElement.parentElement;
                    if (container && !potentialItems.includes(container)) {
                        potentialItems.push(container);
                    }
                }
            });
            if (potentialItems.length > 0) items = potentialItems;
        }

        console.log(`Found ${items.length} potential items in search.`);

        items.forEach(item => {
            try {
                // 1. Name
                let name = "Unknown Business";
                const nameEl = item.querySelector('.dbg0pd') || item.querySelector('div[role="heading"]') || item.querySelector('.OSrXXb');
                if (nameEl) name = nameEl.textContent;
                else {
                    const boldText = item.querySelector('span.OSrXXb');
                    if (boldText) name = boldText.innerText;
                }

                // Cleanup Name
                if (name) name = name.replace(/Visited link/gi, '').trim();


                // 2. Website (Aggressive search)
                let website = null;
                const links = Array.from(item.querySelectorAll('a'));

                for (const l of links) {
                    const href = l.getAttribute('href');
                    if (!href) continue;

                    const txt = l.textContent.trim().toLowerCase();
                    const aria = (l.getAttribute('aria-label') || "").toLowerCase();

                    // Button explicitly labeled Website
                    if (txt === "website" || aria.includes("website")) {
                        website = href;
                        break;
                    }

                    // Link with globe icon (common in search results)
                    // Often has class 'A1zNzb' or is next to 'Directions'
                    if (l.querySelector('div.A1zNzb')) {
                        website = href;
                    }
                }

                // If still no website, check for the specific "Website" button structure in Local Pack
                if (!website) {
                    // Sometimes it's a grid of buttons: Directions, Website, Call
                    // Look for the 'Website' text inside any child div of an 'a' tag
                    const allDivs = item.querySelectorAll('a div');
                    for (const d of allDivs) {
                        if (d.innerText.toLowerCase() === "website") {
                            website = d.closest('a').href;
                            break;
                        }
                    }
                }


                // 3. Rating & Reviews
                let rating = 0;
                let reviews = 0;
                const ratingBlock = item.querySelector('.Y0A0hc') || item.querySelector('.rllt__details');
                if (ratingBlock) {
                    const ratingText = ratingBlock.innerText;
                    const rMatch = ratingText.match(/(\d\.\d)/);
                    if (rMatch) rating = parseFloat(rMatch[1]);

                    const revMatch = ratingText.match(/\(([\d,]+|[\d\.]+K)\)/);
                    if (revMatch) {
                        let revStr = revMatch[1].replace(/,/g, '');
                        if (revStr.includes('K')) revStr = parseFloat(revStr) * 1000;
                        reviews = parseInt(revStr) || 0;
                    }
                }

                // 4. Phone
                let phone = null;
                const text = item.innerText;
                const phoneMatch = text.match(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
                if (phoneMatch) phone = phoneMatch[0];


                leads.push({
                    name: name,
                    category: "Local Business",
                    rating: rating || 0,
                    reviews: reviews || 0,
                    website: website,
                    phone: phone,
                    status: !website ? 'NO_WEBSITE' : (website.startsWith('http') ? 'LOW_QUALITY' : 'GOOD')
                });

            } catch (e) {
                console.warn("Error parsing search item", e);
            }
        });

        return leads;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "SCAN_LEADS") {
            // Must return true to indicate async response
            getVisibleLeads().then(leads => {
                sendResponse({ leads });
            });
            return true;
        }
    });

})();
