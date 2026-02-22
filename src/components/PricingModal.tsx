"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, Check, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: string;
}

export default function PricingModal({ isOpen, onClose, initialPlan }: PricingModalProps) {
    const { update } = useSession();
    const [step, setStep] = useState<'plans' | 'checkout'>('plans');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [couponCode, setCouponCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [couponError, setCouponError] = useState("");

    const plans = [
        {
            name: "Pro Scanner",
            price: "$20",
            period: "/month",
            features: ["75 leads per search", "Public Audit Reports", "PDF Audit Downloads", "AI Personal Pitching"],
            isPopular: true,
            buttonText: "Get Pro Scanner",
            color: "primary"
        },
        {
            name: "Agency",
            price: "$99",
            period: "/month",
            features: ["Unlimited leads per month", "Bulk PDF Export", "One-Tap Email Outreach", "API Access"],
            isPopular: false,
            buttonText: "Get Agency",
            color: "blue"
        }
    ];

    useEffect(() => {
        if (isOpen && initialPlan) {
            const plan = plans.find(p => p.name === initialPlan);
            if (plan) {
                setSelectedPlan(plan);
                setStep('checkout');
            }
        } else if (isOpen && !initialPlan) {
            setStep('plans');
            setSelectedPlan(null);
        }
    }, [isOpen, initialPlan]);

    if (!isOpen) return null;

    const handleSelectPlan = (plan: any) => {
        setSelectedPlan(plan);
        setStep('checkout');
        setCouponCode("");
        setDiscount(0);
        setCouponError("");
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setLoading(true);
        setCouponError("");
        try {
            const res = await axios.post('/api/coupons/validate', {
                code: couponCode,
                planId: selectedPlan.name
            });

            if (res.data.valid) {
                setDiscount(res.data.percent);
            }
        } catch (error: any) {
            setCouponError(error.response?.data?.error || "Invalid coupon code");
            setDiscount(0);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/subscription/activate', {
                planId: selectedPlan.name,
                couponCode: discount > 0 ? couponCode : undefined
            });

            if (res.data.success) {
                await update(); // Refetch session
                onClose();
                setStep('plans');
                alert("Subscription activated successfully!");
            }
        } catch (error: any) {
            alert(error.response?.data?.error || "Activation failed");
        } finally {
            setLoading(false);
        }
    };

    const priceNum = parseInt(selectedPlan?.price.replace('$', '') || '0');
    const finalPrice = Math.max(0, priceNum * (1 - discount / 100));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`relative w-full ${step === 'checkout' ? 'max-w-md' : 'max-w-4xl'} bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-all duration-300`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {step === 'plans' ? (
                    <>
                        <div className="p-8 text-center border-b border-border">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Upgrade to Unlock More Leads</h2>
                            <p className="text-muted-foreground font-medium max-w-lg mx-auto">
                                You've used your free trial leads. Choose a plan to continue finding high-quality leads for your business.
                            </p>
                        </div>

                        <div className="p-8 grid md:grid-cols-2 gap-8">
                            {plans.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-xl border-2 p-6 flex flex-col ${plan.isPopular ? 'border-primary bg-primary/5 shadow-xl' : 'border-border bg-white'}`}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                            Most Popular
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                        <div className="flex items-baseline mt-2">
                                            <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                            <span className="text-muted-foreground font-medium ml-1">{plan.period}</span>
                                        </div>
                                    </div>

                                    <ul className="flex-1 space-y-3 mb-8">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <div className={`p-0.5 rounded-full ${plan.isPopular ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] ${plan.isPopular
                                            ? 'bg-primary text-white hover:shadow-lg hover:shadow-primary/25'
                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                            }`}>
                                        {plan.buttonText}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-8">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900">Checkout</h3>
                            <button onClick={() => setStep('plans')} className="text-sm font-medium text-slate-500 hover:text-primary mt-1">
                                &larr; Change Plan
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-slate-700">{selectedPlan?.name}</span>
                                <span className="font-bold text-slate-900">{selectedPlan?.price}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-emerald-600 text-sm font-medium mb-2">
                                    <span>Discount ({discount}%)</span>
                                    <span>-${(priceNum * discount / 100).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                                <span className="font-black text-slate-900">Total</span>
                                <span className="font-black text-xl text-slate-900">${finalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Enter code"
                                        className="flex-1 bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-5 py-3 outline-none font-medium text-slate-900 uppercase transition-all"
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {couponError && <p className="text-xs text-red-500 font-bold mt-1.5 ml-1">{couponError}</p>}
                                {discount > 0 && <p className="text-xs text-emerald-600 font-bold mt-1.5 ml-1">Coupon applied successfully!</p>}
                            </div>
                        </div>

                        {finalPrice > 0 ? (
                            <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Card Information</label>
                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Card number"
                                                className="w-full bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-4 py-4 outline-none font-medium text-slate-900 transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                className="bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-5 py-4 outline-none font-medium text-slate-900 transition-all"
                                            />
                                            <input
                                                type="text"
                                                placeholder="CVC"
                                                className="bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl px-5 py-4 outline-none font-medium text-slate-900 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600">Secure 256-bit SSL Encrypted Payment</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 mb-8 text-center animate-in zoom-in-95 duration-500">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-2">100% Discount Applied!</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Your coupon code covers the full cost of the <strong>{selectedPlan?.name}</strong> plan. No payment information is required.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleActivate}
                            disabled={loading}
                            className={`w-full ${finalPrice === 0 ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'} text-white font-bold py-4 rounded-xl hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {finalPrice === 0 ? `Activate ${selectedPlan?.name} Now` : `Complete Payment ($${finalPrice.toFixed(0)})`}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 mt-5 font-medium uppercase tracking-widest">
                            {finalPrice === 0 ? "Instant Trial Access" : "Guaranteed Safe Checkout"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
