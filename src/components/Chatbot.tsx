"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Minus, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────
const KB: { keywords: string[]; answer: string }[] = [
    {
        keywords: ["what is", "webfindlead", "about", "platform", "tool", "website"],
        answer: "🚀 **WebFindLead** is a lead generation platform that scans Google Maps to find local businesses — especially ones with **no website or a low-quality site**. It's perfect for web designers, agencies, and freelancers looking for clients to pitch to."
    },
    {
        keywords: ["find leads", "how to search", "search leads", "find businesses", "scan"],
        answer: "🔍 To find leads:\n1. Click **'Find Leads'** in the sidebar.\n2. Enter a **business category** (e.g. Dentist, Plumber, Bakery).\n3. Enter a **location** (e.g. New York, London).\n4. Hit **Search** — results appear instantly with website status, ratings, and contact info!"
    },
    {
        keywords: ["save lead", "saving", "bookmark", "add to leads", "keep"],
        answer: "💾 To save a lead:\n1. Go to **Find Leads** and run a search.\n2. Click the **save icon** (bookmark) on any result card.\n3. The lead is added to your **My Leads** dashboard automatically."
    },
    {
        keywords: ["my leads", "saved leads", "lead list", "dashboard leads"],
        answer: "📋 **My Leads** is your personal lead dashboard. Here you can:\n- View all your saved businesses.\n- Filter by **status** (New, Contacted, Converted).\n- Update pipeline stages.\n- **Export** all leads to a CSV file.\n\nAccess it from the sidebar: **My Leads**."
    },
    {
        keywords: ["export", "csv", "download leads", "spreadsheet"],
        answer: "📥 To export your leads:\n1. Go to **My Leads** in the sidebar.\n2. Click the **Export CSV** button at the top.\n3. A `.csv` file will download instantly — open it in Excel or Google Sheets!"
    },
    {
        keywords: ["audit", "website audit", "analyze", "analysis", "digital score", "report"],
        answer: "🔎 The **Website Audit** tool gives any business a Digital Health Score (0-100). It checks:\n- Whether they have a website.\n- Ad pixel presence (Facebook/Google).\n- Social media profiles.\n- Contact info availability.\n\nClick **Audit** on any lead card from search results to generate a full report."
    },
    {
        keywords: ["price", "pricing", "plan", "cost", "subscription", "upgrade", "pay"],
        answer: "💳 **WebFindLead Plans:**\n\n🆓 **Free Trial** — 3 leads (no card needed)\n⚡ **Pro Scanner** — $20/month → 75 leads/month\n🏢 **Agency** — $99/month → Unlimited leads\n\nTo upgrade, go to the **Homepage** or **Settings → Plan & Billing** and click Upgrade."
    },
    {
        keywords: ["coupon", "discount", "promo", "code", "voucher"],
        answer: "🏷️ To apply a coupon:\n1. Go to the **Homepage** and click your desired plan.\n2. In the checkout/upgrade modal, enter your **coupon code**.\n3. If valid, your discount is applied instantly before payment."
    },
    {
        keywords: ["sign up", "register", "create account", "new account"],
        answer: "✍️ To create an account:\n1. Click **Sign In / Sign Up** from the sidebar.\n2. Fill in your name, email, and password.\n3. You'll receive a **6-digit OTP** to your email — enter it to verify.\n4. You're in! You get **3 free leads** to start."
    },
    {
        keywords: ["sign in", "login", "log in", "access account"],
        answer: "🔐 To sign in:\n1. Click **Sign In / Sign Up** from the sidebar.\n2. Enter your registered **email and password**.\n3. Click **Sign In** — you'll be taken to your dashboard."
    },
    {
        keywords: ["otp", "verification", "verify", "code", "email code", "not received"],
        answer: "📧 About email verification:\n- After signing up, a **6-digit code** is sent to your email.\n- Check your **Spam/Junk** folder if you don't see it.\n- Codes expire in **10 minutes** — use the **Resend Code** button if needed.\n- Make sure the email address you entered is correct."
    },
    {
        keywords: ["password", "change password", "forgot password", "reset"],
        answer: "🔒 To change your password:\n1. Go to **Settings** in the sidebar.\n2. Click on the **Account** tab.\n3. Enter your current password and your new password.\n4. Click **Update Password**.\n\nIf you forgot your password, contact support for help."
    },
    {
        keywords: ["settings", "account settings", "profile", "update name"],
        answer: "⚙️ In **Settings** you can:\n- Update your **display name**.\n- Change your **password**.\n- View your current **plan & billing**.\n- Add or update your **payment method**.\n- Cancel your subscription.\n- Delete your account.\n\nAccess via the sidebar → **Settings**."
    },
    {
        keywords: ["leads balance", "credits", "how many leads", "used up", "ran out"],
        answer: "📊 Your **Leads Balance** is shown in the sidebar at the bottom. Each time you save a lead it uses one credit.\n- Free: 3 leads\n- Pro: 75 leads/month\n- Agency: Unlimited\n\nUpgrade anytime from **Settings → Plan & Billing**."
    },
    {
        keywords: ["contact", "support", "help", "issue", "problem", "not working"],
        answer: "🆘 Need help? Here's what to do:\n1. Go to **Help & Support** in the sidebar.\n2. Submit a help request with your subject and message.\n3. Our team will review and respond as soon as possible.\n\nYou can also try refreshing the page or signing out and back in."
    },
    {
        keywords: ["delete", "remove", "delete account"],
        answer: "⚠️ To delete your account:\n1. Go to **Settings** → **Account** tab.\n2. Scroll to the bottom — click **Delete Account**.\n3. Confirm the action.\n\n⚠️ This is **permanent and irreversible** — all your leads and data will be lost."
    },
    {
        keywords: ["cancel", "cancel subscription", "stop subscription"],
        answer: "❌ To cancel your subscription:\n1. Go to **Settings** → **Plan & Billing**.\n2. Click **Cancel Subscription** under your current plan.\n3. You'll retain access until the end of your billing period."
    },
    {
        keywords: ["extension", "browser extension", "chrome extension"],
        answer: "🔌 WebFindLead has a **browser extension** for power users. It's available for admin accounts. If you have access, you'll see a **Get Extension** button in the sidebar. Contact us via Help & Support if you'd like to learn more."
    },
    {
        keywords: ["google maps", "maps data", "how does it work", "data source"],
        answer: "🗺️ WebFindLead pulls business data directly from **Google Maps**. When you search a category + location, it scans the map results and checks each business for:\n- Website presence\n- Website quality\n- Ad tracking pixels\n- Social profiles\n- Contact info (phone, email)\n\nAll in real-time — no outdated databases!"
    },
    {
        keywords: ["no website", "missing website", "without website", "website missing"],
        answer: "🌐 Businesses marked **'No Website'** or **'Low Quality'** are your best prospects! These businesses need digital help and are likely open to outreach. Use the audit tool to generate a report and show them exactly what they're missing — it's a great sales pitch!"
    },
    {
        keywords: ["hi", "hello", "hey", "hii", "howdy", "greetings", "sup"],
        answer: "👋 Hey there! I'm the **WebFind Assistant**. I can help you with:\n- Finding and saving leads\n- Understanding plans & pricing\n- Account and settings help\n- Using the website audit tool\n\nWhat would you like to know? 😊"
    },
    {
        keywords: ["thank", "thanks", "great", "awesome", "perfect", "nice", "good"],
        answer: "😊 You're welcome! Is there anything else I can help you with?"
    },
];

