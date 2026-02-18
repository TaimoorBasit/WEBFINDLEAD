"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, CreditCard, Check, AlertCircle, Loader2, Plus } from "lucide-react";
import axios from "axios";

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'security' | 'billing'>('billing');

    // Profile State
    const [userName, setUserName] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);

    // Card State
    const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvc: "" });
    const [cardLoading, setCardLoading] = useState(false);

    // Cancel State
    const [cancelLoading, setCancelLoading] = useState(false);

    // Delete State
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Payment State
    const [showAddCard, setShowAddCard] = useState(false);

    // Init profile
    useEffect(() => {
        if (session?.user?.name && !userName) {
            setUserName(session.user.name);
        }
    }, [session, userName]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            await axios.put("/api/user/profile", { name: userName });
            await update({ name: userName }); // Update session
            setMessage({ type: 'success', text: "Profile updated successfully" });
        } catch (error: any) {
            setMessage({ type: 'error', text: "Failed to update profile" });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setCardLoading(true);
        try {
            await axios.post("/api/subscription/card", {
                cardNumber: cardDetails.number,
                expiry: cardDetails.expiry,
                cvc: cardDetails.cvc
            });
            await update(); // Refetch session to get new last4
            setShowAddCard(false);
            setMessage({ type: 'success', text: "Card updated successfully" });
        } catch (error: any) {
            setMessage({ type: 'error', text: "Failed to update card" });
        } finally {
            setCardLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm("Are you sure you want to cancel your subscription?")) return;
        setCancelLoading(true);
        try {
            await axios.post("/api/subscription/cancel");
            await update(); // Refetch session status
            setMessage({ type: 'success', text: "Subscription canceled" });
        } catch (error: any) {
            setMessage({ type: 'error', text: "Failed to cancel subscription" });
        } finally {
            setCancelLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to DELETE your account? This action is irreversible.")) return;
        setDeleteLoading(true);
        try {
            await axios.post("/api/user/delete");
            await signOut({ callbackUrl: '/' });
        } catch (error: any) {
            setMessage({ type: 'error', text: "Failed to delete account" });
            setDeleteLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match" });
            return;
        }

        setLoading(true);

        try {
            await axios.post("/api/user/change-password", {
                currentPassword,
                newPassword
            });

            setMessage({ type: 'success', text: "Password updated successfully" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            const msg = error.response?.data?.error || "Failed to update password";
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const user = session?.user as any;
    const isPlanActive = user?.subscriptionStatus === 'active';
    const isPlanCanceled = user?.subscriptionStatus === 'canceled';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your credentials, preferences, and subscription.</p>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Account
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Plan & Billing
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <Check className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                        {message.text}
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-12 max-w-md">
                        {/* Personal Information */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Update your details</p>
                                </div>
                            </div>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={session?.user?.email || ""}
                                        readOnly
                                        disabled
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 outline-none font-medium text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={profileLoading}
                                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm"
                                >
                                    {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        <div className="border-t border-slate-100 pt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Secure your account</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all font-medium text-slate-900"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                                </button>
                            </form>
                        </div>

                        <div className="border-t border-slate-100 pt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Delete Account</h2>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Permanently remove your account</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 mb-4">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>

                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="w-full border border-red-200 bg-red-50 text-red-600 font-bold py-3.5 rounded-xl hover:bg-red-100 transition-all text-sm flex justify-center items-center gap-2"
                            >
                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Account"}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Subscription Plan</h2>
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Manage your plan</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Plan</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-3xl font-black text-slate-900">
                                        {isPlanCanceled ? 'Canceled' :
                                            user?.plan === 'PRO_MONTHLY_20' ? 'Pro Scanner' :
                                                user?.role === 'ADMIN' ? 'Admin Access' : 'Free Trial'}
                                    </span>
                                    {isPlanActive && (
                                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        {user?.plan === 'AGENCY_MONTHLY_99' ? 'Unlimited Leads & Searches' :
                                            user?.plan === 'PRO_MONTHLY_20' ? '75 Monthly Leads' :
                                                '3 Free Leads Trial'}
                                    </li>
                                    <li className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        {user?.plan ? 'Priority Support' : 'Basic Support'}
                                    </li>
                                </ul>

                                <div className="flex flex-col gap-3">
                                    {(user?.plan && isPlanActive) ? (
                                        <>
                                            {user?.plan === 'PRO_MONTHLY_20' && (
                                                <button
                                                    onClick={() => router.push('/?upgrade=true&plan=agency')}
                                                    className="w-full bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-slate-900/25 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Upgrade to Agency ($99)
                                                </button>
                                            )}

                                            <button
                                                onClick={handleCancelSubscription}
                                                disabled={cancelLoading}
                                                className="text-sm font-bold text-red-500 underline decoration-red-200 underline-offset-4 hover:decoration-red-500 transition-all self-start"
                                            >
                                                {cancelLoading ? "Canceling..." : "Cancel Subscription"}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (!session) {
                                                    console.log("No session, redirecting to signin");
                                                    // Force redirect to signin
                                                    window.location.href = '/auth/signin?callbackUrl=/settings';
                                                } else {
                                                    router.push('/?upgrade=true');
                                                }
                                            }}
                                            className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/25 transition-all"
                                        >
                                            Upgrade Now
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-slate-200 bg-white">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Method</p>

                                {!showAddCard && user?.cardLast4 ? (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl mb-4">
                                            <CreditCard className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <p className="font-bold text-slate-900">{(user as any).cardBrand || 'Card'} ending in {(user as any).cardLast4}</p>
                                                <p className="text-xs text-slate-500 font-medium">Expires 12/25</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAddCard(true)}
                                            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Update Card
                                        </button>
                                    </div>
                                ) : !showAddCard ? (
                                    <div className="text-center">
                                        <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium text-sm mb-4">
                                            No payment methods saved
                                        </div>
                                        <button
                                            onClick={() => setShowAddCard(true)}
                                            className="inline-flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Payment Method
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateCard} className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-3 text-slate-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                placeholder="Card number"
                                                required
                                                value={cardDetails.number}
                                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                                className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl pl-12 pr-4 py-3 outline-none font-medium text-slate-900"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                required
                                                value={cardDetails.expiry}
                                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                className="bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none font-medium text-slate-900"
                                            />
                                            <input
                                                type="text"
                                                placeholder="CVC"
                                                required
                                                value={cardDetails.cvc}
                                                onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                                className="bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none font-medium text-slate-900"
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button type="submit" disabled={cardLoading} className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-primary/25 transition-all">
                                                {cardLoading ? "Saving..." : "Save Card"}
                                            </button>
                                            <button type="button" onClick={() => setShowAddCard(false)} className="px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-sm transition-all">Cancel</button>
                                        </div>
                                    </form>
                                )}

                                <p className="text-xs text-slate-500 mt-6 text-center">
                                    Secure payment processing via Stripe.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
