"use client";

import { useState, useEffect } from "react";
import { Database, Download } from "lucide-react";
import ResultsTable, { Business, WebsiteStatus } from "@/components/ResultsTable";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { normalizeMapsUrl } from "@/lib/url-utils";

export default function LeadsPage() {
    const [leads, setLeads] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<WebsiteStatus | 'ALL'>('ALL');
    const [pipelineFilter, setPipelineFilter] = useState<string | 'ALL'>('ALL');
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push("/auth/signin");
            return;
        }
        fetchLeads();
    }, [session, status]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/leads");
            const parsedLeads = response.data.map((lead: Business) => ({
                ...lead,
                socials: lead.socials && typeof lead.socials === 'string' ? JSON.parse(lead.socials as string) : lead.socials
            }));
            setLeads(parsedLeads);
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (bizId: string) => {
        try {
            await axios.delete(`/api/leads?id=${bizId}`);
            setLeads(leads.filter(l => l.id !== bizId));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleUpdateStatus = async (bizId: string, newStatus: string) => {
        try {
            await axios.patch(`/api/leads`, { id: bizId, status: newStatus });
            setLeads(leads.map(l => l.id === bizId ? { ...l, status: newStatus } : l));
        } catch (error) {
            console.error("Update status failed:", error);
            alert("Failed to update status");
        }
    };

    const exportLeads = () => {
        const headers = ["Name", "Category", "Phone", "Email", "Website", "Status", "Rating", "Reviews", "Address", "Maps Link", "Socials"];
        const csvContent = [
            headers.join(","),
            ...leads.map(l => [
                `"${l.name}"`,
                `"${l.category || ""}"`,
                `"${l.phone || ""}"`,
                `"${l.email || ""}"`,
                `"${l.website || ""}"`,
                `"${l.websiteStatus}"`,
                `"${l.rating || ""}"`,
                `"${l.reviews || ""}"`,
                `"${l.address || ""}"`,
                `"${l.mapsUrl || ""}"`,
                `"${l.socials ? Object.values(l.socials).join(', ') : ""}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `webfinder_leads_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLeads = leads.filter(biz =>
        (statusFilter === 'ALL' || biz.websiteStatus === statusFilter) &&
        (pipelineFilter === 'ALL' || biz.status === pipelineFilter)
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground">
                        My <span className="text-primary italic">Leads</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Manage and export your identified business opportunities.
                    </p>
                </div>

                <button
                    onClick={exportLeads}
                    disabled={leads.length === 0}
                    className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-bold hover:bg-muted transition-all disabled:opacity-50"
                >
                    <Download className="w-5 h-5" />
                    Export CSV
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-xl font-bold">Saved Businesses</h2>
                        <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {filteredLeads.length} total
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as WebsiteStatus | 'ALL')}
                        >
                            <option value="ALL">All Status</option>
                            <option value="NO_WEBSITE">No Website</option>
                            <option value="LOW_QUALITY">Low Quality</option>
                            <option value="GOOD">Good Website</option>
                        </select>

                        <select
                            className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                            value={pipelineFilter}
                            onChange={(e) => setPipelineFilter(e.target.value)}
                        >
                            <option value="ALL">All Pipeline</option>
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="INTERESTED">Interested</option>
                            <option value="LOST">Lost</option>
                            <option value="CLOSED">Closed / Won</option>
                        </select>
                    </div>
                </div>

                <ResultsTable
                    businesses={filteredLeads}
                    isLoading={loading}
                    onRemove={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                    savedIds={[
                        ...leads.map(l => l.placeId).filter(Boolean),
                        ...leads.map(l => normalizeMapsUrl(l.mapsUrl)).filter(Boolean)
                    ] as string[]}
                    emptyMessage="You haven't saved any leads yet. Go to Search Scanner to find some!"
                />
            </div>
        </div>
    );
}
