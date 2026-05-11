import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutResult = () => {
    const location = useLocation();
    const { hotel, totalPrice, roomsData, bookingResponse, displayCurrency } = location.state || {};

    const getCurrencySymbol = (code) => {
        const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'TRY': '₺', 'AED': 'د.إ', 'SAR': 'ر.س', 'JPY': '¥', 'CHF': 'Fr', 'CAD': 'CA$', 'AUD': 'A$' };
        return symbols[code] || code || '$';
    };

    const isSuccess = ['NEW', 'CONFIRMED'].includes(bookingResponse?.status) && bookingResponse?.voucher;
    const bookingRef = bookingResponse?.voucher || bookingResponse?.clientReferenceId || ("TOG" + Math.random().toString(36).substring(2, 8).toUpperCase());

    if (!hotel) return <div className="p-20 text-center">No active booking session found.</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-['Inter',sans-serif]">
            <Header />
            <main className="max-w-4xl mx-auto px-6 pt-10 pb-20 text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
                    <div className={`relative size-16 mx-auto rounded-full ${isSuccess ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'} text-white flex items-center justify-center shadow-xl animate-in zoom-in duration-700`}>
                        <span className="material-symbols-outlined text-3xl">{isSuccess ? 'done_all' : 'error'}</span>
                    </div>
                </div>

                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight mb-3 animate-in slide-in-from-bottom-4 duration-700 delay-100 ${isSuccess ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                    {isSuccess ? 'Booking Confirmed!' : 'Booking Failed'}
                </h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-10 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                    {isSuccess ? 'Your reservation has been processed successfully.' : 'There was an issue processing your reservation. Please contact support.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
                    <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in slide-in-from-left-4 duration-700 delay-300">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">confirmation_number</span>
                            Booking Reference
                        </h2>
                        <div className="mb-10 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800">
                            <Link 
                                to={isSuccess ? `/bookings/${bookingRef}/voucher` : '/bookings'}
                                title={isSuccess ? "Click to view full booking details" : "Go to Bookings"}
                                className="inline-flex items-center gap-2 text-xl lg:text-2xl font-black text-primary hover:text-primary-dark dark:hover:text-primary-light tracking-tighter mb-2 hover:underline decoration-primary/50 underline-offset-4 cursor-pointer transition-all group max-w-full overflow-hidden"
                            >
                                <span className="truncate whitespace-nowrap">{isSuccess ? bookingRef : 'All Bookings'}</span>
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 duration-200 transition-transform select-none shrink-0">
                                    arrow_right_alt
                                </span>
                            </Link>
                            <p className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
                                <div className={`size-1.5 rounded-full ${isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                {isSuccess ? 'Verified • Click for details' : 'Action Required'}
                            </p>
                        </div>
                        <div className="space-y-6 pt-2">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Property</p>
                                <p className="text-lg font-black uppercase tracking-tight">{hotel.name}</p>
                            </div>
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                                    <p className="text-xl font-black text-primary">
                                        {getCurrencySymbol(displayCurrency)} {totalPrice ? totalPrice.toFixed(2) : '0.00'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                                    <span className={`px-3 py-1 text-white text-[10px] font-black rounded-lg uppercase tracking-widest ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                        {isSuccess ? 'PAID' : 'FAILED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in slide-in-from-right-4 duration-700 delay-400">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">group</span>
                            Traveler Breakdown
                        </h2>
                        <div className="space-y-8 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                            {roomsData?.map((room, rIdx) => (
                                <div key={rIdx} className="space-y-4">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Room {rIdx + 1}: {room.roomName}</p>
                                    <div className="space-y-3">
                                        {room.guests.map((guest, gIdx) => (
                                            <div key={gIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-black uppercase tracking-tight">{guest.firstName} {guest.lastName}</p>
                                                    <span className="text-[8px] font-black px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 uppercase">{guest.type}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {guest.gender} • {guest.birthDate}
                                                    </p>
                                                    {guest.email && <p className="text-[9px] font-bold text-primary uppercase">{guest.email}</p>}
                                                    {guest.phone && <p className="text-[9px] font-bold text-slate-500 uppercase">{guest.phone}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in duration-1000 delay-500">
                    <Link
                        to="/dashboard"
                        className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        Go to Dashboard
                    </Link>
                    {isSuccess && (
                        <button
                            onClick={() => window.print()}
                            className="px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-800"
                        >
                            <span className="material-symbols-outlined text-sm">print</span>
                            Print Voucher
                        </button>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutResult;
