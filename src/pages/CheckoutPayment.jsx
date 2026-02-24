import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutPayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { hotel, totalPrice } = location.state || {};

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('deposit'); // 'deposit' or 'credit_card'
    const [cardDetails, setCardDetails] = useState({ number: '', holder: '', expiry: '', cvv: '' });

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) parts.push(match.substring(i, i + 4));
        return parts.length ? parts.join('  ') : value;
    };

    const handleCardInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'number') value = formatCardNumber(value);
        if (name === 'expiry') {
            value = value.replace(/\D/g, '');
            if (value.length > 2) value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
        }
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            navigate('/hotel/checkout/result', { state: { ...location.state, paymentMethod, cardDetails } });
        }, 2000);
    };

    if (!hotel) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
                    <div className="w-full max-w-xl relative group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[40px] blur-2xl opacity-100 transition-opacity duration-500"></div>

                        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[40px] p-12 text-center shadow-2xl overflow-hidden">
                            {/* Decorative background icon */}
                            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                                <span className="material-symbols-outlined text-[200px]">lock_reset</span>
                            </div>

                            <div className="size-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-inner">
                                <span className="material-symbols-outlined text-5xl">lock_person</span>
                            </div>

                            <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">Invalid Checkout Session</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                                We couldn't find an active checkout for your request. Direct access to the payment page is restricted for your security.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/hotels')}
                                    className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Search Hotels
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-['Inter',sans-serif]">
            <Header />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight leading-none mb-1">Secure Payment</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Step 2 of 3: Finalize Booking</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3 space-y-8">
                        {/* Refined Payment Method Selection - More prominent */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <button
                                onClick={() => setPaymentMethod('deposit')}
                                className={`relative p-8 rounded-[40px] border-2 transition-all duration-500 text-left group overflow-hidden ${paymentMethod === 'deposit' ? 'border-primary bg-primary/5 shadow-[0_0_50px_rgba(255,59,92,0.15)] ring-4 ring-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`absolute -top-4 -right-4 transition-all duration-700 ${paymentMethod === 'deposit' ? 'text-primary opacity-20 scale-150 rotate-12' : 'text-slate-300 dark:text-slate-700 opacity-5'}`}>
                                    <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
                                </div>

                                <div className={`size-14 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'deposit' ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-3xl">wallet</span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${paymentMethod === 'deposit' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>B2B Deposit</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">Instant Corporate Settlement</p>
                                </div>

                                {paymentMethod === 'deposit' && (
                                    <div className="absolute top-6 right-6 size-8 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in spin-in-90 duration-500 shadow-lg">
                                        <span className="material-symbols-outlined text-lg font-black">check</span>
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={() => setPaymentMethod('credit_card')}
                                className={`relative p-8 rounded-[40px] border-2 transition-all duration-500 text-left group overflow-hidden ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5 shadow-[0_0_50px_rgba(255,59,92,0.15)] ring-4 ring-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`absolute -top-4 -right-4 transition-all duration-700 ${paymentMethod === 'credit_card' ? 'text-primary opacity-20 scale-150 rotate-12' : 'text-slate-300 dark:text-slate-700 opacity-5'}`}>
                                    <span className="material-symbols-outlined text-[120px]">credit_card</span>
                                </div>

                                <div className={`size-14 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'credit_card' ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-3xl">payments</span>
                                </div>

                                <div className="relative z-10">
                                    <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${paymentMethod === 'credit_card' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Credit Card</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">Visa, Mastercard, Amex</p>
                                </div>

                                {paymentMethod === 'credit_card' && (
                                    <div className="absolute top-6 right-6 size-8 bg-primary text-white rounded-full flex items-center justify-center animate-in zoom-in spin-in-90 duration-500 shadow-lg">
                                        <span className="material-symbols-outlined text-lg font-black">check</span>
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Card Visual & Form */}
                        {paymentMethod === 'credit_card' ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="relative group perspective-1000">
                                    <div className="absolute -inset-1 bg-gradient-to-br from-primary via-purple-600 to-primary rounded-[32px] blur-xl opacity-20 transition-all duration-700 group-hover:opacity-40"></div>
                                    <div className="relative h-64 rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-950 p-10 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10">
                                        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><span className="material-symbols-outlined text-[160px]">credit_card</span></div>
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="size-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"></div>
                                            <p className="text-xl font-black italic tracking-tighter">PREMIUM PLATINUM</p>
                                        </div>
                                        <p className="text-2xl font-black tracking-[0.25em] min-h-[32px] relative z-10">{cardDetails.number || '••••  ••••  ••••  ••••'}</p>
                                        <div className="flex justify-between items-end relative z-10">
                                            <div className="max-w-[70%]"><p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Card Holder</p><p className="text-sm font-black uppercase tracking-wider truncate">{cardDetails.holder || 'GUEST NAME'}</p></div>
                                            <div className="text-right"><p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Expires</p><p className="text-sm font-black">{cardDetails.expiry || 'MM / YY'}</p></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Number</label>
                                        <input name="number" maxLength={22} value={cardDetails.number} onChange={handleCardInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-[0.2em]" placeholder="••••  ••••  ••••  ••••" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Holder Name</label>
                                        <input name="holder" value={cardDetails.holder} onChange={handleCardInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold uppercase tracking-tight" placeholder="FULL NAME AS PRINTED ON CARD" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                                            <input name="expiry" maxLength={7} value={cardDetails.expiry} onChange={handleCardInputChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-widest" placeholder="MM / YY" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CVV / CVC</label>
                                            <input name="cvv" maxLength={4} value={cardDetails.cvv} onChange={handleCardInputChange} type="password" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-[0.5em]" placeholder="•••" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="size-20 rounded-[28px] bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-4xl">account_balance_wallet</span></div>
                                    <div><h3 className="text-xl font-black uppercase tracking-tight mb-1">Corporate Deposit Account</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified B2B Balance</p></div>
                                </div>
                                <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Funds</p><p className="text-3xl font-black tracking-tighter">$12,450.00</p></div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status</p>
                                        <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-emerald-500/10">Active & Ready</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <div className="p-8 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl">
                            <h2 className="text-lg font-black uppercase mb-6 tracking-tight">Order Summary</h2>
                            <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Base Rate</span><span className="font-black">${totalPrice?.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Taxes & Fees</span><span className="font-black text-emerald-500 uppercase tracking-widest text-[9px]">Included</span></div>
                            </div>
                            <div className="pt-6 mb-8">
                                <div className="flex justify-between items-end">
                                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total (Net)</p><p className="text-3xl font-black text-primary tracking-tighter">${totalPrice?.toFixed(2)}</p></div>
                                    <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><span className="material-symbols-outlined">shield_check</span></div>
                                </div>
                            </div>
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv))}
                                className={`w-full py-5 bg-primary text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden relative ${isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                {isProcessing ? <><div className="size-5 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>Processing...</> : <>Authorize Payment<span className="material-symbols-outlined text-[18px]">lock</span></>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPayment;
