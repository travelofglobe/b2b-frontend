import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms } from '../utils/searchParamsUtils';

import NationalitySelect from './NationalitySelect';

const DashboardSearch = ({ initialQuery = '' }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initialize state from URL params or defaults
    const [query, setQuery] = useState(() => {
        return initialQuery || searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Nationality State
    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || 'TR';
    });

    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Default dates: Check-in tomorrow, Check-out day after tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const parseDateParam = (param) => {
        if (!param) return null;
        const [day, month, year] = param.split('-').map(Number);
        if (day && month && year) {
            return new Date(year, month - 1, day);
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
            navigate(`/hotels/${slug}?${getUrlParams()}`);
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
        setQuery(fullName);
        const slug = name.toLowerCase().replace(/ /g, '-');
        navigate(`/hotels/${slug}?${getUrlParams(fullName)}`);
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
        setQuery(fullName);
        navigate(`/hotel/${hotel.url}?${getUrlParams(fullName)}`);
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
                            placeholder="Search for cities, hotels, or regions..."
                            type="text"
                            value={query}
                            onChange={(e) => {
                                isUserInteraction.current = true;
                                setQuery(e.target.value);
                                if (error) setError(false);
                            }}
                            onClick={() => {
                                if (query) setQuery('');
                            }}
                            onFocus={() => { if (results.hotels.length || results.regions.length) setShowDropdown(true); }}
                        />
                        {loading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showDropdown && (results.hotels.length > 0 || results.regions.length > 0) && (
                        <div className="absolute top-full left-0 w-full md:w-[450px] mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl max-h-80 overflow-y-auto z-50">
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
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{region.name.translations.en || region.name.defaultName}</div>
                                                <div className="text-[10px] text-slate-400">{getRegionName(region)}</div>
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
                                                <div className="text-[10px] text-slate-400">
                                                    {hotel.locationBreadcrumbs ?
                                                        hotel.locationBreadcrumbs.map(b => b.name.translations.en || b.name.defaultName).reverse().slice(1, 3).join(', ')
                                                        : hotel.countryCode}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Date Picker */}
                <div className="md:col-span-3 space-y-1.5 z-10">
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
                                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full p-0 text-xs text-slate-900 dark:text-white font-medium cursor-pointer placeholder-slate-400"
                                dateFormat="dd-MM-yyyy"
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

                {/* Nationality Selector */}
                <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Nationality</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
                        <NationalitySelect
                            value={nationality}
                            onChange={setNationality}
                            compact={false}
                        />
                    </div>
                </div>

                {/* Guest Selector */}
                <div className="md:col-span-2 space-y-1.5 relative" ref={guestWrapperRef}>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 ml-1">Guests & Rooms</label>
                    <button
                        onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-primary hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all text-left"
                    >
                        <span className="material-icons-round text-slate-400 text-lg">group</span>
                        <div className="flex flex-col flex-1 items-start overflow-hidden">
                            <span className="text-xs font-medium text-slate-900 dark:text-white truncate w-full">
                                {totalAdults} Adults, {totalChildren} Child{totalChildren !== 1 ? 'ren' : ''}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate w-full">
                                {totalRooms} Room{totalRooms > 1 ? 's' : ''}
                            </span>
                        </div>
                        <span className="material-icons-round text-slate-400 text-base">expand_more</span>
                    </button>
                    {showGuestDropdown && (
                        <div className="absolute top-full right-0 w-[350px] mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xl p-4 z-50 overflow-y-auto max-h-[80vh]">
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
                                        <div className="text-sm text-slate-700 dark:text-slate-200 font-bold">Adults</div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))}
                                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-icons-round text-sm">remove</span>
                                            </button>
                                            <span className="w-4 text-center text-sm font-bold">{room.adults}</span>
                                            <button
                                                onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))}
                                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-icons-round text-sm">add</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Children */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm text-slate-700 dark:text-slate-200 font-bold">Children</div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))}
                                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-icons-round text-sm">remove</span>
                                            </button>
                                            <span className="w-4 text-center text-sm font-bold">{room.children}</span>
                                            <button
                                                onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))}
                                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-colors"
                                            >
                                                <span className="material-icons-round text-sm">add</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Child Ages */}
                                    {room.children > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                            {room.childAges.map((age, ageIndex) => (
                                                <div key={ageIndex} className="flex flex-col">
                                                    <label className="text-[9px] text-slate-400 font-bold mb-1">Child {ageIndex + 1}</label>
                                                    <select
                                                        value={age}
                                                        onChange={(e) => updateChildAge(index, ageIndex, e.target.value)}
                                                        className="w-full h-8 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs px-1 focus:border-primary focus:ring-0"
                                                    >
                                                        {[...Array(18)].map((_, i) => (
                                                            <option key={i} value={i}>{i} yr</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
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
                <div className="md:col-span-2 flex items-end">
                    <button
                        onClick={handleSearch}
                        className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl border border-transparent shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs"
                    >
                        <span className="material-icons-round text-lg">search</span> Search
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DashboardSearch;
