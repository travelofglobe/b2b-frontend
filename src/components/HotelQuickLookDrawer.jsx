import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import { hotelService } from '../services/hotelService';
import { getBoardTypeLabel, BOARD_TYPES } from '../utils/boardTypeUtils';
import { FACILITY_ICON_MAP } from '../utils/facilityUtils';
import RefundPolicyTooltip from './RefundPolicyTooltip';
import { useToast } from '../context/ToastContext';

const HotelQuickLookDrawer = ({
    hotel,
    isOpen,
    onClose,
    searchParams,
    currencySymbol = '₺',
    isFav,
    onToggleFav,
    currentLang = 'tr'
}) => {
    const navigate = useNavigate();
    const { error: toastError } = useToast();
    const [bookingRateCode, setBookingRateCode] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'prices' | 'photos' | 'about'
    const [cachedHotel, setCachedHotel] = useState(hotel);
    const [detailData, setDetailData] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [isRoomsLoading, setIsRoomsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [boardTypeFilter, setBoardTypeFilter] = useState('ALL');
    const [cancelFilter, setCancelFilter] = useState('ALL');
    const [expandedRates, setExpandedRates] = useState({});

    // Keep cached hotel so during exit animation the content remains intact
    useEffect(() => {
        if (hotel) {
            setCachedHotel(hotel);
            setDetailData(null);
            setActiveTab('overview');
            setBoardTypeFilter('ALL');
            setCancelFilter('ALL');
        }
    }, [hotel?.id, hotel?.hotelId]);

    const currentHotel = useMemo(() => {
        return { ...(cachedHotel || {}), ...(detailData || {}) };
    }, [cachedHotel, detailData]);

    // Fetch full hotel rooms & rates from hotelService.searchRooms
    useEffect(() => {
        if (!hotel || !isOpen) return;

        const hotelId = hotel.hotelId || hotel.id;
        if (!hotelId) return;

        let isMounted = true;
        const fetchHotelRooms = async () => {
            setIsRoomsLoading(true);
            try {
                const checkin = searchParams?.get('checkin');
                const checkout = searchParams?.get('checkout');
                const nationality = searchParams?.get('nationality') || 'TR';
                const guestsParam = searchParams?.get('guests');
                let parsedRooms = [{ adults: 2, children: 0, childAges: [] }];
                if (guestsParam) {
                    try {
                        const parsed = JSON.parse(guestsParam);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            parsedRooms = parsed.map(r => ({
                                adults: r.a || 2,
                                children: r.c || 0,
                                childAges: r.ca || []
                            }));
                        }
                    } catch (e) {}
                }

                const response = await hotelService.searchRooms({
                    hotelId: parseInt(hotelId),
                    searchCriteria: {
                        checkin,
                        checkout,
                        nationality,
                        rooms: parsedRooms
                    }
                });

                if (!isMounted) return;

                const content = response?.data?.content;
                if (content && content.length > 0) {
                    const detailed = content[0];
                    setDetailData(detailed);
                    if (detailed.rooms && detailed.rooms.length > 0) {
                        setRooms(detailed.rooms);
                    } else if (hotel.rooms) {
                        setRooms(hotel.rooms);
                    }
                } else if (hotel.rooms) {
                    setRooms(hotel.rooms);
                }
            } catch (err) {
                console.error('Error fetching rooms in quick look drawer:', err);
                if (isMounted && hotel.rooms) {
                    setRooms(hotel.rooms);
                }
            } finally {
                if (isMounted) setIsRoomsLoading(false);
            }
        };

        fetchHotelRooms();

        return () => {
            isMounted = false;
        };
    }, [hotel?.hotelId, hotel?.id, isOpen, searchParams]);

    // Format dates helper
    const checkin = searchParams?.get('checkin') || '';
    const checkout = searchParams?.get('checkout') || '';

    const formatDateBadge = (dateStr) => {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                const day = parseInt(parts[2], 10);
                const month = months[parseInt(parts[1], 10) - 1] || '';
                return `${day} ${month}`;
            }
        } catch {}
        return dateStr;
    };

    const dateRangeLabel = (checkin && checkout) 
        ? `${formatDateBadge(checkin)} - ${formatDateBadge(checkout)}`
        : 'Tarih seçilmedi';

    const formattedPrice = currentHotel.price ? Math.round(currentHotel.price).toLocaleString('tr-TR') : '—';
    const formattedRating = (parseFloat(currentHotel.rating) || 4.4).toFixed(1).replace('.', ',');
    const reviewCount = currentHotel.reviewCount || (currentHotel.stars ? currentHotel.stars * 125 + 42 : 642);
    const starsCount = currentHotel.stars || currentHotel.hotelStar?.star || 4;

    const images = useMemo(() => {
        if (currentHotel.images && currentHotel.images.length > 0) {
            return currentHotel.images.map(img => (typeof img === 'object' ? (img.url || img.originalUrl) : img)).filter(Boolean);
        }
        if (currentHotel.image) return [currentHotel.image];
        return [placeholderHotel, placeholderHotel, placeholderHotel];
    }, [currentHotel.images, currentHotel.image]);

    const detailUrl = `/travel/hotels/detail/${currentHotel.hotelId || currentHotel.id}?${searchParams ? searchParams.toString() : ''}`;

    const handleShare = async () => {
        const fullUrl = window.location.origin + detailUrl;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentHotel.name,
                    url: fullUrl,
                });
            } catch {}
        } else {
            try {
                await navigator.clipboard.writeText(fullUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch {}
        }
    };

    const directionsUrl = (currentHotel.lat && currentHotel.lng)
        ? `https://www.google.com/maps/dir/?api=1&destination=${currentHotel.lat},${currentHotel.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentHotel.name || '')}`;

    // Group rooms by name, filter by board & policy, sort by price
    const groupedRooms = useMemo(() => {
        if (!rooms || rooms.length === 0) return [];

        let filtered = rooms;
        if (boardTypeFilter !== 'ALL') {
            filtered = filtered.filter(r => (r.hubRateModel?.boardCode || r.boardCode) === boardTypeFilter);
        }
        if (cancelFilter === 'FREE') {
            filtered = filtered.filter(r => {
                const cancelAmount = r.hubRateModel?.price?.cancellationPolicies?.[0]?.amount;
                return r.hubRateModel?.refundable === true || cancelAmount === 0 || r.hasFreeCancellation;
            });
        } else if (cancelFilter === 'NON_REFUNDABLE') {
            filtered = filtered.filter(r => {
                const cancelAmount = r.hubRateModel?.price?.cancellationPolicies?.[0]?.amount;
                return r.hubRateModel?.refundable === false || (cancelAmount !== undefined && cancelAmount > 0);
            });
        }

        const groups = filtered.reduce((acc, r) => {
            const key = r.names?.tr || r.names?.en || r.names?.defaultName || r.name || 'Standart Oda';
            if (!acc[key]) {
                acc[key] = {
                    name: key,
                    images: r.images || [],
                    squareMeter: r.squareMeter,
                    roomPaxCapacity: r.roomPaxCapacity,
                    maxAdult: r.maxAdult || 2,
                    maxChildren: r.maxChildren || 0,
                    attributes: r.attributes || [],
                    rates: []
                };
            }
            acc[key].rates.push(r);
            return acc;
        }, {});

        return Object.values(groups).map(g => ({
            ...g,
            rates: [...g.rates].sort((a, b) => {
                const pA = a.hubRateModel?.price?.calculatedAmount || a.hubRateModel?.price?.totalPaymentAmount || a.price || 0;
                const pB = b.hubRateModel?.price?.calculatedAmount || b.hubRateModel?.price?.totalPaymentAmount || b.price || 0;
                return pA - pB;
            })
        }));
    }, [rooms, boardTypeFilter, cancelFilter]);

    const formatPolicyDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
            }
        } catch {}
        return dateStr;
    };

    const handleSelectRateAndCheckout = async (rateItem, roomGroup) => {
        const rateCode = rateItem?.hubRateModel?.rateCode || rateItem?.rateCode;
        if (!rateCode) {
            navigate(detailUrl);
            return;
        }

        setBookingRateCode(rateCode);

        try {
            const checkRatesRequest = {
                rooms: [{ rateCode }]
            };

            const response = await hotelService.checkRates(checkRatesRequest);
            console.log('QuickLook check rates response:', response);

            const checkRatesList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []);
            const firstHotel = checkRatesList[0] || {};
            const rateSearchUuid = response?.rateSearchUuid || firstHotel?.rateSearchUuid || '';

            // Calculate session ID (hash of rateCode)
            let sid = '';
            if (window.crypto && window.crypto.subtle) {
                try {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(rateCode);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    sid = hashHex.substring(0, 16);
                } catch (e) {
                    console.warn('Crypto subtle failed', e);
                }
            }
            if (!sid) {
                let hash = 0;
                for (let i = 0; i < rateCode.length; i++) {
                    const char = rateCode.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                sid = Math.abs(hash).toString(16).padEnd(16, 'a');
            }

            const roomName = roomGroup?.name || rateItem?.names?.tr || rateItem?.names?.en || 'Standart Oda';
            const price = rateItem?.hubRateModel?.price?.calculatedAmount 
                || rateItem?.hubRateModel?.price?.totalPaymentAmount 
                || rateItem?.price 
                || currentHotel.price || 0;

            const currency = rateItem?.hubRateModel?.price?.currency || currentHotel.currency || 'EUR';

            const selectedRoom = {
                type: roomName,
                rate: price,
                name: roomName,
                currency: currency,
                hubRateModel: rateItem?.hubRateModel,
                cancellationPolicies: rateItem?.hubRateModel?.price?.cancellationPolicies || [],
                dailyPrices: rateItem?.hubRateModel?.price?.dailyPrices || []
            };

            const parsedCheckIn = checkin ? new Date(checkin) : new Date();
            const parsedCheckOut = checkout ? new Date(checkout) : new Date(Date.now() + 86400000);
            const isoCheckIn = parsedCheckIn.toISOString();
            const isoCheckOut = parsedCheckOut.toISOString();
            const diffDays = Math.max(1, Math.ceil(Math.abs(parsedCheckOut - parsedCheckIn) / (1000 * 60 * 60 * 24)));

            let parsedRooms = [{ adults: 2, children: 0, childAges: [] }];
            const guestsParam = searchParams?.get('guests');
            if (guestsParam) {
                try {
                    const p = JSON.parse(guestsParam);
                    if (Array.isArray(p) && p.length > 0) {
                        parsedRooms = p.map(r => ({ adults: r.a || 2, children: r.c || 0, childAges: r.ca || [] }));
                    }
                } catch {}
            }

            const sessionData = {
                selectedRooms: [selectedRoom],
                hotel: currentHotel,
                roomState: parsedRooms,
                checkInDate: isoCheckIn,
                checkOutDate: isoCheckOut,
                totalPrice: price,
                nights: diffDays,
                rateSearchUuid: rateSearchUuid,
                checkRatesData: firstHotel,
                originalSearch: searchParams ? `?${searchParams.toString()}` : '',
                hotelSlug: String(currentHotel.hotelId || currentHotel.id)
            };

            await hotelService.saveCheckoutSession(sid, sessionData);
            navigate(`/travel/hotels/checkout/guests?sessionId=${sid}`);
        } catch (err) {
            console.error('Check rates error from quick look:', err);
            if (toastError) {
                toastError('Fiyat kontrolü sırasında bir hata oluştu veya bu oda artık müsait değil. Otel detay sayfasına yönlendiriliyorsunuz.');
            }
            navigate(`${detailUrl}&rateCode=${encodeURIComponent(rateCode)}`);
        } finally {
            setBookingRateCode(null);
        }
    };

    return (
        <div
            className={`absolute inset-0 z-[2100] bg-white dark:bg-[#202124] flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isOpen 
                    ? 'translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.25)]' 
                    : '-translate-x-full pointer-events-none'
            }`}
            style={{ willChange: 'transform' }}
        >
            {/* ══════════════════════════════════════════
                1. TOP HEADER BAR
            ══════════════════════════════════════════ */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#dadce0] dark:border-slate-700 shrink-0 bg-white dark:bg-[#202124] z-20">
                <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                        <h1 
                            className="text-[19px] sm:text-[21px] font-medium text-[#202124] dark:text-slate-100 font-roboto truncate"
                            title={currentHotel.name}
                        >
                            {currentHotel.names?.tr || currentHotel.names?.en || currentHotel.name}
                        </h1>
                        <div className="flex text-[#fbbc04] shrink-0">
                            {[...Array(Math.min(starsCount, 5))].map((_, i) => (
                                <span key={i} className="material-symbols-outlined fill-1 text-[16px]">star</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        to={detailUrl}
                        target="_blank"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700 transition-colors border border-[#dadce0] dark:border-slate-600"
                        title="Detay sayfasını yeni sekmede aç"
                    >
                        <span className="material-symbols-outlined text-[19px]">open_in_new</span>
                    </Link>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                        title="Kapat"
                    >
                        <span className="material-symbols-outlined text-[17px]">close</span>
                        <span>Kapat</span>
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                2. NAVIGATION TABS (Yorumlar Kaldırıldı)
            ══════════════════════════════════════════ */}
            <div className="flex items-center px-6 border-b border-[#dadce0] dark:border-slate-700 shrink-0 bg-white dark:bg-[#202124] gap-6 text-[14px] z-10">
                {[
                    { id: 'overview', label: 'Genel bakış' },
                    { id: 'prices', label: 'Fiyatlar' },
                    { id: 'photos', label: 'Fotoğraflar' },
                    { id: 'about', label: 'Hakkında' }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 font-medium transition-colors relative cursor-pointer ${
                                isActive 
                                    ? 'text-[#1a73e8] dark:text-blue-400 border-b-2 border-[#1a73e8] dark:border-blue-400' 
                                    : 'text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════════
                3. SCROLLABLE TAB CONTENTS
            ══════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">

                {/* ──────────────────────────────────────
                    TAB 1: GENEL BAKIŞ (OVERVIEW)
                ────────────────────────────────────── */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Rating, Address & Price Badge Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5f6368] dark:text-slate-400">
                                    <span className="font-semibold text-[#202124] dark:text-slate-200">{formattedRating}</span>
                                    <div className="flex text-[#fbbc04] text-[13px]">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="leading-none">
                                                {i < Math.floor(parseFloat(currentHotel.rating) || 4) ? '★' : '☆'}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-[#1a73e8] font-medium">({reviewCount.toLocaleString('tr-TR')})</span>
                                    <span>•</span>
                                    <span>{starsCount} yıldızlı otel</span>
                                    {currentHotel.isRecommended && (
                                        <span className="bg-[#e6f4ea] text-[#137333] dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                            Önerilen
                                        </span>
                                    )}
                                </div>
                                <p className="text-[13px] text-[#5f6368] dark:text-slate-400 leading-snug">
                                    {currentHotel.address?.street 
                                        ? `${currentHotel.address.street}, ${currentHotel.address.cityName || ''}`
                                        : (currentHotel.address || currentHotel.city || 'İstanbul, Türkiye')}
                                    {currentHotel.contact?.phoneNumber ? ` • ${currentHotel.contact.phoneNumber}` : ''}
                                </p>
                            </div>

                            {/* Blue Price Badge */}
                            <div className="bg-[#1a73e8] text-white rounded-xl px-4 py-2.5 text-right shrink-0 shadow-md min-w-[105px]">
                                <div className="text-[18px] font-bold leading-tight">
                                    {currencySymbol}{formattedPrice}
                                </div>
                                <div className="text-[11px] font-normal opacity-90 leading-tight mt-0.5">
                                    {dateRangeLabel}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {currentHotel.contact?.website && (
                                <a
                                    href={currentHotel.contact.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[17px]">language</span>
                                    <span>İnternet sitesi</span>
                                </a>
                            )}

                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[17px]">directions</span>
                                <span>Yol Tarifi</span>
                            </a>

                            <button
                                onClick={onToggleFav}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                            >
                                <span 
                                    className="material-symbols-outlined text-[17px]"
                                    style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                    bookmark
                                </span>
                                <span>{isFav ? 'Kaydedildi' : 'Kaydet'}</span>
                            </button>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#dadce0] dark:border-slate-600 rounded-full text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[17px]">
                                    {isCopied ? 'check' : 'share'}
                                </span>
                                <span>{isCopied ? 'Kopyalandı!' : 'Paylaş'}</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('prices')}
                                className="ml-auto flex items-center justify-center px-5 py-1.5 bg-[#1a73e8] text-white rounded-full text-[13px] font-medium hover:bg-[#1557b0] transition-colors shadow-sm cursor-pointer"
                            >
                                Oda rezervasyonu yap
                            </button>
                        </div>

                        {/* 3 Photos Strip - Google Style */}
                        <div className="grid grid-cols-12 gap-2 h-[175px] rounded-xl overflow-hidden shadow-sm">
                            <div 
                                onClick={() => setActiveTab('photos')}
                                className="col-span-6 relative h-full overflow-hidden group cursor-pointer"
                            >
                                <img 
                                    src={images[0] || placeholderHotel} 
                                    alt={currentHotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={e => { e.target.src = placeholderHotel; }}
                                />
                            </div>

                            <div 
                                onClick={() => setActiveTab('photos')}
                                className="col-span-3 relative h-full overflow-hidden group cursor-pointer"
                            >
                                <img 
                                    src={images[1] || images[0] || placeholderHotel} 
                                    alt={currentHotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={e => { e.target.src = placeholderHotel; }}
                                />
                            </div>

                            <div 
                                onClick={() => setActiveTab('photos')}
                                className="col-span-3 relative h-full overflow-hidden group cursor-pointer"
                            >
                                <img 
                                    src={images[2] || images[0] || placeholderHotel} 
                                    alt={currentHotel.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={e => { e.target.src = placeholderHotel; }}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('photos');
                                    }}
                                    className="absolute bottom-2.5 right-2.5 bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-[11.5px] font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[15px]">photo_library</span>
                                    <span>Daha fazla</span>
                                </button>
                            </div>
                        </div>

                        {/* Featured Prices Preview Card */}
                        <div className="border border-[#dadce0] dark:border-slate-700 rounded-xl p-4 space-y-3 bg-white dark:bg-[#303134]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-100">
                                    Öne Çıkan Fiyat Seçenekleri
                                </h3>
                                <button
                                    onClick={() => setActiveTab('prices')}
                                    className="text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    Tüm Fiyatları Gör ({groupedRooms.length > 0 ? groupedRooms.reduce((sum, g) => sum + g.rates.length, 0) : 'Oda'} Seçenek) →
                                </button>
                            </div>

                            {isRoomsLoading ? (
                                <div className="space-y-2 py-2">
                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                    <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                                </div>
                            ) : groupedRooms.length > 0 ? (
                                <div className="space-y-2.5">
                                    {groupedRooms.slice(0, 3).map((roomGroup, idx) => {
                                        const bestRate = roomGroup.rates[0];
                                        const price = bestRate?.hubRateModel?.price?.calculatedAmount 
                                            || bestRate?.hubRateModel?.price?.totalPaymentAmount 
                                            || bestRate?.price 
                                            || currentHotel.price;
                                        const boardCode = bestRate?.hubRateModel?.boardCode;
                                        const boardName = getBoardTypeLabel(boardCode, currentLang) 
                                            || bestRate?.hubRateModel?.boardName 
                                            || 'Oda Kahvaltı';
                                        const isFreeCancel = bestRate?.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0 
                                            || bestRate?.hasFreeCancellation;

                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[#e8eaed] dark:border-slate-700 hover:border-[#1a73e8] transition-colors">
                                                <div className="min-w-0 pr-3">
                                                    <div className="text-[13.5px] font-medium text-[#202124] dark:text-slate-100 truncate">
                                                        {roomGroup.name}
                                                    </div>
                                                    <div className="text-[12px] text-[#5f6368] dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                        <span>{boardName}</span>
                                                        {isFreeCancel && (
                                                            <span className="text-[#137333] font-medium">• Ücretsiz iptal</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-[16px] font-bold text-[#202124] dark:text-slate-100">
                                                        {currencySymbol}{Math.round(price).toLocaleString('tr-TR')}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectRateAndCheckout(bestRate, roomGroup)}
                                                        disabled={!!bookingRateCode}
                                                        className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12.5px] font-medium rounded-full transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        {bookingRateCode === (bestRate?.hubRateModel?.rateCode || bestRate?.rateCode) ? (
                                                            <>
                                                                <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                                <span>Seçiliyor...</span>
                                                            </>
                                                        ) : (
                                                            <span>Odayı Seç</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 rounded-lg border border-[#e8eaed] dark:border-slate-700">
                                    <div>
                                        <div className="text-[13.5px] font-medium text-[#202124] dark:text-slate-100">
                                            Standart Fiyat
                                        </div>
                                        <div className="text-[12px] text-[#137333] font-medium">
                                            En iyi müsaitlik garantisi
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[16px] font-bold text-[#202124] dark:text-slate-100">
                                            {currencySymbol}{formattedPrice}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => navigate(detailUrl)}
                                            className="px-4 py-1.5 bg-[#1a73e8] text-white text-[12.5px] font-medium rounded-full hover:bg-[#1557b0] transition-colors cursor-pointer"
                                        >
                                            Odayı Seç
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Popular Amenities */}
                        <div className="space-y-3 pt-1">
                            <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-100">
                                Popüler olanaklar
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5 text-[13px] text-[#3c4043] dark:text-slate-300">
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">wifi</span>
                                    <span>Ücretsiz kablosuz internet</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">pool</span>
                                    <span>Yüzme havuzu</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">spa</span>
                                    <span>Spa & Masaj</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">local_parking</span>
                                    <span>Otopark</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">restaurant</span>
                                    <span>Restoran</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-[19px] text-[#5f6368]">ac_unit</span>
                                    <span>Klima</span>
                                </div>
                            </div>
                        </div>

                        {/* About Property Preview Snippet */}
                        {(currentHotel.description || (currentHotel.descriptions && currentHotel.descriptions.length > 0)) && (
                            <div className="space-y-2 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                                <h3 className="text-[15px] font-medium text-[#202124] dark:text-slate-100">
                                    Tesis Hakkında
                                </h3>
                                <p 
                                    className="text-[13px] text-[#5f6368] dark:text-slate-400 line-clamp-3 leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: currentHotel.descriptions?.[0]?.text || currentHotel.description || '' 
                                    }}
                                />
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className="text-[13px] font-medium text-[#1a73e8] dark:text-blue-400 hover:underline cursor-pointer pt-1"
                                >
                                    Devamını Hakkında sekmesinde oku →
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ──────────────────────────────────────
                    TAB 2: FİYATLAR (RATES & ROOMS)
                ────────────────────────────────────── */}
                {activeTab === 'prices' && (
                    <div className="space-y-5">
                        {/* Filters Bar - Matching HotelDetail */}
                        <div className="flex flex-wrap items-center gap-2.5 p-3 bg-[#f8f9fa] dark:bg-[#303134] rounded-xl border border-[#dadce0] dark:border-slate-700">
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="material-symbols-outlined text-[17px] text-[#5f6368]">restaurant</span>
                                <span className="font-medium text-[#5f6368] dark:text-slate-400">Pansiyon:</span>
                                <select
                                    value={boardTypeFilter}
                                    onChange={(e) => setBoardTypeFilter(e.target.value)}
                                    className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-600 rounded-md text-xs font-normal text-[#202124] dark:text-white px-2 py-1 outline-none cursor-pointer"
                                >
                                    <option value="ALL">Tüm Pansiyonlar</option>
                                    {Object.keys(BOARD_TYPES).map(code => (
                                        <option key={code} value={code}>{getBoardTypeLabel(code, currentLang)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-px h-4 bg-[#dadce0] dark:bg-slate-700 hidden sm:block"></div>

                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="material-symbols-outlined text-[17px] text-[#5f6368]">event_busy</span>
                                <span className="font-medium text-[#5f6368] dark:text-slate-400">İptal Kuralı:</span>
                                <select
                                    value={cancelFilter}
                                    onChange={(e) => setCancelFilter(e.target.value)}
                                    className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-600 rounded-md text-xs font-normal text-[#202124] dark:text-white px-2 py-1 outline-none cursor-pointer"
                                >
                                    <option value="ALL">Tüm Kurallar</option>
                                    <option value="FREE">Ücretsiz İptal</option>
                                    <option value="NON_REFUNDABLE">İade Edilmez</option>
                                </select>
                            </div>

                            <div className="ml-auto text-xs text-[#5f6368] dark:text-slate-400 font-medium">
                                {groupedRooms.length} Oda Tipi Bulundu
                            </div>
                        </div>

                        {isRoomsLoading ? (
                            <div className="space-y-4 py-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-4 border border-[#dadce0] dark:border-slate-700 rounded-xl space-y-3 animate-pulse">
                                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : groupedRooms.length > 0 ? (
                            <div className="space-y-5">
                                {groupedRooms.map((group, gIdx) => {
                                    const isGroupExpanded = expandedRates[group.name];
                                    const ratesToShow = isGroupExpanded ? group.rates : group.rates.slice(0, 4);
                                    const hasMoreRates = group.rates.length > 4;

                                    return (
                                        <div key={gIdx} className="border border-[#dadce0] dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-[#202124] shadow-none hover:shadow-md transition-shadow">
                                            {/* Room Top Section with image and specs */}
                                            <div className="flex flex-col sm:flex-row">
                                                <div 
                                                    className="sm:w-56 h-44 sm:h-auto relative overflow-hidden shrink-0 cursor-pointer group/room bg-slate-100 dark:bg-slate-800"
                                                    onClick={() => {
                                                        const roomImg = group.images?.[0]?.url || images[gIdx % images.length];
                                                        const foundIdx = images.indexOf(roomImg);
                                                        setLightboxIndex(foundIdx >= 0 ? foundIdx : 0);
                                                    }}
                                                >
                                                    <img 
                                                        src={group.images?.[0]?.url || images[gIdx % images.length]} 
                                                        alt={group.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/room:scale-105"
                                                        onError={e => { e.target.src = placeholderHotel; }}
                                                    />
                                                    {group.images?.length > 0 && (
                                                        <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">photo_library</span>
                                                            <span>{group.images.length} Fotoğraf</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 p-4 flex flex-col min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#202124] dark:text-white leading-tight">
                                                            {group.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {group.squareMeter && (
                                                                <span className="bg-[#f1f3f4] dark:bg-slate-700 text-[#3c4043] dark:text-slate-300 text-[11px] font-normal px-2 py-0.5 rounded-md">
                                                                    {group.squareMeter} m²
                                                                </span>
                                                            )}
                                                            <span className="bg-[#f1f3f4] dark:bg-slate-700 text-[#3c4043] dark:text-slate-300 text-[11px] font-normal px-2 py-0.5 rounded-md">
                                                                {group.roomPaxCapacity || group.maxAdult} Pax
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 text-[#5f6368] dark:text-slate-400 text-xs mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[15px]">group</span>
                                                            <span>{group.maxAdult} Yetişkin</span>
                                                        </span>
                                                        {group.maxChildren > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[15px]">child_care</span>
                                                                <span>{group.maxChildren} Çocuk</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Attribute Chips */}
                                                    <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                                                        {(group.attributes || []).slice(0, 4).map((attr, aIdx) => {
                                                            const label = attr.names?.tr || attr.names?.en || attr.label;
                                                            return (
                                                                <span key={aIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f8f9fa] dark:bg-slate-800 text-[11px] text-[#5f6368] dark:text-slate-300 border border-[#dadce0] dark:border-slate-700">
                                                                    <span className="material-symbols-outlined text-[13px] text-[#1a73e8]">done</span>
                                                                    <span>{label}</span>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rates List Section - Google Style */}
                                            <div className="border-t border-[#dadce0] dark:border-slate-700 bg-[#f8f9fa] dark:bg-[#303134]/30 p-3 sm:p-4 space-y-2.5">
                                                <div className="flex items-center justify-between text-[11.5px] text-[#5f6368] dark:text-slate-400 mb-1">
                                                    <span className="font-medium">Mevcut Fiyatlar ({group.rates.length} Seçenek)</span>
                                                    <span>Fiyatlara vergi ve harçlar dahildir</span>
                                                </div>

                                                {ratesToShow.map((rateItem, rIdx) => {
                                                    const boardCode = rateItem.hubRateModel?.boardCode;
                                                    const boardLabel = getBoardTypeLabel(boardCode, currentLang) 
                                                        || rateItem.hubRateModel?.boardName 
                                                        || rateItem.boardName 
                                                        || 'Oda Kahvaltı';
                                                    
                                                    const price = rateItem.hubRateModel?.price?.calculatedAmount 
                                                        || rateItem.hubRateModel?.price?.totalPaymentAmount 
                                                        || rateItem.price 
                                                        || currentHotel.price;

                                                    const cancelPolicy = rateItem.hubRateModel?.price?.cancellationPolicies?.[0];
                                                    const isFreeCancel = rateItem.hubRateModel?.refundable === true 
                                                        || cancelPolicy?.amount === 0 
                                                        || rateItem.hasFreeCancellation;
                                                    const cancelDueDate = cancelPolicy?.dueDate ? formatDateBadge(cancelPolicy.dueDate) : null;

                                                    return (
                                                        <div 
                                                            key={rIdx}
                                                            className="p-3 sm:p-3.5 rounded-xl border border-[#dadce0] dark:border-slate-700 bg-white dark:bg-[#202124] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#1a73e8] transition-all"
                                                        >
                                                            <div className="space-y-1 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-[17px] text-[#1a73e8]">restaurant</span>
                                                                    <p className="font-medium text-[13.5px] text-[#202124] dark:text-white">
                                                                        {boardLabel}
                                                                    </p>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                                    <RefundPolicyTooltip
                                                                        isRefundable={isFreeCancel}
                                                                        textOverride={isFreeCancel ? (cancelDueDate ? `${cancelDueDate} tarihine kadar ücretsiz iptal` : 'Ücretsiz İptal') : 'İade Edilmez'}
                                                                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                                                            isFreeCancel 
                                                                                ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                                                                                : 'bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                                        }`}
                                                                    />

                                                                    {rateItem.hubRateModel?.price?.cancellationPolicies?.length > 0 && (
                                                                        <div className="group/cancel relative">
                                                                            <span className="text-[11.5px] text-[#1a73e8] hover:underline cursor-pointer">
                                                                                Kuralları Göster
                                                                            </span>
                                                                            <div className="absolute bottom-full left-0 mb-2 w-72 p-3.5 bg-white dark:bg-[#202124] text-[#202124] dark:text-white rounded-lg shadow-xl opacity-0 invisible group-hover/cancel:opacity-100 group-hover/cancel:visible transition-all z-[100] border border-[#dadce0] dark:border-slate-700">
                                                                                <div className="flex items-center gap-1.5 mb-2.5 border-b border-[#dadce0] dark:border-slate-700 pb-1.5">
                                                                                    <span className="material-symbols-outlined text-sm text-[#1a73e8]">event_busy</span>
                                                                                    <p className="text-xs font-semibold uppercase tracking-wider">İptal Takvimi</p>
                                                                                </div>
                                                                                <div className="space-y-2">
                                                                                    {rateItem.hubRateModel.price.cancellationPolicies.map((policy, pIdx) => (
                                                                                        <div key={pIdx} className="text-xs border-l-2 border-[#1a73e8] pl-2">
                                                                                            <div className="flex justify-between">
                                                                                                <span className="text-[#5f6368] dark:text-slate-400">Ceza:</span>
                                                                                                <span className={policy.amount === 0 ? 'text-[#137333] font-semibold' : 'text-[#d93025] font-semibold'}>
                                                                                                    {policy.currency} {policy.amount}
                                                                                                </span>
                                                                                            </div>
                                                                                            <p className="text-[11px] text-[#5f6368] dark:text-slate-400">
                                                                                                {formatPolicyDate(policy.fromDate)} tarihinden itibaren
                                                                                            </p>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 sm:border-l border-[#dadce0] dark:border-slate-700 pt-2.5 sm:pt-0 sm:pl-4 shrink-0">
                                                                <div className="text-right">
                                                                    <div className="text-[17px] font-bold text-[#1a73e8] dark:text-blue-400 leading-none">
                                                                        {currencySymbol}{Math.round(price).toLocaleString('tr-TR')}
                                                                    </div>
                                                                    <p className="text-[10.5px] text-[#5f6368] dark:text-slate-400 font-normal mt-0.5">
                                                                        Toplam Net Tutar
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectRateAndCheckout(rateItem, group)}
                                                                    disabled={!!bookingRateCode}
                                                                    className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[12.5px] font-medium rounded-full transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                                                                >
                                                                    {bookingRateCode === (rateItem.hubRateModel?.rateCode || rateItem.rateCode) ? (
                                                                        <>
                                                                            <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                                            <span>Seçiliyor...</span>
                                                                        </>
                                                                    ) : (
                                                                        <span>Odayı Seç</span>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {hasMoreRates && (
                                                    <button
                                                        onClick={() => setExpandedRates(prev => ({ ...prev, [group.name]: !prev[group.name] }))}
                                                        className="w-full py-2 text-center text-xs font-medium text-[#1a73e8] hover:bg-white dark:hover:bg-[#202124] rounded-lg border border-dashed border-[#dadce0] dark:border-slate-700 transition-colors cursor-pointer"
                                                    >
                                                        {isGroupExpanded ? 'Daha Az Fiyat Göster' : `+${group.rates.length - 4} Daha Fazla Fiyat Seçeneği Göster`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-[#dadce0] dark:border-slate-700 rounded-xl space-y-3">
                                <span className="material-symbols-outlined text-[40px] text-[#70757a]">hotel</span>
                                <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                    Başlangıç Fiyatı: {currencySymbol}{formattedPrice}
                                </h3>
                                <p className="text-[13px] text-[#5f6368] dark:text-slate-400 max-w-md mx-auto">
                                    Seçilen tarihler için tüm oda seçeneklerini ve detaylı iptal koşullarını tam otel detay sayfasından inceleyebilirsiniz.
                                </p>
                                <Link
                                    to={detailUrl}
                                    className="inline-block px-6 py-2.5 bg-[#1a73e8] text-white text-[13px] font-medium rounded-full hover:bg-[#1557b0] transition-colors shadow-sm"
                                >
                                    Tüm Odaları İncele
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* ──────────────────────────────────────
                    TAB 3: FOTOĞRAFLAR (PHOTOS)
                ────────────────────────────────────── */}
                {activeTab === 'photos' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-1 border-b border-[#dadce0] dark:border-slate-700">
                            <div>
                                <h2 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                    Tesis Fotoğrafları
                                </h2>
                                <p className="text-[12px] text-[#5f6368] dark:text-slate-400">
                                    Toplam {images.length} fotoğraf
                                </p>
                            </div>
                            <span className="text-[12px] text-[#5f6368] dark:text-slate-400">
                                Büyütmek için fotoğrafa tıklayın
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setLightboxIndex(idx)}
                                    className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer bg-slate-100 dark:bg-slate-800 border border-[#dadce0] dark:border-slate-700"
                                >
                                    <img
                                        src={img}
                                        alt={`${currentHotel.name} - ${idx + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={e => { e.target.src = placeholderHotel; }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="material-symbols-outlined text-white text-[28px] drop-shadow-md">zoom_in</span>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded">
                                        {idx + 1} / {images.length}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ──────────────────────────────────────
                    TAB 4: HAKKINDA (ABOUT)
                ────────────────────────────────────── */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        {/* Hotel Descriptions */}
                        <div className="space-y-3">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                Tesis Hakkında
                            </h3>
                            {currentHotel.descriptions && currentHotel.descriptions.length > 0 ? (
                                currentHotel.descriptions.map((desc, idx) => (
                                    <div key={idx} className="space-y-1">
                                        {desc.type && (
                                            <h4 className="text-[11px] font-semibold uppercase text-[#1a73e8] tracking-wider">
                                                {desc.type}
                                            </h4>
                                        )}
                                        <p 
                                            className="text-[13.5px] text-[#3c4043] dark:text-slate-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: desc.text }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p 
                                    className="text-[13.5px] text-[#3c4043] dark:text-slate-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: currentHotel.description || "Travel of Globe garantili tesisimizde konforlu ve eşsiz bir konaklama deneyimi sizleri bekliyor." 
                                    }}
                                />
                            )}
                        </div>

                        {/* Check-In / Check-Out Policies */}
                        <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                Giriş & Çıkış Kuralları
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">login</span>
                                    </div>
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">Giriş Saati</span>
                                        <p className="text-[14px] font-medium text-[#202124] dark:text-white">
                                            {currentHotel.checkIn || '14:00'}'ten itibaren
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 flex items-center gap-3">
                                    <div className="size-9 rounded-lg bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">logout</span>
                                    </div>
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">Çıkış Saati</span>
                                        <p className="text-[14px] font-medium text-[#202124] dark:text-white">
                                            {currentHotel.checkOut || '12:00'}'ye kadar
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All Hotel Facilities / Amenities */}
                        <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                Tesis Olanakları & Hizmetleri
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                {(currentHotel.facilities && currentHotel.facilities.length > 0) ? (
                                    currentHotel.facilities.map((fac, fIdx) => {
                                        const id = typeof fac === 'object' ? (fac.facilityId || fac.id) : fac;
                                        const match = FACILITY_ICON_MAP[Number(id)];
                                        const label = fac.names?.tr || fac.names?.en || fac.label || (match ? match.label : 'Tesis Hizmeti');
                                        const icon = match ? match.icon : 'done';

                                        return (
                                            <div key={fIdx} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                                <div className="size-7 rounded-md bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                                                </div>
                                                <span className="text-[12.5px] text-[#3c4043] dark:text-slate-200 truncate">{label}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    [
                                        { icon: 'wifi', label: 'Ücretsiz Yüksek Hızlı WiFi' },
                                        { icon: 'pool', label: 'Yüzme Havuzu' },
                                        { icon: 'spa', label: 'Spa & Sağlık Merkezi' },
                                        { icon: 'local_parking', label: 'Otopark / Vale Hizmeti' },
                                        { icon: 'restaurant', label: 'A la Carte & Açık Büfe Restoran' },
                                        { icon: 'fitness_center', label: 'Fitness & Spor Salonu' },
                                        { icon: 'room_service', label: '24 Saat Oda Servisi' },
                                        { icon: 'dry_cleaning', label: 'Kuru Temizleme & Çamaşırhane' }
                                    ].map((fac, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-2.5 p-2 rounded-lg bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700">
                                            <div className="size-7 rounded-md bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[16px]">{fac.icon}</span>
                                            </div>
                                            <span className="text-[12.5px] text-[#3c4043] dark:text-slate-200 truncate">{fac.label}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Location & Contact */}
                        <div className="space-y-3 pt-2 border-t border-[#dadce0] dark:border-slate-700">
                            <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                Konum & İletişim Detayları
                            </h3>
                            <div className="p-4 rounded-xl bg-[#f8f9fa] dark:bg-[#303134] border border-[#dadce0] dark:border-slate-700 space-y-3">
                                <div>
                                    <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">Adres</span>
                                    <p className="text-[13px] font-normal text-[#202124] dark:text-white mt-0.5">
                                        {currentHotel.address?.street 
                                            ? `${currentHotel.address.street}, ${currentHotel.address.cityName || ''}, ${currentHotel.address.countryName || ''}`
                                            : (currentHotel.address || currentHotel.city || 'İstanbul, Türkiye')}
                                    </p>
                                </div>

                                {currentHotel.contact?.phoneNumber && (
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">Telefon</span>
                                        <a href={`tel:${currentHotel.contact.phoneNumber}`} className="text-[13px] font-medium text-[#1a73e8] hover:underline">
                                            {currentHotel.contact.phoneNumber}
                                        </a>
                                    </div>
                                )}

                                {currentHotel.contact?.email && (
                                    <div>
                                        <span className="text-[10.5px] font-medium text-[#5f6368] uppercase tracking-wider block">E-Posta</span>
                                        <a href={`mailto:${currentHotel.contact.email}`} className="text-[13px] font-medium text-[#1a73e8] hover:underline">
                                            {currentHotel.contact.email}
                                        </a>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <a
                                        href={directionsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] text-white rounded-lg text-[12.5px] font-medium hover:bg-[#1557b0] transition-colors shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[17px]">directions</span>
                                        <span>Google Haritalar'da Yol Tarifi Al</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════
                4. PHOTO LIGHTBOX MODAL
            ══════════════════════════════════════════ */}
            {lightboxIndex !== null && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
                        }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                    </button>

                    <div className="max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
                        <img 
                            src={images[lightboxIndex]} 
                            alt={`${currentHotel.name} - ${lightboxIndex + 1}`}
                            className="max-w-full max-h-[80vh] object-contain"
                        />
                        <div className="text-center text-white/80 text-sm mt-3 font-medium">
                            {lightboxIndex + 1} / {images.length}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex((lightboxIndex + 1) % images.length);
                        }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                        <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(HotelQuickLookDrawer);
