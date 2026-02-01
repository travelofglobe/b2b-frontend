import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";

const HeaderSearch = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // -- State Initialization from URL or Defaults --
    const [query, setQuery] = useState(() => {
        return searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Default dates: tomorrow, day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const [checkInDate, setCheckInDate] = useState(() => {
        const checkinParam = searchParams.get('checkin');
        return checkinParam ? new Date(checkinParam) : tomorrow;
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const checkoutParam = searchParams.get('checkout');
        return checkoutParam ? new Date(checkoutParam) : dayAfter;
    });

    const [adults, setAdults] = useState(() => {
        return parseInt(searchParams.get('adult')) || 2;
    });
    const [children, setChildren] = useState(() => {
        return parseInt(searchParams.get('children')) || 0;
    });
    const [childrenAges, setChildrenAges] = useState(() => {
        const agesParam = searchParams.get('child_ages');
        return agesParam ? agesParam.split(',').map(Number) : [];
    });
    const [rooms, setRooms] = useState(() => {
        return parseInt(searchParams.get('room')) || 1;
    });

    // -- UI State --
    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);
    const isUserInteraction = useRef(false);

    // -- Effects --

    // Debounce search
    useEffect(() => {
        // Only search if the user has interacted (typed)
        if (!isUserInteraction.current) {
            return;
        }

        const timeoutId = setTimeout(() => {
            if (query && query.length >= 3) {
                fetchResults();
            } else {
                setResults({ hotels: [], regions: [] });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Click outside to close dropdowns
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

    // -- Handlers --

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

    const getUrlParams = () => {
        let params = `checkin=${formatDateForUrl(checkInDate)}&checkout=${formatDateForUrl(checkOutDate)}&adult=${adults}&room=${rooms}`;
        if (children > 0) {
            params += `&children=${children}`;
            if (childrenAges.length > 0) {
                params += `&child_ages=${childrenAges.join(',')}`;
            }
        }
        // Add query param if present
        if (query) {
            params += `&q=${encodeURIComponent(query)}`;
        }
        return params;
    };

    const handleSearch = () => {
        if (query) {
            localStorage.setItem('dashboard_last_search', query);
            const slug = query.toLowerCase().replace(/ /g, '-');
            // Navigate to results page with params
            navigate(`/hotels/${slug}?${getUrlParams()}`);
        }
    };

    const handleSelectLocation = (location) => {
        const name = location.name.translations.en || Object.values(location.name.translations)[0] || 'destination';
        setQuery(name);
        localStorage.setItem('dashboard_last_search', name);
        const slug = name.toLowerCase().replace(/ /g, '-');
        navigate(`/hotels/${slug}?${getUrlParams()}`);
        setShowDropdown(false);
    };

    const handleSelectHotel = (hotel) => {
        const name = hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';
        setQuery(name);
        localStorage.setItem('dashboard_last_search', name);
        navigate(`/hotel/${hotel.url}?${getUrlParams()}`);
        setShowDropdown(false);
    };

    const getRegionName = (region) => region.name.translations.en || Object.values(region.name.translations)[0] || 'Unknown Region';
    const getHotelName = (hotel) => hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';


    return (
        <div className="hidden xl:flex items-center bg-slate-100 dark:bg-[#233648] rounded-xl px-2 py-1 gap-2 border border-slate-200 dark:border-transparent relative">

            {/* 1. Destination / Query */}
            <div className="flex items-center px-3 border-r border-slate-300 dark:border-slate-600 relative" ref={searchWrapperRef}>
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">location_on</span>
                <input
                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-sm w-40 placeholder:text-slate-500 p-0"
                    placeholder="Where to?"
                    type="text"
                    value={query}
                    onChange={(e) => {
                        isUserInteraction.current = true;
                        setQuery(e.target.value);
                    }}
                    onFocus={() => { if (results.hotels.length || results.regions.length) setShowDropdown(true); }}
                />

                {/* Autocomplete Dropdown */}
                {showDropdown && (results.hotels.length > 0 || results.regions.length > 0) && (
                    <div className="absolute top-full left-0 w-[400px] mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl max-h-80 overflow-y-auto z-[1200]">
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

            {/* 2. Date Picker */}
            <div className="flex items-center px-3 border-r border-slate-300 dark:border-slate-600">
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">calendar_month</span>
                <div className="w-[210px]">
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
                        className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full p-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 font-medium"
                        dateFormat="dd MMM yyyy"
                        placeholderText="Dates"
                        dayClassName={(date) => {
                            const day = date.getDay();
                            return day === 0 || day === 6 ? "text-red-500 font-bold" : "text-slate-700 dark:text-slate-200";
                        }}
                        calendarClassName="shadow-2xl border-none font-sans mt-4"
                        popperPlacement="bottom-start"
                    />
                </div>
            </div>

            {/* 3. Guests Dropdown */}
            <div className="flex items-center px-3 relative" ref={guestWrapperRef}>
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">group</span>
                <button
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="bg-transparent border-none focus:ring-0 text-sm min-w-[80px] text-left text-slate-900 dark:text-white font-medium whitespace-nowrap"
                >
                    {adults} Adults, {children} Child{children !== 1 ? 'ren' : ''}
                </button>

                {/* Guest Dropdown Panel */}
                {showGuestDropdown && (
                    <div className="absolute top-full right-0 mt-4 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl p-4 z-[1200]">
                        {/* Adults */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Adults</div>
                                <div className="text-[10px] text-slate-400">Age 18+</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setAdults(Math.max(1, adults - 1))}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">remove</span>
                                </button>
                                <span className="w-4 text-center text-sm font-bold">{adults}</span>
                                <button
                                    onClick={() => setAdults(Math.min(10, adults + 1))}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Children</div>
                                <div className="text-[10px] text-slate-400">Age 0-17</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        const newCount = Math.max(0, children - 1);
                                        setChildren(newCount);
                                        setChildrenAges(prev => prev.slice(0, newCount));
                                    }}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">remove</span>
                                </button>
                                <span className="w-4 text-center text-sm font-bold">{children}</span>
                                <button
                                    onClick={() => {
                                        const newCount = Math.min(6, children + 1);
                                        setChildren(newCount);
                                        setChildrenAges(prev => [...prev, 0]);
                                    }}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">add</span>
                                </button>
                            </div>
                        </div>

                        {/* Child Ages */}
                        {children > 0 && (
                            <div className="mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Child Ages</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {childrenAges.map((age, index) => (
                                        <select
                                            key={index}
                                            value={age}
                                            onChange={(e) => {
                                                const newAges = [...childrenAges];
                                                newAges[index] = parseInt(e.target.value);
                                                setChildrenAges(newAges);
                                            }}
                                            className="w-full h-8 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs px-1 focus:border-primary focus:ring-0"
                                        >
                                            {[...Array(18)].map((_, i) => (
                                                <option key={i} value={i}>{i} yr</option>
                                            ))}
                                        </select>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rooms */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Rooms</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">remove</span>
                                </button>
                                <span className="w-4 text-center text-sm font-bold">{rooms}</span>
                                <button
                                    onClick={() => setRooms(Math.min(5, rooms + 1))}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                >
                                    <span className="material-icons-round text-sm">add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search Button */}
            <button
                onClick={handleSearch}
                className="bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
                <span className="material-symbols-outlined text-[22px]">search</span>
            </button>
        </div>
    );
};

export default HeaderSearch;
