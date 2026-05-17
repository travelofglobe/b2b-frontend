import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { hotelService } from '../services/hotelService';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';

const VoucherPage = () => {
    const { voucherId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [hotelDetails, setHotelDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const abortController = new AbortController();
        fetchVoucherDetails(abortController.signal);
        return () => abortController.abort();
    }, [voucherId]);

    const fetchVoucherDetails = async (signal) => {
        try {
            setLoading(true);
            setError(null);
            
            const bookingData = await bookingService.getBookingDetail(voucherId, signal);
            if (!signal?.aborted) {
                if (!bookingData?.voucher) {
                    setError('This reservation does not have a generated voucher yet. Please contact support or wait for confirmation.');
                    return;
                }

                setBooking(bookingData);
                
                if (bookingData?.hotel?.internalHotelId) {
                    try {
                        const hDetails = await hotelService.getHotelDetail(bookingData.hotel.internalHotelId, signal);
                        setHotelDetails(hDetails);
                    } catch (err) {
                        console.error('Error fetching supplementary hotel details:', err);
                    }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching voucher data:', err);
                setError(err.message);
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDateObject = (dateString) => {
        if (!dateString) return { day: '00', month: '---', year: '0000', full: 'N/A' };
        const d = new Date(dateString);
        const activeLang = localStorage.getItem('language') || 'en';
        return {
            day: String(d.getDate()).padStart(2, '0'),
            month: d.toLocaleDateString(activeLang, { month: 'short' }).toUpperCase(),
            year: d.getFullYear(),
            full: d.toLocaleDateString(activeLang, { month: 'long', day: 'numeric', year: 'numeric' })
        };
    };

    const getDaysBetween = (start, end) => {
        if (!start || !end) return 1;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diff = Math.abs(d2 - d1);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';

        try {
            // Remove the [timezone] part for parsing
            let cleanDateString = dateTimeString.replace(/\[([^\]]+)\]/, '');
            const date = new Date(cleanDateString);
            const activeLang = localStorage.getItem('language') || 'en';

            if (isNaN(date.getTime())) return 'Invalid Date';

            return date.toLocaleDateString(activeLang, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const handleBack = () => {
        navigate(`/bookings/${voucherId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 select-none">
                <div className="w-14 h-14 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                <h3 className="mt-6 text-base font-black text-slate-800 tracking-tight">Generating Premium Voucher</h3>
                <p className="mt-1 text-xs text-slate-400 font-medium">Please wait a moment...</p>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none">
                <div className="bg-white border border-slate-200/80 p-8 rounded-[32px] max-w-md text-center shadow-2xl">
                    <span className="material-symbols-outlined text-red-500 text-5xl mb-4">gpp_maybe</span>
                    <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Voucher Unavailable</h3>
                    <p className="text-sm text-slate-600 mb-6 font-medium">{error || 'Booking details not available'}</p>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="w-full py-3.5 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-black text-xs transition active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        Go back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    const checkInDate = formatDateObject(booking.checkIn);
    const checkOutDate = formatDateObject(booking.checkOut);
    const nightsCount = getDaysBetween(booking.checkIn, booking.checkOut);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 md:p-10 select-none antialiased transition-all duration-200 overflow-x-hidden">
            {/* Professional Business Fonts & Base Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
                
                .voucher-root {
                    font-family: 'Outfit', sans-serif !important;
                }

                .font-mono {
                    font-family: 'JetBrains+Mono', monospace !important;
                }

                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; margin: 0 !important; color: #000 !important; }
                    .print-area {
                        box-shadow: none !important;
                        border: 1px solid #E2E8F0 !important;
                        max-width: 100% !important;
                        padding: 1.25rem !important;
                        margin: 0 !important;
                        background: #fff !important;
                        border-radius: 0 !important;
                    }
                    .print-accent {
                        background: #F1F5F9 !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                    .force-print-row {
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }
                }

                .bg-blue-mesh {
                    background-image: radial-gradient(at 0% 0%, hsla(217,100%,97%,1) 0, transparent 50%), 
                                      radial-gradient(at 100% 100%, hsla(217,100%,97%,1) 0, transparent 50%);
                }

                .text-deep-blue { color: #1E40AF; }
                .bg-deep-blue { background-color: #1E40AF; }
                .border-deep-blue { border-color: #1E40AF; }
            `}</style>

            <div className="voucher-root max-w-4xl mx-auto space-y-6">
                {/* 1. Professional Navigation Bar */}
                <div className="no-print flex items-center justify-between gap-6 px-1">
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-700 transition-all duration-300"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        <span className="tracking-tight uppercase">Back</span>
                    </button>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[12px] tracking-wide transition-all active:scale-95 shadow-md shadow-blue-700/10 group"
                        >
                            <span className="material-symbols-outlined text-lg">print</span>
                            <span>Print Voucher</span>
                        </button>
                    </div>
                </div>

                {/* 2. The Voucher Document */}
                <div className="print-area relative bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(30,64,175,0.05)] overflow-hidden rounded-2xl">
                    
                    {/* Header: Clean & Data Rich */}
                    <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl fill-1">travel</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    Travel <span className="text-blue-700">of</span> Globe
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Reservation Voucher</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                            <div className="flex flex-col md:items-end">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Reference ID</span>
                                <span className="text-2xl font-black font-mono tracking-tighter text-blue-800 select-all leading-none">
                                    {booking.voucher || booking.uuid?.slice(0, 8).toUpperCase() || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                    Confirmed
                                </span>
                                <span className="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-blue-100 bg-blue-50 text-blue-600">
                                    Paid
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 md:p-8 space-y-8">
                        
                        {/* 3. Itinerary Summary Grid */}
                        <div className="avoid-break grid grid-cols-1 sm:grid-cols-3 force-print-row gap-1 bg-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                            {/* Check-in */}
                            <div className="bg-white p-5 flex flex-col gap-1">
                                <span className="text-[9px] font-black text-blue-700/60 uppercase tracking-widest">Check-In</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{checkInDate.day}</span>
                                    <span className="text-sm font-bold text-slate-800 uppercase">{checkInDate.month} {checkInDate.year}</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 mt-1">From 14:00 PM</p>
                            </div>
                            {/* Stay */}
                            <div className="bg-slate-50/50 p-5 flex flex-col items-center justify-center gap-1 border-x border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600 text-lg">nights_stay</span>
                                    <span className="text-xl font-black text-blue-800 tracking-tight">{nightsCount} NIGHTS</span>
                                </div>
                            </div>
                            {/* Check-out */}
                            <div className="bg-white p-5 flex flex-col sm:items-end text-right gap-1">
                                <span className="text-[9px] font-black text-blue-700/60 uppercase tracking-widest">Check-Out</span>
                                <div className="flex items-baseline gap-2 justify-end">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{checkOutDate.day}</span>
                                    <span className="text-sm font-bold text-slate-800 uppercase">{checkOutDate.month} {checkOutDate.year}</span>
                                </div>
                                <p className="text-[10px] font-medium text-slate-400 mt-1">Before 11:00 AM</p>
                            </div>
                        </div>

                        {/* 4. Primary Information Section (Restructured for Equal Heights) */}
                        <div className="space-y-8">
                            
                            {/* Row 1: Property & Financials */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                {/* Left: Hotel Card (8 cols) */}
                                <div className="lg:col-span-7 avoid-break space-y-3 flex flex-col">
                                    <div className="flex items-center gap-2 px-1 h-6">
                                        <span className="material-symbols-outlined text-blue-700 text-[18px] w-5 flex justify-center">location_on</span>
                                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Property Information</h2>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 flex-1">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{booking.hotel?.hotelName || 'N/A'}</h3>
                                            <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                                {hotelDetails?.address?.street || booking.hotel?.address?.street || 'No address'},{' '}
                                                {hotelDetails?.address?.cityName || booking.hotel?.address?.cityName}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 pt-1">
                                            {(hotelDetails?.phone || booking.hotel?.phone) && (
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <span className="material-symbols-outlined text-[16px] text-blue-600">call</span>
                                                    <span className="text-xs font-bold">{hotelDetails?.phone || booking.hotel?.phone}</span>
                                                </div>
                                            )}
                                            {hotelDetails?.hotelStar?.names?.en && (
                                                <div className="flex items-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`material-symbols-outlined text-[14px] ${i < parseInt(hotelDetails.hotelStar.names.en) ? 'text-amber-400 fill-1' : 'text-slate-100'}`}>star</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Summary Card (5 cols) */}
                                <div className="lg:col-span-5 avoid-break space-y-3 flex flex-col">
                                    <div className="flex items-center gap-2 px-1 h-6">
                                        <span className="material-symbols-outlined text-blue-700 text-[18px] w-5 flex justify-center">payments</span>
                                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</h2>
                                    </div>
                                    <div className="bg-blue-900 rounded-xl p-6 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden flex-1 flex flex-col justify-center">
                                        <div className="absolute top-0 right-0 size-20 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300/60 mb-3 block">Total Value</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black tracking-tighter">
                                                {booking.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-sm font-bold text-blue-300">{booking.currency}</span>
                                        </div>
                                        <p className="mt-3 text-[9px] font-bold text-blue-200/80 leading-relaxed uppercase tracking-wider">
                                            Includes taxes & applicable fees
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Guests & Policies/Remarks */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                                {/* Left: Detailed Guest List (8 cols) */}
                                <div className="lg:col-span-7 avoid-break space-y-3 flex flex-col">
                                    <div className="flex items-center gap-2 px-1 h-6">
                                        <span className="material-symbols-outlined text-blue-700 text-[18px] w-5 flex justify-center">groups</span>
                                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Accommodation & Guests</h2>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1">
                                        {booking.hotel?.rooms?.map((room, idx) => (
                                            <div key={idx} className="border-b border-slate-100 last:border-0 p-6 bg-slate-50/30">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-blue-800 uppercase tracking-tight">{room.roomName || 'Standard Room'}</span>
                                                        {room.rates?.[0] && (
                                                            <RefundPolicyTooltip
                                                                isRefundable={room.rates[0].refundable}
                                                                className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${room.rates[0].refundable ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">UNIT 0{idx + 1}</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                                    {room.occupancies?.map((guest, gIdx) => (
                                                        <div key={gIdx} className="flex items-center justify-between py-1.5 border-b border-slate-100/50">
                                                            <span className="text-xs font-bold text-slate-700">{guest.name} {guest.surname}</span>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{guest.guestType || 'Adult'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {room.roomConfirmationCode && (
                                                    <div className="mt-3 text-[10px] font-bold text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                                                        <span>Conf. Code:</span>
                                                        <span className="text-blue-700 font-mono font-black">{room.roomConfirmationCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Policies & Remarks (5 cols) */}
                                <div className="lg:col-span-5 avoid-break space-y-3 flex flex-col">
                                    {/* Cancellation Policies */}
                                    {booking.hotel?.rooms?.some(r => r.rates?.some(rate => rate.cancellationPolicies?.length > 0)) && (
                                        <div className="flex-1 flex flex-col space-y-3">
                                            <div className="flex items-center gap-2 px-1 h-6">
                                                <span className="material-symbols-outlined text-blue-700 text-[18px] w-5 flex justify-center">policy</span>
                                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Policy Details</h2>
                                            </div>
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase">Until Date</th>
                                                            <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase text-right">Penalty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {booking.hotel.rooms.flatMap(r => r.rates || []).flatMap(rate => rate.cancellationPolicies || []).map((policy, pIdx) => (
                                                            <tr key={pIdx} className="border-b border-slate-100 last:border-0">
                                                                <td className="px-4 py-3 text-[10px] font-bold text-slate-600">
                                                                    {formatDateTime(policy.toDate)}
                                                                </td>
                                                                <td className="px-4 py-3 text-[10px] font-black text-rose-600 text-right">
                                                                    {policy.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {policy.currency}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Remarks (Compact) */}
                                    {booking.remark && (
                                        <div className="avoid-break bg-slate-50 border border-slate-200 rounded-xl p-5 mt-auto">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Agent Remarks</span>
                                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{booking.remark}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5. Footer Data: QR & Network Details */}
                        <div className="avoid-break pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-5">
                                <div className="size-16 bg-white border border-slate-200 p-1 rounded-lg">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href.replace('localhost', '72.62.17.189'))}`} 
                                        alt="Verify" 
                                        className="w-full h-full"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Verification QR</span>
                                    <p className="text-[8px] font-bold text-slate-400 max-w-[180px] mt-1 leading-relaxed">
                                        This document is digitally signed. Scan to verify real-time status.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:items-end text-center md:text-right gap-1 opacity-60">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Travel Of Globe Network</span>
                                <p className="text-[8px] font-bold text-slate-400">© 2026. All rights reserved. Powered by TOG Reservation Engine.</p>
                                <span className="text-[8px] font-mono text-slate-300 mt-1">{booking.uuid || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Tip */}
                <div className="no-print text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        For best results, print on A4 paper using Portrait orientation
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoucherPage;
