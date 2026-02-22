import { GoogleGenerativeAI } from "@google/generative-ai";
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
- Always guide users toward using the platform's features.

If users ask about finding leads: Tell them to go to "Find Leads", enter a category (e.g. "Dentist") and location (e.g. "New York").
If users ask about pricing or upgrading: Point them to the homepage or Settings > Plan & Billing.
If users ask about exporting: Tell them to go to "My Leads" and click the export button.
Do NOT answer questions unrelated to WebFindLead or general business/marketing topics.`;

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

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_PROMPT,
        });

        // Build Gemini chat history from previous messages (excluding the last user message)
        // Gemini requires history to start with a 'user' role, so we strip leading model messages
        const allPrevious = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        // Drop leading 'model' messages — Gemini only accepts history starting with 'user'
        const firstUserIdx = allPrevious.findIndex((m: { role: string }) => m.role === "user");
        const history = firstUserIdx >= 0 ? allPrevious.slice(firstUserIdx) : [];

        // Start a chat session with valid history
        const chat = model.startChat({ history });

        // Last message from user
        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const reply = result.response.text();

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("Gemini Chat API Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
