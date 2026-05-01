import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { mockHotels } from '../data/mockHotels';
import NationalitySelect from '../components/NationalitySelect';
import { hotelService } from '../services/hotelService';
import { useToast } from '../context/ToastContext';
import { parseGuestsParam, serializeGuestsParam } from '../utils/searchParamsUtils';

const ImageLightbox = ({ images, currentIndex, isOpen, onClose, setCurrentIndex }) => {
    const handlePrevious = useCallback((e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length, setCurrentIndex]);

    const handleNext = useCallback((e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length, setCurrentIndex]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, handlePrevious, handleNext, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <div className="text-white/70 font-black tracking-widest text-xs uppercase">
                    {currentIndex + 1} / {images.length} Photos
                </div>
                <button
                    onClick={onClose}
                    className="size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group"
                >
                    <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">close</span>
                </button>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={handlePrevious}
                className="absolute left-6 size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group z-20 border border-white/5"
            >
                <span className="material-symbols-outlined text-4xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
            </button>

            <button
                onClick={handleNext}
                className="absolute right-6 size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group z-20 border border-white/5"
            >
                <span className="material-symbols-outlined text-4xl group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-12 md:p-24 pb-32 md:pb-40" onClick={(e) => e.stopPropagation()}>
                <img
                    src={images[currentIndex]}
                    className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-500"
                    alt={`Photo ${currentIndex + 1}`}
                />
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center px-6 z-30" onClick={(e) => e.stopPropagation()}>
                <div className="bg-black/40 backdrop-blur-xl p-3 rounded-3xl border border-white/10 flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`size-16 md:size-20 shrink-0 rounded-xl overflow-hidden transition-all duration-300 border-2 ${idx === currentIndex ? 'border-primary scale-110 shadow-[0_0_20px_rgba(255,59,92,0.4)]' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        >
                            <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BookingConfirmationModal = ({ isOpen, onClose, hotelName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 text-center border border-white/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
                <div className="size-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 ring-8 ring-emerald-50/50 dark:ring-emerald-900/10">
                    <span className="material-symbols-outlined text-5xl animate-bounce-slow">check_circle</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Booking Confirmed!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                    Great choice! Your reservation at <br /> <span className="text-slate-900 dark:text-white font-black">{hotelName}</span> <br /> has been successfully secured.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Download Voucher
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


const HotelDetail = () => {
    const getCurrencySymbol = (code) => {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'TRY': '₺',
            'AED': 'د.إ',
            'SAR': 'ر.س',
        };
        return symbols[code] || code || '$';
    };

    const formatPolicyDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            // Remove timezone info like [Asia/Shanghai] if present for basic parsing
            const cleanDate = dateStr.split('[')[0];
            const date = new Date(cleanDate);
            return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return dateStr;
        }
    };

    const { slug } = useParams();
    const id = slug; // Map the route parameter (which matches hotel/:slug) to id
    const [searchParams] = useSearchParams();
    const { error: toastError } = useToast();
    const navigate = useNavigate();

    const [dynamicHotel, setDynamicHotel] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRoomsLoading, setIsRoomsLoading] = useState(false);
    const [error, setError] = useState(null);

    const images = dynamicHotel?.images?.map(img => img.url) || (dynamicHotel?.image ? [dynamicHotel.image] : []);

    // -- Lightbox State --
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState([]);

    const openLightbox = (index, contextImages = images) => {
        setLightboxImages(contextImages);
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    // -- Search State Initialization --
    const parseDateParam = (param) => {
        if (!param) return null;
        // Support both yyyy-mm-dd (ISO) and dd-mm-yyyy
        if (/^\d{4}-\d{2}-\d{2}$/.test(param)) {
            const [year, month, day] = param.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        const [day, month, year] = param.split('-').map(Number);
        if (day && month && year) {
            const date = new Date(year, month - 1, day);
            if (date instanceof Date && !isNaN(date.getTime())) return date;
        }
        return null;
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const [checkInDate, setCheckInDate] = useState(() => {
        return parseDateParam(searchParams.get('checkin')) || tomorrow;
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        return parseDateParam(searchParams.get('checkout')) || dayAfter;
    });

    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || 'TR';
    });

    const [roomState, setRoomState] = useState(() => {
        const guestsParam = searchParams.get('guests');
        return parseGuestsParam(guestsParam);
    });

    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);
    const lastFetchRef = useRef('');

    // Computed totals
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    const [activeTab, setActiveTab] = useState('Rooms & Rates');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [isCheckingRates, setIsCheckingRates] = useState(false);

    // Fetch data when search parameters or hotel ID change
    useEffect(() => {
        const fetchKey = `${id}-${searchParams.toString()}`;
        if (lastFetchRef.current === fetchKey) return;
        lastFetchRef.current = fetchKey;

        // Clear previous selection when a new search is initiated
        setSelectedRooms([]);

        const fetchCheckIn = parseDateParam(searchParams.get('checkin')) || tomorrow;
        const fetchCheckOut = parseDateParam(searchParams.get('checkout')) || dayAfter;
        const fetchNationality = searchParams.get('nationality') || 'TR';
        const fetchRooms = parseGuestsParam(searchParams.get('guests'));

        // Sync local state with URL params
        setCheckInDate(fetchCheckIn);
        setCheckOutDate(fetchCheckOut);
        setNationality(fetchNationality);
        setRoomState(fetchRooms);

        const fetchData = async () => {
            console.log('Fetching detailed room data for hotel:', id, { checkin: fetchCheckIn, checkout: fetchCheckOut });
            
            // If we already have hotel data, only show loading for rooms
            if (dynamicHotel) {
                setIsRoomsLoading(true);
            } else {
                setIsLoading(true);
            }
            
            setError(null);
            try {
                const response = await hotelService.searchRooms({
                    hotelId: id,
                    searchCriteria: {
                        checkin: fetchCheckIn,
                        checkout: fetchCheckOut,
                        nationality: fetchNationality,
                        rooms: fetchRooms
                    }
                });

                if (response?.data?.content?.length > 0) {
                    setDynamicHotel(response.data.content[0]);
                } else if (response?.data?.content) {
                    setError('Hotel not found or no rooms available for selected dates.');
                }
            } catch (err) {
                console.error('Error fetching hotel details:', err);
                setError('Failed to fetch hotel details. Please try again later.');
            } finally {
                setIsLoading(false);
                setIsRoomsLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, searchParams]);

    const hotel = dynamicHotel || {};

    const nights = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return 1;
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, [checkInDate, checkOutDate]);

    const toggleRoomSelection = (roomType, rate, roomName) => {
        setSelectedRooms(prev => {
            const index = prev.findIndex(r => r.type === roomType && r.name === roomName);
            if (index > -1) {
                // Remove if already selected
                return prev.filter((_, i) => i !== index);
            } else {
                // Add to selection
                return [...prev, { type: roomType, rate, name: roomName }];
            }
        });
    };

    // -- Handlers --
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (guestWrapperRef.current && !guestWrapperRef.current.contains(event.target)) {
                setShowGuestDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDateForUrl = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleSearch = () => {
        const guestsParam = serializeGuestsParam(roomState);
        const params = new URLSearchParams();
        params.set('checkin', formatDateForUrl(checkInDate));
        params.set('checkout', formatDateForUrl(checkOutDate));
        params.set('guests', guestsParam);
        params.set('nationality', nationality);
        params.set('q', hotel.names?.tr || hotel.names?.en || hotel.name || '');

        // Keep current path but update search params
        navigate(`${window.location.pathname}?${params.toString()}`);
    };

    const handleBreadcrumbClick = (locationId, name) => {
        const params = new URLSearchParams(searchParams);
        params.set('locationId', locationId);
        params.set('q', name);
        navigate(`/hotels?${params.toString()}`);
    };

    const isRequestingRef = useRef(false);

    const handleInstantReservation = async () => {
        if (isRequestingRef.current || isCheckingRates) return;
        if (selectedRooms.length > 0) {
            isRequestingRef.current = true;
            setIsCheckingRates(true);
            try {
                const checkRatesRequest = {
                    rooms: selectedRooms.map(room => ({
                        rateCode: room.hubRateModel?.rateCode || room.rateCode || ''
                    }))
                };

                const response = await hotelService.checkRates(checkRatesRequest);
                console.log('Check rates response:', response);
                
                const checkRatesList = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : []);
                const firstHotel = checkRatesList[0] || {};
                const firstRoom = firstHotel?.rooms?.[0] || {};
                const firstRate = firstRoom?.rates?.[0] || {};
                const rateSearchUuid = response?.rateSearchUuid || firstHotel?.rateSearchUuid || '';
                
                console.log('Obtained rateSearchUuid:', rateSearchUuid);

                const concatRateCodes = (selectedRooms || [])
                    .map(r => r.hubRateModel?.rateCode || r.rateCode || '')
                    .sort()
                    .join('_');

                const encoder = new TextEncoder();
                const data = encoder.encode(concatRateCodes);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                const sid = hashHex.substring(0, 16);

                const isoCheckIn = checkInDate instanceof Date ? checkInDate.toISOString() : new Date(checkInDate).toISOString();
                const isoCheckOut = checkOutDate instanceof Date ? checkOutDate.toISOString() : new Date(checkOutDate).toISOString();

                navigate(`/hotel/checkout/guests?sessionId=${sid}`, {
                    state: {
                        selectedRooms,
                        hotel,
                        roomState,
                        checkInDate: isoCheckIn,
                        checkOutDate: isoCheckOut,
                        totalPrice: selectedRooms.reduce((sum, r) => sum + r.rate, 0),
                        nights,
                        rateSearchUuid: rateSearchUuid, // Pass the UUID obtained from checkRates
                        checkRatesData: firstRate // Pass rate details directly to prevent duplicate fetch
                    }
                });
            } catch (err) {
                console.error('Check rates failed:', err);
                toastError('Rate check failed. The price might have changed or the room is no longer available.');
            } finally {
                setIsCheckingRates(false);
                isRequestingRef.current = false;
            }
        }
    };

    const updateRoom = (index, field, value) => {
        const newRooms = [...roomState];
        newRooms[index] = { ...newRooms[index], [field]: value };
        if (field === 'children') {
            const diff = value - newRooms[index].childAges.length;
            if (diff > 0) newRooms[index].childAges = [...newRooms[index].childAges, ...Array(diff).fill(0)];
            else if (diff < 0) newRooms[index].childAges = newRooms[index].childAges.slice(0, value);
        }
        setRoomState(newRooms);
    };

    const updateChildAge = (roomIndex, childIndex, age) => {
        const newRooms = [...roomState];
        const newAges = [...newRooms[roomIndex].childAges];
        newAges[childIndex] = parseInt(age);
        newRooms[roomIndex].childAges = newAges;
        setRoomState(newRooms);
    };

    const addRoom = () => {
        if (roomState.length < 5) setRoomState([...roomState, { adults: 2, children: 0, childAges: [] }]);
    };

    const removeRoom = (index) => {
        if (roomState.length > 1) setRoomState(roomState.filter((_, i) => i !== index));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="size-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Finding the best rates...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
                <div className="size-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mb-6">
                    <span className="material-symbols-outlined text-5xl">warning</span>
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">Oops! Something went wrong</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/30"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const tabs = ['Rooms & Rates', 'Overview', 'Amenities', 'Transportation', 'Policies', 'Reviews'];

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            <Header />

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {hotel.locationBreadcrumbs?.map((bc, i) => {
                            const name = bc.name?.translations?.tr || bc.name?.translations?.en || bc.name?.defaultName;
                            return (
                                <React.Fragment key={bc.locationId}>
                                    <button
                                        onClick={() => handleBreadcrumbClick(bc.locationId, name)}
                                        className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {name}
                                    </button>
                                    {i < hotel.locationBreadcrumbs.length - 1 && (
                                        <span className="material-symbols-outlined text-xs text-slate-300">chevron_right</span>
                                    )}
                                </React.Fragment>
                            );
                        }) || <Breadcrumbs />}
                    </div>
                    <Link to={`/hotels?${searchParams.toString()}`} className="flex items-center gap-1.5 text-sm font-bold text-primary group">
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Search
                    </Link>
                </div>

                {/* Hotel Title & Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black tracking-tight">{hotel.names?.tr || hotel.names?.en || hotel.name}</h1>
                            <div className="flex text-amber-400">
                                {[...Array(hotel.hotelStar?.star || 5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined fill-1 text-lg">star</span>
                                ))}
                            </div>
                            <span className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm border border-emerald-200/20">
                                <span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                <span className="font-semibold text-sm">
                                    {hotel.address ? `${hotel.address.street}, ${hotel.address.cityName}` : hotel.location}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 py-1.5 px-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
                                    <span className="material-symbols-outlined text-xs text-primary">login</span>
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">In:</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{hotel.checkIn || '15:00'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs text-primary">logout</span>
                                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Out:</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{hotel.checkOut || '11:00'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/map?${searchParams.toString()}&hotelIds=${hotel.id}`)}
                                className="text-primary text-sm font-bold hover:underline">
                                Show on Map
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{hotel.ratingLabel}</span>
                            <span className="text-xs text-slate-500 font-bold mt-1">1,240 reviews</span>
                            <span className="text-[10px] text-primary font-black flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                <span className="material-symbols-outlined text-xs fill-1">trending_up</span> Highly Popular
                            </span>
                        </div>
                        <div className="bg-primary text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg shadow-primary/20">
                            <span className="text-2xl leading-none">{hotel.rating}</span>
                            <span className="text-[10px] opacity-70">/10</span>
                        </div>
                    </div>
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {(hotel.facilities?.slice(0, 5).map(f => f.names?.tr || f.names?.en) || ['Free WiFi', 'Free Parking', 'Breakfast Available']).map((item, i) => (
                        <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-default backdrop-blur-md shadow-sm">
                            <span className="material-symbols-outlined text-sm text-primary">check_circle</span> {item}
                        </span>
                    ))}
                </div>

                {/* Benton Grid Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[540px] mb-8 overflow-hidden rounded-[32px] relative group/gallery">
                    <div className="md:col-span-2 md:row-span-2 relative overflow-hidden ring-1 ring-white/10 shadow-2xl cursor-pointer" onClick={() => openLightbox(0, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[0]} alt={hotel.name} />
                        <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black shadow-2xl border border-white/20">
                            1 / {images.length} Photos
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(1, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[1] || images[0]} alt="" />
                        <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover/gallery:translate-y-0 group-hover/gallery:opacity-100 transition-all duration-500">
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}><span className="material-symbols-outlined text-xl">favorite</span></button>
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}><span className="material-symbols-outlined text-xl">share</span></button>
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(2, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[2] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(3, images)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[3] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 group/viewall cursor-pointer" onClick={() => openLightbox(0, images)}>
                        <img className="w-full h-full object-cover group-hover/viewall:scale-110 blur-[2px] transition-all duration-700" src={images[4] || images[0]} alt="" />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-4">
                            <span className="material-symbols-outlined text-4xl mb-2 animate-bounce-slow">photo_library</span>
                            <span className="text-sm font-black uppercase tracking-widest">Show All Photos</span>
                        </div>
                    </div>
                </div>


                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
                        {/* Compact Search Bar - Now aligned with room cards */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-[24px] shadow-md grid grid-cols-1 md:grid-cols-10 gap-2 mb-6 h-[72px]">
                            <div className="md:col-span-4 relative group">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50 px-4 rounded-xl cursor-pointer transition-all h-full" onClick={() => datePickerRef.current?.setOpen(true)}>
                                    <span className="material-symbols-outlined text-primary text-xl shrink-0">calendar_month</span>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center justify-between w-full mb-0.5">
                                            <label className="text-[8px] uppercase tracking-wider font-bold text-slate-400">Check-in / Out</label>
                                            {checkInDate && checkOutDate && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 animate-in fade-in zoom-in duration-300">
                                                    <span className="material-symbols-outlined text-[12px] leading-none">bedtime</span>
                                                    <span className="text-[9px] font-black uppercase tracking-tight">
                                                        {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} nights
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <DatePicker
                                            ref={datePickerRef}
                                            selected={checkInDate}
                                            onChange={(dates) => {
                                                const [start, end] = dates;
                                                setCheckInDate(start);
                                                setCheckOutDate(end);
                                            }}
                                            startDate={checkInDate}
                                            endDate={checkOutDate}
                                            selectsRange
                                            minDate={new Date()}
                                            maxDate={checkInDate && !checkOutDate ? new Date(checkInDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null}
                                            monthsShown={2}
                                            locale="en-GB"
                                            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full p-0 text-[13px] font-black text-slate-900 dark:text-white cursor-pointer whitespace-nowrap"
                                            wrapperClassName="w-full"
                                            dateFormat="dd MMM yyyy"
                                            calendarClassName="shadow-2xl border-none font-sans mt-4"
                                            popperPlacement="bottom-start"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-3 relative group/guest" ref={guestWrapperRef}>
                                <button
                                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                                    className="w-full h-full flex items-center gap-3 px-4 bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all text-left"
                                >
                                    <span className="material-symbols-outlined text-primary text-xl shrink-0 group-hover/guest:scale-110 transition-transform">group</span>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <label className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Guests & Rooms</label>
                                        <span className="text-[13px] font-black text-slate-900 dark:text-white whitespace-nowrap block truncate">
                                            {totalAdults} Adults, {totalChildren} Child
                                        </span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-lg group-hover/guest:translate-y-0.5 transition-transform">expand_more</span>
                                </button>

                                {showGuestDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-2xl p-5 z-[100] max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
                                        {roomState.map((room, index) => (
                                            <div key={index} className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:mb-0 last:pb-0 last:border-0">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Room {index + 1}</div>
                                                    {roomState.length > 1 && (
                                                        <button onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 text-[9px] font-black uppercase tracking-widest">Remove</button>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-xs font-black uppercase tracking-tight">Adults</div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">remove</span></button>
                                                        <span className="w-4 text-center text-xs font-black">{room.adults}</span>
                                                        <button onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">add</span></button>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="text-xs font-black uppercase tracking-tight">Children</div>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">remove</span></button>
                                                        <span className="w-4 text-center text-xs font-black">{room.children}</span>
                                                        <button onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))} className="size-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-base">add</span></button>
                                                    </div>
                                                </div>

                                                {room.children > 0 && (
                                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                                        {room.childAges.map((age, ageIdx) => (
                                                            <div key={ageIdx} className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase text-slate-400">Child {ageIdx + 1} Age</label>
                                                                <select
                                                                    value={age}
                                                                    onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                                    className="w-full h-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] px-1 font-black focus:border-primary focus:ring-0"
                                                                >
                                                                    {[...Array(18)].map((_, i) => <option key={i} value={i}>{i} yr</option>)}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {roomState.length < 5 && (
                                            <button
                                                onClick={addRoom}
                                                className="w-full py-3 mt-2 bg-primary/5 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-dashed border-primary/20 flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                                Add Another Room
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 relative group/nat">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 px-3 rounded-xl transition-all h-full">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <label className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Nationality</label>
                                        <NationalitySelect
                                            value={nationality}
                                            onChange={setNationality}
                                            compact={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-1 h-full">
                                <button
                                    onClick={handleSearch}
                                    className="w-full h-full bg-primary text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center group"
                                >
                                    <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">search</span>
                                </button>
                            </div>
                        </div>
                        {/* Tab Bar Container */}
                        <div className="relative">
                            {/* Sticky Tab Bar */}
                            <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-[64px] bg-background-light dark:bg-background-dark z-20 overflow-x-auto no-scrollbar py-2 transition-all duration-300">
                                {tabs.map((tab, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-4 text-sm font-black whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Tab Content */}
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {activeTab === 'Rooms & Rates' && (
                                    <div className="relative space-y-4">
                                        {isRoomsLoading ? (
                                            // Skeleton loading cards
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="flex flex-col md:flex-row rounded-[28px] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-xl overflow-hidden">
                                                        {/* Image skeleton */}
                                                        <div className="md:w-64 h-52 md:h-auto shrink-0 relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px]">
                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15}s` }}></div>
                                                        </div>
                                                        {/* Content skeleton */}
                                                        <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                                                            <div className="space-y-3">
                                                                {/* Title */}
                                                                <div className="relative overflow-hidden h-7 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-xl">
                                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15}s` }}></div>
                                                                </div>
                                                                {/* Subtitle */}
                                                                <div className="relative overflow-hidden h-4 w-2/5 bg-slate-100 dark:bg-slate-700/60 rounded-lg">
                                                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15 + 0.1}s` }}></div>
                                                                </div>
                                                                {/* Attribute tags */}
                                                                <div className="flex gap-2 mt-2">
                                                                    {[40, 56, 44, 36].map((w, j) => (
                                                                        <div key={j} className={`relative overflow-hidden h-6 bg-slate-100 dark:bg-slate-700/60 rounded-xl`} style={{ width: `${w}px` }}>
                                                                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15 + j * 0.05}s` }}></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* Price bar skeleton */}
                                                            <div className="relative overflow-hidden h-14 w-full bg-slate-100 dark:bg-slate-800/60 rounded-[18px]">
                                                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" style={{ animationDelay: `${i * 0.15 + 0.2}s` }}></div>
                                                                {/* Inner price placeholders */}
                                                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="size-8 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
                                                                        <div className="space-y-1.5">
                                                                            <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                                                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="space-y-1 text-right">
                                                                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                                                                            <div className="h-2 w-14 bg-slate-200 dark:bg-slate-700 rounded-md ml-auto"></div>
                                                                        </div>
                                                                        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Loading label */}
                                                <div className="flex items-center justify-center gap-3 py-2">
                                                    <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching best rates...</p>
                                                </div>
                                            </div>
                                        ) : (
                                        <>{(hotel.rooms || []).map((roomItem, roomIndex) => {
                                            const roomName = roomItem.names?.tr || roomItem.names?.en || roomItem.names?.defaultName || 'Standard Room';
                                            const roomPrice = roomItem.hubRateModel?.price?.totalPaymentAmount || roomItem.hubRateModel?.price?.calculatedAmount || roomItem.price || 0;
                                            const currency = roomItem.hubRateModel?.price?.currency || '$';
                                            const isSelected = selectedRooms.some(r => r.name === roomName && r.roomIndex === roomIndex);

                                            return (
                                                <div key={roomIndex} className="relative group transition-all duration-500">
                                                    {/* Glow effect for selected state */}
                                                    {isSelected && (
                                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-[36px] blur-xl opacity-100 transition-opacity duration-500"></div>
                                                    )}

                                                    <div className={`relative flex flex-col md:flex-row rounded-[28px] transition-all duration-500 border ${isSelected ? 'border-primary shadow-[0_0_40px_rgba(255,59,92,0.15)] bg-white/60 dark:bg-slate-900/60' : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40'} backdrop-blur-3xl group-hover:bg-white/50 dark:group-hover:bg-slate-900/50 shadow-2xl shadow-black/5 z-10 hover:z-[60]`}>
                                                        {/* Image Section */}
                                                        <div 
                                                            className="md:w-64 h-52 md:h-auto relative overflow-hidden shrink-0 cursor-pointer group/room rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px] isolation-isolate z-0" 
                                                            style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)', maskImage: 'radial-gradient(white, black)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                                                            onClick={() => {
                                                                const roomImages = roomItem.images?.length > 0 
                                                                    ? roomItem.images.map(img => img.url) 
                                                                    : images; // Fallback to hotel images if room has none
                                                                openLightbox(0, roomImages);
                                                            }}
                                                        >
                                                            <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px] will-change-transform" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} src={roomItem.images?.[0]?.url || images[roomIndex % images.length]} alt="" />
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/room:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[4px] rounded-t-[28px] md:rounded-tr-none md:rounded-l-[28px] will-change-transform" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                                                                <div className="size-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white scale-75 group-hover/room:scale-100 transition-all duration-500 shadow-2xl">
                                                                    <span className="material-symbols-outlined text-3xl">fullscreen</span>
                                                                </div>
                                                            </div>
                                                            {roomItem.images?.length > 0 && (
                                                                <div className="absolute top-5 left-5 bg-black/40 backdrop-blur-xl text-white text-[10px] font-black px-3.5 py-2 rounded-2xl flex items-center gap-2 border border-white/20 shadow-lg">
                                                                    <span className="material-symbols-outlined text-sm">photo_library</span> {roomItem.images.length} PHOTOS
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Details Section */}
                                                        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between min-w-0 rounded-b-[28px] md:rounded-bl-none md:rounded-r-[28px]">
                                                            <div className="relative">
                                                                <div className="absolute top-0 right-0">
                                                                    <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border border-orange-500/10 backdrop-blur-md whitespace-nowrap">
                                                                        {roomItem.roomPaxCapacity || roomItem.maxAdult} Pax
                                                                    </span>
                                                                </div>

                                                                <div className="mb-4 pr-16 sm:pr-20">
                                                                    <h3 className="text-xl sm:text-2xl font-black mb-1 uppercase tracking-tight text-slate-900 dark:text-white leading-tight truncate">{roomName}</h3>
                                                                    <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                                                                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase">
                                                                            <span className="material-symbols-outlined text-sm text-primary">group</span> {roomItem.maxAdult} Adults
                                                                        </span>
                                                                        {roomItem.maxChildren > 0 && (
                                                                            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase">
                                                                                <span className="material-symbols-outlined text-sm text-primary">child_care</span> {roomItem.maxChildren} Children
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1.5 mb-6 sm:mb-8">
                                                                     {(roomItem.attributes || []).slice(0, 6).map((attr, i) => (
                                                                         <span key={i} className="px-2.5 py-1 bg-slate-500/5 dark:bg-white/5 border border-slate-500/10 dark:border-white/10 rounded-xl text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight transition-colors cursor-default">
                                                                             {attr.names?.tr || attr.names?.en || attr.label || 'Feature'}
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                            </div>

                                                            {/* Price Area */}
                                                            <div
                                                                onClick={() => {
                                                                    if (roomPrice <= 0 && !isSelected) return;
                                                                    const cancellationPolicies = roomItem.hubRateModel?.price?.cancellationPolicies || [];
                                                                    const roomData = { 
                                                                        type: roomName, 
                                                                        rate: roomPrice, 
                                                                        name: roomName, 
                                                                        roomIndex, 
                                                                        currency, 
                                                                        cancellationPolicies,
                                                                        hubRateModel: roomItem.hubRateModel 
                                                                    };
                                                                    setSelectedRooms(prev => {
                                                                        const index = prev.findIndex(r => r.name === roomName && r.roomIndex === roomIndex);
                                                                        if (index > -1) return prev.filter((_, i) => i !== index);
                                                                        return [...prev, roomData];
                                                                    });
                                                                }}
                                                                className={`relative p-1.5 sm:p-2.5 rounded-[18px] flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 group/rate transition-all duration-500 border ${roomPrice > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} shadow-lg ${isSelected ? 'bg-primary/5 border-primary ring-2 ring-primary/5' : 'bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-white/10 hover:border-primary/50'}`}
                                                            >
                                                                <div className="flex items-center gap-2 z-10 w-full sm:w-auto">
                                                                    <div className={`size-7 sm:size-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                                        <span className="material-symbols-outlined text-sm sm:text-base font-black">{isSelected ? 'check' : 'add'}</span>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1 sm:flex-none">
                                                                        <div className="flex items-center gap-1 mb-0.5">
                                                                            <p className="font-black text-[9px] uppercase tracking-wide text-slate-900 dark:text-white truncate">B2B RATE</p>
                                                                            {isSelected && (
                                                                                <span className="bg-primary text-white text-[6px] font-black px-1.5 py-0.5 rounded-full shrink-0">SELECTED</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[7px] tracking-tight">
                                                                            <div className="group/cancel relative">
                                                                                <span className={`${roomItem.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0 ? 'text-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-orange-500/80'} cursor-help underline decoration-dotted underline-offset-2 transition-all hover:text-primary`}>
                                                                                    {roomItem.hubRateModel?.price?.cancellationPolicies?.[0]?.amount === 0 ? 'FREE CANCEL' : 'POLICIES APPLY'}
                                                                                </span>
                                                                                {/* Detailed Cancellation Tooltip */}
                                                                                <div className="absolute bottom-full left-0 mb-3 w-72 p-5 bg-slate-900 dark:bg-slate-950 text-white rounded-[24px] shadow-2xl opacity-0 invisible group-hover/cancel:opacity-100 group-hover/cancel:visible transition-all z-50 border border-slate-700/50 backdrop-blur-xl scale-95 group-hover/cancel:scale-100 origin-bottom-left duration-300">
                                                                                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                                                                                        <span className="material-symbols-outlined text-sm text-primary">event_busy</span>
                                                                                        <p className="text-[10px] uppercase font-black tracking-widest">Cancellation Timeline</p>
                                                                                    </div>
                                                                                    <div className="space-y-4">
                                                                                        {roomItem.hubRateModel?.price?.cancellationPolicies?.length > 0 ? (
                                                                                            roomItem.hubRateModel.price.cancellationPolicies.map((policy, idx) => (
                                                                                                <div key={idx} className="relative pl-4 border-l-2 border-slate-800 hover:border-primary transition-colors">
                                                                                                    <div className="flex justify-between items-start mb-1.5">
                                                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Penalty</span>
                                                                                                        <span className={`text-[11px] font-black ${policy.amount === 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                                                                            {policy.currency} {policy.amount}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div className="space-y-1">
                                                                                                        <div className="flex items-center gap-1.5">
                                                                                                            <span className="material-symbols-outlined text-[10px] text-slate-500">calendar_today</span>
                                                                                                            <p className="text-[9px] text-slate-300 font-bold">{formatPolicyDate(policy.fromDate)}</p>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-1.5">
                                                                                                            <span className="material-symbols-outlined text-[10px] text-slate-500">keyboard_tab</span>
                                                                                                            <p className="text-[9px] text-slate-400 font-medium italic">{formatPolicyDate(policy.toDate)}</p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))
                                                                                        ) : (
                                                                                            <p className="text-[10px] text-slate-500 font-medium italic">Standard property policies apply.</p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                                                                                        <span className="material-symbols-outlined text-xs text-slate-500">info</span>
                                                                                        <p className="text-[8px] text-slate-500 font-bold italic uppercase tracking-tighter">All times are in property local time.</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <span>• ROOM ONLY</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 sm:gap-3 z-10 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-1.5 sm:pt-0 sm:pl-3 justify-between sm:justify-end">
                                                                    <div className="text-right">
                                                                        <div className="flex items-baseline justify-end gap-0.5">
                                                                            <span className="text-[9px] font-black text-primary">{currency}</span>
                                                                            <p className="text-lg sm:text-xl font-black text-primary leading-none tracking-tighter">
                                                                                {roomPrice.toFixed(2)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="group/taxes relative inline-block">
                                                                            <p className="text-[6px] text-slate-400 font-bold uppercase tracking-widest leading-none cursor-help hover:text-primary transition-colors flex items-center justify-end gap-1">
                                                                                TOTAL STAY <span className="material-symbols-outlined text-[8px]">info</span>
                                                                            </p>
                                                                            {/* Taxes & Fees Breakdown Tooltip */}
                                                                            {(roomItem.hubRateModel?.price?.taxes?.length > 0 || roomItem.hubRateModel?.price?.fees?.length > 0) && (
                                                                                <div className="absolute bottom-full right-0 mb-3 w-60 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/taxes:opacity-100 group-hover/taxes:visible transition-all z-50 backdrop-blur-xl scale-95 group-hover/taxes:scale-100 origin-bottom-right duration-300">
                                                                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em] border-b dark:border-slate-800 pb-2 flex items-center gap-2">
                                                                                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                                                                                        Tax & Fee Breakdown
                                                                                    </p>
                                                                                    <div className="space-y-2.5">
                                                                                        {roomItem.hubRateModel?.price?.taxes?.map((tax, idx) => (
                                                                                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                                                                                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{tax.type || 'Tax'}</span>
                                                                                                <span className="font-black text-slate-900 dark:text-white">{getCurrencySymbol(tax.currency)} {tax.amount}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                        {roomItem.hubRateModel?.price?.fees?.map((fee, idx) => (
                                                                                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                                                                                <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{fee.type || 'Fee'}</span>
                                                                                                <span className="font-black text-slate-900 dark:text-white">{getCurrencySymbol(fee.currency)} {fee.amount}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                        <div className="mt-3 pt-2 border-t dark:border-slate-800 flex justify-between items-center">
                                                                                            <span className="text-[9px] font-black uppercase text-primary">Inclusions Total</span>
                                                                                            <span className="text-xs font-black text-primary">
                                                                                                {getCurrencySymbol(currency)} {(
                                                                                                    (roomItem.hubRateModel.price.taxes?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0) +
                                                                                                    (roomItem.hubRateModel.price.fees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0)
                                                                                                ).toFixed(2)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {roomPrice > 0 ? (
                                                                        <div className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-[8px] uppercase tracking-wider transition-all duration-300 ${isSelected ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-primary text-white'}`}>
                                                                            {isSelected ? 'Remove' : 'Select'}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-black text-[8px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed">
                                                                            Sold Out
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Decorative Background Element */}
                                                            <div className={`absolute -right-4 -bottom-4 size-16 blur-2xl rounded-full transition-opacity duration-500 ${isSelected ? 'bg-primary/20 opacity-100' : 'bg-primary/10 opacity-0 group-hover/rate:opacity-100'}`}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}</>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'Overview' && (
                                    <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                                        <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">About the Property</h2>
                                        <div className="space-y-6">
                                            {hotel.descriptions?.length > 0 ? (
                                                hotel.descriptions.map((desc, idx) => (
                                                    <div key={idx} className="space-y-2">
                                                        <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{desc.type}</h4>
                                                        <p 
                                                            className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                                                            dangerouslySetInnerHTML={{ __html: desc.text }}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <p 
                                                    className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                                                    dangerouslySetInnerHTML={{ __html: hotel.description || "Experience the ultimate luxury at our TOG-certified property." }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Amenities' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                        {(hotel.facilities || []).map((amenity, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-primary/50 transition-all hover:shadow-lg group">
                                                <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-3xl">done_all</span>
                                                </div>
                                                <span className="font-black text-sm uppercase tracking-tight">{amenity.names?.tr || amenity.names?.en || amenity.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'Transportation' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                        {(hotel.transportations || []).map((t, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all group">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                                        <span className="material-symbols-outlined text-2xl">
                                                            {t.type === 'AIRPORT' ? 'flight_takeoff' : t.type === 'RAIL' ? 'train' : 'directions_car'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-sm uppercase tracking-tight">{t.name}</h4>
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.type}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-400">Distance:</span>
                                                        <span>{t.distanceKm} km</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-400">Duration:</span>
                                                        <span>{t.durationMinutes} min</span>
                                                    </div>
                                                    {t.directions && (
                                                        <p className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                                            Via {t.directions}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'Policies' && (
                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-2xl">info</span>
                                                </div>
                                                <h2 className="text-3xl font-black uppercase tracking-tight">Hotel Policies</h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                            <span className="material-symbols-outlined text-3xl">login</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Check-In</p>
                                                            <h4 className="text-2xl font-black text-primary">{hotel.checkIn || '15:00'}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                        Guests are required to show a photo identification and credit card upon check-in.
                                                    </p>
                                                </div>

                                                <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                            <span className="material-symbols-outlined text-3xl">logout</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Check-Out</p>
                                                            <h4 className="text-2xl font-black text-primary">{hotel.checkOut || '11:00'}</h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                        Please ensure your balance is settled and keys are returned to the front desk.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-8 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 flex items-start gap-4">
                                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                                <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                                                    Special requests are subject to availability and cannot be guaranteed. They may incur additional charges.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Reviews' && (
                                    <div className="bg-white dark:bg-slate-900/50 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                        <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6 font-black uppercase tracking-widest">
                                            R
                                        </div>
                                        <h3 className="text-xl font-black uppercase mb-2">Guest Reviews</h3>
                                        <p className="text-slate-500 font-medium tracking-tight">Real-time feedback from verified Travel of Globe guests.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Sidebar - Sticky Behavior Refined */}
                    <div className="lg:col-span-4 h-fit">
                        <div className="lg:sticky lg:top-[96px] space-y-6">
                            <div className="relative group/sidebar">
                                {/* Glass Background */}
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[40px] border border-white/40 dark:border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover/sidebar:shadow-[0_48px_96px_-16px_rgba(0,0,0,0.15)] group-hover/sidebar:bg-white/50 dark:group-hover/sidebar:bg-slate-900/50"></div>

                                {/* Content */}
                                <div className="relative p-8 z-10">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.07] pointer-events-none group-hover/sidebar:scale-110 transition-transform duration-700">
                                        <span className="material-symbols-outlined text-[140px]">hotel_class</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-primary font-black text-[10px] mb-6 uppercase tracking-[0.2em] bg-primary/5 dark:bg-primary/20 p-3 rounded-2xl border border-primary/10 backdrop-blur-md">
                                        <span className="material-symbols-outlined text-sm fill-1">bolt</span>
                                        Instant Confirmation Available
                                    </div>

                                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        Reservation Summary
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        {selectedRooms.length > 0 ? (
                                            selectedRooms.map((room, idx) => (
                                                <div key={idx} className="relative p-5 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 shadow-sm group/item hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRooms(prev => prev.filter((_, i) => i !== idx));
                                                        }}
                                                        className="absolute -top-1.5 -right-1.5 size-7 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg z-20 group/btn"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px] group-hover/btn:rotate-90 transition-transform">close</span>
                                                    </button>
                                                    <div className="flex justify-between items-start mb-2 pr-4">
                                                        <span className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-tight line-clamp-2">{idx + 1}. {room.name}</span>
                                                        <div className="flex items-baseline gap-1 shrink-0">
                                                            <span className="text-[10px] font-black text-primary">{room.currency}</span>
                                                            <span className="font-black text-primary text-sm leading-none">{room.rate.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Room Only</span>
                                                        <span className="bg-slate-500/10 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Non-refundable</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 px-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2">bed</span>
                                                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Please select a room</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Details Section */}
                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Guests</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {totalAdults} Adults, {totalChildren} Child
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Nationality</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                                {nationality}
                                                <span className="material-symbols-outlined text-[10px] text-primary">verified</span>
                                            </p>
                                        </div>
                                        <div className="col-span-2 p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Dates</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                                    {formatDateForUrl(checkInDate)} - {formatDateForUrl(checkOutDate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Stay</p>
                                                <p className="text-xs font-black text-primary">{nights} Nights</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mb-8">
                                        <div className="flex items-end justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm">receipt_long</span>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Total Stay Price (Net)</p>
                                                </div>
                                                <div className="flex items-baseline gap-1.5 ml-1">
                                                    <span className="text-sm font-black text-primary uppercase tracking-wider">{(selectedRooms[0]?.currency || '$')}</span>
                                                    <p className="text-4xl font-black text-primary leading-none tracking-tighter shadow-primary/10">
                                                        {(selectedRooms.reduce((sum, r) => sum + r.rate, 0)).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="size-10 rounded-2xl flex items-center justify-center text-primary bg-primary/10 border border-primary/20">
                                                <span className="material-symbols-outlined">payments</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleInstantReservation}
                                        disabled={selectedRooms.length === 0 || isCheckingRates}
                                        className={`w-full font-black py-5 rounded-[24px] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] mb-4 group/btn overflow-hidden relative ${selectedRooms.length > 0 && !isCheckingRates ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'}`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isCheckingRates ? (
                                                <>
                                                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Checking Rates...
                                                </>
                                            ) : (
                                                <>
                                                    Instant Reservation
                                                    <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                                </>
                                            )}
                                        </span>
                                    </button>
                                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
                                        B2B AGENCY RATES APPLIED
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                    <span className="material-symbols-outlined">verified_user</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SECURE PAYMENT</p>
                                    <p className="text-sm font-black">TOG Protected Booking</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
            <BookingConfirmationModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                hotelName={hotel.name}
            />

            <ImageLightbox
                images={lightboxImages}
                currentIndex={currentImageIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                setCurrentIndex={setCurrentImageIndex}
            />
        </div >
    );
};

export default HotelDetail;
