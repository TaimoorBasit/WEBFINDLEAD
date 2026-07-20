import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, website } = await req.json();

        if (!id || !website) {
            return NextResponse.json({ error: 'ID and website are required' }, { status: 400 });
        }

        // Fetch the website HTML
        let html = "";
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            const response = await fetch(website, { 
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                html = await response.text();
            }
        } catch (fetchError) {
            console.error("Failed to fetch website for tax check:", website, fetchError);
            // We can't determine status if we can't fetch it
        }

        let newTaxStatus = "UNKNOWN";

        if (html) {
            // Regex to look for common tax registration keywords
            const lowerHtml = html.toLowerCase();
            const taxRegex = /(vat\s*number|vat\s*registration|tax\s*id|registered\s*company|company\s*registration|companies\s*house|abn|gst\s*number|employer\s*identification\s*number|ein\b)/i;
            
            if (taxRegex.test(lowerHtml)) {
                newTaxStatus = "REGISTERED";
            } else {
                newTaxStatus = "UNREGISTERED";
            }
        }

        // Update the database
        const lead = await prisma.lead.updateMany({
            where: { id, userId: session.user.id },
            data: { taxStatus: newTaxStatus },
        });

        return NextResponse.json({ id, taxStatus: newTaxStatus });
    } catch (error) {
        console.error("API check-tax Error:", error);
        return NextResponse.json({ error: 'Failed to check tax status' }, { status: 500 });
    }
}
