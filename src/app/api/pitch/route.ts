import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { issueText } from "@/lib/pitch";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ponytail: in-memory per-instance limit; use Redis/Upstash if traffic spans many serverless instances
const hits = new Map<string, number[]>();
function limited(key: string, max: number) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < 10 * 60 * 1000);
    if (recent.length >= max) return true;
    recent.push(now);
    hits.set(key, recent);
    return false;
}

const s = (v: unknown, n = 80) => (typeof v === "string" ? v.slice(0, n) : "");

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (limited(session.user.id, 30)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

    try {
        const { business: b, sender } = await req.json();
        if (!b || typeof b !== "object") return NextResponse.json({ error: "Bad request" }, { status: 400 });

        const prompt = `Write a short cold outreach email FROM a freelancer/agency person TO a local business owner.
Business: ${s(b.name)}
Category: ${s(b.category)}
Address: ${s(b.address, 120)}
Rating: ${Number(b.rating) || "n/a"} from ${Number(b.reviews) || 0} reviews
Main issue found: this business ${issueText(b)}.

Rules:
- Tone: professional but punchy, warm and a little fun, like a friendly human who genuinely wants to help. Not salesy, no jargon, no buzzwords.
- Open with something specific and genuine about THIS business (rating, category, area). Don't invent facts beyond what's given.
- Explain the issue in plain English and why it matters to them, then make ONE low-pressure ask (e.g. free mockup / 10-min chat).
- 90-130 words. Start with "Hi ${s(b.name)} team," . Do NOT include a sign-off, signature, links or placeholders; those are added separately.
- Subject: short, curiosity-driven, no spammy words, under 60 chars.
Return JSON: {"subject": string, "body": string}`;

        const ai = new GoogleGenAI({ apiKey });
        const r = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.9, maxOutputTokens: 500 },
        });
        const out = JSON.parse(r.text || "{}");
        if (!out.subject || !out.body) throw new Error("Bad AI output");
        return NextResponse.json({ subject: String(out.subject), body: String(out.body) });
    } catch (e: any) {
        console.error("Pitch API Error:", e?.message || e);
        return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }
}
