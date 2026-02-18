'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/auth/signin?verified=true');
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) {
            setError('An error occurred during verification.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setResendLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setTimer(60); // 1 minute cooldown
            } else {
                setError(data.message || 'Failed to resend code');
            }
        } catch (err) {
            setError('An error occurred.');
        } finally {
            setResendLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="text-center">
                <p className="text-red-500 mb-4">No email specified.</p>
                <Link href="/auth/signup" className="text-blue-600 underline">Back to Sign Up</Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Verify Email</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the code sent to <strong>{email}</strong></p>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
                <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-center text-3xl tracking-[1em] font-mono font-bold"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                />

                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-70 flex justify-center items-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>
            </form>

            <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Didn't receive code?</p>
                <button
                    onClick={handleResend}
                    disabled={timer > 0 || resendLoading}
                    className="text-blue-600 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline text-sm"
                >
                    {resendLoading ? 'Sending...' : timer > 0 ? `Resend available in ${timer}s` : 'Resend Code'}
                </button>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Suspense fallback={<div>Loading...</div>}>
                <VerifyForm />
            </Suspense>
        </div>
    );
}
