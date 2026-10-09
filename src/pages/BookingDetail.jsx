import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/bookingService';
import { hotelService } from '../services/hotelService';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import CreateTaskModal from '../components/CreateTaskModal';
import { tBD } from '../utils/bookingDetailLocales';

const BookingDetail = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [hotelDetails, setHotelDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedText, setCopiedText] = useState(null);

    // ── Cancel flow state ──────────────────────────────────────────
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    // step: 'info' | 'reason' | 'simulation' | 'confirming'
    const [cancelStep, setCancelStep] = useState('info');
    const [cancelReason, setCancelReason] = useState('GUEST_REQUEST');
    const [cancelNote, setCancelNote] = useState('');
    const [cancelSimResult, setCancelSimResult] = useState(null);
    const [cancelSimLoading, setCancelSimLoading] = useState(false);
    const [cancelConfirmLoading, setCancelConfirmLoading] = useState(false);
    const [cancelError, setCancelError] = useState(null);
    // ──────────────────────────────────────────────────────────────

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
                if (data?.hotel?.internalHotelId) {
                    try {
                        const hDetails = await hotelService.getHotelDetail(data.hotel.internalHotelId, signal);
                        if (!signal?.aborted && hDetails) {
                            setHotelDetails(hDetails);
                        }
                    } catch (hErr) {
                        console.error('Fetch supplementary hotel details error:', hErr);
                    }
                }
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

    const handleCopy = async (text, label) => {
        if (!text) return;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for HTTP or older browsers
                const el = document.createElement('textarea');
                el.value = text;
                el.style.position = 'fixed';
                el.style.opacity = '0';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }
            setCopiedText(label);
            setTimeout(() => setCopiedText(null), 2500);
        } catch (err) {
            console.error('Copy failed:', err);
            // Fallback on clipboard API failure
            try {
                const el = document.createElement('textarea');
                el.value = text;
                el.style.position = 'fixed';
                el.style.opacity = '0';
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                setCopiedText(label);
                setTimeout(() => setCopiedText(null), 2500);
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
        }
    };

    // ── Cancel reasons (enum) ─────────────────────────────────────
    const CANCEL_REASONS = [
        { value: 'GUEST_REQUEST',       en: 'Guest requested cancellation',                          tr: 'Misafir iptal talebinde bulundu' },
        { value: 'DUPLICATE_BOOKING',   en: 'Duplicate booking',                                     tr: 'Mükerrer rezervasyon' },
        { value: 'PAYMENT_FAILED',      en: 'Payment failed or not received',                        tr: 'Ödeme başarısız oldu veya ödeme alınamadı' },
        { value: 'HOTEL_OVERBOOKED',    en: 'Hotel overbooked',                                      tr: 'Otel fazla rezervasyon aldı (overbooking)' },
        { value: 'PRICE_CHANGED',       en: 'Price change after booking',                            tr: 'Rezervasyon sonrası fiyat değişikliği' },
        { value: 'INVALID_RATE',        en: 'Invalid or expired rate',                               tr: 'Geçersiz veya süresi dolmuş fiyat' },
        { value: 'INVALID_ROOM',        en: 'Invalid or unavailable room',                           tr: 'Geçersiz veya müsait olmayan oda' },
        { value: 'TECHNICAL_ERROR',     en: 'System or technical error',                             tr: 'Sistem veya teknik hata' },
        { value: 'SUPPLIER_REJECTION',  en: 'Supplier rejected booking',                             tr: 'Tedarikçi rezervasyonu reddetti' },
        { value: 'NO_SHOW',             en: 'Guest did not arrive (no-show)',                        tr: 'Misafir otele gelmedi (no-show)' },
        { value: 'AGENT_REQUEST',       en: 'Agency requested cancellation',                         tr: 'Acente iptal talebinde bulundu' },
        { value: 'HOTEL_CLOSED',        en: 'Hotel temporarily or permanently closed',               tr: 'Otel geçici veya kalıcı olarak kapalı' },
        { value: 'FORCE_MAJEURE',       en: 'Force majeure (e.g. natural disaster, pandemic)',       tr: 'Mücbir sebep (ör. doğal afet, pandemi)' },
        { value: 'FRAUD_SUSPECTED',     en: 'Fraud suspected or security concern',                   tr: 'Dolandırıcılık şüphesi veya güvenlik endişesi' },
        { value: 'CUSTOMER_CHANGED_DATES', en: 'Customer changed travel dates',                     tr: 'Müşteri seyahat tarihlerini değiştirdi' },
        { value: 'POLICY_VIOLATION',    en: 'Cancellation due to policy or rule violation',          tr: 'Politika veya kural ihlali nedeniyle iptal' },
        { value: 'TIMEOUT',             en: 'Supplier or system timeout during confirmation',        tr: 'Rezervasyon onayı sırasında tedarikçi veya sistem zaman aşımı' },
        { value: 'UNKNOWN',             en: 'Unknown reason',                                        tr: 'Bilinmeyen neden' },
    ];

    const getCancelReasonLabel = (value) => {
        const r = CANCEL_REASONS.find(x => x.value === value);
        if (!r) return value;
        return currentLang === 'tr' ? r.tr : r.en;
    };

    // ── Determine cancel eligibility ─────────────────────────────
    const getCancelEligibility = () => {
        if (!booking) return { canCancel: false, reason: 'noBooking' };
        const status = booking.hotel?.bookingStatus || booking.status;
        if (status === 'CANCELLED' || status === 'CANCELED') return { canCancel: false, reason: 'alreadyCancelled' };
        if (status === 'FAILED' || status === 'ERROR') return { canCancel: false, reason: 'failed' };
        const rooms = booking.hotel?.rooms || [];
        const anyRefundable = rooms.some(r => r.rates?.some(rate => rate.refundable === true));
        if (!anyRefundable) return { canCancel: false, reason: 'nonRefundable' };
        return { canCancel: true, reason: null };
    };

    // Build the cancel request payload
    const buildCancelPayload = (simulation) => {
        const roomConfirmationCodes = (booking.hotel?.rooms || [])
            .map(r => r.roomConfirmationCode)
            .filter(Boolean);
        return {
            voucher: booking.voucher,
            roomConfirmationCodes,
            simulation,
            cancelReason,
            bookingUuid: booking.uuid || booking.bookingUuid || booking.id || bookingId,
            cancelNote
        };
    };

    // Open modal → step 1: info
    const handleCancelClick = () => {
        setCancelError(null);
        setCancelSimResult(null);
        setCancelReason('GUEST_REQUEST');
        setCancelNote('');
        setCancelStep('info');
        setIsCancelModalOpen(true);
    };

    // Step 1 → Step 2: show reason form
    const handleCancelInfoContinue = () => {
        setCancelStep('reason');
    };

    // Step 2 → Step 3: run simulation
    const handleCancelReasonContinue = async () => {
        if (!cancelReason) return;
        setCancelError(null);
        setCancelSimResult(null);
        setCancelStep('simulation');
        setCancelSimLoading(true);
        try {
            const payload = buildCancelPayload(true);
            const result = await hotelService.cancelBooking(payload);
            setCancelSimResult(result);
        } catch (err) {
            console.error('Cancel simulation error:', err);
            setCancelError(err?.message || L('cancelSimulationErrorMsg'));
        } finally {
            setCancelSimLoading(false);
        }
    };

    // Step 3 → real cancel (simulation: false)
    const handleCancelConfirm = async () => {
        setCancelError(null);
        setCancelConfirmLoading(true);
        try {
            const payload = buildCancelPayload(false);
            await hotelService.cancelBooking(payload);
            setIsCancelModalOpen(false);
            setCancelSimResult(null);
            await fetchBookingDetail();
        } catch (err) {
            console.error('Cancel confirm error:', err);
            setCancelError(err?.message || L('cancelErrorMsg'));
        } finally {
            setCancelConfirmLoading(false);
        }
    };

    const handleCancelClose = () => {
        if (cancelSimLoading || cancelConfirmLoading) return;
        setIsCancelModalOpen(false);
        setCancelSimResult(null);
        setCancelError(null);
    };
    // ──────────────────────────────────────────────────────────────

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString(currentLang, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatFullDateWithDay = (dateString) => {
        if (!dateString) return { day: '--', monthYear: '---', weekday: '---' };
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return { day: '--', monthYear: '---', weekday: '---' };
        return {
            day: date.getDate(),
            monthYear: date.toLocaleDateString(currentLang, { month: 'short', year: 'numeric' }),
            weekday: date.toLocaleDateString(currentLang, { weekday: 'long' })
        };
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';

        try {
            let timezoneMatch = dateTimeString.match(/\[([^\]]+)\]/);
            let timezone = timezoneMatch ? timezoneMatch[1] : null;
            let cleanDateString = dateTimeString.replace(/\[([^\]]+)\]/, '');
            const date = new Date(cleanDateString);

            if (isNaN(date.getTime())) return 'Invalid Date';

            const formattedDate = date.toLocaleString(currentLang, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            if (timezone) return `${formattedDate} (${timezone})`;
            return formattedDate;
        } catch (error) {
            console.error('Error formatting date:', dateTimeString, error);
            return 'Invalid Date';
        }
    };

    const getHotelAddress = () => {
        const addr = hotelDetails?.address || booking?.hotel?.address;
        if (addr) {
            if (typeof addr === 'string' && addr.trim()) return addr.trim();
            if (typeof addr === 'object') {
                const parts = [
                    addr.street,
                    addr.houseNumber,
                    addr.cityName,
                    addr.stateName,
                    addr.countryName || addr.countryCode
                ].filter(p => p && String(p).trim().length > 0);
                if (parts.length > 0) return parts.join(', ');
            }
        }
        if (hotelDetails?.locationPathNames && hotelDetails.locationPathNames.trim()) {
            return hotelDetails.locationPathNames.trim();
        }
        return null;
    };

    const getHotelStarData = () => {
        const starObj = hotelDetails?.hotelStar || booking?.hotel?.hotelStar;
        let count = 0;
        if (starObj?.star != null) {
            count = Number(starObj.star);
        } else if (hotelDetails?.stars != null) {
            count = Number(hotelDetails.stars);
        } else if (booking?.hotel?.stars != null) {
            count = Number(booking.hotel.stars);
        } else if (starObj?.names?.en) {
            const parsed = parseInt(starObj.names.en, 10);
            if (!isNaN(parsed)) count = parsed;
        }

        if (count > 0 && count <= 7) {
            const label = starObj?.names?.[currentLang] || starObj?.names?.en || `${count} ${L('stars') || 'Yıldız'}`;
            return { count, label };
        }
        return null;
    };

    const getPaymentStatusBadge = (status) => {
        switch (status) {
            case 'PAID_ACCOUNT':
            case 'PAID_CREDIT_CARD':
                return {
                    label: getPaymentStatusLabel(status),
                    classes: 'bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#ceead6] dark:border-emerald-800',
                    icon: 'check_circle'
                };
            case 'PENDING':
            case 'PENDING_PAYMENT':
                return {
                    label: getPaymentStatusLabel(status),
                    classes: 'bg-[#fef7e0] text-[#b06000] dark:bg-amber-950/40 dark:text-amber-300 border border-[#feefc3] dark:border-amber-800',
                    icon: 'schedule'
                };
            case 'REFUNDED_CREDIT_CARD':
            case 'REFUNDED_ACCOUNT':
                return {
                    label: getPaymentStatusLabel(status),
                    classes: 'bg-[#f3e8fd] text-[#7627bb] dark:bg-purple-950/40 dark:text-purple-300 border border-[#e9d2fd] dark:border-purple-800',
                    icon: 'currency_exchange'
                };
            case 'FAILED':
                return {
                    label: getPaymentStatusLabel(status),
                    classes: 'bg-[#fce8e6] text-[#c5221f] dark:bg-rose-950/40 dark:text-rose-300 border border-[#fad2cf] dark:border-rose-800',
                    icon: 'error'
                };
            default:
                return {
                    label: status ? status.replace(/_/g, ' ') : 'N/A',
                    classes: 'bg-[#f1f3f4] text-[#5f6368] dark:bg-[#303134] dark:text-slate-300 border border-[#dadce0] dark:border-[#5f6368]',
                    icon: 'help_outline'
                };
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
        if (bt === 'RO') return 'RO • Room Only';
        if (bt === 'BB') return 'BB • Bed & Breakfast';
        if (bt === 'HB') return 'HB • Half Board';
        if (bt === 'FB') return 'FB • Full Board';
        if (bt === 'AI') return 'AI • All Inclusive';
        if (bt === 'UAI') return 'UAI • Ultra All Inclusive';
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
                {/* Google Blue Loading Bar */}
                {loading && (
                    <div className="fixed top-0 left-0 w-full h-1 z-[9999]">
                        <div className="h-full bg-[#1a73e8] animate-progress-indeterminate origin-left"></div>
                    </div>
                )}

                {/* Header Skeleton */}
                <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-6 sm:px-10 lg:px-12 py-3 flex-shrink-0 z-30 transition-all">
                    <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/travel/hotels/bookings')}
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

                <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-6">
                    {loading ? (
                        <div className="space-y-6 animate-pulse">
                            {/* Trip Hero Banner Skeleton */}
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-56"></div>
                            {/* Main Grid Skeleton */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-64"></div>
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-80"></div>
                                </div>
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-72"></div>
                                    <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 h-48"></div>
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
                                    onClick={() => navigate('/travel/hotels/bookings')}
                                    className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
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
    const checkInDate = formatFullDateWithDay(booking.checkIn);
    const checkOutDate = formatFullDateWithDay(booking.checkOut);
    const paymentBadge = getPaymentStatusBadge(booking.payment?.status);

    const totalGuests = booking.hotel?.rooms?.reduce((acc, r) => acc + (r.occupancies?.length || 0), 0) || 0;

    return (
        <>
        <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto">
            {/* Toast Notification */}
            {copiedText && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#202124] dark:bg-white text-white dark:text-[#202124] px-4 py-2 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <span className="material-symbols-outlined text-[16px] text-[#8ab4f8] dark:text-[#1a73e8]">check_circle</span>
                    <span>{copiedText} panoya kopyalandı</span>
                </div>
            )}

            {/* Google Flights / Workspace Style Sticky Top Bar */}
            <header className="sticky top-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-6 sm:px-10 lg:px-12 py-3 flex-shrink-0 z-30 transition-all shadow-2xs">
                <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Breadcrumbs & Status Pills */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/travel/hotels/bookings')}
                            className="size-9 rounded-full bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] flex items-center justify-center text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors cursor-pointer shadow-2xs shrink-0"
                            title={L('backToBookings')}
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[#5f6368] dark:text-slate-400 hover:text-[#1a73e8] cursor-pointer" onClick={() => navigate('/travel/hotels/bookings')}>
                                {L('bookings')}
                            </span>
                            <span className="text-xs text-[#70757a]">/</span>
                            <span className="text-sm font-bold text-[#202124] dark:text-white">
                                #{booking.orderId}
                            </span>
                            <BookingStatusBadge status={getOverallDisplayStatus()} showIcon />
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${paymentBadge.classes}`}>
                                <span className="material-symbols-outlined text-[14px]">{paymentBadge.icon}</span>
                                {paymentBadge.label}
                            </span>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="h-9 px-4 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all bg-[#e8f0fe] dark:bg-blue-900/40 hover:bg-[#1a73e8] text-[#1a73e8] dark:text-blue-300 hover:text-white border border-blue-200 dark:border-blue-800 hover:border-blue-600 shadow-xs active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[18px]">support_agent</span>
                            <span>{currentLang === 'tr' ? 'Talep Oluştur' : 'Create Request'}</span>
                        </button>
                        {(() => {
                            const { canCancel } = getCancelEligibility();
                            if (!canCancel) return null;
                            return (
                                <button
                                    onClick={handleCancelClick}
                                    className="h-9 px-4 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all bg-[#fce8e6] hover:bg-[#d93025] text-[#d93025] hover:text-white border border-[#fad2cf] hover:border-[#d93025] shadow-xs active:scale-95 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                                    <span>{L('cancelBooking')}</span>
                                </button>
                            );
                        })()}
                        {booking.voucher && (
                            <button
                                onClick={() => window.open(`/travel/hotels/bookings/${booking.voucher}/voucher`, '_blank')}
                                disabled={booking.status === 'FAILED' || booking.status === 'ERROR' || booking.hotel?.bookingStatus === 'FAILED' || booking.hotel?.bookingStatus === 'ERROR'}
                                className="h-9 px-4 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                <span>{L('voucher')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="h-9 px-3.5 rounded-full flex items-center gap-1.5 font-medium text-xs transition-all bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] shadow-2xs active:scale-95 cursor-pointer"
                            title="Yazdır"
                        >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                            <span className="hidden sm:inline">Yazdır</span>
                        </button>
                        <button
                            onClick={() => handleCopy(window.location.href, 'Sayfa bağlantısı')}
                            className="size-9 rounded-full flex items-center justify-center transition-all bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] shadow-2xs active:scale-95 cursor-pointer"
                            title="Bağlantıyı Paylaş"
                        >
                            <span className="material-symbols-outlined text-[18px]">share</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Bounded Content Canvas */}
            <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 py-6 space-y-6">

                {/* 1. Google Travel Stay / Flight Hero Itinerary Banner */}
                <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 sm:p-7 shadow-xs space-y-6">

                    {/* ── Cancellation / Status Banner ─────────────────────────── */}
                    {(() => {
                        const status = booking.hotel?.bookingStatus;
                        const isCancelled = status === 'CANCELLED' || status === 'CANCELLED_WITH_PENALTY';
                        const isError = status === 'ERROR';

                        if (!isCancelled && !isError && status !== 'NEW') return null;

                        // Format cancel datetime
                        const cancelDT = booking.hotel?.cancelDateTime;
                        const cancelDateFormatted = cancelDT
                            ? new Date(cancelDT).toLocaleString('tr-TR', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                              })
                            : null;

                        // Map cancelReason to human-readable text
                        const CANCEL_REASON_LABELS = {
                            SUPPLIER_REJECTION:     currentLang === 'tr' ? 'Tedarikçi rezervasyonu reddetti'         : 'Supplier rejected the reservation',
                            GUEST_REQUEST:          currentLang === 'tr' ? 'Misafir talebi üzerine iptal edildi'     : 'Cancelled at guest request',
                            HOTEL_REQUEST:          currentLang === 'tr' ? 'Otel talebi üzerine iptal edildi'        : 'Cancelled at hotel request',
                            NO_SHOW:                currentLang === 'tr' ? 'Misafir gelmedi (No-Show)'               : 'No-show by guest',
                            SYSTEM_ERROR:           currentLang === 'tr' ? 'Sistem hatası nedeniyle iptal edildi'    : 'Cancelled due to system error',
                            ADMIN_CANCELLATION:     currentLang === 'tr' ? 'Yönetici tarafından iptal edildi'        : 'Cancelled by admin',
                            DUPLICATE_RESERVATION:  currentLang === 'tr' ? 'Mükerrer rezervasyon nedeniyle iptal'   : 'Duplicate reservation',
                        };
                        const reasonText = CANCEL_REASON_LABELS[booking.hotel?.cancelReason] || booking.hotel?.cancelReason || null;
                        const cancelNote = booking.hotel?.cancelNote;

                        // Determine banner style
                        const bannerStyle = isError
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300'
                            : status === 'CANCELLED_WITH_PENALTY'
                            ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300'
                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300';

                        const iconStyle = isError ? 'text-rose-500' : status === 'CANCELLED_WITH_PENALTY' ? 'text-orange-500' : 'text-red-500';
                        const icon = isError ? 'error' : status === 'CANCELLED_WITH_PENALTY' ? 'money_off' : 'cancel';

                        return (
                            <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${bannerStyle} mb-2`}>
                                <span className={`material-symbols-outlined text-[22px] shrink-0 mt-0.5 ${iconStyle}`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {icon}
                                </span>
                                <div className="flex flex-col gap-1 min-w-0">
                                    {/* Status + datetime */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <BookingStatusBadge status={status} showIcon className="text-[11px]" />
                                        {cancelDateFormatted && (
                                            <span className="text-xs font-medium opacity-80">
                                                {currentLang === 'tr'
                                                    ? `Bu rezervasyon ${cancelDateFormatted} tarihinde iptal edilmiştir.`
                                                    : `This reservation was cancelled on ${cancelDateFormatted}.`}
                                            </span>
                                        )}
                                    </div>
                                    {/* Cancel reason */}
                                    {reasonText && (
                                        <p className="text-xs font-semibold">
                                            {currentLang === 'tr' ? 'İptal Nedeni:' : 'Cancellation Reason:'}{' '}
                                            <span className="font-normal">{reasonText}</span>
                                        </p>
                                    )}
                                    {/* Cancel note */}
                                    {cancelNote && cancelNote !== reasonText && (
                                        <p className="text-xs opacity-75 italic">{cancelNote}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Top Row: Hotel Title & Price */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dadce0] dark:border-[#3c4043]">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* BookingStatus badge above hotel name */}
                                {booking.hotel?.bookingStatus && (
                                    <div className="w-full mb-0.5">
                                        <BookingStatusBadge status={booking.hotel.bookingStatus} showIcon className="text-[12px]" />
                                    </div>
                                )}
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-white tracking-tight">
                                    {booking.hotel?.hotelName || 'Otel Bilgisi'}
                                </h1>
                                {(() => {
                                    const starData = getHotelStarData();
                                    if (!starData) return null;
                                    return (
                                        <div 
                                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs" 
                                            title={starData.label}
                                        >
                                            {[...Array(starData.count)].map((_, i) => (
                                                <span 
                                                    key={i} 
                                                    className="material-symbols-outlined text-[15px] text-amber-400 select-none leading-none"
                                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                                >
                                                    star
                                                </span>
                                            ))}
                                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 ml-1">
                                                {starData.count}★
                                            </span>
                                        </div>
                                    );
                                })()}
                                {booking.hotel?.isRecommended && (
                                    <span className="bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#ceead6] dark:border-emerald-800 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                                        Tavsiye Edilen
                                    </span>
                                )}
                            </div>

                            {/* Address & Meta */}
                            {(() => {
                                const hotelAddress = getHotelAddress();
                                return (
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368] dark:text-slate-400">
                                        {hotelAddress && (
                                            <div className="flex items-center gap-1.5 text-[#3c4043] dark:text-slate-300">
                                                <span className="material-symbols-outlined text-[16px] text-[#1a73e8] dark:text-[#8ab4f8] shrink-0">location_on</span>
                                                <span className="font-medium">{hotelAddress}</span>
                                            </div>
                                        )}
                                        {booking.hotel?.internalHotelId && (
                                            <>
                                                {hotelAddress && <span>•</span>}
                                                <span className="font-medium text-[#70757a]">ID: {booking.hotel.internalHotelId}</span>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Top Total Amount Display */}
                        <div className="flex flex-col md:items-end">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                {L('totalAmount')}
                            </span>
                            <div className="text-2xl sm:text-3xl font-bold text-[#1a73e8] dark:text-[#8ab4f8] tracking-tight">
                                {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                <span className="text-base font-semibold ml-1.5">{booking.currency || ''}</span>
                            </div>
                            <span className="text-[11px] text-[#70757a] dark:text-slate-400">
                                {L('taxesAndFeesIncluded')}
                            </span>
                        </div>
                    </div>

                    {/* Middle Row: Google Flights / Travel Stay Route Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#f8f9fa] dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-[#dadce0]/80 dark:border-[#3c4043]">
                        {/* Check-in Card (4 cols) */}
                        <div className="md:col-span-4 space-y-1">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider block">
                                {L('checkIn')}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-[#202124] dark:text-white tracking-tight">
                                    {checkInDate.day}
                                </span>
                                <div>
                                    <div className="text-sm font-bold text-[#202124] dark:text-slate-200">
                                        {checkInDate.monthYear}
                                    </div>
                                    <div className="text-xs font-medium text-[#70757a]">
                                        {checkInDate.weekday}
                                    </div>
                                </div>
                            </div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[11px] font-medium text-[#5f6368] dark:text-slate-300">
                                {L('checkInFrom')}
                            </span>
                        </div>

                        {/* Stay Connection Path (4 cols) */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center py-2 text-center">
                            <div className="w-full flex items-center justify-center gap-2 text-[#70757a] mb-1">
                                <span className="size-2 rounded-full bg-[#1a73e8]"></span>
                                <div className="h-[2px] flex-1 bg-[#dadce0] dark:bg-[#5f6368] relative">
                                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] text-[#1a73e8] bg-[#f8f9fa] dark:bg-[#202124] px-1">
                                        nights_stay
                                    </span>
                                </div>
                                <span className="size-2 rounded-full bg-[#1a73e8]"></span>
                            </div>
                            <span className="text-sm font-bold text-[#1a73e8] dark:text-[#8ab4f8] mt-1">
                                {nights > 0 ? `${nights} ${nights > 1 ? L('nights') : L('night')}` : `1 ${L('night')}`}
                            </span>
                            <span className="text-xs text-[#5f6368] dark:text-slate-400">
                                {booking.hotel?.rooms?.length || 1} {L('roomSingular')} • {totalGuests} {L('guestsCount')}
                            </span>
                        </div>

                        {/* Check-out Card (4 cols) */}
                        <div className="md:col-span-4 space-y-1 md:text-right">
                            <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider block">
                                {L('checkOut')}
                            </span>
                            <div className="flex items-baseline gap-2 md:justify-end">
                                <span className="text-3xl font-black text-[#202124] dark:text-white tracking-tight">
                                    {checkOutDate.day}
                                </span>
                                <div className="md:text-left">
                                    <div className="text-sm font-bold text-[#202124] dark:text-slate-200">
                                        {checkOutDate.monthYear}
                                    </div>
                                    <div className="text-xs font-medium text-[#70757a]">
                                        {checkOutDate.weekday}
                                    </div>
                                </div>
                            </div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[11px] font-medium text-[#5f6368] dark:text-slate-300">
                                {L('checkOutUntil')}
                            </span>
                        </div>
                    </div>

                    {/* Bottom Row: Key Information Chips Bar */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        {booking.voucher && (
                            <button
                                onClick={() => handleCopy(booking.voucher, L('voucherCode'))}
                                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8f0fe] dark:hover:bg-[#1a73e8]/20 border border-transparent hover:border-[#1a73e8]/40 transition-all cursor-pointer text-xs"
                                title={L('clickToCopy')}
                            >
                                <span className="text-[#5f6368] dark:text-slate-400 font-medium">Voucher:</span>
                                <span className="font-mono font-bold text-[#202124] dark:text-white group-hover:text-[#1a73e8]">{booking.voucher}</span>
                                <span className="material-symbols-outlined text-[16px] text-[#70757a] group-hover:text-[#1a73e8]">content_copy</span>
                            </button>
                        )}

                        {booking.clientReferenceId && (
                            <button
                                onClick={() => handleCopy(booking.clientReferenceId, L('clientReference'))}
                                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8f0fe] dark:hover:bg-[#1a73e8]/20 border border-transparent hover:border-[#1a73e8]/40 transition-all cursor-pointer text-xs"
                                title={L('clickToCopy')}
                            >
                                <span className="text-[#5f6368] dark:text-slate-400 font-medium">Ref:</span>
                                <span className="font-mono font-bold text-[#202124] dark:text-white group-hover:text-[#1a73e8]">{booking.clientReferenceId}</span>
                                <span className="material-symbols-outlined text-[16px] text-[#70757a] group-hover:text-[#1a73e8]">content_copy</span>
                            </button>
                        )}

                        {booking.orderId && (
                            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] text-xs">
                                <span className="text-[#5f6368] dark:text-slate-400 font-medium">{L('orderId')}:</span>
                                <span className="font-bold text-[#202124] dark:text-white">#{booking.orderId}</span>
                            </div>
                        )}

                        {booking.hotel?.rooms?.[0]?.rates?.[0]?.boardType && (
                            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1f3f4] dark:bg-[#303134] text-xs">
                                <span className="material-symbols-outlined text-[16px] text-[#1a73e8]">restaurant</span>
                                <span className="font-semibold text-[#202124] dark:text-white">
                                    {formatBoardType(booking.hotel.rooms[0].rates[0].boardType)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column (8 cols): Room, Guests, Rates, Contact */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Rooms & Travelers Experience */}
                        {booking.hotel?.rooms && booking.hotel.rooms.length > 0 && booking.hotel.rooms.map((room, roomIndex) => (
                            <div key={roomIndex} className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 shadow-xs space-y-6">
                                {/* Room Header Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <div className="flex items-center gap-3">
                                        <div className="size-11 rounded-2xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                            <span className="material-symbols-outlined text-[24px]">bed</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-[#202124] dark:text-white tracking-tight">
                                                {room.roomName || `${L('room')} ${roomIndex + 1}`}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-slate-400 mt-0.5">
                                                <span>{L('roomId')}: {room.roomId || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {room.roomConfirmationCode && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] dark:bg-emerald-950/30 text-[#137333] dark:text-emerald-300 border border-[#ceead6] dark:border-emerald-800">
                                            {L('confCode')}: {room.roomConfirmationCode}
                                        </span>
                                    )}
                                </div>

                                {/* Travelers / Guests: Google Passenger Cards */}
                                {room.occupancies && room.occupancies.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[20px] text-[#1a73e8]">group</span>
                                                <h4 className="text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                                    {L('guestsLabel')} ({room.occupancies.length})
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {room.occupancies.map((guest, gIdx) => (
                                                <div 
                                                    key={gIdx}
                                                    className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] flex items-start gap-3 hover:border-[#1a73e8]/40 transition-all"
                                                >
                                                    <div className="size-10 rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-bold text-sm flex items-center justify-center shrink-0">
                                                        {guest.name?.charAt(0) || 'G'}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <p className="text-sm font-bold text-[#202124] dark:text-white truncate">
                                                                {guest.name} {guest.surname}
                                                            </p>
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#dadce0] dark:border-[#5f6368] shrink-0">
                                                                {getGuestTypeLabel(guest.guestType)}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5f6368] dark:text-slate-400">
                                                            {guest.nationality && (
                                                                <span className="flex items-center gap-1 font-medium text-[#3c4043] dark:text-slate-300">
                                                                    <span className="material-symbols-outlined text-[14px]">public</span>
                                                                    {guest.nationality}
                                                                </span>
                                                            )}
                                                            {guest.gender && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">{getGenderIcon(guest.gender)}</span>
                                                                    {getGenderLabel(guest.gender)}
                                                                </span>
                                                            )}
                                                            {guest.birthDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">cake</span>
                                                                    {formatDate(guest.birthDate)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Rate & Board Details */}
                                {room.rates && room.rates.length > 0 && room.rates.map((rate, rIdx) => (
                                    <div key={rIdx} className="pt-5 border-t border-[#dadce0] dark:border-[#3c4043] space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[20px] text-[#1a73e8]">payments</span>
                                                <h4 className="text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                                    {L('rateDetails')} {room.rates.length > 1 ? `#${rIdx + 1}` : ''}
                                                </h4>
                                            </div>
                                            <div className="text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8]">
                                                {rate.totalAmount != null ? Number(rate.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} {rate.currency}
                                            </div>
                                        </div>

                                        {/* Rate Highlights Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043]">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase tracking-wider">{L('boardType')}</p>
                                                <p className="text-xs font-bold text-[#202124] dark:text-white mt-1">
                                                    {formatBoardType(rate.boardType)}
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043]">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase tracking-wider">{L('refundable')}</p>
                                                <div className="mt-1">
                                                    <RefundPolicyTooltip
                                                        isRefundable={rate.refundable}
                                                        textOverride={rate.refundable ? L('yes') : L('no')}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                            rate.refundable 
                                                                ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6] dark:bg-emerald-950/40 dark:text-emerald-300' 
                                                                : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] dark:bg-rose-950/40 dark:text-rose-300'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] col-span-2 sm:col-span-1">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase tracking-wider">{L('rateCategory')}</p>
                                                <p className="text-xs font-semibold text-[#202124] dark:text-white mt-1">
                                                    {rate.rateCategoryId || 'Standart'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Daily Prices Horizontal Track */}
                                        {rate.dailyPrices && rate.dailyPrices.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                                        {L('dailyPrices')} ({rate.dailyPrices.length} {rate.dailyPrices.length > 1 ? L('nights') : L('night')})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                                    {rate.dailyPrices.map((dp, dpIdx) => (
                                                        <div key={dpIdx} className="min-w-[120px] p-3 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] text-center shrink-0">
                                                            <div className="text-[11px] font-medium text-[#70757a]">{formatDate(dp.date)}</div>
                                                            <div className="text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8] mt-1">
                                                                {Number(dp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {rate.currency}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancellation Policy Timeline Card */}
                                        {(() => {
                                            const policies =
                                                (rate.cancellationPolicies?.length > 0 ? rate.cancellationPolicies : null) ||
                                                (rate.prices?.[0]?.cancellationPolicies?.length > 0 ? rate.prices[0].cancellationPolicies : null) ||
                                                (room.cancellationPolicies?.length > 0 ? room.cancellationPolicies : null);
                                            if (!policies) return null;
                                            return (
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[18px] text-[#70757a]">policy</span>
                                                        <span className="text-[11px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">
                                                            {L('cancelPolicies')}
                                                        </span>
                                                    </div>
                                                    <div className="rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] overflow-hidden">
                                                        {policies.map((p, pIdx) => (
                                                            <div
                                                                key={pIdx}
                                                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5
                                                                    ${pIdx < policies.length - 1 ? 'border-b border-[#dadce0]/60 dark:border-[#3c4043]' : ''}
                                                                `}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className={`size-2 shrink-0 rounded-full ${p.amount === 0 ? 'bg-[#188038]' : 'bg-[#d93025]'}`}></span>
                                                                    <div className="text-xs text-[#3c4043] dark:text-slate-300">
                                                                        <span className="font-semibold text-[#202124] dark:text-white">{formatDateTime(p.fromDate)}</span>
                                                                        <span className="text-[#70757a] mx-1.5">→</span>
                                                                        <span className="font-semibold text-[#202124] dark:text-white">{formatDateTime(p.toDate)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-xs font-bold shrink-0 self-end sm:self-auto ${p.amount === 0 ? 'text-[#188038] dark:text-emerald-400' : 'text-[#d93025] dark:text-rose-400'}`}>
                                                                    {p.amount === 0
                                                                        ? (L('freeCancel') || 'Ücretsiz İptal')
                                                                        : `${L('penaltyAmount')}: ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${p.currency}`
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Hotel Direct Contact Information */}
                        {booking.hotel?.contact && (
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 shadow-xs space-y-4">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <div className="size-9 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                        <span className="material-symbols-outlined text-[20px]">contact_phone</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#202124] dark:text-white">
                                            {L('contactInfo')}
                                        </h3>
                                        <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                            {booking.hotel.hotelName}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {(booking.hotel.contact.name || booking.hotel.contact.surname) && (
                                        <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[#70757a] text-[20px]">person</span>
                                            <div className="truncate">
                                                <p className="text-[10px] font-bold text-[#70757a] uppercase">{L('name')}</p>
                                                <p className="text-xs font-semibold text-[#202124] dark:text-white truncate">
                                                    {booking.hotel.contact.name} {booking.hotel.contact.surname}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {booking.hotel.contact.phoneNumber && (
                                        <a 
                                            href={`tel:${booking.hotel.contact.phoneCountryCode || ''}${booking.hotel.contact.phoneNumber}`}
                                            className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] flex items-center gap-3 hover:border-[#1a73e8] transition-colors group cursor-pointer"
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
                                            className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] flex items-center gap-3 hover:border-[#1a73e8] transition-colors group cursor-pointer"
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

                    {/* Right Column (4 cols): Financials, Remark, Audit */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Google Checkout / Financial Receipt Card */}
                        <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 shadow-xs space-y-5">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-[#dadce0] dark:border-[#3c4043]">
                                <div className="size-9 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
                                    <span className="material-symbols-outlined text-[20px]">receipt</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#202124] dark:text-white">
                                        {L('pricePaymentSummary')}
                                    </h3>
                                    <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                        {L('officialOrderReceipt')}
                                    </p>
                                </div>
                            </div>

                            {/* Itemized Breakdown */}
                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#5f6368] dark:text-slate-400">{L('roomStayRate')}</span>
                                    <span className="font-semibold text-[#202124] dark:text-white">
                                        {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} {booking.currency}
                                    </span>
                                </div>

                                {booking.totalTaxAmount != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#5f6368] dark:text-slate-400">{L('taxAmount')}</span>
                                        <span className="font-medium text-[#202124] dark:text-white">
                                            {Number(booking.totalTaxAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {booking.totalOnSpotAmount != null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#5f6368] dark:text-slate-400">{L('onSpotAmount')}</span>
                                        <span className="font-medium text-[#202124] dark:text-white">
                                            {Number(booking.totalOnSpotAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {Number(booking.totalPenaltyAmount || 0) > 0 && (
                                    <div className="flex items-center justify-between text-[#d93025] dark:text-rose-400">
                                        <span>{L('penaltyAmount')}</span>
                                        <span className="font-bold">
                                            {Number(booking.totalPenaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {Number(booking.totalRefundAmount || 0) > 0 && (
                                    <div className="flex items-center justify-between text-[#137333] dark:text-emerald-400">
                                        <span>{L('refundAmount')}</span>
                                        <span className="font-bold">
                                            {Number(booking.totalRefundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {/* Total Divider */}
                                <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-baseline justify-between">
                                    <span className="text-sm font-bold text-[#202124] dark:text-white">
                                        {L('totalPrice')}
                                    </span>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-[#1a73e8] dark:text-[#8ab4f8]">
                                            {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} {booking.currency}
                                        </div>
                                        <span className="text-[10px] text-[#70757a]">
                                            {L('taxesIncluded')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method & Status Card */}
                            <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0]/70 dark:border-[#3c4043] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-[#70757a] uppercase tracking-wider">{L('paymentStatus')}</span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${paymentBadge.classes}`}>
                                        <span className="material-symbols-outlined text-[13px]">{paymentBadge.icon}</span>
                                        {paymentBadge.label}
                                    </span>
                                </div>
                                {booking.transactionUser && (
                                    <div className="text-xs text-[#5f6368] dark:text-slate-400 pt-1 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 flex items-center justify-between">
                                        <span>{L('transactionUser')}:</span>
                                        <span className="font-semibold text-[#202124] dark:text-white">{booking.transactionUser}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Remark Card (Google Keep Note Style) */}
                        {booking.remark && (
                            <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 p-5 shadow-xs space-y-2">
                                <div className="flex items-center gap-2 text-[#b06000] dark:text-amber-400">
                                    <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
                                    <h4 className="text-xs font-bold uppercase tracking-wider">{L('remark')}</h4>
                                </div>
                                <p className="text-xs text-[#3c4043] dark:text-slate-300 italic leading-relaxed">
                                    "{booking.remark}"
                                </p>
                            </div>
                        )}

                        {/* Google Activity Timeline Card (Audit Info) */}
                        {booking.audit && (
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-5 shadow-xs space-y-4">
                                <div className="flex items-center gap-2 pb-2.5 border-b border-[#dadce0] dark:border-[#3c4043]">
                                    <span className="material-symbols-outlined text-[18px] text-[#70757a]">history</span>
                                    <h4 className="text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                        {L('auditInfo')}
                                    </h4>
                                </div>

                                <div className="relative pl-6 space-y-4 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#dadce0] dark:before:bg-[#5f6368]">
                                    {/* Created */}
                                    <div className="relative">
                                        <span className="absolute -left-6 top-0.5 size-2 rounded-full bg-[#1a73e8] ring-4 ring-white dark:ring-[#28292c]"></span>
                                        <span className="block font-bold text-[#202124] dark:text-white text-[11px] uppercase">
                                            {L('created')}
                                        </span>
                                        <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                            {formatDateTime(booking.audit.createDateTime)}
                                        </p>
                                        {booking.audit.createdBy && (
                                            <p className="text-[11px] text-[#70757a]">
                                                {L('by')} {booking.audit.createdBy}
                                            </p>
                                        )}
                                    </div>

                                    {/* Updated */}
                                    {booking.audit.updateDateTime && (
                                        <div className="relative">
                                            <span className="absolute -left-6 top-0.5 size-2 rounded-full bg-[#34a853] ring-4 ring-white dark:ring-[#28292c]"></span>
                                            <span className="block font-bold text-[#202124] dark:text-white text-[11px] uppercase">
                                                {L('updated')}
                                            </span>
                                            <p className="text-xs text-[#5f6368] dark:text-slate-400">
                                                {formatDateTime(booking.audit.updateDateTime)}
                                            </p>
                                            {booking.audit.updatedBy && (
                                                <p className="text-[11px] text-[#70757a]">
                                                    {L('by')} {booking.audit.updatedBy}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Version */}
                                    {booking.audit.version != null && (
                                        <div className="pt-2 border-t border-[#dadce0]/50 dark:border-[#3c4043]/50 flex items-center justify-between">
                                            <span className="font-medium text-[#70757a] text-[11px]">
                                                {L('version')}
                                            </span>
                                            <span className="font-mono font-bold text-xs text-[#202124] dark:text-white bg-[#f1f3f4] dark:bg-[#303134] px-2 py-0.5 rounded-full">
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

        {/* ── Cancel Confirmation Modal ──────────────────────────── */}
        {isCancelModalOpen && createPortal(
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-modal-title"
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleCancelClose}
                />

                {/* Modal Panel */}
                <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#28292c] rounded-2xl shadow-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden">

                    {/* ── Header ── */}
                    <div className="flex items-start gap-4 p-6 border-b border-[#dadce0] dark:border-[#3c4043]">
                        <div className="size-11 rounded-2xl bg-[#fce8e6] dark:bg-rose-950/40 flex items-center justify-center text-[#d93025] dark:text-rose-400 shrink-0">
                            <span className="material-symbols-outlined text-[24px]">cancel</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 id="cancel-modal-title" className="text-base font-bold text-[#202124] dark:text-white leading-snug">
                                {L('cancelBooking')}
                            </h2>
                            {/* Step indicator */}
                            <div className="flex items-center gap-1.5 mt-2">
                                {['info', 'reason', 'simulation'].map((s, i) => (
                                    <React.Fragment key={s}>
                                        <div className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                                            cancelStep === s
                                                ? 'bg-[#d93025] text-white'
                                                : ['info', 'reason', 'simulation'].indexOf(cancelStep) > i
                                                    ? 'bg-[#137333] text-white'
                                                    : 'bg-[#f1f3f4] dark:bg-[#3c4043] text-[#5f6368] dark:text-slate-400'
                                        }`}>
                                            {['info', 'reason', 'simulation'].indexOf(cancelStep) > i
                                                ? <span className="material-symbols-outlined text-[12px]">check</span>
                                                : i + 1
                                            }
                                        </div>
                                        {i < 2 && <div className={`h-[2px] w-6 rounded transition-colors ${['info', 'reason', 'simulation'].indexOf(cancelStep) > i ? 'bg-[#137333]' : 'bg-[#dadce0] dark:bg-[#5f6368]'}`} />}
                                    </React.Fragment>
                                ))}
                                <span className="ml-1 text-[11px] text-[#5f6368] dark:text-slate-400">
                                    {cancelStep === 'info' && (currentLang === 'tr' ? 'Rezervasyon Bilgileri' : 'Booking Info')}
                                    {cancelStep === 'reason' && (currentLang === 'tr' ? 'İptal Sebebi' : 'Cancel Reason')}
                                    {cancelStep === 'simulation' && (currentLang === 'tr' ? 'Özet' : 'Summary')}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleCancelClose}
                            disabled={cancelSimLoading || cancelConfirmLoading}
                            className="size-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors shrink-0 cursor-pointer disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

                        {/* ───── STEP 1: Info ───── */}
                        {cancelStep === 'info' && (
                            <div className="space-y-3">
                                <p className="text-xs text-[#5f6368] dark:text-slate-400 leading-relaxed">
                                    {L('cancelModalSubtitle')}
                                </p>
                                <div className="rounded-xl border border-[#dadce0] dark:border-[#3c4043] divide-y divide-[#dadce0] dark:divide-[#3c4043] overflow-hidden">
                                    {booking.voucher && (
                                        <div className="flex items-center justify-between px-4 py-3 text-xs bg-[#f8f9fa] dark:bg-[#202124]">
                                            <span className="text-[#5f6368] dark:text-slate-400 font-medium">{L('bookingRef')}</span>
                                            <span className="font-mono font-bold text-[#202124] dark:text-white">{booking.voucher}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                        <span className="text-[#5f6368] dark:text-slate-400 font-medium">{currentLang === 'tr' ? 'Otel' : 'Hotel'}</span>
                                        <span className="font-semibold text-[#202124] dark:text-white text-right max-w-[240px] truncate">{booking.hotel?.hotelName}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                        <span className="text-[#5f6368] dark:text-slate-400 font-medium">{L('checkIn')} / {L('checkOut')}</span>
                                        <span className="font-semibold text-[#202124] dark:text-white">
                                            {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                                        </span>
                                    </div>
                                    {booking.hotel?.rooms?.[0]?.roomName && (
                                        <div className="flex items-center justify-between px-4 py-3 text-xs">
                                            <span className="text-[#5f6368] dark:text-slate-400 font-medium">{L('room')}</span>
                                            <span className="font-semibold text-[#202124] dark:text-white">{booking.hotel.rooms[0].roomName}</span>
                                        </div>
                                    )}
                                    {booking.hotel?.rooms?.map((r, ri) => r.roomConfirmationCode ? (
                                        <div key={ri} className="flex items-center justify-between px-4 py-3 text-xs">
                                            <span className="text-[#5f6368] dark:text-slate-400 font-medium">{L('confCode')}{booking.hotel.rooms.length > 1 ? ` ${ri + 1}` : ''}</span>
                                            <span className="font-mono font-bold text-[#202124] dark:text-white">{r.roomConfirmationCode}</span>
                                        </div>
                                    ) : null)}
                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                        <span className="text-[#5f6368] dark:text-slate-400 font-medium">{L('totalAmount')}</span>
                                        <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                                            {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} {booking.currency}
                                        </span>
                                    </div>
                                    {/* Cancellation policies from first room/rate */}
                                    {booking.hotel?.rooms?.[0]?.rates?.[0]?.cancellationPolicies?.length > 0 && (
                                        <div className="px-4 py-3 space-y-2">
                                            <p className="text-[10px] font-bold text-[#5f6368] dark:text-slate-400 uppercase tracking-wider">{L('cancelPolicies')}</p>
                                            {booking.hotel.rooms[0].rates[0].cancellationPolicies.map((p, pi) => (
                                                <div key={pi} className="flex items-center justify-between text-xs">
                                                    <span className="text-[#5f6368] dark:text-slate-400">{formatDateTime(p.fromDate)}</span>
                                                    <span className={`font-bold ${Number(p.amount) > 0 ? 'text-[#d93025]' : 'text-[#137333]'}`}>
                                                        {Number(p.amount) === 0 ? (currentLang === 'tr' ? 'Ücretsiz' : 'Free') : `${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${p.currency}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ───── STEP 2: Reason & Note ───── */}
                        {cancelStep === 'reason' && (
                            <div className="space-y-4">
                                {/* Cancel Reason */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                        {L('cancelReason')} <span className="text-[#d93025]">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={cancelReason}
                                            onChange={e => setCancelReason(e.target.value)}
                                            className="w-full h-10 pl-3 pr-8 rounded-xl border border-[#dadce0] dark:border-[#5f6368] bg-white dark:bg-[#202124] text-xs font-medium text-[#202124] dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a73e8] cursor-pointer"
                                        >
                                            {CANCEL_REASONS.map(r => (
                                                <option key={r.value} value={r.value}>
                                                    {currentLang === 'tr' ? r.tr : r.en}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-[#5f6368] pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                {/* Cancel Note */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                        {L('cancelNote')} <span className="text-[#70757a] font-normal normal-case">({currentLang === 'tr' ? 'İsteğe bağlı' : 'Optional'})</span>
                                    </label>
                                    <textarea
                                        value={cancelNote}
                                        onChange={e => setCancelNote(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder={currentLang === 'tr' ? 'İptal hakkında ek bilgi giriniz...' : 'Enter additional information about this cancellation...'}
                                        className="w-full px-3 py-2.5 rounded-xl border border-[#dadce0] dark:border-[#5f6368] bg-white dark:bg-[#202124] text-xs text-[#202124] dark:text-white placeholder:text-[#9aa0a6] dark:placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                                    />
                                    <p className="text-[10px] text-[#70757a] text-right">{cancelNote.length}/500</p>
                                </div>
                            </div>
                        )}

                        {/* ───── STEP 3: Simulation result ───── */}
                        {cancelStep === 'simulation' && (
                            <div className="space-y-4">
                                {/* Loading */}
                                {cancelSimLoading && (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <div className="size-10 border-[3px] border-[#1a73e8]/20 border-t-[#1a73e8] rounded-full animate-spin"></div>
                                        <p className="text-xs text-[#5f6368] dark:text-slate-400">{L('cancelSimulating')}</p>
                                    </div>
                                )}

                                {/* Error */}
                                {!cancelSimLoading && cancelError && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#fce8e6] dark:bg-rose-950/30 border border-[#fad2cf] dark:border-rose-800">
                                        <span className="material-symbols-outlined text-[20px] text-[#d93025] dark:text-rose-400 shrink-0 mt-0.5">error</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#d93025] dark:text-rose-300">
                                                {currentLang === 'tr' ? 'İşlem Başarısız' : 'Request Failed'}
                                            </p>
                                            <p className="text-xs text-[#d93025] dark:text-rose-300 mt-0.5 leading-relaxed">{cancelError}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Simulation result */}
                                {!cancelSimLoading && cancelSimResult && !cancelError && (
                                    <>
                                        {/* Status badge */}
                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e6f4ea] dark:bg-emerald-950/30 border border-[#ceead6] dark:border-emerald-800">
                                            <span className="material-symbols-outlined text-[18px] text-[#137333] dark:text-emerald-400">check_circle</span>
                                            <p className="text-xs font-semibold text-[#137333] dark:text-emerald-300">
                                                {currentLang === 'tr'
                                                    ? 'İptal işlemi tamamlanabilir. Aşağıdaki detayları inceleyiniz.'
                                                    : 'Cancellation can be processed. Please review the details below.'}
                                            </p>
                                        </div>

                                        {/* Summary table */}
                                        <div className="rounded-xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden">
                                            <div className="flex items-center gap-2 px-4 py-3 bg-[#f8f9fa] dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043]">
                                                <span className="material-symbols-outlined text-[16px] text-[#1a73e8]">receipt_long</span>
                                                <span className="text-[11px] font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                                    {L('cancelSimulationResult')}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                                                {cancelSimResult.amount != null && (
                                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                                        <span className="text-[#5f6368] dark:text-slate-400">{L('cancelTotalAmount')}</span>
                                                        <span className="font-semibold text-[#202124] dark:text-white">
                                                            {Number(cancelSimResult.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                {cancelSimResult.refundAmount != null && (
                                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                                        <span className="text-[#5f6368] dark:text-slate-400">{L('cancelRefundAmount')}</span>
                                                        <span className={`font-bold ${Number(cancelSimResult.refundAmount) > 0 ? 'text-[#137333] dark:text-emerald-400' : 'text-[#5f6368]'}`}>
                                                            {Number(cancelSimResult.refundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                {cancelSimResult.penaltyAmount != null && (
                                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                                        <span className="text-[#5f6368] dark:text-slate-400">{L('cancelPenaltyAmount')}</span>
                                                        <span className={`font-bold ${Number(cancelSimResult.penaltyAmount) > 0 ? 'text-[#d93025] dark:text-rose-400' : 'text-[#137333] dark:text-emerald-400'}`}>
                                                            {Number(cancelSimResult.penaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}
                                                        </span>
                                                    </div>
                                                )}
                                                {cancelSimResult.cancelledAt && (
                                                    <div className="flex items-center justify-between px-4 py-3 text-xs">
                                                        <span className="text-[#5f6368] dark:text-slate-400">{L('cancelledAt')}</span>
                                                        <span className="font-medium text-[#202124] dark:text-white">{formatDateTime(cancelSimResult.cancelledAt)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Refund/penalty highlight */}
                                        {Number(cancelSimResult.penaltyAmount || 0) === 0 && Number(cancelSimResult.refundAmount || 0) > 0 ? (
                                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#e6f4ea] dark:bg-emerald-950/30 border border-[#ceead6] dark:border-emerald-800">
                                                <span className="material-symbols-outlined text-[16px] text-[#137333] dark:text-emerald-400 shrink-0 mt-0.5">savings</span>
                                                <p className="text-xs text-[#137333] dark:text-emerald-300 leading-relaxed">
                                                    {currentLang === 'tr'
                                                        ? <><strong>{Number(cancelSimResult.refundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}</strong> tutarındaki ödeme acente hesabınıza iade edilecektir.</>
                                                        : <><strong>{Number(cancelSimResult.refundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}</strong> will be refunded to your agency account.</>
                                                    }
                                                </p>
                                            </div>
                                        ) : Number(cancelSimResult.penaltyAmount || 0) > 0 ? (
                                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#fef7e0] dark:bg-amber-950/30 border border-[#feefc3] dark:border-amber-800">
                                                <span className="material-symbols-outlined text-[16px] text-[#b06000] dark:text-amber-400 shrink-0 mt-0.5">warning</span>
                                                <p className="text-xs text-[#b06000] dark:text-amber-300 leading-relaxed">
                                                    {currentLang === 'tr'
                                                        ? <><strong>{Number(cancelSimResult.penaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}</strong> tutarında ceza uygulanacaktır.</>
                                                        : <>A penalty of <strong>{Number(cancelSimResult.penaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {cancelSimResult.currency || booking.currency}</strong> will be applied.</>
                                                    }
                                                </p>
                                            </div>
                                        ) : null}

                                        {/* Chosen reason display */}
                                        <div className="flex items-center justify-between text-xs px-1">
                                            <span className="text-[#5f6368] dark:text-slate-400">{L('cancelReason')}</span>
                                            <span className="font-semibold text-[#202124] dark:text-white">{getCancelReasonLabel(cancelReason)}</span>
                                        </div>
                                        {cancelNote && (
                                            <div className="flex items-start justify-between text-xs px-1 gap-4">
                                                <span className="text-[#5f6368] dark:text-slate-400 shrink-0">{L('cancelNote')}</span>
                                                <span className="font-medium text-[#202124] dark:text-white text-right italic">"{cancelNote}"</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Confirm error (shown in simulation step when confirm fails) */}
                        {cancelStep === 'simulation' && !cancelSimLoading && cancelConfirmLoading === false && cancelError && cancelSimResult && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#fce8e6] dark:bg-rose-950/30 border border-[#fad2cf] dark:border-rose-800 mt-2">
                                <span className="material-symbols-outlined text-[20px] text-[#d93025] shrink-0 mt-0.5">error</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[#d93025] dark:text-rose-300">
                                        {currentLang === 'tr' ? 'İptal Başarısız' : 'Cancellation Failed'}
                                    </p>
                                    <p className="text-xs text-[#d93025] dark:text-rose-300 mt-0.5 leading-relaxed">{cancelError}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#202124]">
                        {/* Back / Cancel */}
                        <button
                            onClick={() => {
                                if (cancelStep === 'info') { handleCancelClose(); return; }
                                if (cancelStep === 'reason') { setCancelStep('info'); return; }
                                if (cancelStep === 'simulation') { setCancelStep('reason'); setCancelSimResult(null); setCancelError(null); return; }
                            }}
                            disabled={cancelSimLoading || cancelConfirmLoading}
                            className="h-9 px-5 rounded-full font-semibold text-xs bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                        >
                            {cancelStep === 'info'
                                ? <><span className="material-symbols-outlined text-[16px]">close</span>{currentLang === 'tr' ? 'Vazgeç' : 'Cancel'}</>
                                : <><span className="material-symbols-outlined text-[16px]">arrow_back</span>{currentLang === 'tr' ? 'Geri' : 'Back'}</>
                            }
                        </button>

                        {/* Primary action */}
                        {cancelStep === 'info' && (
                            <button
                                onClick={handleCancelInfoContinue}
                                className="h-9 px-5 rounded-full font-semibold text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                                {currentLang === 'tr' ? 'Devam Et' : 'Continue'}
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        )}
                        {cancelStep === 'reason' && (
                            <button
                                onClick={handleCancelReasonContinue}
                                disabled={!cancelReason}
                                className="h-9 px-5 rounded-full font-semibold text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
                            >
                                {currentLang === 'tr' ? 'Devam Et' : 'Continue'}
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        )}
                        {cancelStep === 'simulation' && !cancelSimLoading && cancelSimResult && !cancelError && (
                            <button
                                onClick={handleCancelConfirm}
                                disabled={cancelConfirmLoading}
                                className="h-9 px-5 rounded-full font-semibold text-xs bg-[#d93025] hover:bg-[#b31412] text-white transition-colors shadow-xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
                            >
                                {cancelConfirmLoading ? (
                                    <>
                                        <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>{L('cancelConfirming')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                                        <span>{currentLang === 'tr' ? 'Rezervasyonu İptal Et' : 'Cancel Booking'}</span>
                                    </>
                                )}
                            </button>
                        )}
                        {cancelStep === 'simulation' && !cancelSimLoading && cancelError && (
                            <button
                                onClick={handleCancelReasonContinue}
                                className="h-9 px-5 rounded-full font-semibold text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-[16px]">refresh</span>
                                {currentLang === 'tr' ? 'Tekrar Dene' : 'Retry'}
                            </button>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )}
        {/* ────────────────────────────────────────────────────────── */}
        <CreateTaskModal
            isOpen={isRequestModalOpen}
            onClose={() => setIsRequestModalOpen(false)}
            booking={booking}
            productType="HOTEL"
            onSuccess={(created) => {
                navigate(`/task-management/${created.id}`);
            }}
        />
        </>
    );
};

export default BookingDetail;
