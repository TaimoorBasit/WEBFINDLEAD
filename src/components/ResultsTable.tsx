"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Copy,
    ExternalLink,
    Phone,
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
    Search,
    Mail,
    Star,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Youtube,
    MapPin,
    Trash2,
    Target,
    Info,
    BarChart,
    Zap,
    ArrowRight
} from "lucide-react";
import { normalizeMapsUrl } from "@/lib/url-utils";

export type WebsiteStatus = 'NO_WEBSITE' | 'LOW_QUALITY' | 'GOOD' | 'PENDING';


export interface Business {
    id: string;
    placeId?: string;
    name: string;
    category?: string;
    address?: string;
    phone?: string;
    website?: string;
    mapsUrl?: string;
    rating?: number;
    reviews?: number;
    email?: string;
    price?: string;
    hours?: string;
    description?: string;
    websiteStatus: WebsiteStatus;
    taxStatus?: string;
    status: string; // NEW, CONTACTED, INTERESTED, LOST, CLOSED
    socials?: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; tiktok?: string; youtube?: string };
    pixels?: { facebook: boolean; google: boolean; tiktok: boolean };
    ads?: { facebook: boolean; google: boolean };
    hosting?: string;
    emailProvider?: string;
}

interface ResultsTableProps {
    businesses: Business[];
    onSave?: (biz: Business) => void;
    onRemove?: (bizId: string) => void;
    onUpdateStatus?: (bizId: string, status: string) => void;
    onUpdateTaxStatus?: (bizId: string, taxStatus: string) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    savedIds?: string[];
}


