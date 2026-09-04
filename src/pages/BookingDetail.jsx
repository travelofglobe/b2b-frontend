import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/bookingService';
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
            case 'PAID_CREDIT_CARD':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
            case 'PENDING':
            case 'PENDING_PAYMENT':
                return 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40';
            case 'FAILED':
                return 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40';
            default:
                return 'bg-slate-50 text-slate-600 border border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400';
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

    const getOverallDisplayStatus = () => {
        if (booking?.hotel?.bookingStatus) {
            return booking.hotel.bookingStatus;
        }
        if (booking?.status) {
            return booking.status;
        }
        return 'UNKNOWN';
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

    const calculateNights = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return isNaN(diffDays) ? 0 : diffDays;
    };

    if (loading || error || !booking) {
        return (
            <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
                {/* Top Indeterminate Progress Bar */}
                {loading && (
                    <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
                        <div className="h-full bg-[#1a73e8] animate-progress-indeterminate origin-left"></div>
                    </div>
                )}

                {/* Header Skeleton */}
                <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0 z-30 transition-all">
                    <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="size-9 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] flex items-center justify-center text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-[#202124] dark:text-white tracking-tight">{L('title')}</h1>
                                <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                    {loading ? L('fetching') : error ? L('errorLoading') : L('bookingInfo')}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {loading ? (
                        <div className="space-y-6 animate-pulse">
                            {/* Hero Cards Skeleton */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 h-28 flex flex-col justify-between">
                                        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-36"></div>
                                    </div>
                                ))}
                            </div>
                            {/* Main Skeleton */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-64"></div>
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-96"></div>
                                </div>
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-80"></div>
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="bg-white dark:bg-[#28292c] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 max-w-md text-center mx-auto shadow-sm">
                                <div className="size-14 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#d93025] dark:text-rose-400">
                                    <span className="material-symbols-outlined text-[32px]">error</span>
                                </div>
                                <h3 className="text-base font-bold text-[#202124] dark:text-white mb-2">{L('unavailable')}</h3>
                                <p className="text-xs text-[#5f6368] dark:text-slate-400 mb-6">{error}</p>
                                <button
                                    onClick={() => navigate('/bookings')}
                                    className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl font-medium text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                                >
                                    {L('backToBookings')}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        );
    }

    const nights = calculateNights(booking.checkIn, booking.checkOut);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
            {/* Header - Google Flights / Workspace Style */}
            <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0 z-30 transition-all">
                <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/bookings')}
                            className="size-9 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] flex items-center justify-center text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors cursor-pointer shadow-2xs"
                            title={L('backToBookings')}
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-xl font-bold text-[#202124] dark:text-white tracking-tight">
                                    {L('title')}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]">
                                    #{booking.orderId}
                                </span>
                                <BookingStatusBadge status={getOverallDisplayStatus()} showIcon />
                            </div>
                            <p className="text-xs text-[#5f6368] dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{booking.hotel?.hotelName || 'Otel Bilgisi'}</span>
                                {booking.voucher && (
                                    <>
                                        <span>•</span>
                                        <span>Voucher: <strong className="font-semibold text-[#202124] dark:text-slate-200">{booking.voucher}</strong></span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {booking.voucher && (
                            <button
                                onClick={() => window.open(`/bookings/${booking.voucher}/voucher`, '_blank')}
                                disabled={booking.status === 'FAILED' || booking.status === 'ERROR' || booking.hotel?.bookingStatus === 'FAILED' || booking.hotel?.bookingStatus === 'ERROR'}
                                className="h-9 px-4 rounded-xl flex items-center gap-1.5 font-semibold text-xs transition-all bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                <span>{L('voucher')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-medium text-xs transition-all bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] shadow-2xs active:scale-95 cursor-pointer"
                            title="Yazdır"
                        >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                            <span className="hidden sm:inline">Yazdır</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Bounded Content Canvas */}
            <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* 4 Hero Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Konaklama Tarihleri */}
                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-4 shadow-xs flex flex-col justify-between hover:border-[#1a73e8]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                {currentLang === 'tr' ? 'Konaklama Tarihi' : 'Stay Dates'}
                            </span>
                            <div className="size-8 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-base font-bold text-[#202124] dark:text-white truncate">
                                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </div>
                            <span className="text-[11px] font-medium text-[#1a73e8] dark:text-[#8ab4f8]">
                                {nights > 0 ? `${nights} ${currentLang === 'tr' ? 'Gece Konaklama' : 'Nights'}` : 'Giriş / Çıkış'}
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Toplam Satış Tutarı */}
                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-4 shadow-xs flex flex-col justify-between hover:border-[#1a73e8]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                {L('totalAmount')}
                            </span>
                            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-[#1e8e3e] dark:text-emerald-400">
                                <span className="material-symbols-outlined text-[18px]">payments</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-[#1a73e8] dark:text-[#8ab4f8] truncate">
                                {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                <span className="text-xs font-semibold ml-1.5">{booking.currency || ''}</span>
                            </div>
                            <span className="text-[11px] text-[#70757a] dark:text-slate-400">
                                {currentLang === 'tr' ? 'Vergiler dahil tutar' : 'Taxes included'}
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Ödeme Durumu */}
                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-4 shadow-xs flex flex-col justify-between hover:border-[#1a73e8]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                {L('paymentStatus')}
                            </span>
                            <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1a73e8]">
                                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-base font-bold text-[#202124] dark:text-white truncate">
                                {getPaymentStatusLabel(booking.payment?.status)}
                            </div>
                            <span className="text-[11px] text-[#70757a] dark:text-slate-400">
                                {booking.payment?.status ? booking.payment.status.replace(/_/g, ' ') : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Voucher & Ref */}
                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-4 shadow-xs flex flex-col justify-between hover:border-[#1a73e8]/40 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                {currentLang === 'tr' ? 'Referans & Voucher' : 'Reference & Voucher'}
                            </span>
                            <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-base font-bold text-[#202124] dark:text-white truncate font-mono">
                                {booking.voucher || booking.clientReferenceId || 'N/A'}
                            </div>
                            <span className="text-[11px] text-[#70757a] dark:text-slate-400">
                                {booking.clientReferenceId ? `Ref: ${booking.clientReferenceId}` : `Sipariş: #${booking.orderId}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2-Column Main Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left / Main Column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Hotel Information Card */}
                        {booking.hotel && (
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                            <span className="material-symbols-outlined text-[22px]">hotel</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-[#202124] dark:text-white">{L('hotelInfo')}</h2>
                                            <p className="text-xs text-[#5f6368] dark:text-slate-400">{L('hotelInfoSub')}</p>
                                        </div>
                                    </div>
                                    {booking.hotel.internalHotelId && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-slate-300">
                                            ID: {booking.hotel.internalHotelId}
                                        </span>
                                    )}
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h3 className="text-lg font-bold text-[#202124] dark:text-white">
                                            {booking.hotel.hotelName}
                                        </h3>
                                        {booking.hotel.isRecommended && (
                                            <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                                                Tavsiye Edilen
                                            </span>
                                        )}
                                    </div>

                                    {/* Contact Details */}
                                    {booking.hotel.contact && (
                                        <div className="pt-2">
                                            <h4 className="text-xs font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider mb-2.5">
                                                {L('contactInfo')}
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                    <span className="material-symbols-outlined text-[#70757a] text-[20px]">person</span>
                                                    <div className="truncate">
                                                        <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('name')}</p>
                                                        <p className="text-xs font-semibold text-[#202124] dark:text-white truncate">
                                                            {booking.hotel.contact.name} {booking.hotel.contact.surname}
                                                        </p>
                                                    </div>
                                                </div>

                                                {booking.hotel.contact.phoneNumber && (
                                                    <a 
                                                        href={`tel:${booking.hotel.contact.phoneCountryCode || ''}${booking.hotel.contact.phoneNumber}`}
                                                        className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60 hover:border-[#1a73e8] transition-colors group"
                                                    >
                                                        <span className="material-symbols-outlined text-[#70757a] group-hover:text-[#1a73e8] text-[20px]">call</span>
                                                        <div className="truncate">
                                                            <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('phone')}</p>
                                                            <p className="text-xs font-semibold text-[#202124] dark:text-white group-hover:text-[#1a73e8] truncate">
                                                                {booking.hotel.contact.phoneCountryCode} {booking.hotel.contact.phoneNumber}
                                                            </p>
                                                        </div>
                                                    </a>
                                                )}

                                                {booking.hotel.contact.email && (
                                                    <a 
                                                        href={`mailto:${booking.hotel.contact.email}`}
                                                        className="flex items-center gap-2.5 p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60 hover:border-[#1a73e8] transition-colors group"
                                                    >
                                                        <span className="material-symbols-outlined text-[#70757a] group-hover:text-[#1a73e8] text-[20px]">mail</span>
                                                        <div className="truncate">
                                                            <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('email')}</p>
                                                            <p className="text-xs font-semibold text-[#202124] dark:text-white group-hover:text-[#1a73e8] truncate">
                                                                {booking.hotel.contact.email}
                                                            </p>
                                                        </div>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rooms & Occupancies Section */}
                        {booking.hotel?.rooms && booking.hotel.rooms.length > 0 && booking.hotel.rooms.map((room, roomIndex) => (
                            <div key={roomIndex} className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 shadow-xs space-y-6">
                                {/* Room Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <span className="material-symbols-outlined text-[22px]">meeting_room</span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-[#202124] dark:text-white">
                                                {room.roomName || `${L('room')} ${roomIndex + 1}`}
                                            </h3>
                                            <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                                {L('roomId')}: {room.roomId || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {room.roomConfirmationCode && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                                                {L('confCode')}: {room.roomConfirmationCode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Guests / Occupancies Table */}
                                {room.occupancies && room.occupancies.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px] text-[#70757a]">group</span>
                                            <h4 className="text-xs font-bold text-[#3c4043] dark:text-slate-200 uppercase tracking-wider">
                                                {L('guests')} ({room.occupancies.length})
                                            </h4>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{L('name')}</th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{L('nationality')}</th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{L('birthDate')}</th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{L('gender')}</th>
                                                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{L('type')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#dadce0]/50 dark:divide-[#3c4043]/50">
                                                    {room.occupancies.map((guest, gIdx) => (
                                                        <tr key={gIdx} className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124]/50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-7 rounded-full bg-[#f1f3f4] dark:bg-[#303134] flex items-center justify-center text-[#70757a] text-xs font-bold">
                                                                        {guest.name?.charAt(0) || 'G'}
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-[#202124] dark:text-white">
                                                                        {guest.name} {guest.surname}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-medium text-[#3c4043] dark:text-slate-300">
                                                                {guest.nationality || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-[#5f6368] dark:text-slate-400">
                                                                {formatDate(guest.birthDate)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5 text-xs text-[#5f6368] dark:text-slate-400">
                                                                    <span className="material-symbols-outlined text-[16px]">{getGenderIcon(guest.gender)}</span>
                                                                    <span>{getGenderLabel(guest.gender)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]">
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

                                {/* Rate Breakdown per Room */}
                                {room.rates && room.rates.length > 0 && room.rates.map((rate, rIdx) => (
                                    <div key={rIdx} className="pt-4 border-t border-[#dadce0] dark:border-[#3c4043] space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px] text-[#70757a]">receipt</span>
                                                <h4 className="text-xs font-bold text-[#3c4043] dark:text-slate-200 uppercase tracking-wider">
                                                    {L('rateDetails')} {room.rates.length > 1 ? `#${rIdx + 1}` : ''}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[#70757a]">{rate.rateCategoryId || ''}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('boardType')}</p>
                                                <p className="text-xs font-bold text-[#202124] dark:text-white mt-0.5">
                                                    {formatBoardType(rate.boardType)}
                                                </p>
                                            </div>

                                            <div className="p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('totalAmount')}</p>
                                                <p className="text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] mt-0.5">
                                                    {rate.totalAmount != null ? Number(rate.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} {rate.currency}
                                                </p>
                                            </div>

                                            <div className="p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('refundable')}</p>
                                                <div className="mt-0.5">
                                                    <RefundPolicyTooltip
                                                        isRefundable={rate.refundable}
                                                        textOverride={rate.refundable ? L('yes') : L('no')}
                                                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            rate.refundable 
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/60 dark:border-[#3c4043]/60">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('rateCategory')}</p>
                                                <p className="text-xs font-semibold text-[#202124] dark:text-white mt-0.5">
                                                    {rate.rateCategoryId || 'Standart'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Daily Prices Breakdown */}
                                        {rate.dailyPrices && rate.dailyPrices.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <span className="text-[11px] font-bold text-[#70757a] uppercase tracking-wider block">
                                                    {L('dailyPrices')}
                                                </span>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                    {rate.dailyPrices.map((dp, dpIdx) => (
                                                        <div key={dpIdx} className="p-2 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/50 text-center">
                                                            <div className="text-[10px] text-[#70757a] font-medium">{formatDate(dp.date)}</div>
                                                            <div className="text-xs font-bold text-[#1a73e8] mt-0.5">
                                                                {Number(dp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {rate.currency}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancellation Policies Table */}
                                        {rate.cancellationPolicies && rate.cancellationPolicies.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <span className="text-[11px] font-bold text-[#70757a] uppercase tracking-wider block">
                                                    {L('cancelPolicies')}
                                                </span>
                                                <div className="overflow-x-auto rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                                                <th className="px-3.5 py-2 text-left text-[11px] font-bold text-[#70757a] uppercase">{L('fromDate')}</th>
                                                                <th className="px-3.5 py-2 text-left text-[11px] font-bold text-[#70757a] uppercase">{L('toDate')}</th>
                                                                <th className="px-3.5 py-2 text-right text-[11px] font-bold text-[#70757a] uppercase">{L('penaltyAmount')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[#dadce0]/50">
                                                            {rate.cancellationPolicies.map((p, pIdx) => (
                                                                <tr key={pIdx} className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124]/40">
                                                                    <td className="px-3.5 py-2 text-xs text-[#3c4043] dark:text-slate-300">{formatDateTime(p.fromDate)}</td>
                                                                    <td className="px-3.5 py-2 text-xs text-[#3c4043] dark:text-slate-300">{formatDateTime(p.toDate)}</td>
                                                                    <td className="px-3.5 py-2 text-xs font-bold text-[#d93025] dark:text-rose-400 text-right">
                                                                        {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {p.currency}
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
                    </div>

                    {/* Right / Secondary Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Financial Breakdown Card */}
                        <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-[#dadce0] dark:border-[#3c4043]">
                                <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-[#1e8e3e] dark:text-emerald-400">
                                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                </div>
                                <h3 className="text-sm font-bold text-[#202124] dark:text-white">
                                    {currentLang === 'tr' ? 'Finansal Detaylar' : 'Financial Details'}
                                </h3>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-[#5f6368] dark:text-slate-400">{L('totalAmount')}</span>
                                    <span className="font-bold text-sm text-[#1a73e8] dark:text-[#8ab4f8]">
                                        {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} {booking.currency}
                                    </span>
                                </div>

                                {booking.totalTaxAmount != null && (
                                    <div className="flex items-center justify-between py-1 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50">
                                        <span className="text-[#5f6368] dark:text-slate-400">{L('taxAmount')}</span>
                                        <span className="font-medium text-[#202124] dark:text-white">
                                            {Number(booking.totalTaxAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {booking.totalOnSpotAmount != null && (
                                    <div className="flex items-center justify-between py-1 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50">
                                        <span className="text-[#5f6368] dark:text-slate-400">{L('onSpotAmount')}</span>
                                        <span className="font-medium text-[#202124] dark:text-white">
                                            {Number(booking.totalOnSpotAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {Number(booking.totalPenaltyAmount || 0) > 0 && (
                                    <div className="flex items-center justify-between py-1 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 text-[#d93025] dark:text-rose-400">
                                        <span>{L('penaltyAmount')}</span>
                                        <span className="font-bold">
                                            {Number(booking.totalPenaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {Number(booking.totalRefundAmount || 0) > 0 && (
                                    <div className="flex items-center justify-between py-1 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 text-[#1e8e3e] dark:text-emerald-400">
                                        <span>{L('refundAmount')}</span>
                                        <span className="font-bold">
                                            {Number(booking.totalRefundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {booking.transactionUser && (
                                    <div className="flex items-center justify-between py-1 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50">
                                        <span className="text-[#5f6368] dark:text-slate-400">{L('transactionUser')}</span>
                                        <span className="font-semibold text-[#202124] dark:text-slate-200">
                                            {booking.transactionUser}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Remark Card */}
                        {booking.remark && (
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs space-y-2">
                                <div className="flex items-center gap-2 text-[#e37400] dark:text-amber-400">
                                    <span className="material-symbols-outlined text-[18px]">info</span>
                                    <h4 className="text-xs font-bold uppercase tracking-wider">{L('remark')}</h4>
                                </div>
                                <p className="text-xs text-[#3c4043] dark:text-slate-300 italic bg-[#f8f9fa] dark:bg-[#202124] p-3 rounded-xl border border-[#dadce0]/60">
                                    "{booking.remark}"
                                </p>
                            </div>
                        )}

                        {/* Audit Info Card */}
                        {booking.audit && (
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs space-y-3">
                                <div className="flex items-center gap-2 pb-2.5 border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#70757a]">
                                        <span className="material-symbols-outlined text-[16px]">history</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                        {L('auditInfo')}
                                    </h4>
                                </div>

                                <div className="space-y-2.5 text-xs text-[#5f6368] dark:text-slate-400">
                                    <div>
                                        <span className="block font-bold text-[#3c4043] dark:text-slate-200 text-[11px] uppercase">
                                            {L('created')}
                                        </span>
                                        <span className="text-xs">{formatDateTime(booking.audit.createDateTime)}</span>
                                        {booking.audit.createdBy && (
                                            <span className="block text-[11px] text-[#70757a]">
                                                {L('by')} {booking.audit.createdBy}
                                            </span>
                                        )}
                                    </div>

                                    {booking.audit.updateDateTime && (
                                        <div className="pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50">
                                            <span className="block font-bold text-[#3c4043] dark:text-slate-200 text-[11px] uppercase">
                                                {L('updated')}
                                            </span>
                                            <span className="text-xs">{formatDateTime(booking.audit.updateDateTime)}</span>
                                            {booking.audit.updatedBy && (
                                                <span className="block text-[11px] text-[#70757a]">
                                                    {L('by')} {booking.audit.updatedBy}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {booking.audit.version != null && (
                                        <div className="pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 flex items-center justify-between">
                                            <span className="font-bold text-[#3c4043] dark:text-slate-200 text-[11px] uppercase">
                                                {L('version')}
                                            </span>
                                            <span className="font-mono font-bold text-xs text-[#202124] dark:text-white">
                                                v{booking.audit.version}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BookingDetail;
