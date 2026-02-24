import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms } from '../utils/searchParamsUtils';

import NationalitySelect from './NationalitySelect';

const DashboardSearch = () => {
    const navigate = useNavigate();
    const { error: toastError } = useToast(); // Renamed to avoid conflict with local 'error' state
    const [searchParams] = useSearchParams();

    // Initialize state from URL params or defaults
    const [query, setQuery] = useState(() => {
        return searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Nationality State
    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || 'TR';
    });

    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(-1);
    }, [results]);

    // Default dates: Check-in tomorrow, Check-out day after tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const parseDateParam = (param) => {
        if (!param) return null;
        const [day, month, year] = param.split('-').map(Number);
        if (day && month && year) {
            const date = new Date(year, month - 1, day);
            // Validate that the date is valid
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date;
            }
        }
        return null;
    };

    const [checkInDate, setCheckInDate] = useState(() => {
        const checkinParam = searchParams.get('checkin');
        return parseDateParam(checkinParam) || tomorrow;
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const checkoutParam = searchParams.get('checkout');
        return parseDateParam(checkoutParam) || dayAfter;
    });

    // -- Guest State --
    const [roomState, setRoomState] = useState(() => {
        const guestsParam = searchParams.get('guests');
        if (guestsParam) {
            return parseGuestsParam(guestsParam);
        }
        // Fallback to old params
        const adults = searchParams.get('adult');
        const children = searchParams.get('children');
        const childAges = searchParams.get('child_ages');

        if (adults || children) {
            return convertOldParamsToRooms(adults, children, childAges);
        }

        // Default
        return [{ adults: 2, children: 0, childAges: [] }];
    });

    // Computed totals for display
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    const [showGuestDropdown, setShowGuestDropdown] = useState(false);

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);

    const [error, setError] = useState(false);

    const isUserInteraction = useRef(false);

    // Debounce search
    useEffect(() => {
        // Only trigger search if user has interacted with the input
        if (!isUserInteraction.current) {
            return;
        }

        const timeoutId = setTimeout(() => {
            if (query.length >= 3) {
                fetchResults();
            } else {
                setResults({ hotels: [], regions: [] });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (guestWrapperRef.current && !guestWrapperRef.current.contains(event.target)) {
                setShowGuestDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const data = await autocompleteService.search(query);
            if (data && data.data) {
                setResults(data.data);
                setShowDropdown(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateForUrl = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const getUrlParams = (queryOverride) => {
        const guestsParam = serializeGuestsParam(roomState);
        let params = `checkin=${formatDateForUrl(checkInDate)}&checkout=${formatDateForUrl(checkOutDate)}&guests=${encodeURIComponent(guestsParam)}&nationality=${encodeURIComponent(nationality)}`;

        const q = queryOverride !== undefined ? queryOverride : query;
        if (q) {
            params += `&q=${encodeURIComponent(q)}`;
        }
        return params;
    };

    const handleSearch = () => {
        if (!query.trim()) {
            setError(true);
            // Focus the input if possible, or just show visual cue
            return;
        }

        if (query) {
            localStorage.setItem('dashboard_last_search', query);
            const slug = query.toLowerCase().replace(/ /g, '-');
            // Retrieve locationId from localStorage if it exists
            const savedLocationId = localStorage.getItem('dashboard_last_locationId');
            const locationParam = savedLocationId ? `&locationId=${savedLocationId}` : '';
            navigate(`/hotels/${slug}?${getUrlParams()}${locationParam}`);
        }
    };

    const handleSelectLocation = (location) => {
        // Helper to get English name or fallback
        const name = location.name.translations.en || Object.values(location.name.translations)[0] || 'destination';

        // Construct full name from breadcrumbs for display
        let fullName = name;
        if (location.locationBreadcrumbs && location.locationBreadcrumbs.length > 0) {
            const parts = location.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            fullName = parts.reverse().join(', ');
        }

        localStorage.setItem('dashboard_last_search', fullName);
        // Save locationId for later use with Search button
        if (location.locationId) {
            localStorage.setItem('dashboard_last_locationId', location.locationId);
        }

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setShowDropdown(false);

        setQuery(fullName);

    };

    const handleSelectHotel = (hotel) => {
        const name = getHotelName(hotel);

        // Construct full name with location context
        let fullName = name;
        if (hotel.locationBreadcrumbs && hotel.locationBreadcrumbs.length > 0) {
            const parts = hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            const context = parts.reverse().join(', ');
            fullName = `${name}, ${context}`;
        } else if (hotel.countryCode) {
            fullName = `${name}, ${hotel.countryCode}`;
        }

        localStorage.setItem('dashboard_last_search', fullName);

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setShowDropdown(false);

        setQuery(fullName);

    };

    // Helper to get Hotel Name
    const getHotelName = (hotel) => {
        return hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';
    };

    // Helper to get Region Name
    const getRegionName = (region) => {
        if (region.locationBreadcrumbs && region.locationBreadcrumbs.length > 0) {
            const parts = region.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            return parts.reverse().join(', ');
        }
        return region.name.translations.en || Object.values(region.name.translations)[0] || 'Unknown Region';
    };

    const handleKeyDown = (e) => {
        // Allow Enter key to trigger search actions regardless of dropdown state
        if (e.key === 'Enter') {
            e.preventDefault();
            // If dropdown is open and we have an active item, select it
            if (showDropdown && activeIndex >= 0) {
                if (activeIndex < results.regions.length) {
                    handleSelectLocation(results.regions[activeIndex]);
                } else {
                    handleSelectHotel(results.hotels[activeIndex - results.regions.length]);
                }
            } else {
                // Otherwise, trigger the main search
                handleSearch();
            }
            return;
        }

        // For navigation keys, we need the dropdown to be open and have results
        if (!showDropdown || (results.regions.length === 0 && results.hotels.length === 0)) return;

        const totalItems = results.regions.length + results.hotels.length;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
    };

    // -- Room Manipulators --
    const updateRoom = (index, field, value) => {
        const newRooms = [...roomState];
        newRooms[index] = { ...newRooms[index], [field]: value };

        // Handle child count change special case to resize ages array
        if (field === 'children') {
            const diff = value - newRooms[index].childAges.length;
            if (diff > 0) {
                // Add children with default age 0
                newRooms[index].childAges = [...newRooms[index].childAges, ...Array(diff).fill(0)];
            } else if (diff < 0) {
                // Remove children
                newRooms[index].childAges = newRooms[index].childAges.slice(0, value);
            }
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
        if (roomState.length < 5) {
            setRoomState([...roomState, { adults: 2, children: 0, childAges: [] }]);
        }
    };

    const removeRoom = (index) => {
        if (roomState.length > 1) {
            const newRooms = roomState.filter((_, i) => i !== index);
            setRoomState(newRooms);
        }
    };

    return (
        <section className="relative group/search">
            {/* Intensity glow behind the glass */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-purple-500/5 to-primary/10 rounded-[60px] blur-3xl opacity-0 group-hover/search:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] p-3 border border-white/60 dark:border-white/10 transition-all duration-500 group-hover/search:bg-white/50 dark:group-hover/search:bg-slate-900/50">
                {/* Service Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 relative z-10">
                    <button className="bg-primary text-white px-6 py-2.5 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary/25 text-[10px] tracking-[0.15em] transition-all transform active:scale-95 group/btn">
                        <span className="material-symbols-outlined text-sm fill-1">hotel</span>
                        HOTEL
                    </button>
                    {['flight', 'airport_shuttle', 'explore', 'directions_car'].map((icon, i) => (
                        <button key={i} className="px-5 py-2.5 rounded-2xl font-black text-slate-400 dark:text-slate-500 flex items-center gap-3 text-[10px] tracking-[0.15em] transition-all hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white group/soon" disabled>
                            <span className="material-symbols-outlined text-lg leading-none">{icon}</span>
                            <span className="uppercase">{icon === 'airport_shuttle' ? 'Transfer' : icon === 'explore' ? 'Tour' : icon === 'directions_car' ? 'Car Rentals' : icon}</span>
                            <span className="bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[8px] font-black px-2 py-0.5 rounded-lg opacity-40 group-hover/soon:opacity-100 transition-opacity">SOON</span>
                        </button>
                    ))}
                </div>

                {/* Search Bar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-1.5 relative z-10">
                    {/* Destination Input */}
                    <div className="md:col-span-3 relative group/field" ref={searchWrapperRef}>
                        <label className={`absolute left-10 top-2.5 text-[8px] font-black uppercase tracking-[0.2em] z-10 transition-colors ${error ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                            {error ? 'Destination Required' : 'Accommodation'}
                        </label>
                        <div className={`flex items-center gap-3 px-3 pt-7 pb-3 h-[68px] bg-white/40 dark:bg-slate-800/40 rounded-2xl border backdrop-blur-md transition-all duration-300 ${error ? 'border-red-500 bg-red-500/5' : 'border-white/40 dark:border-white/5 group-hover/field:border-primary/50 group-hover/field:bg-white/60 dark:group-hover/field:bg-slate-800/60'}`}>
                            <span className={`material-symbols-outlined shrink-0 text-xl transition-colors ${error ? 'text-red-500' : 'text-primary/70 group-hover/field:text-primary'}`}>location_on</span>
                            <input
                                className="bg-transparent border-none outline-none focus:ring-0 w-full p-0 text-xs font-black text-slate-900 dark:text-white placeholder-slate-400/50 uppercase tracking-tight overflow-hidden text-ellipsis whitespace-nowrap"
                                placeholder="Where are you going?"
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    isUserInteraction.current = true;
                                    setQuery(e.target.value);
                                    if (error) setError(false);
                                }}
                                onClick={() => { if (query) setQuery(''); }}
                                onFocus={() => { if (results.hotels.length || results.regions.length) setShowDropdown(true); }}
                                onKeyDown={handleKeyDown}
                            />
                            {loading && <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>}
                        </div>

                        {/* Autocomplete Dropdown - Opaque */}
                        {showDropdown && (results.hotels.length > 0 || results.regions.length > 0) && (
                            <div className="absolute top-full left-0 w-full md:w-[450px] mt-4 bg-white dark:bg-slate-900 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl max-h-80 overflow-y-auto z-[200] p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {results.regions.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Destinations</div>
                                        <div className="space-y-1">
                                            {results.regions.map((region, index) => (
                                                <button
                                                    key={region.locationId}
                                                    onClick={() => handleSelectLocation(region)}
                                                    className={`w-full text-left px-3 py-3 hover:bg-primary/10 rounded-2xl flex items-center gap-3 transition-all group ${activeIndex === index ? 'bg-primary/10 ring-1 ring-primary/20' : ''}`}
                                                >
                                                    <div className="size-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                                                        <span className="material-symbols-outlined text-lg">location_on</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{region.name.translations.en || region.name.defaultName}</div>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{getRegionName(region)}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.hotels.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Hotels</div>
                                        <div className="space-y-1">
                                            {results.hotels.map((hotel, index) => (
                                                <button
                                                    key={hotel.hotelId}
                                                    onClick={() => handleSelectHotel(hotel)}
                                                    className={`w-full text-left px-3 py-3 hover:bg-primary/10 rounded-2xl flex items-center gap-3 transition-all group ${activeIndex === (results.regions.length + index) ? 'bg-primary/10 ring-1 ring-primary/20' : ''}`}
                                                >
                                                    <div className="size-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                                                        <span className="material-symbols-outlined text-lg">hotel</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{getHotelName(hotel)}</div>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                                                            {hotel.locationBreadcrumbs ? hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName).reverse().slice(1, 3).join(', ') : hotel.countryCode}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date Picker */}
                    <div className="md:col-span-3 relative group/field">
                        <label className="absolute left-10 top-2.5 text-[8px] font-black uppercase tracking-[0.2em] z-10 text-slate-400 dark:text-slate-500">Check-in / Out</label>
                        <div className="flex items-center gap-3 px-3 pt-7 pb-3 h-[68px] bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-white/5 backdrop-blur-md transition-all duration-300 group-hover/field:border-primary/50 group-hover/field:bg-white/60 dark:group-hover/field:bg-slate-800/60 cursor-pointer" onClick={() => datePickerRef.current?.setOpen(true)}>
                            <span className="material-symbols-outlined text-primary/70 group-hover/field:text-primary text-xl shrink-0">calendar_month</span>
                            <div className="flex-1 min-w-0 flex items-center relative">
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
                                    monthsShown={2}
                                    className="bg-transparent border-none outline-none focus:ring-0 w-full p-0 text-xs font-black text-slate-900 dark:text-white cursor-pointer uppercase tracking-tight"
                                    dateFormat="dd MMM yyyy"
                                    placeholderText="Select dates"
                                />
                                {checkInDate && checkOutDate && (
                                    <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-1 rounded-lg uppercase whitespace-nowrap ml-2">
                                        {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} Nights
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Nationality Selector */}
                    <div className="md:col-span-2 relative group/field">
                        <label className="absolute left-10 top-2.5 text-[8px] font-black uppercase tracking-[0.2em] z-10 text-slate-400 dark:text-slate-500">Nationality</label>
                        <div className="flex items-center gap-3 px-3 pt-7 pb-3 h-[68px] bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-white/5 backdrop-blur-md transition-all duration-300 group-hover/field:border-primary/50 group-hover/field:bg-white/60 dark:group-hover/field:bg-slate-800/60">
                            <NationalitySelect value={nationality} onChange={setNationality} compact={false} />
                        </div>
                    </div>

                    {/* Guest Selector */}
                    <div className="md:col-span-2 relative group/field" ref={guestWrapperRef}>
                        <label className="absolute left-10 top-2.5 text-[8px] font-black uppercase tracking-[0.2em] z-10 text-slate-400 dark:text-slate-500">Guests & Rooms</label>
                        <button
                            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                            className="w-full h-[68px] flex items-center justify-between gap-3 px-3 pt-7 pb-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/40 dark:border-white/5 backdrop-blur-md transition-all duration-300 group-hover/field:border-primary/50 group-hover/field:bg-white/60 dark:group-hover/field:bg-slate-800/60 text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="material-symbols-outlined text-primary/70 group-hover/field:text-primary text-xl shrink-0">group</span>
                                <div className="min-w-0">
                                    <div className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">
                                        {totalAdults}A, {totalChildren}C
                                    </div>
                                    <div className="text-[8px] font-black text-primary uppercase tracking-widest truncate leading-none mt-0.5">
                                        {totalRooms} R
                                    </div>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-400 text-base shrink-0 transition-transform group-hover/field:translate-y-0.5">expand_more</span>
                        </button>

                        {/* Guest Dropdown - Opaque */}
                        {showGuestDropdown && (
                            <div className="absolute top-full right-0 w-[350px] mt-4 bg-white dark:bg-slate-900 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl p-6 z-[200] space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 max-h-[70vh] overflow-y-auto no-scrollbar">
                                {roomState.map((room, index) => (
                                    <div key={index} className="pb-6 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Room {index + 1}</div>
                                            {roomState.length > 1 && (
                                                <button onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-600 text-[9px] font-black uppercase tracking-widest transition-colors">Remove</button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {[{ label: 'Adults', field: 'adults', max: 6, min: 1 }, { label: 'Children', field: 'children', max: 4, min: 0 }].map((item) => (
                                                <div key={item.field} className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => updateRoom(index, item.field, Math.max(item.min, room[item.field] - 1))} className="size-8 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"><span className="material-symbols-outlined text-sm">remove</span></button>
                                                        <span className="w-4 text-center text-sm font-black">{room[item.field]}</span>
                                                        <button onClick={() => updateRoom(index, item.field, Math.min(item.max, room[item.field] + 1))} className="size-8 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"><span className="material-symbols-outlined text-sm">add</span></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {room.children > 0 && (
                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                {room.childAges.map((age, ageIdx) => (
                                                    <div key={ageIdx} className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Child {ageIdx + 1}</label>
                                                        <select
                                                            value={age}
                                                            onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                            className="w-full h-9 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] px-2 font-black focus:border-primary focus:ring-0"
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
                                        className="w-full py-4 bg-primary/5 text-primary rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-dashed border-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">add_circle</span>
                                        Add Another Room
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Button */}
                    <div className="md:col-span-2">
                        <button
                            onClick={handleSearch}
                            className="w-full h-16 bg-primary text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group/searchbtn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/searchbtn:translate-x-full transition-transform duration-1000"></div>
                            <span className="material-symbols-outlined text-2xl group-hover/searchbtn:rotate-12 transition-transform">search</span>
                            <span>Search</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardSearch;
