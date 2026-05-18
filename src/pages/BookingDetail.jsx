import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/bookingService';
import HeaderActions from '../components/HeaderActions';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import { tBD } from '../utils/bookingDetailLocales';

const BookingDetail = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => {
        const raw = i18n.language || localStorage.getItem('i18nextLng') || 'en';
        return raw.split('-')[0].toLowerCase();
    });
    useEffect(() => {
        const raw = i18n.language || localStorage.getItem('i18nextLng') || 'en';
        setCurrentLang(raw.split('-')[0].toLowerCase());
        const handler = (lng) => { if (lng) setCurrentLang(lng.split('-')[0].toLowerCase()); };
        i18n.on('languageChanged', handler);
        return () => { i18n.off('languageChanged', handler); };
    }, [i18n]);

    const L = (key) => tBD(currentLang, key);

    useEffect(() => {
        const abortController = new AbortController();
        fetchBookingDetail(abortController.signal);
        return () => abortController.abort();
    }, [bookingId]);

    const fetchBookingDetail = async (signal) => {
        try {
            setLoading(true);
            setError(null);
            const data = await bookingService.getBookingDetail(bookingId, signal);
            if (!signal?.aborted) {
                setBooking(data);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Fetch booking detail error:', error);
                setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(currentLang, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';

        try {
            // Handle timezone format like "2026-01-30T04:52+08:00[Asia/Shanghai]"
            // Remove the [timezone] part for parsing, but extract it for display
            let timezoneMatch = dateTimeString.match(/\[([^\]]+)\]/);
            let timezone = timezoneMatch ? timezoneMatch[1] : null;

            // Remove the [timezone] part for Date parsing
            let cleanDateString = dateTimeString.replace(/\[([^\]]+)\]/, '');

            const date = new Date(cleanDateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }

            const formattedDate = date.toLocaleString(currentLang, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            // Add timezone if available
            if (timezone) {
                return `${formattedDate} (${timezone})`;
            }

            return formattedDate;
        } catch (error) {
            console.error('Error formatting date:', dateTimeString, error);
            return 'Invalid Date';
        }
    };



    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'PAID_ACCOUNT':
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'FAILED':
                return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
        }
    };

    const getGenderIcon = (gender) => {
        switch (gender) {
            case 'MALE':
                return 'male';
            case 'FEMALE':
                return 'female';
            default:
                return 'person';
        }
    };

    const getGenderLabel = (gender) => {
        if (!gender) return 'N/A';
        switch (gender.toUpperCase()) {
            case 'MALE':
                return L('genderMale');
            case 'FEMALE':
                return L('genderFemale');
            default:
                return L('genderOther');
        }
    };

    const getGuestTypeLabel = (type) => {
        if (!type) return 'N/A';
        switch (type.toUpperCase()) {
            case 'ADULT':
                return L('typeAdult');
            case 'CHILD':
                return L('typeChild');
            case 'INFANT':
                return L('typeInfant');
            default:
                return type;
        }
    };

    const getPaymentStatusLabel = (status) => {
        if (!status) return 'N/A';
        switch (status) {
            case 'PENDING':
            case 'PENDING_PAYMENT':
                return L('pyPending');
            case 'PAID_CREDIT_CARD':
                return L('pyPaidCard');
            case 'PAID_ACCOUNT':
                return L('pyPaidAcc');
            case 'REFUNDED_CREDIT_CARD':
                return L('pyRefCard');
            case 'REFUNDED_ACCOUNT':
                return L('pyRefAcc');
            case 'FAILED':
                return L('pyFailed');
            default:
                return status.replace(/_/g, ' ');
        }
    };

    const getCurrencyIcon = (currency) => {
        switch (currency) {
            case 'EUR':
                return 'euro';
            case 'USD':
                return 'attach_money';
            case 'GBP':
                return 'currency_pound';
            case 'TRY':
                return 'currency_lira';
            default:
                return 'payments';
        }
    };

    const getOverallDisplayStatus = () => {
        if (booking?.status === 'FAILED' || booking?.hotel?.bookingStatus === 'FAILED') {
            return 'FAILED';
        }
        return 'SUCCESS';
    };

    const formatBoardType = (boardType) => {
        if (!boardType) return 'N/A';
        const bt = boardType.toUpperCase();
        if (bt === 'RO') return 'RO - Room Only';
        if (bt === 'BB') return 'BB - Bed and Breakfast';
        if (bt === 'HB') return 'HB - Half Board';
        if (bt === 'FB') return 'FB - Full Board';
        if (bt === 'AI') return 'AI - All Inclusive';
        if (bt === 'UAI') return 'UAI - Ultra All Inclusive';
        return boardType;
    };

    if (loading || error || !booking) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Progress Bar */}
                {loading && (
                    <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
                        <div className="h-full bg-primary animate-progress-indeterminate origin-left"></div>
                    </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span className="material-icons-round">arrow_back</span>
                                </button>
                                <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{L('title')}</h1>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {loading ? L('fetching') : error ? L('errorLoading') : L('bookingInfo')}
                                    </p>
                                </div>
                            </div>
                            <HeaderActions />
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto p-6">
                        {loading ? (
                            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
                                {/* Booking Overview Skeleton */}
                                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48"></div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-64"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                                                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Hotel Information Skeleton */}
                                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-40"></div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-56"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                                                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md text-center mx-auto shadow-lg">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                        <span className="material-icons-round text-red-500 text-4xl">error_outline</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{L('unavailable')}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                                    <button
                                        onClick={() => navigate('/bookings')}
                                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 active:scale-95"
                                    >
                                        {L('backToBookings')}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex-shrink-0 z-30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{L('title')}</h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {L('orderId')} #{booking.orderId} • {booking.hotel?.hotelName || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => booking.voucher && window.open(`/bookings/${booking.voucher}/voucher`, '_blank')}
                                disabled={!booking.voucher || booking.status === 'FAILED' || booking.hotel?.bookingStatus === 'FAILED'}
                                className={`h-10 px-5 rounded-xl flex items-center gap-2 font-black text-sm transition-all shadow-sm border ${
                                    !booking.voucher || booking.status === 'FAILED' || booking.hotel?.bookingStatus === 'FAILED'
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed grayscale opacity-60'
                                        : 'bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30 border-primary/20 active:scale-95'
                                }`}
                            >
                                <span className="material-icons-round text-lg">receipt_long</span>
                                <span>{booking.voucher ? L('voucher') : L('voucherPending')}</span>
                            </button>
                            <HeaderActions />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Booking Overview Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-icons-round text-2xl">receipt_long</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{L('overview')}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{L('overviewSub')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('orderId')}</p>
                                    <p className="text-lg font-black text-primary">#{booking.orderId}</p>
                                </div>
                                {/* Removed UUID and Status as requested */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('paymentStatus')}</p>
                                    <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getPaymentStatusColor(booking.payment?.status)}`}>
                                        {getPaymentStatusLabel(booking.payment?.status)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('clientRefId')}</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.clientReferenceId || 'N/A'}</p>
                                </div>
                                {/* Removed Request ID, Supplier ID, Supplier Name, Feed ID */}
                                {booking.status !== 'FAILED' && booking.hotel?.bookingStatus !== 'FAILED' && (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('voucher')}</p>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.voucher || 'N/A'}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('checkIn')}</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatDate(booking.checkIn)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('checkOut')}</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatDate(booking.checkOut)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('totalAmount')}</p>
                                    <p className="text-xs font-black text-primary">{booking.totalAmount !== null ? `${booking.totalAmount} ${booking.currency || ''}` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('penaltyAmount')}</p>
                                    <p className="text-xs font-medium text-red-600">{booking.totalPenaltyAmount !== null ? `${booking.totalPenaltyAmount} ${booking.currency || ''}` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('refundAmount')}</p>
                                    <p className="text-xs font-medium text-green-600">{booking.totalRefundAmount !== null ? `${booking.totalRefundAmount} ${booking.currency || ''}` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('taxAmount')}</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.totalTaxAmount !== null ? `${booking.totalTaxAmount} ${booking.currency || ''}` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('onSpotAmount')}</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.totalOnSpotAmount !== null ? `${booking.totalOnSpotAmount} ${booking.currency || ''}` : 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('transactionUser')}</p>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.transactionUser || 'N/A'}</p>
                                </div>
                                {booking.remark && (
                                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('remark')}</p>
                                        <p className="text-sm text-slate-700 dark:text-slate-200 italic">{booking.remark}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hotel Information Card */}
                        {booking.hotel && (
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <span className="material-icons-round text-2xl">hotel</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{L('hotelInfo')}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{L('hotelInfoSub')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('hotelName')}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{booking.hotel.hotelName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('hotelId')}</p>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.hotel.internalHotelId || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('bookingStatus')}</p>
                                        <BookingStatusBadge status={getOverallDisplayStatus()} className="px-3 py-1 rounded-xl text-[10px]" showIcon />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                {booking.hotel.contact && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">{L('contactInfo')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="material-icons-round text-slate-400">person</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{L('name')}</p>
                                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.hotel.contact.name} {booking.hotel.contact.surname}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="material-icons-round text-slate-400">phone</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{L('phone')}</p>
                                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.hotel.contact.phoneCountryCode} {booking.hotel.contact.phoneNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="material-icons-round text-slate-400">email</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{L('email')}</p>
                                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.hotel.contact.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rooms Section */}
                        {booking.hotel?.rooms && booking.hotel.rooms.length > 0 && booking.hotel.rooms.map((room, roomIndex) => (
                            <div key={roomIndex} className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <span className="material-icons-round text-2xl">meeting_room</span>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{L('room')} {roomIndex + 1}: {room.roomName}</h2>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{L('roomId')}: {room.roomId}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <span>{L('bookingStatus')}:</span>
                                                <BookingStatusBadge status={getOverallDisplayStatus()} className="px-2 py-0.5 rounded-md text-[9px]" />
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{L('confCode')}: <span className="font-bold text-slate-700 dark:text-slate-200">{room.roomConfirmationCode || 'N/A'}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Occupancies */}
                                {room.occupancies && room.occupancies.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">{L('guests')}</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('name')}</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('nationality')}</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('birthDate')}</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('gender')}</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('type')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {room.occupancies.map((guest, guestIndex) => (
                                                        <tr key={guestIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-medium text-slate-900 dark:text-white">{guest.name} {guest.surname}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{guest.nationality}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-xs text-slate-600 dark:text-slate-300">{formatDate(guest.birthDate)}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-icons-round text-slate-400 text-sm">{getGenderIcon(guest.gender)}</span>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-300">{getGenderLabel(guest.gender)}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
                                                                    {getGuestTypeLabel(guest.guestType)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Rates */}
                                {room.rates && room.rates.length > 0 && room.rates.map((rate, rateIndex) => (
                                    <div key={rateIndex} className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">{L('rateDetails')}</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('boardType')}</p>
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatBoardType(rate.boardType)}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('totalAmount')}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg font-black text-primary">{rate.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                                    <span className="text-sm font-bold text-slate-400">{rate.currency}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('refundable')}</p>
                                                <RefundPolicyTooltip
                                                    isRefundable={rate.refundable}
                                                    textOverride={rate.refundable ? L('yes') : L('no')}
                                                    className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${rate.refundable ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('rateCategory')}</p>
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{rate.rateCategoryId || 'N/A'}</p>
                                            </div>
                                            {/* Removed Rate Code as requested */}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                            {/* Fees */}
                                            <div>
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">{L('fees')}</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('type')}</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('amount')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {rate.fees && rate.fees.length > 0 ? rate.fees.map((fee, feeIndex) => (
                                                                <tr key={feeIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{fee.type?.replace(/_/g, ' ') || 'N/A'}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <p className="text-xs font-medium text-slate-900 dark:text-white">{fee.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {fee.currency}</p>
                                                                    </td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan="2" className="px-4 py-3 text-center text-xs text-slate-400 italic">{L('noFees')}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Taxes */}
                                            <div>
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">{L('taxes')}</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('type')}</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('amount')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {rate.taxes && rate.taxes.length > 0 ? rate.taxes.map((tax, taxIndex) => (
                                                                <tr key={taxIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{tax.type?.replace(/_/g, ' ') || 'N/A'}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <p className="text-xs font-medium text-slate-900 dark:text-white">{tax.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tax.currency}</p>
                                                                    </td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan="2" className="px-4 py-3 text-center text-xs text-slate-400 italic">{L('noTaxes')}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Prices */}
                                        {rate.dailyPrices && rate.dailyPrices.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">{L('dailyPrices')}</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('date')}</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('amount')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {rate.dailyPrices.map((daily, dailyIndex) => (
                                                                <tr key={dailyIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatDate(daily.date)}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <p className="text-xs font-medium text-primary">{daily.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {rate.currency}</p>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancellation Policies */}
                                        {rate.cancellationPolicies && rate.cancellationPolicies.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">{L('cancelPolicies')}</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('fromDate')}</th>
                                                                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('toDate')}</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">{L('penaltyAmount')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {rate.cancellationPolicies.map((policy, policyIndex) => (
                                                                <tr key={policyIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-xs text-slate-700 dark:text-slate-200">{formatDateTime(policy.fromDate)}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <p className="text-xs text-slate-700 dark:text-slate-200">{formatDateTime(policy.toDate)}</p>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <p className="text-xs font-medium text-red-600 dark:text-red-400">{policy.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {policy.currency}</p>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Audit Information Card */}
                        {booking.audit && (
                            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                        <span className="material-icons-round text-2xl">history</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{L('auditInfo')}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{L('auditInfoSub')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('created')}</p>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatDateTime(booking.audit.createDateTime)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{L('by')} {booking.audit.createdBy}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('updated')}</p>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{formatDateTime(booking.audit.updateDateTime)}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{L('by')} {booking.audit.updatedBy}</p>
                                    </div>
                                    {/* Removed Status from Audit Info as requested */}
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{L('version')}</p>
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{booking.audit.version}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetail;
