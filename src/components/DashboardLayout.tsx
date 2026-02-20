"use client";

import { useState, useEffect } from "react";
import {
    Search,
    LayoutDashboard,
    Users,
    Settings,
    Menu,
    LogOut,
    HelpCircle,
    Shield,
    X,
    MapPin,
    Database,
    Download
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Custom Premium Realistic Logo Component
const Logo = () => (
    <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10"
    >
        <rect width="32" height="32" rx="10" fill="url(#logo-grad)" />
        <path
            d="M8 12L12 24L16 16L20 24L24 12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
        <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
        </defs>
    </svg>
);

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }, []);

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: Search, label: "Find Leads", href: "/search" },
        { icon: Database, label: "My Leads", href: "/leads" },
        { icon: HelpCircle, label: "Help & Support", href: "/help" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    if (session?.user?.role === 'ADMIN') {
        navItems.push({ icon: Shield, label: "Admin Panel", href: "/admin" });
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-primary/30 selection:text-primary">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="pt-10 px-8 pb-10 flex items-center gap-4">

                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter text-foreground leading-none">WebFind<span className="text-primary">Lead</span></span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">Lead Intelligence</span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 space-y-1.5 mt-2">
                        {navItems.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="group flex items-center gap-3 px-5 py-3.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest relative overflow-hidden"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary group-hover:h-3 transition-all duration-300 rounded-r-full" />
                                <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span>{item.label}</span>
                            </a>
                        ))}
                    </nav>

                    <div className="p-6">
                        {session?.user?.role === 'ADMIN' && (
                            <a
                                href="/webfind-extension.zip"
                                download="webfind-extension.zip"
                                className="flex items-center justify-center gap-3 px-4 py-3 mb-6 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-xs uppercase tracking-widest w-full group"
                            >
                                <Download className="w-4 h-4 group-hover:animate-bounce" />
                                <span>Get Extension</span>
                            </a>
                        )}

                        <div className="bg-muted/30 border border-border/50 rounded-3xl p-5 mb-6">
                            {session ? (
                                <>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {session.user?.name?.[0] || 'U'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-foreground">{session.user?.email?.split('@')[0]}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">{session.user?.plan || 'Free Plan'}</span>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                            <span>Leads Balance</span>
                                            <span className={session.user.role === 'ADMIN' ? 'text-purple-500' : (session.user as any).leadsBalance > 0 ? 'text-emerald-500' : 'text-red-500'}>
                                                {session.user.role === 'ADMIN' ? '∞' : (session.user as any).leadsBalance || 0}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                                style={{ width: session.user.role === 'ADMIN' ? '100%' : `${Math.min(((session.user as any).leadsBalance || 0) / 75 * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-red-500 hover:text-red-600 mt-3"
                                    >
                                        <LogOut className="w-3 h-3" /> Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link href="/auth/signin" className="block text-center text-xs font-bold text-primary hover:underline">
                                    Sign In / Sign Up
                                </Link>
                            )}
                        </div>


                    </div>
                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30 lg:hidden">
                    <button
                        className="p-2 text-muted-foreground"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Logo />
                        </div>
                        <span className="font-bold text-sm tracking-tight text-primary uppercase">WebFindLead</span>
                    </div>
                </header>
                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-muted/30">
                    <div className="max-w-7xl mx-auto">
                        {children}
                        <footer className="mt-20 pb-10 border-t border-border/50 pt-10 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-muted-foreground text-sm font-medium">
                                © {new Date().getFullYear()} WebFindLead. All rights reserved.
                            </p>
                            <p className="text-muted-foreground text-sm font-medium">
                                Developed with passion by{" "}
                                <a
                                    href="https://taimoorawan.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 transition-colors font-bold"
                                >
                                    Taimoor Awan
                                </a>
                            </p>
                        </footer>
                    </div>
                </div>
            </main>
        </div >
    );
}
