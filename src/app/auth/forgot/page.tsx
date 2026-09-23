'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try { await axios.post('/api/auth/forgot', { email }); } finally { setLoading(false); setSent(true); }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Forgot Password</h2>
                {sent ? (
                    <p className="text-center text-sm text-gray-600 my-6">
                        If an account exists for <b>{email}</b>, we&apos;ve sent a password reset link. It expires in 1 hour.
                    </p>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <p className="text-center text-sm text-gray-600">Enter your email and we&apos;ll send you a link to reset your password.</p>
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50">
                            {loading ? 'Sending…' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
                <p className="mt-4 text-center text-sm">
                    <Link href="/auth/signin" className="text-blue-600 hover:underline">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}
