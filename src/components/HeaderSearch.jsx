import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms } from '../utils/searchParamsUtils';
import NationalitySelect from './NationalitySelect';

const HeaderSearch = () => {
    const navigate = useNavigate();
    const { error } = useToast();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    // Detect if we're on the map page to preserve navigation context
    const isMapPage = location.pathname.startsWith('/map');

    // -- State Initialization from URL or Defaults --
    const [query, setQuery] = useState(() => {
        return searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Nationality
    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || 'TR';
    });

    // Default dates: tomorrow, day after
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

    // -- UI State --
    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);
    const isUserInteraction = useRef(false);

    // -- Effects --

    // Debounce search
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

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(-1);
    }, [results]);

    // Sync query with URL parameter when URL changes (e.g., breadcrumb click)
    useEffect(() => {
        const qParam = searchParams.get('q');
        if (qParam && qParam !== query) {
            setQuery(qParam);
        }
    }, [searchParams]);

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

        // Add query param if present
        const q = queryOverride !== undefined ? queryOverride : query;
        if (q) {
            params += `&q=${encodeURIComponent(q)}`;
        }
        return params;
    };

    const handleSearch = () => {
        if (query) {
            localStorage.setItem('dashboard_last_search', query);
            // Retrieve locationId from localStorage if it exists
            const savedLocationId = localStorage.getItem('dashboard_last_locationId');
            const locationParam = savedLocationId ? `&locationId=${savedLocationId}` : '';

            // Map page doesn't use slug-based routing, only Hotels does
            if (isMapPage) {
                navigate(`/map?${getUrlParams()}${locationParam}`);
            } else {
                const slug = query.toLowerCase().replace(/ /g, '-');
                navigate(`/hotels/${slug}?${getUrlParams()}${locationParam}`);
            }
        }
    };

    const handleSelectLocation = (location) => {
        const name = location.name.translations.en || Object.values(location.name.translations)[0] || 'destination';

        // Construct full name from breadcrumbs for display
        let fullName = name;
        if (location.locationBreadcrumbs && location.locationBreadcrumbs.length > 0) {
            const parts = location.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            fullName = parts.reverse().join(', ');
        }

        // Close dropdown FIRST before updating query to prevent reopening
        isUserInteraction.current = false;
        setShowDropdown(false);

        setQuery(fullName);
        localStorage.setItem('dashboard_last_search', fullName);
        // Save locationId for later use with Search button and breadcrumb loading
        if (location.locationId) {
            localStorage.setItem('dashboard_last_locationId', location.locationId);
        }

        // Removed immediate navigation
    };

    const handleSelectHotel = (hotel) => {
        const name = hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';

        // Construct full name with location context
        let fullName = name;
        if (hotel.locationBreadcrumbs && hotel.locationBreadcrumbs.length > 0) {
            const parts = hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            const context = parts.reverse().join(', ');
            fullName = `${name}, ${context}`;
        } else if (hotel.countryCode) {
            fullName = `${name}, ${hotel.countryCode}`;
        }

        // Close dropdown FIRST before updating query to prevent reopening
        isUserInteraction.current = false;
        setShowDropdown(false);

        setQuery(fullName);
        localStorage.setItem('dashboard_last_search', fullName);

        // Removed immediate navigation
    };

    const getRegionName = (region) => {
        // Use breadcrumbs if available to show full path
        if (region.locationBreadcrumbs && region.locationBreadcrumbs.length > 0) {
            const parts = region.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName);
            return parts.reverse().join(', ');
        }
        return region.name.translations.en || Object.values(region.name.translations)[0] || 'Unknown Region';
    };

    const getHotelName = (hotel) => hotel.name.translations.en || Object.values(hotel.name.translations)[0] || 'Hotel';

    // -- Room Manipulators --
    const updateRoom = (index, field, value) => {
        const newRooms = [...roomState];
        newRooms[index] = { ...newRooms[index], [field]: value };

        if (field === 'children') {
            const diff = value - newRooms[index].childAges.length;
            if (diff > 0) {
                newRooms[index].childAges = [...newRooms[index].childAges, ...Array(diff).fill(0)];
            } else if (diff < 0) {
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
        <div className="hidden xl:flex items-center bg-slate-100 dark:bg-[#233648] rounded-xl px-2 py-1 gap-2 border border-slate-200 dark:border-transparent relative">

            {/* 1. Destination / Query */}
            <div className="flex items-center px-3 border-r border-slate-300 dark:border-slate-600 relative" ref={searchWrapperRef}>
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">location_on</span>
                <input
                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-xs w-[300px] font-medium text-slate-900 dark:text-white placeholder:text-slate-500 p-0"
                    placeholder="Where to?"
                    type="text"
                    value={query}
                    onChange={(e) => {
                        isUserInteraction.current = true;
                        setQuery(e.target.value);
                    }}
                    onClick={() => {
                        if (query) setQuery('');
                    }}
                    onFocus={() => { if (results.hotels.length || results.regions.length) setShowDropdown(true); }}
                    onKeyDown={handleKeyDown}
                />

                {/* Autocomplete Dropdown */}
                {showDropdown && (results.hotels.length > 0 || results.regions.length > 0) && (
                    <div className="absolute top-full left-0 w-[400px] mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl max-h-80 overflow-y-auto z-[1200]">
                        {results.regions.length > 0 && (
                            <div className="p-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Destinations</div>
                                {results.regions.map((region, index) => (
                                    <button
                                        key={region.locationId}
                                        onClick={() => handleSelectLocation(region)}
                                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg flex items-center gap-3 transition-colors group ${activeIndex === index ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-primary/20' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                            <span className="material-icons-round text-sm">location_on</span>
                                        </div>
                                        <div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{region.name.translations.en || region.name.defaultName}</div>
                                                <div className="text-[10px] text-slate-400">{getRegionName(region)}</div>
                                            </div>
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
                                {results.hotels.map((hotel, index) => (
                                    <button
                                        key={hotel.hotelId}
                                        onClick={() => handleSelectHotel(hotel)}
                                        className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg flex items-center gap-3 transition-colors group ${activeIndex === (results.regions.length + index) ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-primary/20' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                            <span className="material-icons-round text-sm">hotel</span>
                                        </div>
                                        <div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{getHotelName(hotel)}</div>
                                                <div className="text-[10px] text-slate-400">
                                                    {hotel.locationBreadcrumbs ?
                                                        hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName).reverse().slice(1, 3).join(', ')
                                                        : hotel.countryCode}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Date Picker */}
            <div className="flex items-center px-3 border-r border-slate-300 dark:border-slate-600 cursor-pointer" onClick={() => datePickerRef.current?.setOpen(true)}>
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">calendar_month</span>
                <div className="w-[210px]">
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
                        className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full p-0 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 font-medium"
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

            {/* Nationality Selector */}
            <NationalitySelect
                value={nationality}
                onChange={setNationality}
                compact={true}
            />

            {/* 3. Guests Dropdown */}
            <div className="flex items-center px-3 relative" ref={guestWrapperRef}>
                <span className="material-symbols-outlined text-slate-400 text-xl mr-2">group</span>
                <button
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="bg-transparent border-none focus:ring-0 text-xs min-w-[80px] text-left text-slate-900 dark:text-white font-medium whitespace-nowrap"
                >
                    {totalAdults} Adults, {totalChildren} Child{totalChildren !== 1 ? 'ren' : ''}
                </button>

                {/* Guest Dropdown Panel */}
                {showGuestDropdown && (
                    <div className="absolute top-full right-0 mt-4 w-[340px] bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl p-4 z-[1200] overflow-y-auto max-h-[80vh]">
                        {roomState.map((room, index) => (
                            <div key={index} className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:mb-0 last:pb-0 last:border-0 relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Room {index + 1}</div>
                                    {roomState.length > 1 && (
                                        <button
                                            onClick={() => removeRoom(index)}
                                            className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Adults */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Adults</div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))}
                                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <span className="material-icons-round text-sm">remove</span>
                                        </button>
                                        <span className="w-4 text-center text-sm font-bold">{room.adults}</span>
                                        <button
                                            onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))}
                                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <span className="material-icons-round text-sm">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">Children</div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))}
                                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <span className="material-icons-round text-sm">remove</span>
                                        </button>
                                        <span className="w-4 text-center text-sm font-bold">{room.children}</span>
                                        <button
                                            onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))}
                                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                        >
                                            <span className="material-icons-round text-sm">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Child Ages */}
                                {room.children > 0 && (
                                    <div className="mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Child Ages</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {room.childAges.map((age, ageIndex) => (
                                                <select
                                                    key={ageIndex}
                                                    value={age}
                                                    onChange={(e) => updateChildAge(index, ageIndex, e.target.value)}
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
                            </div>
                        ))}

                        {/* Add Room Button */}
                        {roomState.length < 5 && (
                            <button
                                onClick={addRoom}
                                className="w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-base">add_circle</span>
                                Add Another Room
                            </button>
                        )}
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
