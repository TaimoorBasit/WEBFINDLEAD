"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  TrendingUp,
  Search,
  ArrowRight,
  Target,
  BarChart3,
  Globe,
  Star,
  Check
} from "lucide-react";
import { Business } from "@/components/ResultsTable";
import { useRouter, useSearchParams } from "next/navigation";
import PricingModal from "@/components/PricingModal";

const RadarPulse = () => (
  <div className="relative w-48 h-48 flex items-center justify-center">
    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping [animation-duration:3s]" />
    <div className="absolute inset-4 bg-primary/20 rounded-full animate-ping [animation-duration:3.5s]" />
    <div className="absolute inset-8 bg-primary/20 rounded-full animate-ping [animation-duration:4s]" />
    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] z-10 border border-white/20">
      <Search className="text-white w-8 h-8 animate-pulse [animation-duration:2s]" />
    </div>

    {/* Scanning Line */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-spin [animation-duration:5s]" style={{ transformOrigin: 'center' }} />
  </div>
);

const MockLeadCard = ({ name, category, status, delay }: { name: string, category: string, status: 'NO_WEBSITE' | 'LOW_QUALITY', delay: string }) => (
  <div
    className={`bg-card/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-right-10 fade-in duration-700 fill-mode-backwards ${delay}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === 'NO_WEBSITE' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
      {status === 'NO_WEBSITE' ? <Globe className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
    </div>
    <div className="flex flex-col min-w-0">
      <span className="font-bold text-sm truncate">{name}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-black mb-2">{category}</span>
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${status === 'NO_WEBSITE' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
        {status === 'NO_WEBSITE' ? 'Missing Website' : 'Low Quality'}
      </div>
    </div>
  </div>
);

function DashboardContent() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    noWebsite: 0,
    interested: 0,
    closed: 0
  });

  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('upgrade')) {
      const plan = searchParams.get('plan') === 'agency' ? 'Agency' : 'Pro Scanner';
      setModalPlan(plan);
      setShowPricing(true);
    }
  }, [searchParams]);
  const [showPricing, setShowPricing] = useState(false);
  const [modalPlan, setModalPlan] = useState<string | undefined>(undefined);

  const fetchStats = async () => {
    if (!session) return;

    try {
      const response = await axios.get("/api/leads");
      const leads = response.data;
      setStats({
        totalLeads: leads.length,
        noWebsite: leads.filter((l: any) => l.websiteStatus === 'NO_WEBSITE').length,
        interested: leads.filter((l: any) => l.status === 'INTERESTED' || l.status === 'CONTACTED').length,
        closed: leads.filter((l: any) => l.status === 'CLOSED').length
      });
    } catch (error) {
      console.log("Stats fetch skipped (not logged in or error)");
    }
  };

  useEffect(() => {
    if (session) fetchStats();
  }, [session]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 selection:bg-primary/30">
      {/* Hero Section */}
      <section className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-4">
        <div className="flex flex-col gap-6 z-10">

          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[0.95] drop-shadow-sm">
            Find High-Value <br />
            <span className="text-primary underline decoration-primary/20 underline-offset-8">Leads Instantly.</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-lg leading-relaxed font-medium">
            WebFindLead is an autonomous intelligence scanner that discovers local businesses without a professional web presence. <strong>Turn missing websites into monthly revenue.</strong>
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <a
              href="/search"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:shadow-[0_12px_24px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Start Free Scan
            </a>
            <a
              href="/leads"
              className="px-6 py-3 bg-white border border-border text-foreground rounded-xl font-bold text-base hover:bg-muted/50 transition-all flex items-center gap-2 group"
            >
              My Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <div className="flex flex-col">
              <span className="text-2xl font-black">2.4k+</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Businesses found</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-2xl font-black">98%</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Accuracy</span>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center p-8">
          <RadarPulse />

          {/* Floating Result Examples */}
          <div className="absolute top-0 right-0 z-20">
            <MockLeadCard name="Elite Plumbing" category="Service" status="NO_WEBSITE" delay="delay-150" />
          </div>
          <div className="absolute bottom-10 -left-10 z-20">
            <MockLeadCard name="Green Garden" category="Landscaping" status="LOW_QUALITY" delay="delay-300" />
          </div>
          <div className="absolute top-1/2 -right-12 z-20">
            <MockLeadCard name="Bistro 42" category="Restaurant" status="NO_WEBSITE" delay="delay-500" />
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {[
          {
            label: "Pipeline Value",
            value: stats.totalLeads,
            sub: "Total Leads Saved",
            icon: (props: any) => (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
                <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
                <path d="M12 6V18M12 6L9 9M12 6L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 14L12 19L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            color: "text-blue-600",
            bg: "bg-blue-600/10"
          },
          {
            label: "Gold Opportunities",
            value: stats.noWebsite,
            sub: "High Intent Leads",
            icon: (props: any) => (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            ),
            color: "text-amber-500",
            bg: "bg-amber-500/10"
          },
          {
            label: "Active Outreach",
            value: stats.interested,
            sub: "In Pipeline",
            icon: (props: any) => (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.9A8.38 8.38 0 0 1 4 11.3a8.5 8.5 0 0 1 8.5-8.5 8.5 8.5 0 0 1 8.5 8.7Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            color: "text-primary",
            bg: "bg-primary/10"
          },
          {
            label: "Total Revenue",
            value: stats.closed,
            sub: "Success Stories",
            icon: (props: any) => (
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
          },
        ].map((card, idx) => (
          <div key={idx} className="bg-card border border-border p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
            <div className="flex flex-col relative z-10">
              <span className={`p-4 rounded-2xl ${card.bg} ${card.color} w-fit mb-6 transition-transform group-hover:scale-110 duration-500 border border-current/10`}>
                <card.icon className="w-6 h-6" />
              </span>
              <span className="text-4xl font-black tracking-tighter mb-1">{card.value}</span>
              <span className="text-foreground font-bold text-sm tracking-tight">{card.label}</span>
              <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-2">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Scanned Platforms - Realistic Logos for Trust */}
      <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8 lg:p-12 mt-12 mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-xl font-black tracking-tighter mb-2 italic">Scanning Infrastructure</h3>
            <p className="text-muted-foreground text-sm font-medium">Real-time data extraction from the world's leading platforms.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Google_Maps_icon_%282020%29.svg" alt="Google Maps" className="h-8 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/Yelp_Logo.svg" alt="Yelp" className="h-6 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="h-8 object-contain" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="h-8 object-contain" />
            <img src="https://img.icons8.com/color/48/yellow-pages.png" alt="Yellow Pages" className="h-8 object-contain" />
          </div>
        </div>
      </div>


      <div className="text-center mb-4">
        <h2 className="text-4xl font-black tracking-tighter mb-4">Pricing & Insights</h2>
        <p className="text-muted-foreground text-lg">Everything you need to succeed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Market Penetration */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 rounded-[2.5rem] p-10 relative overflow-hidden group h-full flex flex-col justify-between">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
              <BarChart3 className="text-white w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-4 leading-tight">Market <br />Penetration</h3>
            <p className="text-foreground/70 text-sm font-medium leading-relaxed">
              Target <strong>High-Intent</strong> local niches with zero digital overhead.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-primary/10">
            <div className="flex items-center justify-between group/link cursor-pointer">
              <span className="text-xs font-black uppercase tracking-widest text-primary">View Report</span>
              <ArrowRight className="w-4 h-4 text-primary group-hover/link:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Pro Scanner Card */}
        <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-4 group relative overflow-hidden flex flex-col">
          <div className="flex-1 p-8">
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">Recommended Integration</span>
                <h3 className="text-5xl font-black tracking-tighter mt-4 flex items-baseline gap-2">
                  $20<span className="text-sm text-muted-foreground tracking-normal font-bold">/mo</span>
                </h3>
              </div>
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center border border-border group-hover:rotate-12 transition-all duration-500">
                <Target className="text-foreground w-7 h-7" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Unlimited Website Audits",
                "Advanced SEO Analysis",
                "Custom Pitch Templates",
                "Export to CRM (CSV/PDF)",
                "Bulk Scanning",
                "Dedicated API Access"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 group/item">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                    <Check className="w-3 h-3 text-emerald-600 group-hover/item:text-white" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setModalPlan('Pro Scanner'); setShowPricing(true); }}
            className="w-full bg-foreground text-background py-6 text-sm font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-500 rounded-2xl"
          >
            Activate Pro Scanner
          </button>
        </div>

        {/* Agency Plan Card */}
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 group relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Enterprise</span>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black tracking-tight text-white mb-2 leading-tight">Agency <br />Force</h3>
            <p className="text-white/50 text-sm font-medium mb-8">Scale your outreach with unlimited seats.</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white/80 italic">White-label Reports</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white/80 italic">Team Management</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setModalPlan('Agency'); setShowPricing(true); }}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest mt-8 transition-all"
          >
            Go Agency
          </button>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="mt-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-primary/0 to-primary/40" />
        <div className="pt-32 pb-24 text-center max-w-3xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20 text-[10px] font-black uppercase tracking-widest mb-8">
            <Star className="w-3 h-3 fill-amber-500" /> Our Philosophy
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-2xl lg:text-3xl font-black mb-8 tracking-tighter leading-tight text-foreground drop-shadow-sm">
              &quot;Your mission is to bridge the gap between their <span className="text-primary bg-primary/10 px-2 rounded-lg">business excellence</span> and their <span className="text-amber-500 bg-amber-500/10 px-2 rounded-lg">digital invisibility</span>.&quot;
            </h3>

            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50" />
              <p className="text-amber-600 font-black text-xs uppercase tracking-[0.2em]">Platform Philosophy</p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>
        </div>
      </div>

      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} initialPlan={modalPlan} />
    </div >
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
