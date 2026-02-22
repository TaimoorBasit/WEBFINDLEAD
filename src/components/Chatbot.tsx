"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Minus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm your WebFind Assistant. How can I help you find better leads today? 🚀" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            const data = await res.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please check your connection." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-5 flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight">WebFind Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50"
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex w-full",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-primary text-white rounded-tr-none"
                                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Prompts */}
                    {messages.length === 1 && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 ml-1">Suggested Questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "How do I find leads?",
                                    "What is website analysis?",
                                    "Can I export my leads?"
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => {
                                            setInput(q);
                                            // Trigger next tick to avoid input lag
                                            setTimeout(() => handleSend(), 0);
                                        }}
                                        className="text-[11px] font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form
                        onSubmit={handleSend}
                        className="p-4 bg-white border-t border-slate-100 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your question..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-slate-900"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </form>
                </div>
            )}

            {/* Bubble Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group relative overflow-hidden",
                    isOpen ? "bg-slate-900 rotate-90" : "bg-primary"
                )}
            >
                {/* Decorative glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <>
                        <div className="absolute top-0 right-0 p-1">
                            <div className="w-2.5 h-2.5 bg-white rounded-full border-2 border-primary animate-ping" />
                        </div>
                        <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                    </>
                )}
            </button>
        </div>
    );
}
