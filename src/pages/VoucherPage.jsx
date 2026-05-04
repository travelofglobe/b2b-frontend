import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { hotelService } from '../services/hotelService';
import BookingStatusBadge from '../components/BookingStatusBadge';

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
        return {
            day: String(d.getDate()).padStart(2, '0'),
            month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            year: d.getFullYear(),
            full: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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

            if (isNaN(date.getTime())) return 'Invalid Date';

            return date.toLocaleDateString('en-US', {
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
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/bookings');
        }
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
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-12 select-none antialiased transition-all duration-200">
            {/* Embedded Google Fonts and Style Controls */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
                @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

                .voucher-body, .voucher-body button, .voucher-body p, .voucher-body h1, .voucher-body h2, .voucher-body h3, .voucher-body h4, .voucher-body span:not(.material-symbols-outlined):not(.material-icons-round) {
                    font-family: 'Outfit', sans-serif !important;
                }

                .material-symbols-outlined {
                    font-family: 'Material Symbols Outlined' !important;
                    font-size: inherit;
                    line-height: inherit;
                }

                .material-icons-round {
                    font-family: 'Material Icons Round' !important;
                    font-size: inherit;
                    line-height: inherit;
                }

                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; margin: 0 !important; color: #000 !important; }
                    .print-area {
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #fff !important;
                    }
                    .print-card {
                        background: #fff !important;
                        border: 1px solid #e2e8f0 !important;
                    }
                    .print-voucher-ref {
                        font-size: 14px !important;
                        letter-spacing: normal !important;
                        word-break: break-all !important;
                        white-space: pre-wrap !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>

            <div className="voucher-body max-w-4xl mx-auto space-y-6">
                {/* 1. Fixed Action Header */}
                <div className="no-print flex items-center justify-between gap-4 mb-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
                    >
                        <span className="material-symbols-outlined text-base flex-shrink-0">arrow_back_ios_new</span>
                        <span>Back</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary hover:bg-blue-600 text-white font-extrabold text-xs tracking-wide transition active:scale-95 shadow-lg shadow-primary/25 border border-primary/20"
                        >
                            <span className="material-symbols-outlined text-base flex-shrink-0">local_printshop</span>
                            <span>PRINT VOUCHER</span>
                        </button>
                    </div>
                </div>

                {/* 2. Main Luxury Printable Content Container */}
                <div className="print-area bg-white rounded-[32px] border border-slate-200/80 p-6 md:p-12 shadow-2xl shadow-slate-100 relative overflow-hidden transition-all duration-300 flex flex-col gap-8">

                    {/* Gradient background decoration (Digital view only) */}
                    <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none no-print"></div>

                    {/* Branding Panel matching Dashboard */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-dashed border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-all duration-500 flex-shrink-0">
                                <span className="material-symbols-outlined text-2xl">travel</span>
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-slate-900 text-[16px] font-black leading-none tracking-tighter uppercase whitespace-nowrap">
                                    Travel <span className="text-primary">of</span> Globe
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1 leading-none">
                                    <div className="h-[1px] w-3 bg-primary/40"></div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap leading-none">Global B2B Solutions</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
                            <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 leading-none">
                                Voucher Reference
                            </span>
                            <span className="print-voucher-ref text-2xl md:text-3xl font-black font-mono tracking-tight text-primary select-all leading-none py-1 transition-all duration-200">
                                {booking.voucher || booking.uuid?.slice(0, 8).toUpperCase() || 'N/A'}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <BookingStatusBadge status={booking.status} className="px-3 py-1 rounded-xl text-[10px] uppercase font-black border border-slate-100" />
                                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase border tracking-wider bg-slate-50 border-slate-200 text-slate-600">
                                    {booking.payment?.status?.replace('_', ' ') || 'PAID'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stay Period Overview */}
                    <div className="print-card bg-slate-50/70 rounded-3xl p-5 md:p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-1 items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Check-In</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 leading-none">
                                    {checkInDate.day}
                                </span>
                                <span className="text-xs font-extrabold text-slate-500 uppercase mt-0.5">
                                    {checkInDate.month} {checkInDate.year}
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center px-4">
                                <div className="h-px w-full bg-slate-200 relative flex items-center justify-center">
                                    <span className="absolute bg-slate-50 px-3 text-[10px] font-black text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                                        <span className="material-symbols-outlined text-base flex-shrink-0">calendar_today</span>
                                        {nightsCount} {nightsCount === 1 ? 'NIGHT' : 'NIGHTS'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Check-Out</span>
                                <span className="text-2xl font-black text-slate-900 tracking-tight mt-0.5 leading-none">
                                    {checkOutDate.day}
                                </span>
                                <span className="text-xs font-extrabold text-slate-500 uppercase mt-0.5">
                                    {checkOutDate.month} {checkOutDate.year}
                                </span>
                            </div>
                        </div>

                        <div className="h-px md:h-12 w-full md:w-px bg-slate-200 self-stretch md:self-auto flex-shrink-0 no-print"></div>

                        <div className="flex flex-col md:items-end justify-center flex-shrink-0 gap-1">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none">Total Price</span>
                            <span className="text-2xl font-black text-primary tracking-tight">
                                {booking.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                            </span>
                        </div>
                    </div>

                    {/* Extended Property & Supplementary Information */}
                    <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                                <span className="material-symbols-outlined text-xl flex-shrink-0">apartment</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Property overview</span>
                                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
                                    {booking.hotel?.hotelName || 'N/A'}
                                </h2>
                            </div>
                        </div>

                        <div className="pl-13 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/40 p-4 md:p-5 border border-slate-100 rounded-2xl">
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Address</span>
                                        <p className="text-sm font-bold text-slate-700 leading-normal max-w-sm mt-0.5">
                                            {hotelDetails?.address?.street || booking.hotel?.address?.street || 'No street available'},{' '}
                                            {hotelDetails?.address?.cityName || booking.hotel?.address?.cityName || 'City'},{' '}
                                            {hotelDetails?.address?.countryName || booking.hotel?.address?.countryName || 'Country'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                                        {(hotelDetails?.phone || booking.hotel?.phone) && (
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 leading-none">
                                                <span className="material-symbols-outlined text-base flex-shrink-0">phone</span>
                                                {hotelDetails?.phone || booking.hotel?.phone}
                                            </span>
                                        )}
                                        {hotelDetails?.hotelStar?.names?.en && (
                                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1 leading-none">
                                                <span className="material-symbols-outlined text-base flex-shrink-0">star</span>
                                                {hotelDetails.hotelStar.names.en}
                                            </span>
                                        )}
                                        {hotelDetails?.coordinates && (
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 leading-none">
                                                <span className="material-symbols-outlined text-base flex-shrink-0">location_on</span>
                                                {hotelDetails.coordinates.lat?.toFixed(5)}, {hotelDetails.coordinates.lon?.toFixed(5)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-6">
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Hotel Direct Details</span>
                                    {hotelDetails?.descriptions?.en || hotelDetails?.descriptions?.tr || booking.hotel?.descriptions?.en ? (
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed italic max-h-32 overflow-y-auto pr-1">
                                            "{hotelDetails?.descriptions?.en || hotelDetails?.descriptions?.tr || booking.hotel?.descriptions?.en}"
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-500 font-medium italic">General property descriptions not available.</p>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Accommodations and Guest Section */}
                    <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                                <span className="material-symbols-outlined text-xl flex-shrink-0">bed</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Accommodations</span>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Room Type & Guests</h3>
                            </div>
                        </div>

                        <div className="pl-13 space-y-4">
                            {booking.hotel?.rooms && booking.hotel.rooms.length > 0 ? (
                                booking.hotel.rooms.map((room, roomIndex) => (
                                    <div key={roomIndex} className="print-card bg-slate-50/40 rounded-2xl p-4 md:p-5 border border-slate-100 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black select-none flex-shrink-0">
                                                    {roomIndex + 1}
                                                </span>
                                                <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight">{room.roomName || 'Standard Accommodation'}</h4>
                                            </div>
                                            {room.roomConfirmationCode && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400">Confirmation:</span>
                                                    <span className="text-xs font-extrabold font-mono text-primary bg-primary/5 px-2.5 py-0.5 rounded-lg">
                                                        {room.roomConfirmationCode}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Registered Guests Grid */}
                                        {room.occupancies && room.occupancies.length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registered Guests</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {room.occupancies.map((guest, guestIndex) => (
                                                        <div key={guestIndex} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-slate-400 text-base flex-shrink-0">account_circle</span>
                                                                <span className="text-xs font-bold text-slate-800 leading-none">
                                                                    {guest.name} {guest.surname}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-extrabold tracking-wider rounded uppercase leading-none">
                                                                    {guest.guestType || 'Adult'}
                                                                </span>
                                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black tracking-wider rounded uppercase leading-none">
                                                                    {guest.nationality || 'TR'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Room-specific Cancellation Policies */}
                                        {room.rates && room.rates.length > 0 && room.rates.some(r => r.cancellationPolicies?.length > 0) && (
                                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cancellation Policies</span>
                                                <div className="overflow-hidden border border-slate-100 rounded-xl">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead className="bg-slate-50/50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">Validity</th>
                                                                <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Penalty</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white">
                                                            {room.rates.flatMap(r => r.cancellationPolicies || []).map((policy, pIdx) => (
                                                                <tr key={pIdx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                                    <td className="px-4 py-2.5">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">From: {formatDateTime(policy.fromDate)}</span>
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">To: {formatDateTime(policy.toDate)}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right">
                                                                        <span className="text-xs font-black text-red-500">
                                                                            {policy.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {policy.currency}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs font-medium text-slate-500 italic">No room records available</p>
                            )}
                        </div>
                    </div>

                    {/* Special Remarks */}
                    {booking.remark && (
                        <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mt-1">
                            <span className="material-symbols-outlined text-amber-600 text-base flex-shrink-0 mt-0.5">comment</span>
                            <div className="space-y-1">
                                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block leading-none">Important Notes</span>
                                <p className="text-xs text-amber-900 font-medium italic">"{booking.remark}"</p>
                            </div>
                        </div>
                    )}

                    {/* Quality Assurance Footer & QR Code */}
                    <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-0.5 text-[11px] font-medium text-slate-400">
                                <p className="font-bold text-slate-500">Issued by <span className="font-black text-slate-800">Travel Of Globe Platform</span></p>
                                <p>Global travel operations and reservations network. All rights reserved.</p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-shrink-0">
                                <span className="material-symbols-outlined text-base flex-shrink-0 leading-none">verified_user</span>
                                <span className="font-bold">Secured & Verified Document</span>
                            </div>
                        </div>
                        
                        {/* QR Code for Verification */}
                        <div className="flex flex-col items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex-shrink-0">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href.replace('localhost', '72.62.17.189'))}`} 
                                alt="Verification QR Code" 
                                className="w-[72px] h-[72px] mix-blend-multiply"
                                crossOrigin="anonymous"
                            />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Scan to Verify</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default VoucherPage;
