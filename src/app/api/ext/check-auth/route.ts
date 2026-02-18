
export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Ext Check-Auth Hit!");
    // Mock response for user subscription status using just session cookie or next-auth later if available
    // For dev MVP, we'll return a simulated "Pro" user status
    return new Response(
        JSON.stringify({
            user: {
                id: "mock_user_123",
                email: "demo@webfindlead.com",
                plan: "PRO",
                leadsRemaining: 75,
                isActive: true,
            },
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                // Allow extension to call (dev mode: *)
                "Access-Control-Allow-Origin": "*", // In prod, restrict to chrome-extension://<id>
            },
        }
    );
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
