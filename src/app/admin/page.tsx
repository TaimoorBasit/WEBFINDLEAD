import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    // Explicitly opt-out of static generation
    await cookies();

    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return <AdminLogin />;
        }

        // Fetch dashboard data
        const [users, helpRequests, leads, coupons] = await Promise.all([
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                where: { role: { not: "ADMIN" } },
                include: { _count: { select: { leads: true } } }
            }),
            prisma.helpRequest.findMany({
                orderBy: { updatedAt: "desc" },
                include: {
                    user: { select: { name: true, email: true } },
                    messages: { orderBy: { createdAt: "asc" } },
                },
            }),
            prisma.lead.findMany({
                orderBy: { createdAt: "desc" },
                include: { user: { select: { email: true } } }
            }),
            prisma.coupon.findMany({
                orderBy: { createdAt: "desc" }
            })
        ]);

        return <AdminDashboard users={users} helpRequests={helpRequests} leads={leads} coupons={coupons} />;
    } catch (error: any) {
        // Next.js internal dynamic usage errors must be rethrown
        if (error.message?.includes('DYNAMIC_SERVER_USAGE') || error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }

        console.error("DEPLOYMENT_DIAGNOSTIC - Admin Page Error:", error);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-900 text-white">
                <div className="p-10 bg-slate-800 rounded-[2.5rem] border border-white/10 max-w-2xl w-full text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-3xl font-black mb-4 tracking-tighter">System Offline</h2>
                    <p className="text-slate-400 mb-8 font-medium">The admin layer encountered a critical error. This is likely due to a database connection timeout or mission session.</p>

                    <div className="bg-black/50 p-6 rounded-2xl font-mono text-xs text-red-400 overflow-x-auto mb-8 border border-white/5 text-left">
                        <p className="font-bold mb-2 uppercase text-[10px] tracking-widest text-slate-500">Diagnostic Info:</p>
                        {error?.message || "Internal Handshake Error"}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <a href="/admin" className="px-6 py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-all text-center">Try Again</a>
                        <a href="/" className="px-6 py-4 bg-slate-700 text-white rounded-xl font-bold text-center hover:bg-slate-600 transition-all">Homepage</a>
                    </div>
                </div>
            </div>
        );
    }
}
