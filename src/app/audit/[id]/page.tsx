"use client";

import { useEffect, useState } from "react";
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    Globe,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Zap,
    Target,
    BarChart,
    Layout,
    Mail,
    Phone,
    MapPin,
    Star,
    ArrowRight
} from "lucide-react";
import axios from "axios";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AuditPage() {
    const { id } = useParams();
    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const downloadPDF = async () => {
        const element = document.getElementById('audit-report-content');
        if (!element) return;

        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#f8fafc"
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Audit-Report-${lead.name.replace(/\s+/g, '-')}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await axios.get(`/api/audit/${id}`);
                setLead(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-slate-400 animate-pulse">Analyzing digital footprint...</p>
            </div>
        </div>
    );

    if (!lead) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md border border-slate-100">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Report Not Found</h1>
                <p className="text-slate-500 font-medium mb-8">This audit link may have expired or is invalid.</p>
                <a href="/" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg transition-all">Back to Safety</a>
            </div>
        </div>
    );

    const pixels = lead.pixels ? JSON.parse(lead.pixels) : {};
    const ads = lead.ads ? JSON.parse(lead.ads) : {};
    const socials = lead.socials ? JSON.parse(lead.socials) : {};

    // Calculate Digital Score
    let score = 20; // Base score
    if (lead.websiteStatus === 'GOOD') score += 30;
    if (lead.websiteStatus === 'LOW_QUALITY') score += 15;
    if (pixels.facebook || pixels.google) score += 20;
    if (ads.facebook || ads.google) score += 20;
    if (Object.keys(socials).length > 2) score += 10;
    if (score > 100) score = 100;

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'GOOD') return <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Optimized</span>;
        if (status === 'LOW_QUALITY') return <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Low Quality</span>;
        return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Critical Issue</span>;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Brand */}
            <nav className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xl">W</div>
                        <span className="font-black text-slate-900 tracking-tighter text-lg underline decoration-primary decoration-4 underline-offset-4">WebFind Intelligence</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verified Audit Report</span>
                        </div>
                        <button
                            onClick={downloadPDF}
                            disabled={isExporting}
                            className="bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isExporting ? <BarChart className="w-4 h-4 animate-bounce" /> : <BarChart className="w-4 h-4 text-primary" />}
                            {isExporting ? "Generating..." : "Download PDF"}
                        </button>
                    </div>
                </div>
            </nav>

            <div id="audit-report-content">
                <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Hero Section */}
                        <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Target size={200} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <StatusBadge status={lead.websiteStatus} />
                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{lead.category || 'Business'}</span>
                                </div>

                                <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                                    {lead.name}
                                </h1>
                                <div className="flex items-center gap-4 text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-primary" /> {lead.address || 'Local Area'}</span>
                                    <span className="flex items-center gap-1.5 text-amber-500 font-black"><Star size={16} className="fill-current" /> {lead.rating || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Crisis Points / Critical Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Issue 1: Website */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-sm ${lead.websiteStatus === 'NO_WEBSITE' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${lead.websiteStatus === 'NO_WEBSITE' ? 'bg-red-500 text-white shadow-red-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`}>
                                    <Globe size={28} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Online Infrastructure</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                                    {lead.websiteStatus === 'NO_WEBSITE'
                                        ? "Critical Warning: No professional website detected. You are likely losing over 45% of customer conversions."
                                        : "Professional website detected, but there is always room for optimization for higher conversion rates."}
                                </p>
                                <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                                    <span className={`font-black uppercase text-[10px] ${lead.websiteStatus === 'NO_WEBSITE' ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {lead.websiteStatus === 'NO_WEBSITE' ? 'CRITICAL' : 'DETECTED'}
                                    </span>
                                </div>
                            </div>

                            {/* Issue 2: Tracking */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-sm ${!pixels.facebook && !pixels.google ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${!pixels.facebook && !pixels.google ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`}>
                                    <Target size={28} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Lead Re-Targeting</h3>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                                    {!pixels.facebook && !pixels.google
                                        ? "Ad Trackers (Pixels) are missing. This means you cannot 'follow' your website visitors with ads after they leave your site."
                                        : "Retargeting infrastructure is partially configured. Ensure all pixels are tracking high-intent actions."}
                                </p>
                                <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence</span>
                                    <span className={`font-black uppercase text-[10px] ${!pixels.facebook && !pixels.google ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {!pixels.facebook && !pixels.google ? 'MISSING' : 'ACTIVE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Analysis Grid */}
                        <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-10">
                                <BarChart className="text-primary" size={24} />
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Full Intelligence Audit</h2>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Google Ads", status: ads.google, icon: CheckCircle2 },
                                    { label: "Facebook Ads", status: ads.facebook, icon: Facebook },
                                    { label: "Tech Stack", status: !!lead.hosting, icon: Layout },
                                    { label: "Verified Email", status: !!lead.email, icon: Mail },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex flex-col items-center text-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.status ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.status ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                                            {item.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Scorecard */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Digital Score Card */}
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Zap size={100} />
                            </div>

                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8 border border-primary/20 bg-primary/5 px-4 py-2 rounded-full">Digital Health Index</span>

                                <div className="relative w-40 h-40 flex items-center justify-center mb-8">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={440}
                                            strokeDashoffset={440 - (440 * score) / 100}
                                            strokeLinecap="round"
                                            className="text-primary transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black tracking-tighter">{score}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">/ 100</span>
                                    </div>
                                </div>

                                <p className="text-center text-sm font-medium text-white/60 leading-relaxed mb-6">
                                    {score < 40 ? "Your business is currently invisible to high-value online traffic." :
                                        score < 70 ? "Stable foundation, but you are leaving significant revenue on the table." :
                                            "Excellent digital presence, but competitors are catching up."}
                                </p>

                                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
                                        <Shield size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Risk Assessment</span>
                                        <span className={`text-xs font-bold ${score < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {score < 50 ? 'High Competitive Risk' : 'Moderate Market Share'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info (Public) */}
                        <div className="bg-white rounded-[3rem] p-8 lg:p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Verified Channels</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                        <Phone size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Phone</span>
                                        <span className="text-sm font-bold text-slate-900">{lead.phone || 'Private Listing'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                        <Mail size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Email</span>
                                        <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{lead.email || 'Verified on Scan'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-slate-100">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                    <Globe size={12} /> Social Footprint
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(socials).length > 0 ? (
                                        Object.entries(socials).map(([platform, link]: [any, any]) => (
                                            <a key={platform} href={link} target="_blank" className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all">
                                                {platform === 'facebook' && <Facebook size={18} />}
                                                {platform === 'instagram' && <Instagram size={18} />}
                                                {platform === 'linkedin' && <Linkedin size={18} />}
                                                {platform === 'twitter' && <Twitter size={18} />}
                                            </a>
                                        ))
                                    ) : (
                                        <span className="text-xs font-medium text-slate-400 italic">No social profiles detected</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA / Footer */}
                <div className="max-w-6xl mx-auto px-6 mt-12">
                    <div className="bg-gradient-to-br from-primary via-primary/95 to-indigo-600 rounded-[3rem] p-10 lg:p-16 text-white text-center shadow-2xl shadow-primary/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter mb-6 leading-tight">Ready to fix these vulnerabilities?</h2>
                            <p className="text-white/70 text-lg font-medium mb-10">We specialize in transforming businesses with low digital scores into market leaders through optimized infrastructure and AI-driven growth.</p>
                            <button className="bg-white text-primary font-black px-12 py-5 rounded-[2rem] hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto shadow-xl">
                                Request Professional Consultation
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