function getBotResponse(userInput: string): string {
    const lower = userInput.toLowerCase();

    for (const entry of KB) {
        if (entry.keywords.some(kw => lower.includes(kw))) {
            return entry.answer;
        }
    }

    return "🤔 I'm not sure about that. Try asking about:\n- **How to find leads**\n- **Pricing & plans**\n- **Exporting leads**\n- **Account & settings**\n\nOr visit **Help & Support** in the sidebar for direct assistance!";
}

// ─── Quick Prompt Suggestions ────────────────────────────────────────────────
const QUICK_PROMPTS = [
    "How do I find leads?",
    "What are the pricing plans?",
    "How do I export my leads?",
    "How does the Website Audit work?",
];

// ─── Markdown-style simple formatter ─────────────────────────────────────────
function formatMessage(text: string) {
    const lines = text.split("\n");
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // Bold text wrapped in **
                const formatted = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                );
                // List items
                if (line.startsWith("- ") || /^\d+\./.test(line)) {
                    return (
                        <div key={i} className="flex items-start gap-1.5 pl-1">
                            <span className="text-primary mt-0.5 shrink-0">
                                {line.startsWith("- ") ? "•" : line.match(/^(\d+)\./)?.[1] + "."}
                            </span>
                            <span>{formatted.map((p, j) => typeof p === 'string'
                                ? p.replace(/^[-\d.]+\s*/, '')
                                : p
                            )}</span>
                        </div>
                    );
                }
                return <p key={i}>{formatted}</p>;
            })}
        </div>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 Hi! I'm your **WebFind Assistant**. Ask me anything about finding leads, pricing, exporting, or using the platform!"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const sendMessage = (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setShowQuickPrompts(false);
        setLoading(true);

        // Simulate slight delay for natural feel
        setTimeout(() => {
            const reply = getBotResponse(text);
            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
            setLoading(false);
        }, 600);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[380px] h-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight">WebFind Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-primary text-white rounded-tr-none font-medium"
                                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                )}>
                                    {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Prompts */}
                    {showQuickPrompts && (
                        <div className="px-4 pb-3 bg-white border-t border-slate-100 shrink-0">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pt-3 mb-2">Quick Questions:</p>
                            <div className="space-y-1.5">
                                {QUICK_PROMPTS.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="w-full text-left text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-between gap-2"
                                    >
                                        <span>{q}</span>
                                        <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-slate-900"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed group shrink-0"
                        >
                            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden group",
                    isOpen ? "bg-slate-800" : "bg-primary"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <>
                        <div className="absolute top-1 right-1">
                            <span className="flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/90" />
                            </span>
                        </div>
                        <MessageCircle className="w-7 h-7 text-white" />
                    </>
                )}
            </button>
        </div>
    );
}
