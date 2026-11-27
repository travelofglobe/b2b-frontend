import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Printer,
    ArrowLeft,
    Building2,
    Calendar,
    User,
    Phone,
    MapPin,
    Utensils,
    CheckCircle2,
    Compass,
    AlertCircle,
    FileText
} from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { hotelService } from '../services/hotelService';
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
                if (!bookingData) {
                    setError('Booking details could not be found.');
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
                setError(err.message || 'Error fetching voucher details');
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
        if (!dateString) return { day: '—', month: '—', year: '', weekday: '', full: '—' };
        const d = new Date(dateString);
        const activeLang = localStorage.getItem('language') || 'en';
        return {
            day: String(d.getDate()).padStart(2, '0'),
            month: d.toLocaleDateString(activeLang, { month: 'short' }),
            year: d.getFullYear(),
            weekday: d.toLocaleDateString(activeLang, { weekday: 'short' }),
            full: d.toLocaleDateString(activeLang, { month: 'short', day: 'numeric', year: 'numeric' })
        };
    };

    const getDaysBetween = (start, end) => {
        if (!start || !end) return 1;
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diff = Math.abs(d2 - d1);
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '—';
        try {
            const cleanDateString = dateTimeString.replace(/\[([^\]]+)\]/, '');
            const date = new Date(cleanDateString);
            const activeLang = localStorage.getItem('language') || 'en';
            if (isNaN(date.getTime())) return '—';

            return date.toLocaleDateString(activeLang, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return '—';
        }
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/travel/hotels/bookings');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-sky-50/40 flex flex-col items-center justify-center p-6 select-none">
                <div className="w-10 h-10 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                <h3 className="mt-4 text-xs font-semibold text-slate-600 tracking-wider uppercase">Loading Voucher</h3>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-sky-50/30 flex flex-col items-center justify-center p-6 select-none">
                <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-sm w-full text-center shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Voucher Unavailable</h3>
                    <p className="text-xs text-slate-500 mb-5">{error || 'Booking details not available'}</p>
                    <button
                        onClick={handleBack}
                        className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-xs transition cursor-pointer"
                    >
                        Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    const checkInDate = formatDateObject(booking.checkIn);
    const checkOutDate = formatDateObject(booking.checkOut);
    const nightsCount = getDaysBetween(booking.checkIn, booking.checkOut);

    const rooms = (() => {
        const rawRooms = booking.hotel?.rooms || [];
        if (!Array.isArray(rawRooms) || rawRooms.length === 0) return [];

        const deduplicated = [];
        const seenSignatures = new Set();

        rawRooms.forEach((room) => {
            const primaryRate = room.rates?.[0] || {};
            const rateCode = primaryRate.rateCode || room.rateCode || '';

            const guestSig = (room.occupancies || [])
                .map(g => `${(g.name || '').trim().toLowerCase()}_${(g.surname || '').trim().toLowerCase()}_${g.birthDate || ''}`)
                .sort()
                .join('|');

            const rateSig = (room.rates || [])
                .map(r => `${r.totalAmount || 0}_${r.boardType || ''}_${r.rateCode || ''}`)
                .join('|');

            const signature = `${rateCode}_${room.roomId || ''}_${room.roomName || ''}_${guestSig}_${rateSig}`;

            if (!seenSignatures.has(signature)) {
                seenSignatures.add(signature);
                deduplicated.push(room);
            }
        });

        return deduplicated;
    })();

    const firstOccupant = rooms[0]?.occupancies?.[0];
    const leadGuestName = booking.hotel?.contact?.name
        ? `${booking.hotel.contact.name} ${booking.hotel.contact.surname || ''}`.trim()
        : booking.customer?.name
            ? `${booking.customer.name} ${booking.customer.surname || ''}`.trim()
            : firstOccupant
                ? `${firstOccupant.name || ''} ${firstOccupant.surname || ''}`.trim()
                : 'Guest';

    const voucherNumber = booking.voucher || booking.uuid?.slice(0, 10).toUpperCase() || voucherId || '—';
    const supplierConfirmation = booking.hotel?.supplierVoucher || booking.hotel?.confirmationCode || booking.supplierBookingCode;
    const bookingDateStr = booking.createdAt || booking.bookingDate || booking.insertDate;
    const formattedBookingDate = bookingDateStr ? formatDateTime(bookingDateStr) : null;
    const starCount = parseInt(hotelDetails?.hotelStar?.names?.en || booking.hotel?.star || '0', 10);
    const agencyName = booking.agencyHierarchyInfo?.agencyName || booking.agencyHierarchyInfo?.principalAgency?.agencyName || booking.salesChannelName || 'Travel of Globe';
    const rawStatus = (booking.hotel?.bookingStatus || booking.status || 'CONFIRMED').toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 antialiased text-slate-700">
            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: #ffffff !important; margin: 0 !important; color: #1e293b !important; }
                    .voucher-sheet {
                        box-shadow: none !important;
                        border: 1px solid #e2e8f0 !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                    }
                    .avoid-break {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>

            <div className="max-w-[820px] mx-auto space-y-4">
                {/* 1. Header Toolbar (Hidden in Print) */}
                <div className="no-print flex items-center justify-between px-1">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-sky-700 bg-white hover:bg-sky-50/50 border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                            A4 Standard Format
                        </span>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs tracking-wide shadow-xs shadow-sky-600/20 active:scale-98 transition cursor-pointer"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Voucher</span>
                        </button>
                    </div>
                </div>

                {/* 2. The Voucher Document Sheet */}
                <div className="voucher-sheet bg-white border border-sky-100 rounded-2xl shadow-sm overflow-hidden">
                    
                    {/* Top Soft Brand Accent Line */}
                    <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-400" />

                    <div className="p-8 sm:p-10 space-y-7">
                        {/* Header: Brand, Title & Reference */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-5 pb-6 border-b border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-600 flex-shrink-0 mt-0.5">
                                    <Compass className="w-5 h-5 stroke-[2.2]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg font-black tracking-tight text-slate-800 uppercase">
                                            TRAVEL OF GLOBE
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            {rawStatus}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5 tracking-wide">
                                        Accommodation Reservation Voucher
                                    </p>
                                </div>
                            </div>

                            <div className="sm:text-right">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">
                                    Voucher Code
                                </span>
                                <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-sky-700 select-all">
                                    {voucherNumber}
                                </span>
                                {formattedBookingDate && (
                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                        Issued: {formattedBookingDate}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Reference Strip (Soft Pastel Blue Tint) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3.5 px-4 rounded-xl bg-sky-50/50 border border-sky-100/70 text-xs">
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Lead Guest</span>
                                <span className="font-semibold text-slate-800 truncate block mt-0.5">{leadGuestName}</span>
                            </div>
                            {supplierConfirmation && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Supplier Ref</span>
                                    <span className="font-mono font-semibold text-slate-800 truncate block mt-0.5">{supplierConfirmation}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Agency / Channel</span>
                                <span className="font-medium text-slate-700 truncate block mt-0.5">{agencyName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Billing Status</span>
                                <span className="font-semibold text-emerald-700 block mt-0.5">Prepaid</span>
                            </div>
                        </div>

                        {/* Itinerary Timeline */}
                        <div className="avoid-break grid grid-cols-3 rounded-xl border border-sky-100 divide-x divide-sky-100 overflow-hidden bg-white">
                            {/* Check-In */}
                            <div className="p-4 sm:p-5">
                                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-sky-600 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                                    <span>Check-In</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                        {checkInDate.day}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-600 uppercase">
                                        {checkInDate.month} {checkInDate.year}
                                    </span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400 font-medium">
                                    From 14:00
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="p-4 sm:p-5 bg-sky-50/30 flex flex-col items-center justify-center text-center">
                                <span className="text-base sm:text-lg font-extrabold text-sky-800 tracking-tight">
                                    {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
                                </span>
                                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
                                    Stay Duration
                                </span>
                            </div>

                            {/* Check-Out */}
                            <div className="p-4 sm:p-5 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase font-bold tracking-wider text-sky-600 mb-1">
                                    <span>Check-Out</span>
                                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                                </div>
                                <div className="flex items-baseline gap-1.5 justify-end">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                                        {checkOutDate.day}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-600 uppercase">
                                        {checkOutDate.month} {checkOutDate.year}
                                    </span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-400 font-medium">
                                    Until 11:00
                                </div>
                            </div>
                        </div>

                        {/* Hotel Information & Total Rate Section */}
                        <div className="avoid-break grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                            {/* Hotel Details (Col 8) */}
                            <div className="md:col-span-8 p-5 rounded-xl border border-sky-100/90 bg-white flex flex-col justify-between space-y-4">
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-sky-600 mb-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-sky-500" />
                                        <span>Property</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                                            {booking.hotel?.hotelName || 'Hotel Reservation'}
                                        </h2>
                                        {starCount > 0 && (
                                            <div className="flex items-center gap-0.5 text-amber-400 flex-shrink-0 pt-0.5" title={`${starCount} Stars`}>
                                                {[...Array(Math.min(5, starCount))].map((_, i) => (
                                                    <span key={i} className="text-xs">★</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">
                                            {[
                                                hotelDetails?.address?.street || booking.hotel?.address?.street,
                                                hotelDetails?.address?.cityName || booking.hotel?.address?.cityName,
                                                hotelDetails?.address?.countryName || booking.hotel?.address?.countryName
                                            ].filter(Boolean).join(', ') || 'Address on file'}
                                        </span>
                                    </div>
                                </div>

                                {(hotelDetails?.phone || booking.hotel?.phone) && (
                                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700">
                                        <Phone className="w-3.5 h-3.5 text-sky-500" />
                                        <span className="font-medium">{hotelDetails?.phone || booking.hotel?.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total Charges (Col 4) - Pastel Blue Soft Card */}
                            <div className="md:col-span-4 p-5 rounded-xl border border-sky-100 bg-sky-50/40 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                        <span>Total Amount</span>
                                        <span className="text-emerald-700 font-semibold">Prepaid</span>
                                    </div>
                                    <div className="mt-3">
                                        <div className="text-2xl font-black tracking-tight text-slate-800">
                                            {booking.totalAmount != null
                                                ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                : '0.00'}
                                            <span className="text-xs font-semibold text-sky-700 ml-1.5">{booking.currency || 'EUR'}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                                            Taxes & fees included
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-sky-100/90 flex items-center justify-between text-xs text-slate-600">
                                    <span>Accommodation</span>
                                    <span className="font-semibold text-slate-800">{rooms.length || 1} Room(s)</span>
                                </div>
                            </div>
                        </div>

                        {/* Room & Occupancy Section */}
                        <div className="avoid-break space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Room & Guest Allocations
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                    {rooms.reduce((acc, r) => acc + (r.occupancies?.length || 1), 0)} Guest(s) total
                                </span>
                            </div>

                            <div className="border border-sky-100 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                                {rooms.map((room, idx) => {
                                    const primaryRate = room.rates?.[0] || {};
                                    const boardBasis = primaryRate.boardType || room.boardType || room.boardName || 'Room Only';

                                    return (
                                        <div key={idx} className="p-5 space-y-3.5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100">
                                                        Room {idx + 1}
                                                    </span>
                                                    <h3 className="font-bold text-sm text-slate-800">
                                                        {room.roomName || 'Standard Room'}
                                                    </h3>
                                                    {primaryRate && (
                                                        <RefundPolicyTooltip
                                                            isRefundable={primaryRate.refundable}
                                                            className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                                primaryRate.refundable
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            }`}
                                                        />
                                                    )}
                                                </div>

                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-100/80 text-xs font-medium self-start sm:self-auto">
                                                    <Utensils className="w-3.5 h-3.5 text-sky-600" />
                                                    <span>{boardBasis}</span>
                                                </div>
                                            </div>

                                            {/* Registered Guests */}
                                            <div className="bg-slate-50/60 rounded-lg p-3 border border-slate-100">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                                                    Registered Guests
                                                </span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                                    {room.occupancies && room.occupancies.length > 0 ? (
                                                        room.occupancies.map((guest, gIdx) => (
                                                            <div key={gIdx} className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                                    <User className="w-3 h-3" />
                                                                </div>
                                                                <span className="font-medium text-slate-800 truncate">
                                                                    {guest.name} {guest.surname}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    ({guest.guestType || 'Adult'})
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic">To be registered at check-in</span>
                                                    )}
                                                </div>
                                            </div>

                                            {room.roomConfirmationCode && (
                                                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                                    <span className="text-slate-400 font-medium">Room Confirmation:</span>
                                                    <span className="font-mono font-semibold text-sky-700">{room.roomConfirmationCode}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cancellation Policy & Special Requests */}
                        {(rooms.some(r => r.rates?.some(rate => rate.cancellationPolicies?.length > 0)) || booking.remark) && (
                            <div className="avoid-break grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                                {rooms.some(r => r.rates?.some(rate => rate.cancellationPolicies?.length > 0)) && (
                                    <div className={`${booking.remark ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-2`}>
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                                            <span>Cancellation Conditions</span>
                                        </div>
                                        <div className="border border-sky-100 rounded-xl overflow-hidden bg-white text-xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-sky-50/40 text-[10px] font-bold text-slate-500 uppercase border-b border-sky-100">
                                                    <tr>
                                                        <th className="py-2 px-3.5">Cancel By</th>
                                                        <th className="py-2 px-3.5 text-right">Fee / Penalty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {rooms.flatMap(r => r.rates || []).flatMap(rate => rate.cancellationPolicies || []).map((policy, pIdx) => (
                                                        <tr key={pIdx}>
                                                            <td className="py-2 px-3.5 text-slate-700 font-medium">
                                                                {formatDateTime(policy.toDate)}
                                                            </td>
                                                            <td className="py-2 px-3.5 text-right font-semibold text-rose-600">
                                                                {policy.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {policy.currency}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {booking.remark && (
                                    <div className={`${rooms.some(r => r.rates?.some(rate => rate.cancellationPolicies?.length > 0)) ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-2`}>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                            Special Remarks
                                        </span>
                                        <div className="p-3.5 bg-sky-50/30 rounded-xl border border-sky-100 text-xs text-slate-700 leading-relaxed italic">
                                            "{booking.remark}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="avoid-break pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
                            <div>
                                <span className="font-semibold text-slate-600">Travel of Globe</span>
                                <span className="mx-2">•</span>
                                <span>support@travelofglobe.com</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                                {booking.uuid || ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Print Tip */}
                <div className="no-print text-center py-2">
                    <p className="text-[11px] text-slate-400">
                        Print in portrait mode on standard A4 paper.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoucherPage;
