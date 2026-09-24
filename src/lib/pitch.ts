import type { Business } from "@/components/ResultsTable";

// Friendly, human outreach emails. Templates (instant, free) chosen by the business's main issue.
// ponytail: 2 variants per issue picked by id hash; add more or switch to AI if variety matters.

const pick = <T,>(id: string, opts: T[]) =>
    opts[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % opts.length];

export function issueText(biz: Business) {
    if (biz.websiteStatus === "NO_WEBSITE") return "has no website";
    if (biz.websiteStatus === "LOW_QUALITY") return "has a dated/low-quality website";
    if (biz.pixels && !biz.pixels.facebook && !biz.pixels.google) return "has a good website but no ad tracking pixels (can't retarget visitors)";
    return "has a solid online presence; pitch general growth help";
}

// AI-written pitch via /api/pitch; falls back to the template on any failure.
export async function aiPitch(biz: Business, sender?: string | null, origin = "") {
    try {
        const res = await fetch("/api/pitch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ business: biz, sender }),
        });
        if (!res.ok) throw new Error();
        const { subject, body } = await res.json();
        if (!subject || !body) throw new Error();
        return { subject: String(subject), body: `${body}\n\nQuick free report on your online presence: ${origin}/audit/${biz.id}\n\nCheers,\n${sender?.trim() || "[Your Name]"}` };
    } catch {
        return buildPitch(biz, sender, origin);
    }
}

export function buildPitch(biz: Business, sender?: string | null, origin = "") {
    const name = biz.name;
    const me = sender?.trim() || "[Your Name]";
    const what = biz.category ? biz.category.toLowerCase() : "local business";
    const praise =
        biz.rating && biz.rating >= 4 && (biz.reviews ?? 0) >= 10
            ? `${biz.rating}★ from ${biz.reviews} reviews is seriously impressive — your customers clearly love you. `
            : `I came across ${name} while checking out ${what}s nearby and liked what I saw. `;
    const link = origin ? `\n\nI put together a quick free report on your online presence here: ${origin}/audit/${biz.id}` : "";
    const sign = `\n\nCheers,\n${me}`;
    const hi = `Hi ${name} team,\n\n`;

    let subject: string;
    let body: string;

    if (biz.websiteStatus === "NO_WEBSITE") {
        subject = pick(biz.id, [`Quick idea for ${name}`, `${name} — people are searching for you online`]);
        body = hi + praise +
            `One thing jumped out though: I couldn't find a website for you. That means people Googling ${what}s in your area may end up at a competitor instead.\n\n` +
            `I help local businesses get a simple, good-looking site up fast — no jargon, no big commitments. Want me to send over a free mockup so you can see what it'd look like?` + link + sign;
    } else if (biz.websiteStatus === "LOW_QUALITY") {
        subject = pick(biz.id, [`A few quick wins for ${name}'s website`, `Loved ${name} — your website could do it more justice`]);
        body = hi + praise +
            `I had a look at your website and it's not quite doing your business justice yet — it looks dated and may be slow or awkward on phones, which is where most people browse.\n\n` +
            `The good news: these are very fixable. I'd be happy to share 2–3 quick wins for free, no strings attached. Interested?` + link + sign;
    } else if (biz.pixels && !biz.pixels.facebook && !biz.pixels.google) {
        subject = `${name}: you're missing out on returning customers`;
        body = hi + praise +
            `Your website looks great! One small thing I spotted: it isn't tracking visitors with ad pixels, so you can't win back people who visited but didn't book or buy.\n\n` +
            `It's a quick setup and often pays for itself fast. Want me to walk you through it in a 10-minute chat?` + link + sign;
    } else {
        subject = `Hello from a fan of ${name}`;
        body = hi + praise +
            `Your online presence is in solid shape, and I'd love to help you get even more out of it — more reach, more bookings, more regulars.\n\n` +
            `If you're open to it, I can send a couple of ideas tailored to ${name}. No pressure at all!` + link + sign;
    }

    return { subject, body };
}
