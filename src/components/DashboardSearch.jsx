import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";

const DashboardSearch = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState(() => {
        return localStorage.getItem('dashboard_last_search') || '';
    });
    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // ... (rest of the state)

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.length >= 3) {
                fetchResults();
            } else {
                setResults({ hotels: [], regions: [] });
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Default dates: Check-in tomorrow, Check-out day after tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const [checkInDate, setCheckInDate] = useState(tomorrow);
    const [checkOutDate, setCheckOutDate] = useState(dayAfter);

    const [adults, setAdults] = useState(2);
    const [rooms, setRooms] = useState(1);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);

    const [error, setError] = useState(false);

    // Debounce search
    useEffect(() => {
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
        return date.toISOString().split('T')[0];
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
            navigate(`/hotels/${slug}?checkin=${formatDateForUrl(checkInDate)}&checkout=${formatDateForUrl(checkOutDate)}&adult=${adults}&room=${rooms}`);
        }
    };

    const handleSelectLocation = (location) => {
        // Helper to get English name or fallback
        const name = location.name.translations.en || Object.values(location.name.translations)[0] || 'destination';
        localStorage.setItem('dashboard_last_search', name);
        const slug = name.toLowerCase().replace(/ /g, '-');
        const url = `/hotels/${slug}?checkin=${formatDateForUrl(checkInDate)}&checkout=${formatDateForUrl(checkOutDate)}&adult=${adults}&room=${rooms}`;
        navigate(url);
    };

    const handleSelectHotel = (hotel) => {
        const name = getHotelName(hotel);
        localStorage.setItem('dashboard_last_search', name);
        const url = `/hotel/${hotel.url}?checkin=${formatDateForUrl(checkInDate)}&checkout=${formatDateForUrl(checkOutDate)}&adult=${adults}&room=${rooms}`;
        navigate(url);
    };

    // Helper to get Hotel Name
    const getHotelName = (hotel) => {
        return hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';
    };

    // Helper to get Region Name
    const getRegionName = (region) => {
        return region.name.translations.en || Object.values(region.name.translations)[0] || 'Unknown Region';
    };

    return (
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none p-2 mb-6 border border-white dark:border-slate-800 relative z-20">
            <div className="flex flex-wrap items-center gap-1 mb-3 p-3 border-b border-slate-50 dark:border-slate-800">
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-primary/25 text-xs transition-transform transform active:scale-95">
                    <span className="material-icons-round text-base">hotel</span> HOTEL
                </button>
                <button className="text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs transition-colors">
                    <span className="material-icons-round text-base">flight</span> FLIGHT
                </button>
                <button className="text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs transition-colors">
                    <span className="material-icons-round text-base">airport_shuttle</span> TRANSFER
                </button>
                <button className="text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs transition-colors">
                    <span className="material-icons-round text-base">explore</span> TOUR
                </button>
                <button className="text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-xs transition-colors">
                    <span className="material-icons-round text-base">directions_car</span> CAR RENTALS
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                {/* Destination Input */}
                <div className="md:col-span-3 space-y-1.5 relative" ref={searchWrapperRef}>
                    <label className={`text-[10px] font-semibold uppercase tracking-wider ml-1 ${error ? 'text-red-500' : 'text-slate-400'}`}>
                        {error ? 'Please enter a destination' : 'Accommodation'}
                    </label>
                    <div className={`flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border transition-all ${error ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent focus-within:border-primary'}`}>
                        <span className={`material-icons-round text-lg ${error ? 'text-red-500' : 'text-slate-400'}`}>location_on</span>
                        <input
                            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full p-0 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                            placeholder="Where?"
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (error) setError(false);
                            }}
                            onFocus={() => { if (results.hotels.length || results.regions.length) setShowDropdown(true); }}
                        />
                        {loading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showDropdown && (results.hotels.length > 0 || results.regions.length > 0) && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl max-h-80 overflow-y-auto z-50">
                            {results.regions.length > 0 && (
                                <div className="p-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Destinations</div>
                                    {results.regions.map((region) => (
                                        <button
                                            key={region.locationId}
                                            onClick={() => handleSelectLocation(region)}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                                <span className="material-icons-round text-sm">location_on</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{getRegionName(region)}</div>
                                                <div className="text-[10px] text-slate-400">{region.countryCode}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.regions.length > 0 && results.hotels.length > 0 && (
                                <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                            )}

                            {results.hotels.length > 0 && (
                                <div className="p-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Hotels</div>
                                    {results.hotels.map((hotel) => (
                                        <button
                                            key={hotel.hotelId}
                                            onClick={() => handleSelectHotel(hotel)}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg flex items-center gap-3 transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                                <span className="material-icons-round text-sm">hotel</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{getHotelName(hotel)}</div>
                                                <div className="text-[10px] text-slate-400">{hotel.countryCode}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Date Picker */}
                <div className="md:col-span-4 space-y-1.5 z-10">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Check-in / Check-out</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary transition-all relative">
                        <span className="material-icons-round text-slate-400 text-lg">calendar_month</span>
                        <div className="flex items-center w-full">
                            <DatePicker
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
                                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full p-0 text-xs text-slate-900 dark:text-white font-bold cursor-pointer placeholder-slate-400"
                                dateFormat="dd MMM yyyy"
                                placeholderText="Select dates"
                                dayClassName={(date) => {
                                    const day = date.getDay();
                                    return day === 0 || day === 6 ? "text-red-500 font-bold" : "text-slate-700 dark:text-slate-200";
                                }}
                                calendarClassName="shadow-2xl border-none font-sans"
                            />
                        </div>
                    </div>
                </div>

                {/* Guest Selector */}
                <div className="md:col-span-3 space-y-1.5 relative" ref={guestWrapperRef}>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Guests & Rooms</label>
                    <button
                        onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-primary hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all text-left"
                    >
                        <span className="material-icons-round text-slate-400 text-lg">group</span>
                        <span className="text-xs flex-1 font-medium text-slate-900 dark:text-white">
                            {adults} Adults, {rooms} Room{rooms > 1 ? 's' : ''}
                        </span>
                        <span className="material-icons-round text-slate-400 text-base">expand_more</span>
                    </button>

                    {showGuestDropdown && (
                        <div className="absolute top-full right-0 w-64 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xl p-4 z-50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Adults</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setAdults(Math.max(1, adults - 1))}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">remove</span>
                                    </button>
                                    <span className="w-4 text-center text-sm font-bold">{adults}</span>
                                    <button
                                        onClick={() => setAdults(Math.min(10, adults + 1))}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Rooms</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">remove</span>
                                    </button>
                                    <span className="w-4 text-center text-sm font-bold">{rooms}</span>
                                    <button
                                        onClick={() => setRooms(Math.min(5, rooms + 1))}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <span className="material-icons-round text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Button */}
                <div className="md:col-span-2 flex items-end">
                    <button
                        onClick={handleSearch}
                        className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs"
                    >
                        <span className="material-icons-round text-base">search</span> Search
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DashboardSearch;
