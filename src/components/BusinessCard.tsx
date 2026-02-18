import {
    Globe,
    MapPin,
    Phone,
    Star,
    Navigation,
    Mail,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Youtube,
    AlertCircle,
    CheckCircle2,
    X,
    Copy,
    Check,
    ArrowRight,
    Zap,
    ExternalLink,
    Target,
    Plus
} from "lucide-react";
import { Business, WebsiteStatus } from "./ResultsTable";
import { Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";


interface BusinessCardProps {
    business: Business;
    onSave?: (biz: Business) => void;
    onRemove?: (bizId: string) => void;
    isSaved?: boolean;
}

export default function BusinessCard({ business, onSave, onRemove, isSaved }: BusinessCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyPitch = () => {
        let pitch = "";
        if (business.websiteStatus === 'NO_WEBSITE') {
            pitch = `Hi ${business.name} team, I noticed you don't have a website listed on Google Maps. I help local businesses build professional sites to get more customers. Would you be open to a 5-min chat?`;
        } else if (business.websiteStatus === 'LOW_QUALITY') {
            pitch = `Hi ${business.name} team, I saw your website and noticed it could use some modernization to better represent your brand. I specialize in refreshing local business sites for better results. Open to a quick chat?`;
        } else {
            pitch = `Hi ${business.name} team, I noticed you have a great business! I help companies like yours optimize their online presence and social media. Let me know if you'd like to see some ideas.`;
        }

        navigator.clipboard.writeText(pitch);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getStatusBadge = (status: WebsiteStatus) => {
        switch (status) {
            case 'NO_WEBSITE':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Website Missing
                    </div>
                );
            case 'LOW_QUALITY':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 backdrop-blur-md">
                        <AlertCircle className="w-3 h-3" />
                        Low Quality
                    </div>
                );
            case 'GOOD':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Optimized
                    </div>
                );
            case 'PENDING':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 animate-pulse backdrop-blur-md">
                        <Clock className="w-3 h-3" />
                        Analyzing IQ
                    </div>
                );
            default:
                return null;
        }
    };

    const isPriority = business.websiteStatus === 'NO_WEBSITE';

    return (
        <div className={cn(
            "group relative flex flex-col bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 transition-all duration-500 h-full hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 overflow-hidden",
            isPriority && "shadow-[inset_0_0_40px_rgba(239,68,68,0.03)]"
        )}>
            {/* Elite Glow for Priority Leads */}
            {isPriority && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] -mr-10 -mt-10 animate-pulse" />
            )}

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-2 flex-1">
                        {getStatusBadge(business.websiteStatus)}
                    </div>

                    {onSave && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isSaved) {
                                    onRemove?.(business.id);
                                } else {
                                    onSave(business);
                                }
                            }}
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                                isSaved
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
                                    : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                            )}
                        >
                            {isSaved ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </button>
                    )}
                </div>

                <div className="mb-6">
                    <h3 className="text-2xl font-black tracking-tighter text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {business.name}
                    </h3>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 whitespace-nowrap">
                            {business.category}
                        </span>
                        {business.price && (
                            <span className="text-[10px] font-black text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded-md">
                                {business.price}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "w-3 h-3",
                                        i < Math.floor(business.rating || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-foreground/80">{business.rating}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-xs font-medium text-muted-foreground">{business.reviews?.toLocaleString()} Reviews</span>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed italic pr-4">
                            {business.address || "Digital Mission Only"}
                        </span>
                    </div>

                    {business.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-bold text-foreground/90">{business.phone}</span>
                        </div>
                    )}

                    {business.email ? (
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                            <a href={`mailto:${business.email}`} className="text-xs font-black text-emerald-500 hover:underline truncate">
                                {business.email}
                            </a>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 opacity-30">
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] uppercase font-black tracking-widest italic">Email Invisible</span>
                        </div>
                    )}
                </div>

                {/* Outreach Action */}
                <div className="mt-auto space-y-3">
                    <button
                        onClick={handleCopyPitch}
                        className={cn(
                            "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl group/btn overflow-hidden relative",
                            copied
                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                : isPriority
                                    ? "bg-primary text-white shadow-primary/20 hover:scale-[1.02]"
                                    : "bg-white/5 text-foreground border border-white/10 hover:bg-white/10"
                        )}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                        {copied ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4 group-hover/btn:animate-pulse" />}
                        <span className="relative z-10">{copied ? "Pitch Copied" : "Copy Mission Pitch"}</span>
                    </button>

                    <div className="flex gap-2">
                        {business.website ? (
                            <a
                                href={business.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Globe className="w-3.5 h-3.5" />
                                Review Site
                            </a>
                        ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/2 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-30 cursor-not-allowed">
                                <X className="w-3.5 h-3.5" />
                                No Target URL
                            </div>
                        )}
                        <a
                            href={business.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + " " + business.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-all"
                            title="View Mission Coordinates"
                        >
                            <Target className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

