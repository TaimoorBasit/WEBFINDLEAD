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

    // Fetch data
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
}
