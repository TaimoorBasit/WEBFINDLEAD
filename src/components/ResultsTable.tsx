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
    Trash2
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
    status: string; // NEW, CONTACTED, INTERESTED, LOST, CLOSED
    socials?: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; tiktok?: string; youtube?: string };
}

interface ResultsTableProps {
    businesses: Business[];
    onSave?: (biz: Business) => void;
    onRemove?: (bizId: string) => void;
    onUpdateStatus?: (bizId: string, status: string) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    savedIds?: string[];
}


export default function ResultsTable({
    businesses,
    onSave,
    onRemove,
    onUpdateStatus,
    isLoading,
    emptyMessage = "No results found. Try a different search.",
    savedIds = []
}: ResultsTableProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        // Only toggle if not clicking on a button or link
        if (e && (e.target as HTMLElement).closest('button, a')) return;
        setExpandedId(expandedId === id ? null : id);
    };

    const getStatusBadge = (status: WebsiteStatus) => {
        switch (status) {
            case 'NO_WEBSITE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold bg-white text-red-500 border border-red-200 shadow-sm whitespace-nowrap">
                        <X className="w-3 h-3" /> No Website
                    </span>
                );
            case 'LOW_QUALITY':
                return (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-400/50 shadow-sm whitespace-nowrap">
                        <AlertCircle className="w-3 h-3" /> Low Quality
                    </span>
                );
            case 'GOOD':
                return (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> Good Website
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 animate-pulse whitespace-nowrap">
                        <Clock className="w-3 h-3" /> Analyzing...
                    </span>
                );
        }
    };

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        // You could add a toast here
    };

    const getPitch = (biz: Business) => {
        const name = biz.name;
        const status = biz.websiteStatus;

        if (status === 'NO_WEBSITE') {
            return `Hi ${name} team, I noticed you don't have a website listed on Google Maps. Having a site can help you get 2-3x more customers. I specialize in building fast, local-friendly sites. Would you be open to a quick chat?`;
        } else {
            return `Hi ${name} team, I saw your website and noticed it could use some modern optimizations for speed and mobile users to help you rank better on Google. I'd love to show you how we can improve it. Available for a chat?`;
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
        <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-border table-fixed">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="px-6 py-4 text-sm font-semibold text-muted-foreground w-[25%] text-left">Business Name</th>
                            <th className="px-6 py-4 text-sm font-semibold text-muted-foreground w-1/6 text-left">Website</th>
                            <th className="px-6 py-4 text-sm font-semibold text-muted-foreground w-1/5 text-left">Pipeline</th>
                            <th className="px-6 py-4 text-sm font-semibold text-muted-foreground w-1/6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {businesses.map((biz) => {
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
                                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-amber-200 animate-pulse whitespace-nowrap">
                                                                High Priority
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px]">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600 uppercase tracking-wide">{biz.category || "Service"}</span>
                                                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <span className="text-slate-700">{biz.rating || "N/A"}</span>
                                                            <span className="text-slate-400 font-medium">({biz.reviews || 0})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                                {getStatusBadge(biz.websiteStatus)}
                                                {biz.website && (
                                                    <a
                                                        href={biz.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 group/link"
                                                    >
                                                        <Globe className="w-3.5 h-3.5 text-indigo-100 bg-indigo-600 rounded-full p-0.5" />
                                                        <span className="truncate">{biz.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {onUpdateStatus ? (
                                                <select
                                                    value={biz.status}
                                                    onChange={(e) => onUpdateStatus(biz.id, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border outline-none transition-all",
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
                                            ) : (
                                                <span className="text-[10px] font-black p-2 bg-slate-100 rounded text-slate-500 uppercase">Save to Track</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right align-top">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                                            <td colSpan={4} className="px-8 py-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    {/* Overview */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Business Overview</h4>
                                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                                            {biz.description || "No description available for this business."}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {biz.website && (
                                                                <a href={biz.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 hover:border-indigo-300 transition-all">
                                                                    <Globe className="w-3.5 h-3.5" /> Visit Website
                                                                </a>
                                                            )}
                                                            {biz.mapsUrl && (
                                                                <a href={biz.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-primary/30 transition-all">
                                                                    <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Operations & Intelligence */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sales Intelligence</h4>

                                                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion Killers</span>
                                                            <div className="space-y-2">
                                                                {biz.websiteStatus === 'NO_WEBSITE' ? (
                                                                    <>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                                                                            <AlertCircle className="w-3.5 h-3.5" /> 100% Mobile Traffic Lost
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                                                                            <AlertCircle className="w-3.5 h-3.5" /> Zero Search Discoverability
                                                                        </div>
                                                                    </>
                                                                ) : biz.websiteStatus === 'LOW_QUALITY' ? (
                                                                    <>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                                                                            <AlertCircle className="w-3.5 h-3.5" /> Slow Load Speed (&gt;3s)
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                                                                            <AlertCircle className="w-3.5 h-3.5" /> Poor Mobile Experience
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Web Presence
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 pt-2">
                                                            <div className="flex items-start gap-3">
                                                                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-bold text-slate-400">Hours</span>
                                                                    <span className="text-sm font-medium text-slate-700">{biz.hours || "Hours not specified"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-start gap-3">
                                                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-bold text-slate-400">Address</span>
                                                                    <span className="text-sm font-medium text-slate-700 leading-tight">{biz.address || "No address found"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Engagement */}
                                                    <div className="space-y-4">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Outreach & Engagement</h4>
                                                        {(biz.socials && Object.keys(biz.socials).length > 0) ? (
                                                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                                {biz.socials.facebook && (
                                                                    <a href={biz.socials.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all"><Facebook className="w-4 h-4" /></a>
                                                                )}
                                                                {biz.socials.instagram && (
                                                                    <a href={biz.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-lg border border-pink-100 hover:bg-pink-100 transition-all"><Instagram className="w-4 h-4" /></a>
                                                                )}
                                                                {biz.socials.twitter && (
                                                                    <a href={biz.socials.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-50 text-sky-600 rounded-lg border border-sky-100 hover:bg-sky-100 transition-all"><Twitter className="w-4 h-4" /></a>
                                                                )}
                                                                {biz.socials.linkedin && (
                                                                    <a href={biz.socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all"><Linkedin className="w-4 h-4" /></a>
                                                                )}
                                                                {biz.socials.youtube && (
                                                                    <a href={biz.socials.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 transition-all"><Youtube className="w-4 h-4" /></a>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground italic mb-4">No social profiles found.</p>
                                                        )}
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); copyPitch(biz); }}
                                                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98]"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" /> Copy Pitch
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(`${biz.name} - ${biz.phone || ""}`); }}
                                                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" /> Copy Details
                                                            </button>
                                                        </div>
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
    );
}
