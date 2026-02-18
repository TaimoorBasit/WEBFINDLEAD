import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";
import AdminLogin from "./AdminLogin";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);



    if (!session || session.user.role !== "ADMIN") {
        return <AdminLogin />;
    }

    // Fetch data with error handling
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            where: { role: { not: "ADMIN" } },
            include: {
                _count: { select: { leads: true } }
            }
        });

        const helpRequests = await prisma.helpRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });

        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" }
        });

        return <AdminDashboard users={users} helpRequests={helpRequests} leads={leads} coupons={coupons} />;
    } catch (error) {
        console.error("Database connection error on Admin page:", error);
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                <div className="p-8 bg-white rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
                    <h2 className="text-2xl font-black text-red-600 mb-4 tracking-tight">Database Connection Error</h2>
                    <p className="text-gray-600 mb-6 font-medium leading-relaxed">
                        We couldn't connect to the database. Please check your TiDB Cloud IP Whitelist (0.0.0.0/0) and ensure the DATABASE_URL is correct on Vercel.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
                    >
                        Retry Connection
                    </button>
                    <div className="mt-6 text-[10px] text-gray-400 font-mono uppercase tracking-widest bg-gray-50 p-3 rounded-lg text-left overflow-auto max-h-32">
                        {String(error)}
                    </div>
                </div>
            </div>
        );
    }
}
