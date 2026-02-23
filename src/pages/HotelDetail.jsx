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
    const { id, slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const hotel = mockHotels.find(h => h.id === parseInt(id)) || mockHotels[0];
    const images = hotel.images || [hotel.image];

    // -- Lightbox State --
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setIsLightboxOpen(true);
    };

    // -- Search State Initialization --
    const parseDateParam = (param) => {
        if (!param) return null;
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

    // Computed totals
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    const [activeTab, setActiveTab] = useState('Rooms & Rates');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedRooms, setSelectedRooms] = useState([]);

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
        params.set('q', hotel.name);

        // Keep current path but update search params
        navigate(`${window.location.pathname}?${params.toString()}`);
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

    const tabs = ['Rooms & Rates', 'Overview', 'Amenities', 'Policies', 'Reviews'];

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            <Header />

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Breadcrumbs />
                    <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-primary group">
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Search
                    </Link>
                </div>

                {/* Hotel Title & Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black tracking-tight">{hotel.name}</h1>
                            <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined fill-1 text-lg">star</span>
                                ))}
                            </div>
                            <span className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm border border-emerald-200/20">
                                <span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            <span className="font-semibold text-sm">{hotel.location}</span>
                            <button
                                onClick={() => navigate(`/map?hotelId=${hotel.id}`)}
                                className="text-primary text-sm font-bold hover:underline ml-2">
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
                    {['Free WiFi', 'Free Parking', 'Breakfast Available', 'Pool', 'Sea View'].map((item, i) => (
                        <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-default backdrop-blur-md shadow-sm">
                            <span className="material-symbols-outlined text-sm text-primary">check_circle</span> {item}
                        </span>
                    ))}
                </div>

                {/* Benton Grid Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[540px] mb-8 overflow-hidden rounded-[32px] relative group/gallery">
                    <div className="md:col-span-2 md:row-span-2 relative overflow-hidden ring-1 ring-white/10 shadow-2xl cursor-pointer" onClick={() => openLightbox(0)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[0]} alt={hotel.name} />
                        <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black shadow-2xl border border-white/20">
                            1 / {images.length} Photos
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(1)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[1] || images[0]} alt="" />
                        <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover/gallery:translate-y-0 group-hover/gallery:opacity-100 transition-all duration-500">
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}><span className="material-symbols-outlined text-xl">favorite</span></button>
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}><span className="material-symbols-outlined text-xl">share</span></button>
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(2)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[2] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 cursor-pointer" onClick={() => openLightbox(3)}>
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[3] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 group/viewall cursor-pointer" onClick={() => openLightbox(0)}>
                        <img className="w-full h-full object-cover group-hover/viewall:scale-110 blur-[2px] transition-all duration-700" src={images[4] || images[0]} alt="" />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-4">
                            <span className="material-symbols-outlined text-4xl mb-2 animate-bounce-slow">photo_library</span>
                            <span className="text-sm font-black uppercase tracking-widest">Show All Photos</span>
                        </div>
                    </div>
                </div>

                {/* Quick Selection Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-none grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
                    <div className="md:col-span-4 relative group">
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 z-10">Check-in / Out</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50 px-3 pt-7 pb-4 rounded-2xl cursor-pointer transition-all h-[72px]" onClick={() => datePickerRef.current?.setOpen(true)}>
                            <span className="material-symbols-outlined text-primary shrink-0">calendar_month</span>
                            <div className="flex flex-col flex-1 min-w-0">
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
                                    className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 w-full text-slate-900 dark:text-white cursor-pointer whitespace-nowrap"
                                    wrapperClassName="w-full"
                                    dateFormat="dd MMM yyyy"
                                />
                                {checkInDate && checkOutDate && (
                                    <span className="text-[10px] font-bold text-primary uppercase">
                                        {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} Nights Stay
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 relative" ref={guestWrapperRef}>
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 z-10">Guests & Rooms</label>
                        <button
                            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                            className="w-full h-[72px] flex items-center gap-3 px-3 pt-7 pb-4 bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-2xl transition-all text-left"
                        >
                            <span className="material-symbols-outlined text-primary shrink-0">group</span>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap block">
                                    {totalAdults} Adults, {totalChildren} Child{totalChildren !== 1 ? 'ren' : ''}
                                </span>
                                <span className="text-[10px] text-primary font-bold uppercase tracking-tight">
                                    {totalRooms} Room{totalRooms > 1 ? 's' : ''} Stay
                                </span>
                            </div>
                            <span className="material-symbols-outlined text-slate-400 rotate-0 transition-transform">expand_more</span>
                        </button>

                        {/* Guest Dropdown */}
                        {showGuestDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-2xl p-6 z-[100] max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-300">
                                {roomState.map((room, index) => (
                                    <div key={index} className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 last:mb-0 last:pb-0 last:border-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Room {index + 1}</div>
                                            {roomState.length > 1 && (
                                                <button onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-widest">Remove</button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-black uppercase tracking-tight">Adults</div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">remove</span></button>
                                                <span className="w-4 text-center font-black">{room.adults}</span>
                                                <button onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">add</span></button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-black uppercase tracking-tight">Children</div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">remove</span></button>
                                                <span className="w-4 text-center font-black">{room.children}</span>
                                                <button onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><span className="material-symbols-outlined text-lg">add</span></button>
                                            </div>
                                        </div>

                                        {room.children > 0 && (
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                {room.childAges.map((age, ageIdx) => (
                                                    <div key={ageIdx} className="space-y-1">
                                                        <label className="text-[9px] font-black uppercase text-slate-400">Child {ageIdx + 1} Age</label>
                                                        <select
                                                            value={age}
                                                            onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                            className="w-full h-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs px-2 font-black focus:border-primary focus:ring-0"
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
                                        className="w-full py-4 mt-2 bg-primary/5 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-dashed border-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">add_circle</span>
                                        Add Another Room
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-3 relative">
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 z-10">Nationality</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100 dark:group-hover:bg-slate-700/50 px-3 pt-7 pb-4 rounded-2xl transition-all h-[72px]">
                            <NationalitySelect
                                value={nationality}
                                onChange={setNationality}
                                compact={false}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <button
                            onClick={handleSearch}
                            className="w-full h-[72px] bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95 group"
                        >
                            <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">search</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
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
                                    <div className="space-y-6">
                                        {[1, 2].map((roomIndex) => {
                                            const roomName = roomIndex === 1 ? 'Deluxe King Room' : 'Executive Loft Suite';
                                            const roomPrice = hotel.price + (roomIndex * 75);
                                            const isSelected = selectedRooms.some(r => r.name === roomName);

                                            return (
                                                <div key={roomIndex} className={`bg-white dark:bg-slate-900/50 border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-800'} rounded-[32px] overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none`}>
                                                    <div className="md:w-80 relative overflow-hidden shrink-0 cursor-pointer group/room" onClick={() => openLightbox(roomIndex % images.length)}>
                                                        <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={images[roomIndex % images.length]} alt="" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/room:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                            <div className="size-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white scale-90 group-hover/room:scale-100 transition-transform">
                                                                <span className="material-symbols-outlined text-2xl">zoom_in</span>
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                                            <span className="material-symbols-outlined text-xs">photo_camera</span> 2 Photos
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 p-8">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{roomName}</h3>
                                                                <div className="flex gap-4 text-slate-400 mb-4">
                                                                    <span className="flex items-center gap-1.5 text-xs font-black"><span className="material-symbols-outlined text-sm text-primary">square_foot</span> 48 m²</span>
                                                                    <span className="flex items-center gap-1.5 text-xs font-black"><span className="material-symbols-outlined text-sm text-primary">king_bed</span> King Bed</span>
                                                                </div>
                                                            </div>
                                                            <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-orange-200/20">
                                                                Most Popular
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 mb-8">
                                                            {['Free WiFi', 'Air Conditioning', 'Mini-bar', 'Room Service'].map((feat, i) => (
                                                                <span key={i} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                                    {feat}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <div
                                                            onClick={() => toggleRoomSelection(roomIndex, roomPrice, roomName)}
                                                            className={`${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'bg-primary/5 dark:bg-primary/10 border border-primary/20'} p-6 rounded-3xl flex items-center justify-between group/row hover:bg-primary/10 transition-colors cursor-pointer`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`size-6 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-300 border border-slate-200 dark:border-slate-700'} flex items-center justify-center shadow-lg shadow-primary/20 transition-all`}>
                                                                    <span className="material-symbols-outlined text-xs font-black">{isSelected ? 'check' : 'add'}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-sm uppercase tracking-tighter text-slate-900 dark:text-white">B2B Special Rate</p>
                                                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-[14px]">cancel</span> Non-refundable
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-black text-primary">${roomPrice}</p>
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Net / Night</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {activeTab === 'Overview' && (
                                    <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                                        <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">About the Property</h2>
                                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {hotel.description || "Experience the ultimate luxury at our TOG-certified property."}
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'Amenities' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                        {hotel.amenities.map((amenity, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-primary/50 transition-all hover:shadow-lg group">
                                                <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-3xl">{amenity.icon}</span>
                                                </div>
                                                <span className="font-black text-sm uppercase tracking-tight">{amenity.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(activeTab === 'Policies' || activeTab === 'Reviews') && (
                                    <div className="bg-white dark:bg-slate-900/50 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                        <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6 font-black uppercase tracking-widest">
                                            {activeTab[0]}
                                        </div>
                                        <h3 className="text-xl font-black uppercase mb-2">{activeTab} Details</h3>
                                        <p className="text-slate-500 font-medium tracking-tight">Data synchronized from Travel of Globe systems.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-[88px] h-fit">
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
                                            <div key={idx} className="p-5 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 shadow-sm group/item hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{idx + 1}. {room.name}</span>
                                                    <span className="font-black text-primary text-sm">${room.rate}</span>
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
                                            <p className="text-xs font-black text-primary">{Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} Nights</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mb-8">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Stay Price (Net)</p>
                                            <p className="text-4xl font-black text-primary leading-none tracking-tighter">
                                                ${selectedRooms.reduce((sum, r) => sum + r.rate, 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="size-10 rounded-2xl flex items-center justify-center text-primary bg-primary/10 border border-primary/20">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => selectedRooms.length > 0 && setIsBookingModalOpen(true)}
                                    disabled={selectedRooms.length === 0}
                                    className={`w-full font-black py-5 rounded-[24px] transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] mb-4 group/btn overflow-hidden relative ${selectedRooms.length > 0 ? 'bg-primary text-white shadow-primary/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                    <span className="relative z-10 flex items-center gap-2">
                                        Instant Reservation
                                        <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
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
            </main>

            <Footer />
            <BookingConfirmationModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                hotelName={hotel.name}
            />

            <ImageLightbox
                images={images}
                currentIndex={currentImageIndex}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                setCurrentIndex={setCurrentImageIndex}
            />
        </div>
    );
};

export default HotelDetail;
