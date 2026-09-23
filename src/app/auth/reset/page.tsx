'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import PasswordInput from '@/components/PasswordInput';

const input = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition';

function ResetForm() {
    const token = useSearchParams().get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) return setError('Passwords do not match');
        try {
            await axios.post('/api/auth/reset', { token, password });
            setDone(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Set New Password</h2>
            {done ? (
                <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">Your password has been updated.</p>
                    <Link href="/auth/signin" className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">Sign in</Link>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{error}</div>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <PasswordInput required className={input} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <p className="text-xs text-gray-500 mt-1">Must be 8+ chars, include 1 uppercase, 1 number, 1 special char.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <PasswordInput required className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition">Reset Password</button>
                </form>
            )}
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Suspense><ResetForm /></Suspense>
        </div>
    );
}
