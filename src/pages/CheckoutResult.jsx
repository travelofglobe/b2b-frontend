import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutResult = () => {
    const location = useLocation();
    const { hotel, totalPrice, roomsData } = location.state || {};

    const bookingRef = "TOG" + Math.random().toString(36).substring(2, 8).toUpperCase();

    if (!hotel) return <div className="p-20 text-center">No active booking session found.</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-['Inter',sans-serif]">
            <Header />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
                <div className="relative mb-12">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"></div>
                    <div className="relative size-24 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-in zoom-in duration-700">
                        <span className="material-symbols-outlined text-5xl">done_all</span>
                    </div>
                </div>

                <h1 className="text-5xl font-black uppercase tracking-tight mb-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">Booking Confirmed!</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest mb-12 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                    Your reservation has been processed successfully.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
                    <div className="p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl animate-in slide-in-from-left-4 duration-700 delay-300">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">confirmation_number</span>
                            Booking Reference
                        </h2>
                        <div className="mb-8">
                            <p className="text-4xl font-black text-primary tracking-tighter mb-1">{bookingRef}</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Instant Confirmation</p>
                        </div>
                        <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Property</p>
                                <p className="text-lg font-black uppercase tracking-tight">{hotel.name}</p>
                            </div>
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                                    <p className="text-xl font-black text-primary">${totalPrice?.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">PAID</span>
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
                                                        {guest.isNonTc ? `Passport: ${guest.passportNo}` : `TC: ${guest.tcNo.slice(0, 3)}•••${guest.tcNo.slice(-2)}`}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                        {guest.gender} • {guest.birthDate}
                                                    </p>
                                                    {guest.email && <p className="text-[9px] font-bold text-primary uppercase">{guest.email}</p>}
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
                    <button
                        onClick={() => window.print()}
                        className="px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-800"
                    >
                        <span className="material-symbols-outlined text-sm">print</span>
                        Print Voucher
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutResult;
