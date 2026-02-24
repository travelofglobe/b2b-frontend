import React, { useState, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutPayment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { hotel, totalPrice, selectedRooms, roomState, checkInDate, checkOutDate } = location.state || {};

    // Calculate nights for accurate pricing
    const nights = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return 1;
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, [checkInDate, checkOutDate]);

    const formattedDates = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return { start: 'Select Date', end: 'Select Date' };
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return {
            start: new Date(checkInDate).toLocaleDateString('en-US', options),
            end: new Date(checkOutDate).toLocaleDateString('en-US', options)
        };
    }, [checkInDate, checkOutDate]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('deposit'); // 'deposit' or 'credit_card'
    const [cardDetails, setCardDetails] = useState({ number: '', holder: '', expiry: '', cvv: '' });

    // Auto-scroll to top on mount
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
        const finalTotal = selectedRooms?.reduce((sum, r) => sum + r.rate, 0) * nights;
        setTimeout(() => {
            navigate('/hotel/checkout/result', {
                state: {
                    ...location.state,
                    paymentMethod,
                    cardDetails,
                    totalPrice: finalTotal
                }
            });
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
            <main className="max-w-6xl mx-auto px-6 pt-24 pb-20">
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
                                className={`relative p-6 rounded-[32px] border-2 transition-all duration-500 text-left group overflow-hidden ${paymentMethod === 'deposit' ? 'border-primary bg-primary/5 shadow-[0_0_50px_rgba(255,59,92,0.15)] ring-4 ring-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`absolute -top-4 -right-4 transition-all duration-700 ${paymentMethod === 'deposit' ? 'text-primary opacity-20 scale-150 rotate-12' : 'text-slate-300 dark:text-slate-700 opacity-5'}`}>
                                    <span className="material-symbols-outlined text-[100px]">account_balance_wallet</span>
                                </div>

                                <div className={`size-12 rounded-2xl mb-6 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'deposit' ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-2xl">wallet</span>
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
                                className={`relative p-6 rounded-[32px] border-2 transition-all duration-500 text-left group overflow-hidden ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5 shadow-[0_0_50px_rgba(255,59,92,0.15)] ring-4 ring-primary/5' : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'}`}
                            >
                                <div className={`absolute -top-4 -right-4 transition-all duration-700 ${paymentMethod === 'credit_card' ? 'text-primary opacity-20 scale-150 rotate-12' : 'text-slate-300 dark:text-slate-700 opacity-5'}`}>
                                    <span className="material-symbols-outlined text-[100px]">credit_card</span>
                                </div>

                                <div className={`size-12 rounded-2xl mb-6 flex items-center justify-center transition-all duration-500 ${paymentMethod === 'credit_card' ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-2xl">payments</span>
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
                                {/* Enhanced Credit Card Visual with Flip Animation */}
                                <div className="relative h-64 w-full max-w-[420px] mx-auto perspective-1000 group">
                                    <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${cardDetails.cvvFocused ? 'rotate-y-180' : ''}`}>

                                        {/* Glow effects */}
                                        <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-purple-500/30 to-blue-500/30 rounded-[40px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>

                                        {/* FRONT SIDE */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden">
                                            <div className="w-full h-full relative rounded-[32px] bg-gradient-to-br from-slate-800 via-slate-900 to-black p-10 flex flex-col justify-between overflow-hidden shadow-2xl border border-white/10">
                                                {/* Glassmorphism overlays */}
                                                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-[-20deg] translate-x-1/2 pointer-events-none"></div>
                                                <div className="absolute -bottom-20 -left-20 size-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                                                <div className="flex justify-between items-start relative z-10">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="size-14 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.3)] relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                            {/* Simple chip lines */}
                                                            <div className="absolute inset-x-2 top-4 h-px bg-black/20"></div>
                                                            <div className="absolute inset-x-2 top-7 h-px bg-black/20"></div>
                                                            <div className="absolute inset-x-2 top-10 h-px bg-black/20"></div>
                                                            <div className="absolute inset-y-2 left-4 w-px bg-black/20"></div>
                                                            <div className="absolute inset-y-2 left-7 w-px bg-black/20"></div>
                                                            <div className="absolute inset-y-2 left-10 w-px bg-black/20"></div>
                                                        </div>
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-2">Global Reserve</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">PREMIUM PLATINUM</p>
                                                        <div className="flex justify-end gap-1 mt-1">
                                                            <div className="size-2 rounded-full bg-primary/80"></div>
                                                            <div className="size-2 rounded-full bg-white/20"></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    <p className="text-xl font-black tracking-[0.15em] min-h-[40px] flex items-center text-white drop-shadow-lg whitespace-nowrap">
                                                        {cardDetails.number || '••••  ••••  ••••  ••••'}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between items-end relative z-10">
                                                    <div className="max-w-[70%]">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Card Holder</p>
                                                        <p className="text-base font-black uppercase tracking-wider truncate text-white/90">
                                                            {cardDetails.holder || 'GUEST NAME'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Expires</p>
                                                        <p className="text-base font-black text-white/90">{cardDetails.expiry || 'MM / YY'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BACK SIDE */}
                                        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                                            <div className="w-full h-full relative rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col shadow-2xl border border-white/10">
                                                <div className="w-full h-14 bg-black mt-10"></div>
                                                <div className="flex-1 p-10 flex flex-col justify-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1 h-12 bg-slate-200/90 rounded-lg flex items-center justify-end px-4 overflow-hidden relative">
                                                            {/* Security pattern lines */}
                                                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }}></div>
                                                            <p className="text-black font-black italic tracking-widest relative z-10 text-lg">{cardDetails.cvv || '•••'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">CVV / CVC Code</p>
                                                            <p className="text-[8px] font-medium text-white/20 uppercase mt-1 leading-tight max-w-[80px]">AUTHORIZED SIGNATURE NOT TRANSFERABLE</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 flex justify-between items-center opacity-30">
                                                        <div className="flex gap-2 text-white">
                                                            <span className="material-symbols-outlined">wifi_tethering</span>
                                                            <span className="material-symbols-outlined">lock_person</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest italic font-serif">TOG BANK</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl space-y-6 max-w-[480px] mx-auto">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Number</label>
                                        <input
                                            name="number"
                                            maxLength={22}
                                            value={cardDetails.number}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-[0.2em]"
                                            placeholder="••••  ••••  ••••  ••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Holder Name</label>
                                        <input
                                            name="holder"
                                            value={cardDetails.holder}
                                            onChange={handleCardInputChange}
                                            onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold uppercase tracking-tight"
                                            placeholder="FULL NAME AS PRINTED ON CARD"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                                            <input
                                                name="expiry"
                                                maxLength={7}
                                                value={cardDetails.expiry}
                                                onChange={handleCardInputChange}
                                                onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-widest"
                                                placeholder="MM / YY"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CVV / CVC</label>
                                            <input
                                                name="cvv"
                                                maxLength={4}
                                                value={cardDetails.cvv}
                                                onChange={handleCardInputChange}
                                                onFocus={() => setCardDetails(prev => ({ ...prev, cvvFocused: true }))}
                                                onBlur={() => setCardDetails(prev => ({ ...prev, cvvFocused: false }))}
                                                type="password"
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-black tracking-[0.5em]"
                                                placeholder="•••"
                                            />
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
                        {/* Rich Reservation Summary Sidebar - Consistent with Guest Details */}
                        <div className="p-8 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <span className="material-symbols-outlined text-[120px]">assignment</span>
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-xl font-black uppercase mb-8 tracking-tight flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-xl">receipt_long</span>
                                    </div>
                                    Reservation Summary
                                </h2>

                                {/* Hotel Quick Info */}
                                <div className="flex gap-4 mb-8 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                    <div className="size-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                                        <img src={hotel?.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt={hotel?.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`material-symbols-outlined text-[12px] ${i < (hotel?.stars || 5) ? 'text-amber-400 fill-1' : 'text-slate-300'}`}>star</span>
                                            ))}
                                        </div>
                                        <h3 className="font-black text-sm uppercase tracking-tight leading-tight mb-1 line-clamp-2">{hotel?.name}</h3>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{hotel?.location}</p>
                                    </div>
                                </div>

                                {/* Booking Dates */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in</p>
                                        <p className="text-sm font-black uppercase text-primary">{formattedDates.start}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out</p>
                                        <p className="text-sm font-black uppercase text-primary">{formattedDates.end}</p>
                                    </div>
                                </div>

                                {/* Room Breakdown */}
                                <div className="space-y-4 mb-8 pb-8 border-b border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Rooms</p>
                                    {selectedRooms?.map((room, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-xs group/room">
                                            <div className="flex gap-3">
                                                <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/room:bg-primary/10 group-hover/room:text-primary transition-colors">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase tracking-tight mb-0.5">{room.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{roomState?.[idx]?.adults} Adults, {roomState?.[idx]?.children} Children</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-slate-700 dark:text-slate-300">${(room.rate * nights).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Total */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-primary tracking-tighter leading-none">${(selectedRooms?.reduce((sum, r) => sum + r.rate, 0) * nights || totalPrice || 0).toFixed(2)}</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Taxes Included • {nights} Night{nights > 1 ? 's' : ''}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv))}
                                    className={`w-full mt-8 py-5 bg-primary text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden relative ${isProcessing || (paymentMethod === 'credit_card' && (!cardDetails.number || !cardDetails.holder || !cardDetails.expiry || !cardDetails.cvv)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? <><div className="size-5 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>Processing...</> : <>Authorize Payment<span className="material-symbols-outlined text-[18px]">lock</span></>}
                                </button>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="p-6 rounded-[32px] border border-emerald-500/10 bg-emerald-500/5 backdrop-blur-3xl flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="material-symbols-outlined font-black">verified_user</span>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight dark:text-emerald-400">Secure Checkout</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">256-bit SSL encrypted connection</p>
                            </div>
                        </div>
                    </div>
                </div >
            </main >
            <Footer />
        </div >
    );
};

export default CheckoutPayment;
