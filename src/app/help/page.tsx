'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<null | 'success' | 'error'>(null);

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
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 pt-24 font-sans selection:bg-primary/30 selection:text-primary">
            <div className="max-w-2xl mx-auto bg-card p-8 rounded-3xl border border-border shadow-xl">
                <h1 className="text-4xl font-black tracking-tighter mb-6 text-foreground">
                    Support Center
                </h1>
                <p className="text-muted-foreground font-medium mb-8 text-lg">
                    Having trouble? Summit a ticket and our team will get back to you shortly.
                </p>

                {status === 'success' && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 font-bold text-sm">
                        Request submitted successfully! We'll be in touch.
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
            </div>
        </div>
    );
}
