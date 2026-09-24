'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHelp from './AdminHelp';

interface AdminDashboardProps {
    users: any[];
    helpRequests: any[];
    leads?: any[];
    coupons?: any[];
}

export default function AdminDashboard({
    users,
    helpRequests,
    leads = [],
    coupons = []
}: AdminDashboardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'USERS' | 'LEADS' | 'HELP' | 'COUPONS' | 'SETTINGS'>('USERS');

    // Coupon Form State
    const [newCoupon, setNewCoupon] = useState({ code: '', percent: '', maxUses: '', validPlan: 'ALL', expiry: '' });

    // Password Form State
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const fmt = (d: any) =>
        new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    const handleAction = async (userId: string, action: string, amount: number = 0) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, amount }),
            });
            if (res.ok) {
                alert('Action successful');
                router.refresh();
            } else {
                alert('Action failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error performing action');
        } finally {
            setLoading(false);
        }
    };

    const handleLeads = (userId: string, action: 'ADD_LEADS' | 'SUB_LEADS') => {
        const input = prompt(`Enter leads amount to ${action === 'ADD_LEADS' ? 'add' : 'remove'}:`);
        if (input === null) return;
        const amount = Number(input);
        if (!Number.isInteger(amount) || amount <= 0) {
            alert('Please enter a whole number greater than 0');
            return;
        }
        handleAction(userId, action, amount);
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // datetime-local is the admin's local time; send as ISO so the server doesn't read it as UTC
                body: JSON.stringify({ ...newCoupon, expiry: newCoupon.expiry ? new Date(newCoupon.expiry).toISOString() : null }),
            });
            if (res.ok) {
                setNewCoupon({ code: '', percent: '', maxUses: '', validPlan: 'ALL', expiry: '' });
                router.refresh();
                alert('Coupon Created');
            } else {
                alert('Failed to create coupon');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;
        setLoading(true);
        try {
            await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords don't match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
            });

            const data = await res.json();
            if (res.ok) {
                alert('Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(data.error || 'Failed to change password');
            }
        } catch (error) {
            console.error(error);
            alert('Error changing password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-2 bg-gray-50">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('USERS')}
                    className={`px-4 py-2 font-bold text-sm uppercase tracking-wide rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'bg-white border text-primary border-b-white -mb-2.5 z-10' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('LEADS')}
                    className={`px-4 py-2 font-bold text-sm uppercase tracking-wide rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'LEADS' ? 'bg-white border text-primary border-b-white -mb-2.5 z-10' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Leads ({leads.length})
                </button>
                <button
                    onClick={() => setActiveTab('COUPONS')}
                    className={`px-4 py-2 font-bold text-sm uppercase tracking-wide rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'COUPONS' ? 'bg-white border text-primary border-b-white -mb-2.5 z-10' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Coupons
                </button>
                <button
                    onClick={() => setActiveTab('HELP')}
                    className={`px-4 py-2 font-bold text-sm uppercase tracking-wide rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'HELP' ? 'bg-white border text-primary border-b-white -mb-2.5 z-10' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Help Requests ({helpRequests.filter((r) => r.status === 'OPEN').length} new)
                </button>
                <button
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`px-4 py-2 font-bold text-sm uppercase tracking-wide rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'SETTINGS' ? 'bg-white border text-primary border-b-white -mb-2.5 z-10' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Settings
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 min-h-[500px]">
                {activeTab === 'USERS' && (
                    <div className="overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Registered Users</h2>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Name</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Email</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Registered</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Plan</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Promo Used</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Leads</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan={7} className="p-4 text-center">No users found</td></tr>
                                ) : users.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-medium">{user.name || 'N/A'}</td>
                                        <td className="p-3 text-sm text-gray-600">{user.email}</td>
                                        <td className="p-3 text-xs text-gray-500 whitespace-nowrap" suppressHydrationWarning>{user.createdAt ? fmt(user.createdAt) : '—'}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-600">
                                                {user.plan || 'Free'}
                                            </span>
                                            {(() => {
                                                const exp = user.planExpiresAt ? new Date(user.planExpiresAt) : user.couponUsedAt ? new Date(new Date(user.couponUsedAt).getTime() + 30 * 86400000) : null;
                                                if (!exp || user.subscriptionStatus === 'trial') return null;
                                                const done = user.subscriptionStatus === 'expired' || exp < new Date();
                                                return <div className={`text-[10px] mt-1 whitespace-nowrap ${done ? 'text-red-500' : 'text-gray-400'}`} suppressHydrationWarning>{done ? 'Expired' : 'Expires'} {fmt(exp)}</div>;
                                            })()}
                                        </td>
                                        <td className="p-3">
                                            {user.couponUsed ? (
                                                <>
                                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 font-mono">{user.couponUsed}</span>
                                                {user.couponUsedAt && (
                                                    <div className="text-[10px] text-gray-400 mt-1 whitespace-nowrap" suppressHydrationWarning>{fmt(user.couponUsedAt)}</div>
                                                )}
                                                </>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="p-3 font-bold">{user.leadsBalance}</td>
                                        <td className="p-3 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleAction(user.id, user.isBlocked ? 'UNBLOCK' : 'BLOCK')}
                                                disabled={loading}
                                                className={`px-3 py-1 text-xs font-bold text-white rounded shadow-sm hover:shadow ${user.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                                                    }`}
                                            >
                                                {user.isBlocked ? 'Unblock' : 'Block'}
                                            </button>
                                            <button
                                                onClick={() => handleLeads(user.id, 'ADD_LEADS')}
                                                disabled={loading}
                                                className="px-3 py-1 text-xs font-bold bg-indigo-500 text-white rounded shadow-sm hover:bg-indigo-600"
                                            >
                                                + Leads
                                            </button>
                                            <button
                                                onClick={() => handleLeads(user.id, 'SUB_LEADS')}
                                                disabled={loading}
                                                className="px-3 py-1 text-xs font-bold bg-orange-500 text-white rounded shadow-sm hover:bg-orange-600"
                                            >
                                                − Leads
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to PERMANENTLY delete this user?")) {
                                                        handleAction(user.id, 'DELETE');
                                                    }
                                                }}
                                                disabled={loading}
                                                className="px-3 py-1 text-xs font-bold bg-gray-800 text-white rounded shadow-sm hover:bg-black transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'COUPONS' && (
                    <div className="space-y-8">
                        {/* Create Coupon Form */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-bold mb-4 text-gray-800">Create New Coupon</h3>
                            <form onSubmit={handleCreateCoupon} className="flex gap-4 items-end flex-wrap">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Code</label>
                                    <input
                                        type="text"
                                        value={newCoupon.code}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        className="border p-2 rounded w-48 font-mono uppercase"
                                        placeholder="SALE50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Discount %</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newCoupon.percent}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, percent: e.target.value })}
                                        className="border p-2 rounded w-24"
                                        placeholder="50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Max Uses</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newCoupon.maxUses}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                                        className="border p-2 rounded w-24"
                                        placeholder="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valid For</label>
                                    <select
                                        value={newCoupon.validPlan || 'ALL'}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, validPlan: e.target.value })}
                                        className="border p-2 rounded w-32 text-sm"
                                    >
                                        <option value="ALL">All Plans</option>
                                        <option value="Pro Scanner">Pro Scanner ($20)</option>
                                        <option value="Agency">Agency ($99)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Expires (optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={newCoupon.expiry}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, expiry: e.target.value })}
                                        className="border p-2 rounded text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-black text-white px-6 py-2 rounded font-bold hover:bg-gray-800 transition-colors"
                                >
                                    Create Coupon
                                </button>
                            </form>
                        </div>

                        {/* List Coupons */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-gray-800">Active Coupons</h3>
                            <table className="w-full text-left bg-white border rounded hidden md:table">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Code</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Discount</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Plan</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Uses</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Created</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Expires</th>
                                        <th className="p-3 text-xs font-bold uppercase text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.length === 0 ? (
                                        <tr><td colSpan={7} className="p-4 text-center text-gray-500">No active coupons</td></tr>
                                    ) : coupons.map((coupon) => (
                                        <tr key={coupon.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-mono font-bold text-blue-600">{coupon.code}</td>
                                            <td className="p-3 font-bold">{coupon.percent}% OFF</td>
                                            <td className="p-3 text-sm text-gray-600">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{coupon.validPlan || 'ALL'}</span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-600">
                                                {coupon.usedCount} / {coupon.maxUses === -1 ? '∞' : coupon.maxUses}
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {new Date(coupon.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-xs whitespace-nowrap" suppressHydrationWarning>
                                                {coupon.expiry
                                                    ? <span className={new Date(coupon.expiry) < new Date() ? 'text-red-500 font-bold' : 'text-gray-500'}>{new Date(coupon.expiry) < new Date() ? 'Expired ' : ''}{fmt(coupon.expiry)}</span>
                                                    : <span className="text-gray-300">Never</span>}
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'LEADS' && (
                    <div className="overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">All Leads</h2>
                        <table className="w-full text-left table-auto">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Business Name</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Category</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Website Status</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Owner</th>
                                    <th className="p-3 text-xs font-bold uppercase text-gray-500">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500 italic">No leads found in database.</td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="p-3 font-medium text-gray-900 group relative">
                                                {lead.name}
                                                {lead.website && (
                                                    <a href={lead.website} target="_blank" className="ml-2 text-blue-400 hover:text-blue-600 text-xs">↗</a>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-gray-600 truncate max-w-[150px]">{lead.category}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${lead.websiteStatus === 'NO_WEBSITE' ? 'bg-red-50 text-red-600' :
                                                    lead.websiteStatus === 'LOW_QUALITY' ? 'bg-yellow-50 text-yellow-600' :
                                                        'bg-green-50 text-green-600'
                                                    }`}>
                                                    {lead.websiteStatus?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500 font-mono">
                                                {lead.user?.email || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-xs text-gray-400">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'HELP' && <AdminHelp requests={helpRequests} />}

                {activeTab === 'SETTINGS' && (
                    <div className="max-w-md mx-auto">
                        <h2 className="text-xl font-semibold mb-6 text-gray-700">Account Settings</h2>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4">Change Password</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full border p-2 rounded text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full border p-2 rounded text-sm"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full border p-2 rounded text-sm"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-3 rounded font-bold hover:bg-gray-800 transition-colors uppercase tracking-widest text-xs"
                                >
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
