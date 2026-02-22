import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the WebFind Assistant, a helpful AI guide for the WebFindLead platform.

WebFindLead is a powerful lead generation tool designed for freelancers, agencies, and B2B professionals to find local business leads.

Key Features of WebFindLead:
1. Local Business Search — Find businesses in any category and location using Google Maps data.
2. Lead Intelligence — Identifies businesses with NO website or a low-quality one (perfect for web designers/agencies to pitch to).
3. Contact Mining — Finds emails, phone numbers, social media profiles (Facebook, Instagram, LinkedIn), and ad pixel data.
4. My Leads — Dashboard to save, organize, filter, and export leads to CSV.
5. Website Audit — Analyze any business's digital presence with a detailed scorecard.
6. Coupon Codes — Users can apply discount codes on the pricing page for plan upgrades.

Plans:
- Free Trial: 3 leads
- Pro Scanner: $20/month — 75 leads/month
- Agency: $99/month — Unlimited leads

Your Tone:
- Professional, tech-savvy, encouraging and concise.
- Keep answers short (2-4 sentences max unless asked for detail).
- Use emojis occasionally to feel approachable.
- Always guide users toward using the platform features.

If users ask about finding leads: Tell them to go to "Find Leads", enter a category (e.g. "Dentist") and location (e.g. "New York").
If users ask about pricing or upgrading: Point them to the homepage or Settings > Plan & Billing.
If users ask about exporting: Tell them to go to "My Leads" and click the export button.
Only answer questions related to WebFindLead or general business/marketing topics.`;

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API Key not configured. Please add GEMINI_API_KEY to your environment variables." },
                { status: 500 }
            );
        }

        const { messages } = await req.json();

        const ai = new GoogleGenAI({ apiKey });

        // Build conversation history for multi-turn chat
        // Gemini requires: history must start with 'user' role
        const allMessages = messages.map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        // Strip leading model messages — Gemini requires first message to be from user
        const firstUserIdx = allMessages.findIndex((m: { role: string }) => m.role === "user");
        if (firstUserIdx === -1) {
            return NextResponse.json({ error: "No user message found." }, { status: 400 });
        }

        const history = allMessages.slice(firstUserIdx, -1);
        const lastUserMessage = messages[messages.length - 1].content;

        // Create chat with history
        const chat = ai.chats.create({
            model: "gemini-2.0-flash",
            config: {
                systemInstruction: SYSTEM_PROMPT,
            },
            history,
        });

        const response = await chat.sendMessage({ message: lastUserMessage });
        const reply = response.text;

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("Gemini Chat API Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
