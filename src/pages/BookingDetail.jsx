import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/bookingService';
import { hotelService } from '../services/hotelService';
import { propertyService } from '../services/propertyService';
import BookingStatusBadge from '../components/BookingStatusBadge';
import RefundPolicyTooltip from '../components/RefundPolicyTooltip';
import CreateTaskModal from '../components/CreateTaskModal';
import { tBD } from '../utils/bookingDetailLocales';

const BookingDetail = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [hotelDetails, setHotelDetails] = useState(null);
    const [propertySummary, setPropertySummary] = useState(null);
    const [propertyLoading, setPropertyLoading] = useState(false);
    const [showImageLightbox, setShowImageLightbox] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedText, setCopiedText] = useState(null);

    // ── Pay (complete reserved order) flow state ──────────────────
    const [isPayLoading, setIsPayLoading] = useState(false);
    const [payError, setPayError] = useState(null);
    const [paySuccess, setPaySuccess] = useState(false);
    // ──────────────────────────────────────────────────────────────

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
    const [selectedRoomKeys, setSelectedRoomKeys] = useState([]);
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
                const togId = data?.hotel?.internalHotelId || data?.hotel?.togId;
                if (togId) {
                    setPropertyLoading(true);
                    propertyService.getPropertyBookingSummary(togId, signal)
                        .then((pSummary) => {
                            if (!signal?.aborted && pSummary) {
                                setPropertySummary(pSummary);
                            }
                        })
                        .catch((pErr) => {
                            console.warn('Property summary fetch failed, trying fallback:', pErr);
                            return hotelService.getHotelDetail(togId, signal).then((hDetails) => {
                                if (!signal?.aborted && hDetails) {
                                    setHotelDetails(hDetails);
                                }
                            });
                        })
                        .catch((err) => {
                            console.error('Fetch supplementary hotel details error:', err);
                        })
                        .finally(() => {
                            if (!signal?.aborted) setPropertyLoading(false);
                        });
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

    const getRoomKey = (r, i) => r.roomConfirmationCode || r.roomCode || r.roomId || (r.dbId ? String(r.dbId) : `room_${i}`);

    // Build the cancel request payload
    const buildCancelPayload = (simulation) => {
        const rooms = booking?.hotel?.rooms || [];
        const isMultiRoomCancelSupported = Boolean(booking?.supplier?.multiRoomCancelSupported);
        
        let roomConfirmationCodes = [];
        if (isMultiRoomCancelSupported && rooms.length > 1) {
            roomConfirmationCodes = rooms
                .filter((r, i) => selectedRoomKeys.includes(getRoomKey(r, i)))
                .map(r => r.roomConfirmationCode || r.roomCode || r.roomId || (r.dbId ? String(r.dbId) : null))
                .filter(Boolean);
        } else {
            roomConfirmationCodes = rooms
                .map(r => r.roomConfirmationCode || r.roomCode || r.roomId || (r.dbId ? String(r.dbId) : null))
                .filter(Boolean);
        }

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
        const rooms = booking?.hotel?.rooms || [];
        const cancelableRooms = rooms.filter(r => r.bookingStatus !== 'CANCELLED' && r.bookingStatus !== 'CANCELLED_WITH_PENALTY');
        setSelectedRoomKeys(cancelableRooms.map(getRoomKey));
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

    // ── Pay: complete reserved order ──────────────────────────────
    const handlePayClick = async () => {
        setIsPayLoading(true);
        setPayError(null);
        setPaySuccess(false);
        try {
            const result = await hotelService.completeReservedOrder(booking.voucher);
            const paid = result?.paymentStatus === 'PAID_CREDIT_CARD' || result?.paymentStatus === 'PAID_ACCOUNT';
            if (paid) {
                setPaySuccess(true);
                await fetchBookingDetail();
            } else {
                setPayError(currentLang === 'tr' ? 'Ödeme tamamlanamadı. Lütfen tekrar deneyin.' : 'Payment could not be completed. Please try again.');
            }
        } catch (err) {
            console.error('Complete reserved order error:', err);
            setPayError(err?.message || (currentLang === 'tr' ? 'Ödeme sırasında bir hata oluştu.' : 'An error occurred during payment.'));
        } finally {
            setIsPayLoading(false);
        }
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
        if (propertySummary?.fullAddress && propertySummary.fullAddress.trim()) {
            return propertySummary.fullAddress.trim();
        }
        if (propertySummary?.addressLine) {
            const parts = [
                propertySummary.addressLine,
                propertySummary.cityName,
                propertySummary.countryName
            ].filter(p => p && String(p).trim().length > 0);
            if (parts.length > 0) return parts.join(', ');
        }
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
        if (propertySummary?.starRating != null && propertySummary.starRating > 0 && propertySummary.starRating <= 7) {
            const count = Number(propertySummary.starRating);
            return { count, label: `${count} ${L('stars') || 'Yıldız'}` };
        }
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
                            <div className="bg-white dark:bg-[#28292c] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] p-6 sm:p-7 space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-5">
                                    <div className="w-full sm:w-64 h-44 rounded-2xl bg-slate-200 dark:bg-[#303134] shrink-0" />
                                    <div className="flex-1 space-y-3.5 w-full">
                                        <div className="flex gap-2">
                                            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-[#303134]" />
                                            <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-[#303134]" />
                                            <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-[#303134]" />
                                        </div>
                                        <div className="h-8 w-3/4 rounded-xl bg-slate-200 dark:bg-[#303134]" />
                                        <div className="flex gap-2 pt-1">
                                            <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-[#303134]" />
                                            <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-[#303134]" />
                                            <div className="h-8 w-28 rounded-xl bg-slate-200 dark:bg-[#303134]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="h-24 rounded-2xl bg-slate-100 dark:bg-[#202124]" />
                            </div>
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

    const isRefundableBooking = (() => {
        if (booking?.hotel?.isRefundable !== undefined && booking?.hotel?.isRefundable !== null) {
            return Boolean(booking.hotel.isRefundable);
        }
        const rooms = booking?.hotel?.rooms || [];
        if (rooms.length > 0) {
            return rooms.some(r => (r.rates || []).some(rate => rate.refundable === true));
        }
        return null;
    })();

    const heroImage = propertySummary?.heroImage || propertySummary?.heroThumbImage || hotelDetails?.heroImage || hotelDetails?.images?.[0]?.url || null;
    const imagesCount = propertySummary?.imagesCount || hotelDetails?.imagesCount || (Array.isArray(hotelDetails?.images) ? hotelDetails.images.length : null);
    const hotelName = propertySummary?.name || booking?.hotel?.hotelName || 'Otel Bilgisi';
    const internalHotelId = propertySummary?.togId || booking?.hotel?.internalHotelId || null;
    const supplierDisplayName = booking?.supplier?.name || booking?.hotel?.supplier?.name || 'Expedia';

    const CopyBadge = ({ label, value, copyId, icon, isPrimary = false, onClickValue = null, color = 'default' }) => {
        if (!value) return null;
        const isCopied = copiedText === copyId;

        let containerClass = "bg-[#f8f9fa] dark:bg-[#303134] border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:border-[#1a73e8]/40";
        let iconBoxClass = "bg-slate-200/70 dark:bg-[#3c4043] text-[#5f6368] dark:text-slate-300";
        let labelClass = "text-[#70757a] dark:text-slate-400";
        let valueClass = "text-[#202124] dark:text-white";
        let actionBtnClass = "text-[#70757a] hover:text-[#1a73e8] hover:bg-black/5 dark:hover:bg-white/10";

        if (isPrimary) {
            containerClass = "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/90 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 hover:border-blue-400 dark:hover:border-blue-700";
            iconBoxClass = "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300";
            labelClass = "text-blue-700/80 dark:text-blue-300/80";
            valueClass = "text-blue-950 dark:text-blue-100";
            actionBtnClass = "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-100/60 dark:hover:bg-blue-900/50";
        } else if (color === 'purple' || label?.toLowerCase().includes('voucher')) {
            containerClass = "bg-purple-50/60 dark:bg-purple-950/25 border-purple-200/80 dark:border-purple-800/50 text-purple-950 dark:text-purple-200 hover:border-purple-300 dark:hover:border-purple-700";
            iconBoxClass = "bg-purple-100/80 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300";
            labelClass = "text-purple-700/80 dark:text-purple-300/80";
            valueClass = "text-purple-950 dark:text-purple-100";
            actionBtnClass = "text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100/60 dark:hover:bg-purple-900/50";
        }

        return (
            <div className={`inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-xl border text-xs shadow-2xs transition-all ${containerClass}`}>
                {/* Left: Icon Pill */}
                {icon && (
                    <span className={`size-5 rounded-md flex items-center justify-center shrink-0 ${iconBoxClass}`}>
                        <span className="material-symbols-outlined text-[13px]">{icon}</span>
                    </span>
                )}

                {/* Middle: Label & Value */}
                {onClickValue ? (
                    <button
                        type="button"
                        onClick={onClickValue}
                        className="inline-flex items-center gap-1 font-mono text-left cursor-pointer hover:underline decoration-current/40 group"
                        title={`${label}: ${value}`}
                    >
                        <span className={`text-[10px] font-semibold uppercase tracking-wider font-sans select-none ${labelClass}`}>
                            {label}:
                        </span>
                        <span className={`font-bold text-xs truncate max-w-[180px] sm:max-w-[220px] ${valueClass}`}>
                            {value}
                        </span>
                        <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                            open_in_new
                        </span>
                    </button>
                ) : (
                    <div className="inline-flex items-center gap-1 font-mono">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider font-sans select-none ${labelClass}`}>
                            {label}:
                        </span>
                        <span className={`font-bold text-xs truncate max-w-[180px] sm:max-w-[220px] ${valueClass}`}>
                            {value}
                        </span>
                    </div>
                )}

                {/* Right: Copy Button */}
                <button
                    type="button"
                    onClick={() => handleCopy(value, copyId)}
                    className={`size-6 rounded-md flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-0.5 ${actionBtnClass}`}
                    title={currentLang === 'tr' ? `Kopyala: ${label}` : `Copy: ${label}`}
                >
                    <span className="material-symbols-outlined text-[14px]">
                        {isCopied ? 'check' : 'content_copy'}
                    </span>
                </button>
            </div>
        );
    };

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

            {/* Pay Error Toast */}
            {payError && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#d93025] text-white px-4 py-2 rounded-full shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{payError}</span>
                    <button onClick={() => setPayError(null)} className="ml-1 opacity-70 hover:opacity-100 cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
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
                        {booking.hotel?.bookingStatus === 'RESERVED' && booking.payment?.status === 'PENDING_PAYMENT' && (
                            <button
                                onClick={handlePayClick}
                                disabled={isPayLoading}
                                className="h-9 px-4 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all bg-[#1e8e3e] hover:bg-[#137333] text-white shadow-xs active:scale-95 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                            >
                                {isPayLoading ? (
                                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                )}
                                <span>{currentLang === 'tr' ? 'Ödeme Yap' : 'Pay Now'}</span>
                            </button>
                        )}
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
                        {booking.voucher && booking.hotel?.bookingStatus === 'CONFIRMED' && (
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
                            title={currentLang === 'tr' ? 'Yazdır' : 'Print'}
                        >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                            <span className="hidden sm:inline">{currentLang === 'tr' ? 'Yazdır' : 'Print'}</span>
                        </button>
                        <button
                            onClick={() => handleCopy(window.location.href, currentLang === 'tr' ? 'Sayfa bağlantısı' : 'Page link')}
                            className="size-9 rounded-full flex items-center justify-center transition-all bg-white dark:bg-[#303134] border border-[#dadce0] dark:border-[#5f6368] text-[#3c4043] dark:text-slate-200 hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] shadow-2xs active:scale-95 cursor-pointer"
                            title={currentLang === 'tr' ? 'Bağlantıyı Paylaş' : 'Share Link'}
                        >
                            <span className="material-symbols-outlined text-[18px]">share</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Bounded Content Canvas */}
            <main className="max-w-[1440px] w-full mx-auto px-6 sm:px-10 lg:px-12 py-6 space-y-6">

                {/* 1. Hero Reservation Dossier Card */}
                <div className="rounded-3xl bg-white dark:bg-[#28292c] border border-slate-200/90 dark:border-[#3c4043] shadow-sm overflow-hidden">
                    {/* Top Status Notification Banner (Cancelled, Error, or Confirmed) */}
                    {(() => {
                        const statusRaw = (booking.hotel?.bookingStatus || booking.status || '').toUpperCase();
                        const isCancelled = statusRaw === 'CANCELLED' || statusRaw === 'CANCELLED_WITH_PENALTY' || Boolean(booking.hotel?.cancelReason);
                        const isError = statusRaw === 'ERROR' || statusRaw === 'FAILED';
                        const isConfirmed = statusRaw === 'CONFIRMED' || statusRaw === 'ACTIVE' || statusRaw === 'SUCCESS';

                        if (isError) {
                            const errorReasonText = booking.errorMessage
                                || booking.remark
                                || booking.hotel?.cancelNote
                                || booking.hotel?.cancelReason
                                || (currentLang === 'tr' ? 'Rezervasyon oluşturulurken bir hata meydana geldi.' : 'An error occurred during booking confirmation.');
                            const errorTime = booking.hotel?.cancelDateTime || booking.audit?.updateDateTime || booking.audit?.createDateTime;

                            return (
                                <div className="px-6 py-4 bg-gradient-to-r from-red-50 via-rose-50 to-red-50/60 dark:from-red-950/50 dark:via-rose-950/40 dark:to-red-950/30 border-b border-red-200/90 dark:border-red-900/70 flex flex-wrap items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
                                            <span className="material-symbols-outlined text-[18px]">error</span>
                                        </div>
                                        <div className="min-w-0">
                                            <span className="font-bold text-red-950 dark:text-red-200">
                                                {currentLang === 'tr' ? 'Hata / İşlem Başarısız:' : 'Error / Operation Failed:'}
                                            </span>{' '}
                                            <span className="text-red-800 dark:text-red-300 font-semibold break-words">
                                                {errorReasonText}
                                            </span>
                                            {booking.hotel?.cancelNote && booking.hotel.cancelNote !== errorReasonText && (
                                                <span className="text-red-700/80 dark:text-red-400/80 ml-2 italic">
                                                    ({booking.hotel.cancelNote})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                                        {booking.clientReferenceId && (
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Ref: <strong className="text-slate-900 dark:text-white font-mono">{booking.clientReferenceId}</strong>
                                            </span>
                                        )}
                                        {errorTime && (
                                            <span className="text-slate-600 dark:text-slate-400">
                                                {currentLang === 'tr' ? 'Hata Zamanı:' : 'Error Time:'} <strong className="text-slate-900 dark:text-white">{formatDateTime(errorTime)}</strong>
                                            </span>
                                        )}
                                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold text-[10px] tracking-wider">
                                            {statusRaw}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        if (isCancelled) {
                            const CANCEL_REASON_LABELS = {
                                GUEST_REQUEST:          currentLang === 'tr' ? 'Misafir iptal talebinde bulundu'                              : 'Guest requested cancellation',
                                DUPLICATE_BOOKING:      currentLang === 'tr' ? 'Mükerrer rezervasyon'                                         : 'Duplicate booking',
                                PAYMENT_FAILED:         currentLang === 'tr' ? 'Ödeme başarısız oldu veya ödeme alınamadı'                   : 'Payment failed or not received',
                                HOTEL_OVERBOOKED:       currentLang === 'tr' ? 'Otel fazla rezervasyon aldı (overbooking)'                   : 'Hotel overbooked',
                                PRICE_CHANGED:          currentLang === 'tr' ? 'Rezervasyon sonrası fiyat değişikliği'                       : 'Price change after booking',
                                INVALID_RATE:           currentLang === 'tr' ? 'Geçersiz veya süresi dolmuş fiyat'                           : 'Invalid or expired rate',
                                INVALID_ROOM:           currentLang === 'tr' ? 'Geçersiz veya müsait olmayan oda'                            : 'Invalid or unavailable room',
                                TECHNICAL_ERROR:        currentLang === 'tr' ? 'Sistem veya teknik hata'                                     : 'System or technical error',
                                SUPPLIER_REJECTION:     currentLang === 'tr' ? 'Tedarikçi rezervasyonu reddetti'                             : 'Supplier rejected booking',
                                NO_SHOW:                currentLang === 'tr' ? 'Misafir otele gelmedi (no-show)'                             : 'Guest did not arrive (no-show)',
                                AGENT_REQUEST:          currentLang === 'tr' ? 'Acente iptal talebinde bulundu'                              : 'Agency requested cancellation',
                                HOTEL_CLOSED:           currentLang === 'tr' ? 'Otel geçici veya kalıcı olarak kapalı'                      : 'Hotel temporarily or permanently closed',
                                FORCE_MAJEURE:          currentLang === 'tr' ? 'Mücbir sebep (ör. doğal afet, pandemi)'                     : 'Force majeure (e.g. natural disaster, pandemic)',
                                FRAUD_SUSPECTED:        currentLang === 'tr' ? 'Dolandırıcılık şüphesi veya güvenlik endişesi'              : 'Fraud suspected or security concern',
                                CUSTOMER_CHANGED_DATES: currentLang === 'tr' ? 'Müşteri seyahat tarihlerini değiştirdi'                     : 'Customer changed travel dates',
                                POLICY_VIOLATION:       currentLang === 'tr' ? 'Politika veya kural ihlali nedeniyle iptal'                 : 'Cancellation due to policy or rule violation',
                                TIMEOUT:                currentLang === 'tr' ? 'Rezervasyon onayı sırasında tedarikçi veya sistem zaman aşımı' : 'Supplier or system timeout during confirmation',
                                UNKNOWN:                currentLang === 'tr' ? 'Bilinmeyen neden'                                            : 'Unknown reason',
                                HOTEL_REQUEST:          currentLang === 'tr' ? 'Otel talebi üzerine iptal edildi'                           : 'Cancelled at hotel request',
                                SYSTEM_ERROR:           currentLang === 'tr' ? 'Sistem hatası nedeniyle iptal edildi'                       : 'Cancelled due to system error',
                                ADMIN_CANCELLATION:     currentLang === 'tr' ? 'Yönetici tarafından iptal edildi'                           : 'Cancelled by admin',
                                DUPLICATE_RESERVATION:  currentLang === 'tr' ? 'Mükerrer rezervasyon nedeniyle iptal'                       : 'Duplicate reservation',
                            };
                            const reasonText = CANCEL_REASON_LABELS[booking.hotel?.cancelReason] || booking.hotel?.cancelReason || null;
                            const cancelNote = booking.hotel?.cancelNote;
                            const cancelDT = booking.hotel?.cancelDateTime;
                            const cancelDateFormatted = cancelDT
                                ? new Date(cancelDT).toLocaleString('tr-TR', {
                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit'
                                  })
                                : null;

                            return (
                                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50/70 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/20 border-b border-amber-200/80 dark:border-amber-900/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                                            <span className="material-symbols-outlined text-[18px]">warning</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-amber-950 dark:text-amber-200">
                                                {currentLang === 'tr' ? 'İptal / Ceza Bilgilendirmesi:' : 'Cancellation / Penalty Notice:'}
                                            </span>{' '}
                                            <span className="text-amber-800 dark:text-amber-300 font-semibold">
                                                {reasonText || (currentLang === 'tr' ? 'Rezervasyon İptal Edildi' : 'Reservation Cancelled')}
                                            </span>
                                            {cancelNote && cancelNote !== reasonText && (
                                                <span className="text-amber-700/80 dark:text-amber-400/80 ml-2 italic">
                                                    ({cancelNote})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                                        {cancelDateFormatted && (
                                            <span className="text-slate-600 dark:text-slate-400">
                                                {currentLang === 'tr' ? 'İptal Zamanı:' : 'Cancelled At:'} <strong className="text-slate-900 dark:text-white">{cancelDateFormatted}</strong>
                                            </span>
                                        )}
                                        {booking.totalPenaltyAmount != null && Number(booking.totalPenaltyAmount) > 0 && (
                                            <span className="text-amber-700 dark:text-amber-300">
                                                {currentLang === 'tr' ? 'Ceza Tutarı:' : 'Penalty:'} <strong className="text-amber-800 dark:text-amber-200">{Number(booking.totalPenaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}</strong>
                                            </span>
                                        )}
                                        {booking.totalRefundAmount != null && Number(booking.totalRefundAmount) > 0 && (
                                            <span className="text-emerald-700 dark:text-emerald-400">
                                                {currentLang === 'tr' ? 'İade Tutarı:' : 'Refund:'} <strong className="text-emerald-800 dark:text-emerald-300">{Number(booking.totalRefundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        if (isConfirmed) {
                            const confCode = booking.hotel?.rooms?.find(r => r.roomConfirmationCode)?.roomConfirmationCode || null;
                            const confirmTime = booking.audit?.createDateTime || booking.createDate;

                            return (
                                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/70 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 border-b border-emerald-200/80 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        </div>
                                        <div className="min-w-0">
                                            <span className="font-bold text-emerald-900 dark:text-emerald-200">
                                                {currentLang === 'tr' ? 'Rezervasyon Onaylandı:' : 'Booking Confirmed:'}
                                            </span>{' '}
                                            <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                                                {currentLang === 'tr' ? 'Rezervasyon başarıyla tamamlandı ve otel tarafından teyit edildi.' : 'Reservation successfully confirmed and verified by hotel.'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                                        {booking.voucher && (
                                            <span className="text-slate-600 dark:text-slate-400">
                                                Voucher: <strong className="text-slate-900 dark:text-white font-mono">{booking.voucher}</strong>
                                            </span>
                                        )}
                                        {confCode && (
                                            <span className="text-emerald-700 dark:text-emerald-400">
                                                {currentLang === 'tr' ? 'Onay Kodu:' : 'Confirmation Code:'} <strong className="text-emerald-800 dark:text-emerald-200 font-mono">{confCode}</strong>
                                            </span>
                                        )}
                                        {confirmTime && (
                                            <span className="text-slate-600 dark:text-slate-400">
                                                {currentLang === 'tr' ? 'Onay Zamanı:' : 'Confirmed At:'} <strong className="text-slate-900 dark:text-white">{formatDateTime(confirmTime)}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })()}

                    {/* Top Row: Hotel Media & Details Showcase + Twin Status Cards */}
                    <div className="p-5 lg:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border-b border-slate-100 dark:border-[#3c4043]">
                        {/* Hotel Media Showcase & Info */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
                            {/* Hero Hotel Photo Container */}
                            <div
                                onClick={() => {
                                    if (heroImage) setShowImageLightbox(true);
                                    else if (internalHotelId) navigate(`/travel/hotels/detail/${internalHotelId}`);
                                }}
                                className="relative group w-full sm:w-44 md:w-52 h-32 sm:h-32 max-h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#303134] border border-slate-200/90 dark:border-[#3c4043] shadow-2xs shrink-0 cursor-pointer"
                                title={heroImage ? (currentLang === 'tr' ? "Fotoğrafı Büyüt" : "Zoom Photo") : (currentLang === 'tr' ? "Otel Sayfasına Git" : "Go to Hotel Page")}
                            >
                                {heroImage ? (
                                    <>
                                        <img
                                            src={heroImage}
                                            alt={hotelName}
                                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                                            <span className="text-[10px] font-semibold text-white flex items-center gap-1 drop-shadow">
                                                <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                                <span>{currentLang === 'tr' ? 'Büyüt' : 'Zoom'}</span>
                                            </span>
                                        </div>
                                        {imagesCount > 1 && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1 shadow-xs border border-white/10">
                                                <span className="material-symbols-outlined text-[13px]">photo_library</span>
                                                <span>{imagesCount}</span>
                                            </div>
                                        )}
                                    </>
                                ) : propertyLoading ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center animate-pulse bg-slate-100 dark:bg-[#303134] text-slate-400">
                                        <span className="material-symbols-outlined text-[20px] animate-spin text-[#137fec]">sync</span>
                                        <span className="text-[10px] font-semibold text-slate-400 mt-1.5">
                                            {currentLang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#137fec] to-[#0b5baf] text-white">
                                        <span className="material-symbols-outlined text-[32px]">hotel</span>
                                        <span className="text-[10px] font-semibold mt-1">Travel Of Globe</span>
                                    </div>
                                )}
                            </div>

                            {/* Hotel Details & Metadata Column */}
                            <div className="min-w-0 flex-1 flex flex-col justify-center gap-2">
                                {/* Stars & Location & Refundable row */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Star Rating */}
                                    {(() => {
                                        const starData = getHotelStarData();
                                        if (!starData) return null;
                                        return (
                                            <div
                                                className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-900/60 text-[10px] font-semibold uppercase tracking-wider"
                                                title={starData.label}
                                            >
                                                {[...Array(starData.count)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className="material-symbols-outlined text-[13px] text-amber-400 select-none leading-none"
                                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                                    >
                                                        star
                                                    </span>
                                                ))}
                                                <span className="font-bold ml-0.5">
                                                    {starData.count} {currentLang === 'tr' ? 'Yıldız' : 'Star'}
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    {/* Refundable Badge */}
                                    {isRefundableBooking !== null && (
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                                                isRefundableBooking
                                                    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50'
                                                    : 'bg-slate-100/90 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${isRefundableBooking ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {isRefundableBooking ? (currentLang === 'tr' ? 'İade Edilebilir' : 'Refundable') : (currentLang === 'tr' ? 'İade Edilemez' : 'Non-Refundable')}
                                        </span>
                                    )}

                                    {/* Recommended Badge */}
                                    {booking.hotel?.isRecommended && (
                                        <span className="bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#ceead6] dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                                            <span>{currentLang === 'tr' ? 'Tavsiye Edilen' : 'Recommended'}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Hotel Title */}
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                                        {hotelName}
                                    </h1>
                                </div>

                                {/* Hotel Address */}
                                {(() => {
                                    const hotelAddress = getHotelAddress();
                                    if (!hotelAddress) return null;
                                    return (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500 dark:text-slate-400 max-w-xl truncate" title={hotelAddress}>
                                            <span className="material-symbols-outlined text-[15px] text-rose-500 shrink-0">location_on</span>
                                            <span className="truncate">{hotelAddress}</span>
                                        </div>
                                    );
                                })()}

                                {/* Structured ID Ribbon */}
                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                    {internalHotelId && (
                                        <CopyBadge
                                            label="TOG Hotel ID"
                                            value={internalHotelId}
                                            copyId="hero-tog-hotel-id"
                                            icon="apartment"
                                            isPrimary={true}
                                            onClickValue={() => navigate(`/travel/hotels/detail/${internalHotelId}`)}
                                        />
                                    )}

                                    {booking.voucher && (
                                        <CopyBadge
                                            label="Voucher"
                                            value={booking.voucher}
                                            copyId="hero-voucher"
                                            icon="receipt_long"
                                            color="purple"
                                        />
                                    )}

                                    {booking.hotel?.supplierHotelId && (
                                        <CopyBadge
                                            label={`${supplierDisplayName} ID`}
                                            value={booking.hotel.supplierHotelId}
                                            copyId="hero-sup-hotel-id"
                                            icon="travel_explore"
                                        />
                                    )}

                                    {booking.hotel?.supplierVoucher && (
                                        <CopyBadge
                                            label="Supplier Voucher"
                                            value={booking.hotel.supplierVoucher}
                                            copyId="hero-sup-voucher"
                                            icon="confirmation_number"
                                            color="purple"
                                        />
                                    )}

                                    {booking.hotel?.dbId && (
                                        <CopyBadge
                                            label="DB ID"
                                            value={booking.hotel.dbId}
                                            copyId="hero-db-id"
                                            icon="database"
                                        />
                                    )}

                                    {booking.clientReferenceId && (
                                        <CopyBadge
                                            label="Ref"
                                            value={booking.clientReferenceId}
                                            copyId="hero-client-ref"
                                            icon="tag"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Clean Twin Status Badge Cards (Matching admin-frontend) */}
                        {(() => {
                            const rawStatus = (booking.hotel?.bookingStatus || booking.status || '').toUpperCase();
                            const isCanc = rawStatus === 'CANCELLED' || rawStatus === 'CANCELLED_WITH_PENALTY' || Boolean(booking.hotel?.cancelReason);
                            const isErr = rawStatus === 'ERROR' || rawStatus === 'FAILED';
                            const isConf = rawStatus === 'CONFIRMED' || rawStatus === 'ACTIVE' || rawStatus === 'SUCCESS';

                            const statusPulseDot = isErr ? 'bg-red-500' : isCanc ? 'bg-amber-400' : isConf ? 'bg-emerald-400' : 'bg-slate-400';
                            const statusSolidDot = isErr ? 'bg-red-600' : isCanc ? 'bg-amber-500' : isConf ? 'bg-emerald-500' : 'bg-slate-500';
                            const statusTextClass = isErr ? 'text-red-600 dark:text-red-400' : isCanc ? 'text-amber-600 dark:text-amber-400' : isConf ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white';

                            return (
                                <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-3 shrink-0 w-full lg:w-auto">
                                    {/* Booking Status Card */}
                                    <div className="flex-1 sm:w-52 bg-slate-50/80 dark:bg-[#303134]/60 rounded-2xl p-3.5 border border-slate-100 dark:border-[#3c4043] flex flex-col justify-between min-h-[92px]">
                                        <div className="flex items-center justify-between gap-2 min-h-[22px]">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[15px] text-[#137fec] dark:text-[#42a5f5] shrink-0">verified</span>
                                                <span>{currentLang === 'tr' ? 'Rezervasyon' : 'Booking Status'}</span>
                                            </span>
                                            <span className="relative flex h-2 w-2 shrink-0">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusPulseDot}`} />
                                                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusSolidDot}`} />
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <div className={`text-base font-bold tracking-tight truncate ${statusTextClass}`}>
                                                {rawStatus || 'N/A'}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                Order <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">#{booking.orderId}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Status Card */}
                                    <div className="flex-1 sm:w-52 bg-slate-50/80 dark:bg-[#303134]/60 rounded-2xl p-3.5 border border-slate-100 dark:border-[#3c4043] flex flex-col justify-between min-h-[92px]">
                                        <div className="flex items-center justify-between gap-2 min-h-[22px]">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                                                <span className="material-symbols-outlined text-[15px] text-emerald-500 shrink-0">payments</span>
                                                <span>{currentLang === 'tr' ? 'Ödeme Durumu' : 'Payment Status'}</span>
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shrink-0 ${paymentBadge.classes}`}>
                                                {String(booking.payment?.status || '').includes('ACCOUNT') ? 'ACCOUNT' : 'CARD'}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                                                {paymentBadge.label.replace(/\s*\(.*?\)\s*/g, '')}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                Method: <strong className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {String(booking.payment?.status || '').includes('ACCOUNT') ? (currentLang === 'tr' ? 'Cari Hesap' : 'Account') : (currentLang === 'tr' ? 'Kredi Kartı' : 'Credit Card')}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* 4 Divided Dashboard Stat Panels - Clean Symmetric 4-Column Grid */}
                    {(() => {
                        const leadGuest = booking.hotel?.rooms?.[0]?.occupancies?.[0];
                        const leadGuestName = leadGuest && (leadGuest.name || leadGuest.surname)
                            ? `${leadGuest.name || ''} ${leadGuest.surname || ''}`.trim()
                            : booking.hotel?.contact?.name
                                ? `${booking.hotel.contact.name || ''} ${booking.hotel.contact.surname || ''}`.trim()
                                : '—';
                        const leadBoardType = booking.hotel?.rooms?.[0]?.rates?.[0]?.boardType
                            ? formatBoardType(booking.hotel.rooms[0].rates[0].boardType)
                            : null;

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#3c4043] bg-slate-50/40 dark:bg-[#202124]/40">
                                {/* 1. Stay Itinerary */}
                                <div className="p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-[#137fec] dark:text-[#42a5f5]">calendar_month</span>
                                            <span>{currentLang === 'tr' ? 'Konaklama Tarihleri' : 'Stay Dates'}</span>
                                        </span>
                                        {nights > 0 && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-[#137fec]/10 text-[#137fec] dark:text-[#42a5f5] font-semibold text-[10px] tabular-nums tracking-wider">
                                                {nights} {nights === 1 ? (currentLang === 'tr' ? 'GECE' : 'NIGHT') : (currentLang === 'tr' ? 'GECE' : 'NIGHTS')}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 tabular-nums text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                            <span>{formatDate(booking.checkIn)}</span>
                                            <span className="text-slate-400 text-xs">→</span>
                                            <span>{formatDate(booking.checkOut)}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {(booking.hotel?.rooms || []).length} {(booking.hotel?.rooms || []).length === 1 ? L('roomSingular') : L('roomPlural')}
                                            </span>
                                            <span>•</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {totalGuests} {totalGuests === 1 ? (currentLang === 'tr' ? 'Misafir' : 'Guest') : L('guestsCount')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Total Financials */}
                                <div className="p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-emerald-500">payments</span>
                                            <span>{L('totalAmount')}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-[#303134] text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                                            {booking.currency || 'GBP'}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-base sm:text-lg font-bold tabular-nums text-[#137fec] dark:text-[#42a5f5] leading-none">
                                            {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}{' '}
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{booking.currency || ''}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                            <span>{L('taxesAndFeesIncluded')}</span>
                                            {booking.totalTaxAmount != null && (
                                                <span>Tax: <strong className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">{Number(booking.totalTaxAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Supply & Distribution */}
                                <div className="p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-indigo-500">inventory_2</span>
                                            <span>{currentLang === 'tr' ? 'Tedarikçi & Referans' : 'Supplier & Reference'}</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-[#303134] text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                                            {booking.supplier?.integrationType || 'DIRECT'}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {supplierDisplayName}{' '}
                                            {booking.hotel?.supplierHotelId && (
                                                <span className="tabular-nums font-normal text-xs text-slate-400">
                                                    (#{booking.hotel.supplierHotelId})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                                            Voucher: <strong className="font-mono text-slate-700 dark:text-slate-200 font-semibold">{booking.voucher || '—'}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Lead Contact */}
                                <div className="p-4 sm:p-5 flex flex-col justify-between gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-amber-500">person</span>
                                            <span>{currentLang === 'tr' ? 'Misafir & Pansiyon' : 'Lead Guest & Board'}</span>
                                        </span>
                                        {leadBoardType && (
                                            <span className="px-2 py-0.5 rounded-md bg-[#137fec]/10 text-[#137fec] dark:text-[#42a5f5] font-semibold text-[10px]">
                                                {leadBoardType}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={leadGuestName}>
                                            {leadGuestName}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                                            Ref: <strong className="font-semibold text-slate-700 dark:text-slate-300">#{booking.clientReferenceId || booking.orderId}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* 2. Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column (8 cols): Room, Guests, Rates, Contact */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Rooms & Travelers Experience */}
                        {booking.hotel?.rooms && booking.hotel.rooms.length > 0 && booking.hotel.rooms.map((room, roomIndex) => (
                            <div key={roomIndex} className="rounded-3xl bg-white dark:bg-[#28292c] border border-slate-200/90 dark:border-[#3c4043] shadow-sm overflow-hidden">
                                {/* Room Header Bar */}
                                <div className="px-6 py-4 bg-slate-50/70 dark:bg-[#202124]/70 border-b border-slate-100 dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-[#137fec]/10 dark:bg-[#137fec]/20 flex items-center justify-center text-[#137fec] dark:text-[#42a5f5] shrink-0">
                                            <span className="material-symbols-outlined text-[22px]">bed</span>
                                        </div>
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                                {room.roomName || `${L('room')} ${roomIndex + 1}`}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <span className="font-mono text-[11px] bg-white dark:bg-[#303134] px-1.5 py-0.5 rounded border border-slate-200/70 dark:border-[#3c4043]">
                                                    ID: {room.roomId || 'N/A'}
                                                </span>
                                                {booking.hotel.rooms.length > 1 && (
                                                    <span className="text-[11px] font-semibold text-[#137fec] dark:text-[#42a5f5]">
                                                        ({roomIndex + 1} / {booking.hotel.rooms.length})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {room.roomConfirmationCode && (
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-white dark:bg-[#303134] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                                                Conf: {room.roomConfirmationCode}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Room Body: Divided by hairline dividers */}
                                <div className="divide-y divide-slate-100 dark:divide-[#3c4043]">
                                    {/* 1. Travelers / Guests Row */}
                                    {room.occupancies && room.occupancies.length > 0 && (
                                        <div className="p-5 sm:p-6 space-y-3.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px] text-[#137fec] dark:text-[#42a5f5]">group</span>
                                                    <span>{L('guestsLabel')} ({room.occupancies.length})</span>
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {room.occupancies.map((guest, gIdx) => (
                                                    <div 
                                                        key={gIdx}
                                                        className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#202124]/50 border border-slate-200/70 dark:border-[#3c4043]/70 flex items-center gap-3 hover:border-[#137fec]/40 transition-colors"
                                                    >
                                                        <div className="size-9 rounded-full bg-[#137fec]/10 dark:bg-[#137fec]/20 text-[#137fec] dark:text-[#42a5f5] font-bold text-xs flex items-center justify-center shrink-0">
                                                            {guest.name?.charAt(0) || 'G'}
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                                    {guest.name} {guest.surname}
                                                                </p>
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white dark:bg-[#303134] text-[#137fec] dark:text-[#42a5f5] border border-slate-200 dark:border-[#3c4043] shrink-0">
                                                                    {getGuestTypeLabel(guest.guestType)}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                                {guest.nationality && (
                                                                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                                                        <span className="material-symbols-outlined text-[13px]">public</span>
                                                                        {guest.nationality}
                                                                    </span>
                                                                )}
                                                                {guest.gender && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[13px]">{getGenderIcon(guest.gender)}</span>
                                                                        {getGenderLabel(guest.gender)}
                                                                    </span>
                                                                )}
                                                                {guest.birthDate && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[13px]">cake</span>
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

                                    {/* 2. Rate & Board Metrics Strip */}
                                    {room.rates && room.rates.length > 0 && room.rates.map((rate, rIdx) => {
                                        const policies =
                                            (rate.cancellationPolicies?.length > 0 ? rate.cancellationPolicies : null) ||
                                            (rate.prices?.[0]?.cancellationPolicies?.length > 0 ? rate.prices[0].cancellationPolicies : null) ||
                                            (room.cancellationPolicies?.length > 0 ? room.cancellationPolicies : null);

                                        return (
                                            <div key={rIdx} className="divide-y divide-slate-100 dark:divide-[#3c4043]">
                                                {/* Rate Metric Strip (3 Columns) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#3c4043] bg-slate-50/30 dark:bg-[#202124]/30">
                                                    <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px] text-[#137fec]">restaurant</span>
                                                            <span>{L('boardType')}</span>
                                                        </span>
                                                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                            {formatBoardType(rate.boardType)}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px] text-emerald-500">verified</span>
                                                            <span>{L('refundable')}</span>
                                                        </span>
                                                        <div>
                                                            <RefundPolicyTooltip
                                                                isRefundable={rate.refundable}
                                                                textOverride={rate.refundable ? (currentLang === 'tr' ? 'İade Edilebilir' : 'Refundable') : (currentLang === 'tr' ? 'İade Edilemez' : 'Non-Refundable')}
                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    rate.refundable 
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50' 
                                                                        : 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="p-4 sm:p-5 flex flex-col justify-between gap-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px] text-indigo-500">payments</span>
                                                            <span>{L('rateDetails')}</span>
                                                        </span>
                                                        <div className="text-xs sm:text-sm font-bold tabular-nums text-[#137fec] dark:text-[#42a5f5]">
                                                            {rate.totalAmount != null ? Number(rate.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} {rate.currency}
                                                            <span className="text-[11px] font-normal text-slate-400 ml-1.5">({rate.rateCategoryId || 'Standart'})</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Daily Prices Track */}
                                                {rate.dailyPrices && rate.dailyPrices.length > 0 && (
                                                    <div className="p-5 sm:p-6 space-y-2.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px] text-[#137fec]">calendar_view_day</span>
                                                            <span>{L('dailyPrices')} ({rate.dailyPrices.length} {rate.dailyPrices.length > 1 ? L('nights') : L('night')})</span>
                                                        </span>
                                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                                            {rate.dailyPrices.map((dp, dpIdx) => (
                                                                <div key={dpIdx} className="min-w-[110px] px-3.5 py-2.5 rounded-xl bg-slate-50/70 dark:bg-[#202124]/50 border border-slate-200/70 dark:border-[#3c4043]/70 text-center shrink-0">
                                                                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{formatDate(dp.date)}</div>
                                                                    <div className="text-xs font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                                                                        {Number(dp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {rate.currency}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Cancellation Policy Timeline Strip */}
                                                {policies && policies.length > 0 && (
                                                    <div className="p-5 sm:p-6 space-y-2.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[15px] text-rose-500">policy</span>
                                                            <span>{L('cancelPolicies')}</span>
                                                        </span>
                                                        <div className="rounded-2xl border border-slate-200/80 dark:border-[#3c4043] divide-y divide-slate-100 dark:divide-[#3c4043] overflow-hidden">
                                                            {policies.map((p, pIdx) => (
                                                                <div
                                                                    key={pIdx}
                                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-[#28292c]"
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className={`size-2 shrink-0 rounded-full ${p.amount === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                                        <div className="text-xs text-slate-700 dark:text-slate-300">
                                                                            <span className="font-semibold text-slate-900 dark:text-white">{formatDateTime(p.fromDate)}</span>
                                                                            <span className="text-slate-400 mx-2">→</span>
                                                                            <span className="font-semibold text-slate-900 dark:text-white">{formatDateTime(p.toDate)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`text-xs font-bold tabular-nums shrink-0 self-end sm:self-auto ${p.amount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                        {p.amount === 0
                                                                            ? (L('freeCancel') || 'Ücretsiz İptal')
                                                                            : `${L('penaltyAmount')}: ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${p.currency}`
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Hotel Direct Contact Information */}
                        {booking.hotel?.contact && (
                            <div className="rounded-3xl bg-white dark:bg-[#28292c] border border-slate-200/90 dark:border-[#3c4043] shadow-sm overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50/70 dark:bg-[#202124]/70 border-b border-slate-100 dark:border-[#3c4043] flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[16px] text-[#137fec]">contact_phone</span>
                                        <span>{L('contactInfo')} ({booking.hotel.hotelName})</span>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#3c4043]">
                                    {(booking.hotel.contact.name || booking.hotel.contact.surname) && (
                                        <div className="p-4 sm:p-5 flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[18px]">person</span>
                                            </div>
                                            <div className="truncate">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{L('name')}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                                    {booking.hotel.contact.name} {booking.hotel.contact.surname}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {booking.hotel.contact.phoneNumber && (
                                        <a 
                                            href={`tel:${booking.hotel.contact.phoneCountryCode || ''}${booking.hotel.contact.phoneNumber}`}
                                            className="p-4 sm:p-5 flex items-center gap-3 hover:bg-slate-50/60 dark:hover:bg-[#202124]/40 transition-colors group cursor-pointer"
                                        >
                                            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">call</span>
                                            </div>
                                            <div className="truncate">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{L('phone')}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#137fec] truncate mt-0.5">
                                                    {booking.hotel.contact.phoneCountryCode} {booking.hotel.contact.phoneNumber}
                                                </p>
                                            </div>
                                        </a>
                                    )}

                                    {booking.hotel.contact.email && (
                                        <a 
                                            href={`mailto:${booking.hotel.contact.email}`}
                                            className="p-4 sm:p-5 flex items-center gap-3 hover:bg-slate-50/60 dark:hover:bg-[#202124]/40 transition-colors group cursor-pointer"
                                        >
                                            <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">mail</span>
                                            </div>
                                            <div className="truncate">
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{L('email')}</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#137fec] truncate mt-0.5">
                                                    {booking.hotel.contact.email}
                                                </p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (4 cols): Financials, Remark */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Google Checkout / Financial Receipt Card */}
                        <div className="rounded-3xl bg-white dark:bg-[#28292c] border border-slate-200/90 dark:border-[#3c4043] shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 bg-slate-50/70 dark:bg-[#202124]/70 border-b border-slate-100 dark:border-[#3c4043] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-xl bg-[#137fec]/10 dark:bg-[#137fec]/20 flex items-center justify-center text-[#137fec] dark:text-[#42a5f5]">
                                        <span className="material-symbols-outlined text-[18px]">receipt</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                            {L('pricePaymentSummary')}
                                        </h3>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-[#303134] text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                                    {booking.currency || 'GBP'}
                                </span>
                            </div>

                            {/* Primary Total Sale Box */}
                            <div className="px-6 py-4 bg-gradient-to-br from-slate-50/40 via-blue-50/20 to-slate-50/40 dark:from-[#202124]/50 dark:to-[#137fec]/10 border-b border-slate-100 dark:border-[#3c4043] flex items-baseline justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                                        {L('totalPrice')}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {L('taxesIncluded')}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl sm:text-2xl font-black tabular-nums text-[#137fec] dark:text-[#42a5f5]">
                                        {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}{' '}
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{booking.currency || ''}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Ledger Rows */}
                            <div className="divide-y divide-slate-100 dark:divide-[#3c4043] text-xs">
                                <div className="px-6 py-3 flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">{L('roomStayRate')}</span>
                                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                                        {booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} {booking.currency}
                                    </span>
                                </div>

                                {booking.totalTaxAmount != null && (
                                    <div className="px-6 py-3 flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">{L('taxAmount')}</span>
                                        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                            {Number(booking.totalTaxAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {booking.totalOnSpotAmount != null && (
                                    <div className="px-6 py-3 flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">{L('onSpotAmount')}</span>
                                        <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                            {Number(booking.totalOnSpotAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {Number(booking.totalPenaltyAmount || 0) > 0 && (
                                    <div className="px-6 py-3 flex items-center justify-between text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                                        <span className="font-semibold">{L('penaltyAmount')}</span>
                                        <span className="font-bold tabular-nums">
                                            {Number(booking.totalPenaltyAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}

                                {Number(booking.totalRefundAmount || 0) > 0 && (
                                    <div className="px-6 py-3 flex items-center justify-between text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                                        <span className="font-semibold">{L('refundAmount')}</span>
                                        <span className="font-bold tabular-nums">
                                            {Number(booking.totalRefundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Bulk Price Breakdown (Clean Flat Sub-Ledger) */}
                            {booking.bulkPrice && (
                                <div className="border-t border-slate-100 dark:border-[#3c4043] divide-y divide-slate-100 dark:divide-[#3c4043] text-xs">
                                    <div className="px-6 py-2.5 bg-slate-50/70 dark:bg-[#202124]/70 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px]">monitoring</span>
                                            <span>{L('bulkPriceSection')}</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {L('bulkPriceSectionSub')}
                                        </span>
                                    </div>
                                    {booking.bulkPrice.supplierPrice != null && (
                                        <div className="px-6 py-2.5 flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">{L('supplierPrice')}</span>
                                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                                                {Number(booking.bulkPrice.supplierPrice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                {' '}{booking.bulkPrice.supplierPrice.currency}
                                            </span>
                                        </div>
                                    )}
                                    {booking.bulkPrice.markupPrice != null && (
                                        <div className="px-6 py-2.5 flex items-center justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">{L('markupPrice')}</span>
                                            <span className={`font-semibold tabular-nums ${Number(booking.bulkPrice.markupPrice.amount) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {Number(booking.bulkPrice.markupPrice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                {' '}{booking.bulkPrice.markupPrice.currency}
                                            </span>
                                        </div>
                                    )}
                                    {booking.bulkPrice.sellingPrice != null && (
                                        <div className="px-6 py-2.5 flex items-center justify-between bg-blue-50/40 dark:bg-[#137fec]/10">
                                            <span className="font-semibold text-slate-900 dark:text-white">{L('sellingPrice')}</span>
                                            <span className="font-bold text-[#137fec] dark:text-[#42a5f5] tabular-nums">
                                                {Number(booking.bulkPrice.sellingPrice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                {' '}{booking.bulkPrice.sellingPrice.currency}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment Method & Status Footer */}
                            <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-[#202124]/50 border-t border-slate-100 dark:border-[#3c4043] flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                                        {L('paymentStatus')}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {String(booking.payment?.status || '').includes('ACCOUNT') ? (currentLang === 'tr' ? 'Cari Hesap' : 'Account Balance') : (currentLang === 'tr' ? 'Kredi Kartı' : 'Credit Card')}
                                        {booking.transactionUser && (
                                            <span className="text-slate-400 font-normal ml-1">({booking.transactionUser})</span>
                                        )}
                                    </span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${paymentBadge.classes}`}>
                                    <span className="material-symbols-outlined text-[13px]">{paymentBadge.icon}</span>
                                    <span>{paymentBadge.label}</span>
                                </span>
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

                                {/* Multi-room Selection / Notice */}
                                {(booking.hotel?.rooms || []).length > 1 && (
                                    <div className="space-y-2.5 pt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-[#202124] dark:text-white uppercase tracking-wider">
                                                {L('selectRoomsToCancel')}
                                            </span>
                                            {booking.supplier?.multiRoomCancelSupported && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cancelable = (booking.hotel?.rooms || []).filter(r => r.bookingStatus !== 'CANCELLED' && r.bookingStatus !== 'CANCELLED_WITH_PENALTY');
                                                        if (selectedRoomKeys.length === cancelable.length) {
                                                            setSelectedRoomKeys([]);
                                                        } else {
                                                            setSelectedRoomKeys(cancelable.map(getRoomKey));
                                                        }
                                                    }}
                                                    className="text-xs font-semibold text-[#1a73e8] hover:underline cursor-pointer"
                                                >
                                                    {selectedRoomKeys.length === (booking.hotel?.rooms || []).filter(r => r.bookingStatus !== 'CANCELLED' && r.bookingStatus !== 'CANCELLED_WITH_PENALTY').length ? L('deselectAll') : L('selectAll')}
                                                </button>
                                            )}
                                        </div>

                                        {!booking.supplier?.multiRoomCancelSupported && (
                                            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                                                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                                                <p>
                                                    {L('noPartialCancelSupplier').replace('{0}', booking.supplier?.name || (currentLang === 'tr' ? 'Tedarikçi' : 'Supplier'))}
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {(booking.hotel?.rooms || []).map((r, ri) => {
                                                const key = getRoomKey(r, ri);
                                                const isChecked = selectedRoomKeys.includes(key);
                                                const isAlreadyCancelled = r.bookingStatus === 'CANCELLED' || r.bookingStatus === 'CANCELLED_WITH_PENALTY';
                                                const isMultiSupported = Boolean(booking.supplier?.multiRoomCancelSupported);

                                                return (
                                                    <label
                                                        key={key}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                                            isAlreadyCancelled
                                                                ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-[#202124] border-slate-200 dark:border-slate-800'
                                                                : isChecked
                                                                    ? 'bg-[#e8f0fe] dark:bg-blue-950/20 border-[#1a73e8] cursor-pointer'
                                                                    : 'bg-white dark:bg-[#202124] border-[#dadce0] dark:border-[#3c4043] cursor-pointer hover:border-slate-400'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled={!isMultiSupported || isAlreadyCancelled}
                                                            onChange={() => {
                                                                if (!isMultiSupported || isAlreadyCancelled) return;
                                                                setSelectedRoomKeys(prev =>
                                                                    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                                                                );
                                                            }}
                                                            className="mt-0.5 size-4 rounded text-[#1a73e8] focus:ring-[#1a73e8] border-slate-300"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-xs font-bold text-[#202124] dark:text-white">
                                                                    {r.roomName || `${L('room')} ${ri + 1}`}
                                                                </span>
                                                                {r.rates?.[0]?.totalAmount != null && (
                                                                    <span className="text-xs font-semibold text-[#1a73e8]">
                                                                        {Number(r.rates[0].totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {booking.currency}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {r.occupancies?.length > 0 && (
                                                                <p className="text-[11px] text-[#5f6368] dark:text-slate-400 mt-0.5 truncate">
                                                                    {r.occupancies.map(o => `${o.name} ${o.surname}`).join(', ')}
                                                                </p>
                                                            )}
                                                            {r.roomConfirmationCode && (
                                                                <p className="text-[10px] font-mono text-[#70757a] mt-0.5">
                                                                    {L('confCode')}: {r.roomConfirmationCode}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        {booking.supplier?.multiRoomCancelSupported && (
                                            <div className="flex items-center justify-between px-1 text-xs">
                                                <span className="text-[#5f6368] dark:text-slate-400">
                                                    {L('roomsSelected').replace('{0}', selectedRoomKeys.length).replace('{1}', (booking.hotel?.rooms || []).length)}
                                                </span>
                                                <span className={`font-semibold ${selectedRoomKeys.length === (booking.hotel?.rooms || []).length ? 'text-[#1a73e8]' : 'text-amber-600 dark:text-amber-400'}`}>
                                                    {selectedRoomKeys.length === (booking.hotel?.rooms || []).length ? L('fullCancellation') : L('partialCancellation')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                disabled={Boolean(booking?.supplier?.multiRoomCancelSupported && (booking.hotel?.rooms || []).length > 1 && selectedRoomKeys.length === 0)}
                                className="h-9 px-5 rounded-full font-semibold text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-colors shadow-xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
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

        {/* Hotel Image Lightbox Modal */}
        {showImageLightbox && heroImage && typeof document !== 'undefined' && createPortal(
            <div
                className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowImageLightbox(false)}
            >
                <div
                    className="relative max-w-4xl max-h-[85vh] bg-[#202124] rounded-3xl border border-[#3c4043] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => setShowImageLightbox(false)}
                        className="absolute top-4 right-4 z-10 size-9 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                    <img
                        src={heroImage}
                        alt={hotelName}
                        className="w-full max-h-[72vh] object-contain bg-black"
                    />
                    <div className="p-4 bg-[#202124] flex flex-wrap items-center justify-between gap-3 text-white border-t border-[#3c4043]">
                        <div>
                            <h3 className="text-sm font-bold">{hotelName}</h3>
                            {(() => {
                                const hotelAddress = getHotelAddress();
                                return hotelAddress ? <p className="text-xs text-slate-400 mt-0.5">{hotelAddress}</p> : null;
                            })()}
                        </div>
                        {internalHotelId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowImageLightbox(false);
                                    navigate(`/travel/hotels/detail/${internalHotelId}`);
                                }}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#137fec] hover:bg-[#0b5baf] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <span>{currentLang === 'tr' ? 'Otel Detay Sayfasına Git' : 'Go to Hotel Detail'}</span>
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
};

export default BookingDetail;
