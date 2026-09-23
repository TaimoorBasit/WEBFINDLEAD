'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_STYLE: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    ANSWERED: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-green-100 text-green-800',
};
const STATUS_LABEL: Record<string, string> = { OPEN: 'Needs reply', ANSWERED: 'Answered', CLOSED: 'Closed' };

export default function AdminHelp({ requests }: { requests: any[] }) {
    const router = useRouter();
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'ANSWERED' | 'CLOSED'>('OPEN');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);

    const list = requests.filter((r) => filter === 'ALL' || r.status === filter);
    const selected = requests.find((r) => r.id === selectedId);
    const count = (s: string) => requests.filter((r) => r.status === s).length;

    const send = async (body: { reply?: string; status?: string }) => {
        if (!selected) return;
        setBusy(true);
        try {
            const res = await fetch('/api/admin/help', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selected.id, ...body }),
            });
            if (!res.ok) throw new Error();
            if (body.reply) setText('');
            router.refresh();
        } catch {
            alert('Failed to update ticket');
        } finally {
            setBusy(false);
        }
    };

    // The user's first message lives on the ticket itself; later messages are in `messages`.
    const thread = selected
        ? [{ id: 'first', sender: 'USER', body: selected.message, createdAt: selected.createdAt }, ...selected.messages]
        : [];

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-4">
                {(['OPEN', 'ANSWERED', 'CLOSED', 'ALL'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${filter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 hover:border-primary/50'}`}
                    >
                        {f === 'ALL' ? `All (${requests.length})` : `${STATUS_LABEL[f]} (${count(f)})`}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4">
                <div className="border rounded-lg overflow-hidden max-h-[70vh] overflow-y-auto bg-white">
                    {list.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-8">No tickets here.</p>
                    ) : (
                        list.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedId(r.id)}
                                className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selectedId === r.id ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-bold text-sm text-gray-800 truncate">{r.subject}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between gap-2">
                                    <span className="truncate">{r.user?.name || r.user?.email}</span>
                                    <span className="whitespace-nowrap">{new Date(r.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="border rounded-lg bg-white flex flex-col max-h-[70vh]">
                    {!selected ? (
                        <p className="text-gray-400 italic text-center py-16">Select a ticket to view the conversation.</p>
                    ) : (
                        <>
                            <div className="p-3 border-b flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-800 truncate">{selected.subject}</h3>
                                    <p className="text-xs text-gray-500 font-mono truncate">{selected.user?.name ? `${selected.user.name} · ` : ''}{selected.user?.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
                                    <button
                                        disabled={busy}
                                        onClick={() => send({ status: selected.status === 'CLOSED' ? 'OPEN' : 'CLOSED' })}
                                        className="px-3 py-1 text-xs font-bold bg-gray-800 text-white rounded"
                                    >
                                        {selected.status === 'CLOSED' ? 'Reopen' : 'Resolve & Close'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                                {thread.map((m: any) => (
                                    <div key={m.id} className={`flex ${m.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.sender === 'ADMIN' ? 'bg-primary text-white' : 'bg-white border'}`}>
                                            {m.body}
                                            <div className={`text-[10px] mt-1 ${m.sender === 'ADMIN' ? 'text-white/70' : 'text-gray-400'}`}>
                                                {m.sender === 'ADMIN' ? 'Support' : 'User'} · {new Date(m.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t flex gap-2">
                                <textarea
                                    rows={2}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Write a reply (the user is emailed)..."
                                    className="flex-1 border p-2 rounded text-sm"
                                />
                                <button
                                    disabled={busy || !text.trim()}
                                    onClick={() => send({ reply: text })}
                                    className="px-4 text-xs font-bold bg-indigo-500 text-white rounded disabled:opacity-40"
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