export default function ResultsTable({
    businesses,
    onSave,
    onRemove,
    onUpdateStatus,
    onUpdateTaxStatus,
    isLoading,
    emptyMessage = "No results found. Try a different search.",
    savedIds = []
}: ResultsTableProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterMissingPixels, setFilterMissingPixels] = useState(false);
    const [filterActiveAds, setFilterActiveAds] = useState(false);
    const [filterNeedsWebsite, setFilterNeedsWebsite] = useState(false);

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        // Only toggle if not clicking on a button or link
        if (e && (e.target as HTMLElement).closest('button, a')) return;
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredBusinesses = businesses.filter(biz => {
        if (filterMissingPixels && (biz.pixels?.facebook || biz.pixels?.google)) return false;
        if (filterActiveAds && (!biz.ads?.facebook && !biz.ads?.google)) return false;
        if (filterNeedsWebsite && biz.websiteStatus === 'GOOD') return false;
        return true;
    });

    const getStatusBadge = (status: WebsiteStatus) => {
        switch (status) {
            case 'NO_WEBSITE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 shadow-sm whitespace-nowrap">
                        <X className="w-3 h-3" /> No Website
                    </span>
                );
            case 'LOW_QUALITY':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200/50 shadow-sm whitespace-nowrap">
                        <AlertCircle className="w-3 h-3" /> Low Quality
                    </span>
                );
            case 'GOOD':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> Good Website
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 animate-pulse whitespace-nowrap">
                        <Clock className="w-3 h-3" /> Analyzing...
                    </span>
                );
        }
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
    };

    const getPitch = (biz: Business) => {
        const name = biz.name;
        const status = biz.websiteStatus;
        const auditLink = window.location.origin + '/audit/' + biz.id;

        if (status === 'NO_WEBSITE') {
            return `Hi ${name} team, I just ran a digital scan of your business and noticed you don't have a website yet. I've prepared a health report for you here: ${auditLink} - I specialize in helping local businesses get online and would love to help you fix this!`;
        } else if (status === 'LOW_QUALITY') {
            return `Hi ${name} team, I performed a technical audit on your website and found some critical performance issues. You can see the full report here: ${auditLink} - I'd love to help you optimize this for more customers!`;
        } else {
            return `Hi ${name} team, your website looks great, but I noticed you aren't currently using Ad Tracking (Pixels) to retarget your visitors. I've analyzed your setup here: ${auditLink} - Shall we chat about improving your ROI?`;
        }
    };

    const copyPitch = (biz: Business) => {
        const pitch = getPitch(biz);
        navigator.clipboard.writeText(pitch);
        alert("Pitch copied to clipboard!");
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium text-lg">Scanning businesses and analyzing websites...</p>
            </div>
        );
    }

    if (businesses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border text-center px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold mb-2">No data yet</h3>
                <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Advanced Smart Filters */}
            <div className="flex flex-wrap items-center gap-3 p-1">
                <button
                    onClick={() => setFilterMissingPixels(!filterMissingPixels)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        filterMissingPixels
                            ? "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                    )}
                >
                    <Target className={cn("w-3.5 h-3.5", filterMissingPixels ? "text-white" : "text-amber-500")} />
                    Missing Pixels
                </button>

                <button
                    onClick={() => setFilterActiveAds(!filterActiveAds)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        filterActiveAds
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                    )}
                >
                    <Zap className={cn("w-3.5 h-3.5", filterActiveAds ? "text-white" : "text-blue-500")} />
                    Paying for Ads
                </button>

                <button
                    onClick={() => setFilterNeedsWebsite(!filterNeedsWebsite)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        filterNeedsWebsite
                            ? "bg-red-500 text-white border-red-600 shadow-lg shadow-red-200"
                            : "bg-white text-slate-500 border-slate-200 hover:border-red-300"
                    )}
                >
                    <Globe className={cn("w-3.5 h-3.5", filterNeedsWebsite ? "text-white" : "text-red-500")} />
                    Needs Website / Low Qual
                </button>

                {(filterMissingPixels || filterActiveAds || filterNeedsWebsite) && (
                    <button
                        onClick={() => {
                            setFilterMissingPixels(false);
                            setFilterActiveAds(false);
                            setFilterNeedsWebsite(false);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-2"
                    >
                        Clear All
                    </button>
                )}

                <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Showing {filteredBusinesses.length} of {businesses.length}
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="min-w-full divide-y divide-border table-fixed">
                        <thead className="bg-[#f8fafc]">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-[24rem] text-left">Business Detail</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-48 text-left">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-40 text-center">Socials</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-32 text-center">
                                    <div className="flex items-center justify-center gap-1 group cursor-help" title="These are snippets of code (like Facebook Pixel or Google Tags) that track website visitors. If a business has these, they are likely already investing in marketing.">
                                        AD TRACKING
                                        <Info className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-32 text-center">
                                    <div className="flex items-center justify-center gap-1 group cursor-help" title="Checks if the business is currently paying for advertisements on Facebook or Google.">
                                        ACTIVE ADS
                                        <Info className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-40 text-center">Category</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 w-40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredBusinesses.map((biz) => {
                                const normalized = normalizeMapsUrl(biz.mapsUrl);
                                const isSaved = (biz.id && savedIds.includes(biz.id)) || (normalized && savedIds.includes(normalized));

                                return (
                                    <React.Fragment key={biz.id}>
                                        <tr
                                            className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${expandedId === biz.id ? 'bg-slate-50/80' : ''}`}
                                            onClick={(e) => toggleExpand(biz.id, e)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 transition-transform group-hover:scale-110">
                                                        {expandedId === biz.id ? (
                                                            <ChevronDown className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <Plus className="w-4 h-4 text-muted-foreground/40" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-[15px] leading-tight group-hover:text-primary transition-colors line-clamp-1" title={biz.name}>{biz.name}</span>
                                                            {biz.websiteStatus === 'NO_WEBSITE' && (biz.rating || 0) >= 4 && (
                                                                <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200 animate-pulse whitespace-nowrap">
                                                                    High Priority
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px]">
                                                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                                <Star className="w-3 h-3 fill-current" />
                                                                <span className="text-slate-700">{biz.rating || "N/A"}</span>
                                                                <span className="text-slate-400 font-medium">({biz.reviews || 0})</span>
                                                            </div>
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-slate-500 truncate max-w-[200px]" title={biz.address}>{biz.address || "Local Area"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    {biz.email ? (
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            <Mail className="w-3 h-3 text-primary" />
                                                            <span className="truncate">{biz.email}</span>
                                                        </div>
                                                    ) : biz.phone ? (
                                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                                            <Phone className="w-3 h-3 text-primary" />
                                                            <span>{biz.phone}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">No direct contact</span>
                                                    )}
                                                    {biz.website ? (
                                                        <a href={biz.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 hover:underline">
                                                            <Globe className="w-3 h-3" />
                                                            <span className="truncate">{biz.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">Missing Website</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <span title="Facebook">{biz.socials?.facebook ? <Facebook className="w-3.5 h-3.5 text-blue-600" /> : <Facebook className="w-3.5 h-3.5 text-slate-200" />}</span>
                                                    <span title="Instagram">{biz.socials?.instagram ? <Instagram className="w-3.5 h-3.5 text-pink-600" /> : <Instagram className="w-3.5 h-3.5 text-slate-200" />}</span>
                                                    <span title="LinkedIn">{biz.socials?.linkedin ? <Linkedin className="w-3.5 h-3.5 text-indigo-600" /> : <Linkedin className="w-3.5 h-3.5 text-slate-200" />}</span>
                                                    <span title="X (Twitter)">{biz.socials?.twitter ? <Twitter className="w-3.5 h-3.5 text-sky-600" /> : <Twitter className="w-3.5 h-3.5 text-slate-200" />}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className={`w-2 h-2 rounded-full ${biz.pixels?.facebook ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`} title={biz.pixels?.facebook ? "Facebook tracking active" : "No Facebook tracking"} />
                                                    <div className={`w-2 h-2 rounded-full ${biz.pixels?.google ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}`} title={biz.pixels?.google ? "Google tracking active" : "No Google tracking"} />
                                                    <div className={`w-2 h-2 rounded-full ${biz.pixels?.tiktok ? 'bg-black shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'bg-slate-200'}`} title={biz.pixels?.tiktok ? "TikTok tracking active" : "No TikTok tracking"} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className={`text-[10px] font-black ${biz.ads?.facebook ? 'text-blue-600' : 'text-slate-200'}`} title={biz.ads?.facebook ? "FB Ads active" : "No active FB ads"}>FB</div>
                                                    <div className={`text-[10px] font-black ${biz.ads?.google ? 'text-green-600' : 'text-slate-200'}`} title={biz.ads?.google ? "Google Ads active" : "No active Google ads"}>G</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded truncate inline-block max-w-full">
                                                    {biz.category || "General"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!biz.id) return;
                                                            const url = window.location.origin + '/audit/' + biz.id;
                                                            navigator.clipboard.writeText(url);
                                                            alert("Public Audit Link Copied! Send this to your client to impress them.");
                                                        }}
                                                        className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all"
                                                        title="Generate Public Audit Report"
                                                    >
                                                        <BarChart className="w-4 h-4" />
                                                    </button>
                                                    {onSave && (
                                                        <button
                                                            onClick={() => {
                                                                if (isSaved) {
                                                                    onRemove?.(biz.id);
                                                                } else {
                                                                    onSave(biz);
                                                                }
                                                            }}
                                                            className={`p-2.5 rounded-xl transition-all border ${isSaved ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'bg-primary text-primary-foreground border-primary/20 hover:shadow-lg hover:shadow-primary/20'}`}
                                                            title={isSaved ? "Remove from Leads" : "Save Lead"}
                                                        >
                                                            {isSaved ? (
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            ) : (
                                                                <Plus className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                    {onRemove && !onSave && (
                                                        <button
                                                            onClick={() => onRemove(biz.id)}
                                                            className="p-2.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all"
                                                            title="Delete Lead"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === biz.id && (
                                            <tr className="bg-slate-50/50 border-t border-slate-100">
                                                <td colSpan={7} className="px-8 py-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                                        {/* Overview */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                                <Globe className="w-3 h-3" /> Digital Footprint
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400">Website Quality</span>
                                                                        {getStatusBadge(biz.websiteStatus)}
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400">Hosting & Tech</span>
                                                                        <span className="text-xs font-bold text-slate-700">{biz.hosting || "Detecting..."}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400">Email Stack</span>
                                                                        <span className="text-xs font-bold text-slate-700">{biz.emailProvider || "Detecting..."}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400">Tax Registration</span>
                                                                        {onUpdateTaxStatus ? (
                                                                            <select
                                                                                value={biz.taxStatus || 'UNKNOWN'}
                                                                                onChange={(e) => onUpdateTaxStatus(biz.id, e.target.value)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none"
                                                                            >
                                                                                <option value="UNKNOWN">Unknown</option>
                                                                                <option value="REGISTERED">Registered</option>
                                                                                <option value="UNREGISTERED">Not Registered</option>
                                                                            </select>
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-slate-700">{biz.taxStatus || 'UNKNOWN'}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Marketing Intelligence */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                                <Target className="w-3 h-3" /> Marketing Setup
                                                            </h4>
                                                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400">Visitor Tracking (Pixels)</span>
                                                                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded italic">Higher Intent</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                                            <span className="text-slate-500">Facebook Pixel</span>
                                                                            {biz.pixels?.facebook ? <span className="flex items-center gap-1 text-emerald-500">Active <CheckCircle2 className="w-3 h-3" /></span> : <span className="text-slate-300">Missing</span>}
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                                            <span className="text-slate-500">Google Ads Tag</span>
                                                                            {biz.pixels?.google ? <span className="flex items-center gap-1 text-emerald-500">Active <CheckCircle2 className="w-3 h-3" /></span> : <span className="text-slate-300">Missing</span>}
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                                            <span className="text-slate-500">TikTok Pixel</span>
                                                                            {biz.pixels?.tiktok ? <span className="flex items-center gap-1 text-emerald-500">Active <CheckCircle2 className="w-3 h-3" /></span> : <span className="text-slate-300">Missing</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                                                    <span className="text-[9px] font-black uppercase text-slate-400">Ad Visibility</span>
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                                            <span className="text-slate-500">Running Facebook Ads</span>
                                                                            {biz.ads?.facebook ? <span className="text-emerald-500 font-black">YES</span> : <span className="text-slate-300">NO</span>}
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                                            <span className="text-slate-500">Running Google Ads</span>
                                                                            {biz.ads?.google ? <span className="text-emerald-500 font-black">YES</span> : <span className="text-slate-300">NO</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Operations */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                                                <Clock className="w-3 h-3" /> Operations
                                                            </h4>
                                                            <div className="space-y-3">
                                                                <div className="flex items-start gap-3">
                                                                    <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-bold text-slate-400">Hours Today</span>
                                                                        <span className="text-sm font-medium text-slate-700">{biz.hours || "Not specified"}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-3">
                                                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[11px] font-bold text-slate-400">Full Address</span>
                                                                        <span className="text-sm font-medium text-slate-700 leading-tight">{biz.address || "No address found"}</span>
                                                                    </div>
                                                                </div>
                                                                {biz.mapsUrl && (
                                                                    <a href={biz.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-primary/30 transition-all mt-2">
                                                                        <ExternalLink className="w-3 h-3" /> View on Google Maps
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Engagement */}
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                                <Zap className="w-3 h-3" /> Consultant Pack
                                                            </h4>
                                                            <div className="bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/20 rounded-[2rem] p-6 space-y-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black uppercase text-slate-400 ml-1">Client Audit Report</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const url = window.location.origin + '/audit/' + biz.id;
                                                                            navigator.clipboard.writeText(url);
                                                                            alert("Client Audit URL copied! Send this to your client.");
                                                                        }}
                                                                        className="flex items-center justify-between w-full bg-white border border-slate-200 hover:border-primary px-4 py-3 rounded-xl transition-all group"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                                                <BarChart className="w-4 h-4" />
                                                                            </div>
                                                                            <span className="text-xs font-bold text-slate-700">Digital Scan Report</span>
                                                                        </div>
                                                                        <Copy className="w-3 h-3 text-slate-300 group-hover:text-primary" />
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black uppercase text-slate-400 ml-1">AI Personal Pitch</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); copyPitch(biz); }}
                                                                        className="flex items-center justify-between w-full bg-slate-900 shadow-lg shadow-slate-200 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition-all font-bold text-xs"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <MessageSquare className="w-4 h-4 text-primary" />
                                                                            Generate Outreach
                                                                        </div>
                                                                        <ArrowRight className="w-4 h-4" />
                                                                    </button>
                                                                </div>

                                                                <div className="pt-2 border-t border-slate-200/50 flex flex-col gap-2">
                                                                    {biz.email ? (
                                                                        <a
                                                                            href={`mailto:${biz.email}?subject=${encodeURIComponent(`Business Audit for ${biz.name}`)}&body=${encodeURIComponent(getPitch(biz))}`}
                                                                            className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-center"
                                                                        >
                                                                            <Mail className="w-3.5 h-3.5" /> One-Click Email Outreach
                                                                        </a>
                                                                    ) : (
                                                                        <div className="flex-1 bg-slate-100 text-slate-400 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                                                                            <Mail className="w-3.5 h-3.5 opacity-50" /> No Email Found
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {onUpdateStatus && (
                                                                <div className="pt-2">
                                                                    <span className="text-[9px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Pipeline Status</span>
                                                                    <select
                                                                        value={biz.status}
                                                                        onChange={(e) => onUpdateStatus(biz.id, e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className={cn(
                                                                            "w-full text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border outline-none transition-all",
                                                                            biz.status === 'NEW' && "bg-blue-50 text-blue-600 border-blue-200",
                                                                            biz.status === 'CONTACTED' && "bg-amber-50 text-amber-600 border-amber-200",
                                                                            biz.status === 'INTERESTED' && "bg-emerald-50 text-emerald-600 border-emerald-200",
                                                                            biz.status === 'LOST' && "bg-slate-50 text-slate-500 border-slate-200",
                                                                            biz.status === 'CLOSED' && "bg-purple-50 text-purple-600 border-purple-200",
                                                                        )}
                                                                    >
                                                                        <option value="NEW">New</option>
                                                                        <option value="CONTACTED">Contacted</option>
                                                                        <option value="INTERESTED">Interested</option>
                                                                        <option value="LOST">Lost</option>
                                                                        <option value="CLOSED">Closed / Won</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
