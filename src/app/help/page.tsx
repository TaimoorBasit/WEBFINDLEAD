'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STATUS_STYLE: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    ANSWERED: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-green-100 text-green-800',
};
const STATUS_LABEL: Record<string, string> = { OPEN: 'Waiting for support', ANSWERED: 'Support replied', CLOSED: 'Closed' };

export default function HelpPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<null | 'success' | 'error'>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [openId, setOpenId] = useState<string | null>(null);
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState(false);

    const loadTickets = useCallback(
        () => fetch('/api/help').then((r) => (r.ok ? r.json() : [])).then(setTickets).catch(() => {}),
        []
    );
    useEffect(() => { if (session) loadTickets(); }, [session, loadTickets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) {
            router.push('/auth/signin');
            return;
        }
        try {
            const res = await fetch('/api/help', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message }),
            });
            if (res.ok) {
                setStatus('success');
                setSubject('');
                setMessage('');
                loadTickets();
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const call = async (id: string, method: 'POST' | 'PATCH', body: object) => {
        setBusy(true);
        try {
            await fetch(`/api/help/${id}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            await loadTickets();
        } finally {
            setBusy(false);
        }
    };

    const toggle = (t: any) => {
        const opening = openId !== t.id;
        setOpenId(opening ? t.id : null);
        setReply('');
        if (opening && t.userUnread) {
            call(t.id, 'PATCH', { action: 'seen' });
            window.dispatchEvent(new Event('help-unread-changed'));
        }
    };

    return (
        <div className="bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary">
            <div className="max-w-4xl mx-auto bg-card p-6 rounded-3xl border border-border shadow-xl">
                <h1 className="text-4xl font-black tracking-tighter mb-6 text-foreground">
                    Support Center
                </h1>
                <p className="text-muted-foreground font-medium mb-8 text-lg">
                    Having trouble? Submit a ticket and our team will get back to you shortly.
                </p>

                {status === 'success' && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 font-bold text-sm">
                        Request submitted successfully! We&apos;ll be in touch.
                    </div>
                )}
                {status === 'error' && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 font-bold text-sm">
                        Failed to submit request. Please try again.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Subject</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-muted/50 border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium placeholder:text-muted-foreground/50"
                            placeholder="e.g. Trouble exporting leads"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Message</label>
                        <textarea
                            required
                            rows={5}
                            className="w-full bg-muted/50 border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium placeholder:text-muted-foreground/50"
                            placeholder="Describe your issue in detail..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        Submit Request
                    </button>
                </form>

                {tickets.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-black tracking-tighter mb-4">My Tickets</h2>
                        <div className="space-y-3">
                            {tickets.map((t) => {
                                const thread = [{ id: 'first', sender: 'USER', body: t.message, createdAt: t.createdAt }, ...t.messages];
                                return (
                                    <div key={t.id} className="border border-border rounded-xl bg-muted/30 overflow-hidden">
                                        <button onClick={() => toggle(t)} className="w-full flex justify-between items-center gap-3 p-4 text-left">
                                            <span className="font-bold truncate">
                                                {t.userUnread && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />}
                                                {t.subject}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${STATUS_STYLE[t.status]}`}>
                                                {STATUS_LABEL[t.status]}
                                            </span>
                                        </button>

                                        {openId === t.id && (
                                            <div className="border-t border-border p-4 space-y-3">
                                                {thread.map((m: any) => (
                                                    <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.sender === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                                                            {m.body}
                                                            <div className="text-[10px] opacity-60 mt-1">
                                                                {m.sender === 'USER' ? 'You' : 'Support'} · {new Date(m.createdAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {t.status === 'CLOSED' && (
                                                    <p className="text-xs text-muted-foreground text-center">This ticket is closed. Reply below to reopen it.</p>
                                                )}

                                                <div className="flex gap-2 pt-2">
                                                    <textarea
                                                        rows={2}
                                                        value={reply}
                                                        onChange={(e) => setReply(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="flex-1 bg-muted/50 border border-border rounded-xl p-3 text-sm outline-none focus:border-primary"
                                                    />
                                                    <button
                                                        disabled={busy || !reply.trim()}
                                                        onClick={async () => { await call(t.id, 'POST', { body: reply }); setReply(''); }}
                                                        className="px-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-40"
                                                    >
                                                        Send
                                                    </button>
                                                </div>

                                                {t.status !== 'CLOSED' && (
                                                    <button
                                                        disabled={busy}
                                                        onClick={() => call(t.id, 'PATCH', { action: 'close' })}
                                                        className="text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                                                    >
                                                        My issue is solved — close ticket
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
