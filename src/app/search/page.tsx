"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    MoreHorizontal,
    ChevronDown,
    Globe,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
    MessageSquare,
    X,
    Search as SearchIcon,
    Mail,
    Star,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Youtube,
    MapPin,
    Trash2,
    ArrowRight,
    Search,
    Download,
    Target
} from "lucide-react";
import MapView from "@/components/Map";
import ResultsTable, { Business } from "@/components/ResultsTable";
import axios from "axios";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { normalizeMapsUrl } from "@/lib/url-utils";
import { useRouter } from "next/navigation";
import PricingModal from "@/components/PricingModal";

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [results, setResults] = useState<Business[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextStart, setNextStart] = useState<number | undefined>(undefined);
    const [savedMap, setSavedMap] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState<"ALL" | "NO_WEBSITE" | "NO_SOCIALS" | "LOW_QUALITY">("ALL");
    const [showPricing, setShowPricing] = useState(false);
    const { data: session, update } = useSession();
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        if (session?.user) {
            fetchSavedLeads();
            setBalance((session.user as any).leadsBalance ?? 0);
        }
    }, [session]);

    const fetchSavedLeads = async () => {
        if (!session) return;
        try {
            const response = await axios.get("/api/leads");
            const leads = response.data;
            const map: Record<string, string> = {};
            leads.forEach((l: Business) => {
                if (l.placeId) {
                    map[l.placeId] = l.id;
                } else if (l.mapsUrl) {
                    const normalized = normalizeMapsUrl(l.mapsUrl);
                    if (normalized) map[normalized] = l.id;
                }
            });
            setSavedMap(map);
        } catch (error) {
            console.error("Failed to fetch saved leads:", error);
        }
    };

    const filteredResults = results.filter(biz => {
        // Hide if already saved (matched by placeId or normalized mapsUrl)
        if (biz.id && savedMap[biz.id]) return false;
        const normalized = normalizeMapsUrl(biz.mapsUrl);
        if (normalized && savedMap[normalized]) return false;

        if (filter === "ALL") return true;
        if (filter === "NO_WEBSITE") return biz.websiteStatus === "NO_WEBSITE";
        if (filter === "LOW_QUALITY") return biz.websiteStatus === "LOW_QUALITY";
        if (filter === "NO_SOCIALS") return !biz.socials || Object.keys(biz.socials).length === 0;
        return true;
    });

    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (isLoadMore = false) => {
        if (!session) {
            router.push("/auth/signin");
            return;
        }
        if (!isLoadMore && (!query && !location)) return;

        setLoading(true);
        setError(null);

        // Clear previous results if it's a new search to avoid stale data
        if (!isLoadMore) {
            setResults([]);
            setNextStart(undefined);
        }

        try {
            const startParam = isLoadMore && nextStart ? `&start=${nextStart}` : '';
            const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}${startParam}`);

            const newResults = response.data.results as Business[];
            setNextStart(response.data.nextStart);

            if (newResults.length === 0 && !isLoadMore) {
                // Optional: distinct empty state handling
            }

            // Update balance from server response (decremented on search)
            if (typeof response.data.remainingBalance === 'number') {
                setBalance(response.data.remainingBalance);
                await update(); // Sync session
            }

            setResults((prev: Business[]) => {
                const combined = isLoadMore ? [...prev, ...newResults] : newResults;

                // Deduplicate by ID using a typed Map
                const uniqueMap = new Map<string, Business>();
                combined.forEach(item => uniqueMap.set(item.id, item));
                const uniqueLeads = Array.from(uniqueMap.values());

                return uniqueLeads.sort((a, b) => {
                    const statusOrder: Record<string, number> = { 'NO_WEBSITE': 0, 'PENDING': 1, 'LOW_QUALITY': 2, 'GOOD': 3 };
                    return (statusOrder[a.websiteStatus] ?? 99) - (statusOrder[b.websiteStatus] ?? 99);
                });
            });

            // Throttle analysis requests to prevent network overload
            newResults.forEach((biz: Business, index: number) => {
                if (biz.websiteStatus === 'PENDING' && biz.website) {
                    setTimeout(() => {
                        analyzeInBackground(biz.id, biz.website!);
                    }, index * 800); // 800ms delay between each request
                }
            });
        } catch (error: any) {
            console.error("Search failed:", error);
            if (error.response?.status === 403) {
                setShowPricing(true);
                setBalance(0);
                // Don't show generic error for trial expiry
                return;
            }

            setError("Failed to fetch results. Please try again.");
            if (!isLoadMore) setResults([]); // Ensure empty results on failure
        } finally {
            setLoading(false);
        }
    };

    const analyzeInBackground = async (id: string, url: string) => {
        try {
            const res = await axios.get(`/api/analyze?url=${encodeURIComponent(url)}`);
            const analysis = res.data;

            setResults(prev => prev.map(biz => {
                if (biz.id === id) {
                    return {
                        ...biz,
                        websiteStatus: analysis.status,
                        email: analysis.emails && analysis.emails.length > 0 ? analysis.emails[0] : null,
                        socials: { ...biz.socials, ...analysis.socials }
                    };
                }
                return biz;
            }));
        } catch (error) {
            console.error("Analysis failed:", error);
            // On failure, maybe downgrade to 'LOW_QUALITY' or keep as is? 
            // Better to stop spinner.
            setResults(prev => prev.map(biz => {
                if (biz.id === id) {
                    return { ...biz, websiteStatus: 'LOW_QUALITY' }; // fallback
                }
                return biz;
            }));
        }
    };

    const saveLead = async (biz: Business) => {
        try {
            const response = await axios.post("/api/leads", biz);
            const savedLead = response.data;
            const normalized = normalizeMapsUrl(biz.mapsUrl);

            setSavedMap(prev => {
                const newMap = { ...prev };
                if (biz.id) newMap[biz.id] = savedLead.id;
                if (normalized) newMap[normalized] = savedLead.id;
                return newMap;
            });

            if (typeof savedLead.remainingBalance === 'number') {
                setBalance(savedLead.remainingBalance);
            }

            await update(); // Refresh session to update leads balance
        } catch (error: any) {
            console.error("Save failed:", error);
            if (error.response?.status === 402) {
                setShowPricing(true);
            }
        }
    };

    const removeLead = async (bizId: string) => {
        const biz = results.find(b => b.id === bizId);
        const normalized = normalizeMapsUrl(biz?.mapsUrl);

        // Find the database ID from the savedMap
        const dbId = (bizId && savedMap[bizId]) || (normalized && savedMap[normalized]);

        if (!dbId) {
            console.warn("Could not find lead in saved map to delete");
            return;
        }

        try {
            await axios.delete(`/api/leads?id=${dbId}`);
            setSavedMap(prev => {
                const newMap = { ...prev };
                if (bizId) delete newMap[bizId];
                if (normalized) delete newMap[normalized];
                return newMap;
            });
        } catch (error) {
            console.error("Remove failed:", error);
        }
    };

    const handleExport = () => {
        const dataToExport = filteredResults.length > 0 ? filteredResults : results;
        if (!dataToExport || dataToExport.length === 0) return;

        const headers = ["Name", "Category", "Phone", "Email", "Website", "Status", "Rating", "Reviews", "Address"];
        const csvContent = [
            headers.join(","),
            ...dataToExport.map(l => [
                `"${l.name}"`, `"${l.category || ""}"`, `"${l.phone || ""}"`, `"${l.email || ""}"`,
                `"${l.website || ""}"`, `"${l.websiteStatus}"`, `"${l.rating || ""}"`,
                `"${l.reviews || ""}"`, `"${l.address || ""}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <div className="flex-none bg-card border-b border-border z-20 shadow-sm">
                <div className="max-w-[1920px] mx-auto p-4 lg:px-8">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(false); }} className="flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                        <div className="flex-none lg:mr-8 hidden xl:block">
                            <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
                                Find <span className="text-primary italic font-serif">Leads</span>
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Lead Intelligence</p>
                        </div>

                        {/* Balance Badge */}
                        {session?.user && (
                            <div className="hidden lg:flex flex-col items-end mr-6">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                    {(session.user as any).plan === 'FREE' || !(session.user as any).plan ? 'Trial Leads' : 'Balance'}
                                </span>
                                <span className={`text-2xl font-black ${balance > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {(session.user as any).role === 'ADMIN' ? '∞' : balance}
                                </span>
                            </div>
                        )}

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="City, State (e.g., Dallas, TX)"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl py-3 pl-10 pr-4 font-medium text-sm transition-all outline-none"
                                    required
                                />
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Niche (e.g., Plumber, Dentist)"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl py-3 pl-10 pr-4 font-medium text-sm transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 lg:flex-none bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm tracking-wide hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 min-w-[120px]"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Find Lead"}
                            </button>

                            {results.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleExport}
                                    className="flex-none px-4 py-3 bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 rounded-xl font-bold text-sm hover:bg-emerald-600/20 transition-all flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Export</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div >

            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col min-w-0 bg-muted/10 relative z-10 overflow-hidden">
                    {(results.length > 0 || loading) && (
                        <div className="flex-none p-4 lg:px-8 border-b border-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm font-medium text-slate-500">
                                Found <span className="text-slate-900 font-bold">{filteredResults.length}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                {["ALL", "NO_WEBSITE", "NO_SOCIALS", "LOW_QUALITY"].map((opt: string) => (
                                    <button
                                        key={opt}
                                        onClick={() => setFilter(opt as "ALL" | "NO_WEBSITE" | "NO_SOCIALS" | "LOW_QUALITY")}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all border",
                                            filter === opt ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
                                        {opt.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                        <div className="max-w-5xl mx-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                    <p className="font-bold text-slate-400">Scanning for high-intent leads...</p>
                                </div>
                            ) : filteredResults.length > 0 ? (
                                <div className="space-y-6">
                                    <ResultsTable
                                        businesses={filteredResults}
                                        savedIds={Object.keys(savedMap)}
                                        onSave={saveLead}
                                        onRemove={removeLead}
                                    />
                                    {nextStart !== undefined && (
                                        <div className="flex justify-center pt-8">
                                            <button
                                                onClick={() => handleSearch(true)}
                                                className="flex items-center gap-2 px-8 py-3 bg-white border border-border rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                                            >
                                                Load More Results <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : results.length > 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-muted-foreground font-bold">No results match your active filters.</p>
                                    <button onClick={() => setFilter('ALL')} className="text-primary font-black text-xs tracking-widest uppercase mt-4 hover:underline">Clear Filters</button>
                                </div>
                            ) : (
                                <div className="text-center py-32 opacity-30">
                                    <Target className="w-16 h-16 mx-auto mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Ready to Scan</h3>
                                    <p className="font-medium text-slate-500 mt-2">Enter location & niche to find hidden gems.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block w-[35%] xl:w-[30%] relative border-l border-border bg-muted">
                    <MapView query={query} location={location} />
                </div>
            </div>
            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
        </div>
    );
}
