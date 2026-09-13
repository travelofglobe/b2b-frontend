import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { tr, enUS, enGB, de, ru, ar, es, fr, it, pt, nl, pl, uk, bg, zhCN, ja, faIR, el } from 'date-fns/locale';
import HolidaySidePanel from "./HolidaySidePanel";
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
import { useHolidays } from '../utils/useHolidays';
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms, validateAndSanitizeDates, resolveKnownCoordinates } from '../utils/searchParamsUtils';
import { useTranslation } from 'react-i18next';

import { getUserCountryCode } from '../utils/geoUtils';
import NationalitySelect from './NationalitySelect';
import GoogleFlightDatePicker, { formatGoogleFlightDate } from './GoogleFlightDatePicker';

// Rest of imports...

// Register dynamic locales
import { registerLocale } from 'react-datepicker';
registerLocale('en', enUS);
registerLocale('tr', tr);
registerLocale('es', es);
registerLocale('ru', ru);
registerLocale('zhCN', zhCN);
registerLocale('ja', ja);
registerLocale('faIR', faIR);
registerLocale('fr', fr);
registerLocale('it', it);
registerLocale('el', el);
registerLocale('pt', pt);
registerLocale('ar', ar);

import { getSearchLocale } from '../utils/searchLocales';

const DashboardSearch = () => {
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase();
    const ls = getSearchLocale(currentLang);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initialize state from URL params or defaults
    const [query, setQuery] = useState(() => {
        return searchParams.get('q') || localStorage.getItem('dashboard_last_search') || '';
    });

    // Nationality State
    const [nationality, setNationality] = useState(() => {
        return searchParams.get('nationality') || localStorage.getItem('dashboard_last_nationality') || localStorage.getItem('agency_country_code') || getUserCountryCode();
    });

    const [destinationCountryCode, setDestinationCountryCode] = useState(() => localStorage.getItem('dashboard_last_countryCode') || null);
    const [visibleMonth, setVisibleMonth] = useState(new Date());

    // Resolve country code for holidays: destination > nationality > agency > user location > 'TR'
    const holidayCountryCode = destinationCountryCode || nationality || localStorage.getItem('agency_country_code') || getUserCountryCode() || 'TR';
    const { holidays } = useHolidays(holidayCountryCode);

    const renderDayContents = (day, date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const holiday = holidays.find((h) => h.date === dateStr);
        const dayClass = holiday ? "holiday-day" : "";
        return <div className={dayClass}>{day}</div>;
    };

    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchHistory, setSearchHistory] = useState([]);

    const fetchSearchHistory = async () => {
        try {
            const res = await autocompleteService.getSearchHistory();
            const items = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            if (Array.isArray(items)) {
                setSearchHistory(items);
                
                if (items.length > 0) {
                    setQuery(prev => {
                        if (!prev) {
                            const mostRecent = items[0];
                            const queryToSet = mostRecent.query || mostRecent.name || '';
                            
                            const itemType = mostRecent.type || mostRecent.searchType || 'SEARCH';
                            localStorage.setItem('dashboard_last_search', queryToSet);
                            localStorage.setItem('dashboard_last_type', itemType);
                            
                            if (mostRecent.targetId) {
                                if (itemType === 'LOCATION') {
                                    localStorage.setItem('dashboard_last_locationId', mostRecent.targetId);
                                } else if (itemType === 'HOTEL') {
                                    localStorage.setItem('dashboard_last_hotelId', mostRecent.targetId);
                                }
                            }
                            return queryToSet;
                        }
                        return prev;
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching search history:", err);
        }
    };

    useEffect(() => {
        fetchSearchHistory();
    }, []);

    const handleClearHistory = async (e) => {
        if (e) e.stopPropagation();
        try {
            await autocompleteService.clearSearchHistory();
            setSearchHistory([]);
        } catch (err) {
            console.error("Error clearing search history:", err);
        }
    };

    const saveSearchHistoryItem = async (q, type, targetId, subtitle) => {
        if (!q || !q.trim()) return;
        try {
            await autocompleteService.saveSearchHistory({
                query: q.trim(),
                searchType: type || 'SEARCH',
                targetId: targetId ? String(targetId) : null,
                subtitle: subtitle || null
            });
            fetchSearchHistory();
        } catch (err) {
            console.error("Error saving search history:", err);
        }
    };

    const handleSelectHistoryItem = async (item) => {
        const itemType = item.type || item.searchType || 'SEARCH';
        setQuery(item.query);
        setResults({ hotels: [], regions: [] });
        isUserInteraction.current = false;
        setShowDropdown(false);
        saveSearchHistoryItem(item.query, itemType, item.targetId, item.subtitle);

        localStorage.setItem('dashboard_last_search', item.query);
        localStorage.setItem('dashboard_last_type', itemType);

        let knownCoords = resolveKnownCoordinates(item.query) || resolveKnownCoordinates(item.subtitle);

        if (!knownCoords && itemType !== 'HOTEL') {
            try {
                const res = await autocompleteService.search({ query: item.query, page: 0, size: 5 });
                const content = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : []);
                const match = content?.find(c => c.geoCoordinate?.lat && (c.geoCoordinate?.lon || c.geoCoordinate?.lng));
                if (match) {
                    const lat = match.geoCoordinate.lat;
                    const lng = match.geoCoordinate.lon || match.geoCoordinate.lng;
                    knownCoords = { lat, lng };
                }
            } catch (err) {
                console.error("Error fetching coordinates for history item:", err);
            }
        }

        if (knownCoords) {
            localStorage.setItem('dashboard_last_lat', knownCoords.lat);
            localStorage.setItem('dashboard_last_lng', knownCoords.lng);
        } else {
            localStorage.removeItem('dashboard_last_lat');
            localStorage.removeItem('dashboard_last_lng');
        }

        if (item.targetId) {
            if (itemType === 'LOCATION') {
                localStorage.setItem('dashboard_last_locationId', item.targetId);
            } else if (itemType === 'HOTEL') {
                localStorage.setItem('dashboard_last_hotelId', item.targetId);
            }
        }
    };

    const handleDeleteHistoryItem = async (e, id) => {
        if (e) e.stopPropagation();
        if (!id) return;
        try {
            await autocompleteService.deleteSearchHistoryItem(id);
            setSearchHistory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Error deleting search history item:", err);
        }
    };

    // Reset active index when results change
    useEffect(() => {
        setActiveIndex(-1);
    }, [results]);

    // Initialize & sanitize search dates (guarantees checkIn is not in the past and checkOut > checkIn)
    const [checkInDate, setCheckInDate] = useState(() => {
        const checkinParam = searchParams.get('checkin') || localStorage.getItem('dashboard_last_checkin');
        const checkoutParam = searchParams.get('checkout') || localStorage.getItem('dashboard_last_checkout');
        return validateAndSanitizeDates(checkinParam, checkoutParam).checkInDate;
    });

    const [checkOutDate, setCheckOutDate] = useState(() => {
        const checkinParam = searchParams.get('checkin') || localStorage.getItem('dashboard_last_checkin');
        const checkoutParam = searchParams.get('checkout') || localStorage.getItem('dashboard_last_checkout');
        return validateAndSanitizeDates(checkinParam, checkoutParam).checkOutDate;
    });

    // -- Guest State --
    const [roomState, setRoomState] = useState(() => {
        const guestsParam = searchParams.get('guests') || localStorage.getItem('dashboard_last_guests');
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
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDateField, setActiveDateField] = useState('checkIn'); // 'checkIn' | 'checkOut'

    const stepCheckIn = (days) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(checkInDate || today);
        target.setDate(target.getDate() + days);
        if (target < today) return;
        setCheckInDate(target);
        if (checkOutDate && target >= checkOutDate) {
            const nextOut = new Date(target);
            nextOut.setDate(nextOut.getDate() + 1);
            setCheckOutDate(nextOut);
        }
    };

    const stepCheckOut = (days) => {
        const target = new Date(checkOutDate || new Date());
        target.setDate(target.getDate() + days);
        if (checkInDate && target <= checkInDate) return;
        setCheckOutDate(target);
    };

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

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('dashboard_last_nationality', nationality);
    }, [nationality]);

    useEffect(() => {
        if (checkInDate) {
            localStorage.setItem('dashboard_last_checkin', `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`);
        }
    }, [checkInDate]);

    useEffect(() => {
        if (checkOutDate) {
            localStorage.setItem('dashboard_last_checkout', `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth() + 1).padStart(2, '0')}-${String(checkOutDate.getDate()).padStart(2, '0')}`);
        }
    }, [checkOutDate]);

    useEffect(() => {
        localStorage.setItem('dashboard_last_guests', serializeGuestsParam(roomState));
    }, [roomState]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const data = await autocompleteService.search({ query, types: ['HOTEL', 'LOCATION'] });
            const resultsData = data?.data || data;
            
            if (resultsData) {
                const items = resultsData.content || [];
                const hotels = items.filter(item => item.type === 'HOTEL');
                const regions = items.filter(item => item.type === 'LOCATION');
                setResults({ hotels, regions });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateForUrl = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    const buildLocationSlug = (location) => {
        if (location.locationBreadcrumbs && location.locationBreadcrumbs.length > 0) {
            // parts: [Country, City, District] (hierarchical order from API)
            const breadcrumbs = location.locationBreadcrumbs.map(b => (b.name?.translations?.[currentLang] || b.name?.translations?.en || b.name?.defaultName || '').toLowerCase());
            
            // If more than 1 part (e.g., City exists), skip Country (at index 0)
            if (breadcrumbs.length > 1) {
                return breadcrumbs.slice(1).join('/');
            }
            // Just one part
            return breadcrumbs[0];
        }
        return (location.name?.translations?.[currentLang] || location.name?.translations?.en || Object.values(location.name?.translations || {})[0] || 'destination').toLowerCase();
    };

    const handleSearch = () => {
        if (!query.trim()) {
            setError(true);
            return;
        }

        if (query) {
            const savedLastSearch = localStorage.getItem('dashboard_last_search');
            const savedLastType = localStorage.getItem('dashboard_last_type');
            const savedLastHotelId = localStorage.getItem('dashboard_last_hotelId');

            if (query !== savedLastSearch) {
                saveSearchHistoryItem(query, 'SEARCH', null, null);
                localStorage.setItem('dashboard_last_search', query);
                localStorage.setItem('dashboard_last_type', 'SEARCH');
                localStorage.removeItem('dashboard_last_hotelId');
                localStorage.removeItem('dashboard_last_locationId');
            }

            if (savedLastType === 'HOTEL' && query === savedLastSearch && savedLastHotelId) {
                const searchParamsString = getUrlParams();
                navigate(`/travel/hotels/detail/${savedLastHotelId}?${searchParamsString}`);
                return;
            }
            
            // If query contains commas, try to build a hierarchical slug
            // e.g. "Üsküdar, İstanbul, Türkiye" -> ["Üsküdar", "İstanbul", "Türkiye"]
            const queryParts = query.split(',').map(p => p.trim().toLowerCase());
            let slug = query.toLowerCase();
            
            if (queryParts.length >= 2) {
                // If 3 parts: [District, City, Country] -> slug "istanbul/uskudar"
                // If 2 parts: [City, Country] -> slug "istanbul"
                const reversed = queryParts.reverse(); // [Country, City, District]
                slug = reversed.slice(1).join('/');
            }

            // Retrieve locationId & coordinates from localStorage if they exist
            const savedLocationId = localStorage.getItem('dashboard_last_locationId');
            const savedLat = localStorage.getItem('dashboard_last_lat');
            const savedLng = localStorage.getItem('dashboard_last_lng');
            const locationParam = savedLocationId ? `&locationId=${savedLocationId}` : '';
            const geoParam = (savedLat && savedLng) ? `&lat=${savedLat}&lng=${savedLng}` : '';
            const searchParamsString = getUrlParams() + locationParam + geoParam;

            localStorage.setItem('last_hotel_search_slug', slug);
            localStorage.setItem('last_hotel_search_params', searchParamsString);

            navigate(`/travel/hotels/search/${slug}?${searchParamsString}`);
        }
    };

    const handleSelectLocation = (location) => {
        // Helper to get English name or fallback
        const name = location.name?.translations?.[currentLang] || location.name?.translations?.en || Object.values(location.name?.translations || {})[0] || 'destination';

        // Construct full name from breadcrumbs for display
        let fullName = name;
        if (location.locationBreadcrumbs && location.locationBreadcrumbs.length > 0) {
            const parts = location.locationBreadcrumbs.map(b => b.name?.translations?.[currentLang] || b.name?.translations?.en || b.name?.defaultName);
            fullName = parts.reverse().join(', ');
        }

        saveSearchHistoryItem(fullName, 'LOCATION', location.locationId, getRegionName(location));

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', 'LOCATION');
        // Save locationId for later use with Search button
        if (location.locationId) {
            localStorage.setItem('dashboard_last_locationId', location.locationId);
        }

        let latVal = location.geoCoordinate?.lat || location.geoCoordinate?.latitude || location.lat || location.latitude;
        let lngVal = location.geoCoordinate?.lon || location.geoCoordinate?.lng || location.geoCoordinate?.longitude || location.lng || location.lon || location.longitude;

        if (!latVal || !lngVal) {
            const fallbackCoords = resolveKnownCoordinates(fullName) || resolveKnownCoordinates(name) || resolveKnownCoordinates(location.locationPath);
            if (fallbackCoords) {
                latVal = fallbackCoords.lat;
                lngVal = fallbackCoords.lng;
            }
        }

        if (latVal && lngVal) {
            localStorage.setItem('dashboard_last_lat', latVal);
            localStorage.setItem('dashboard_last_lng', lngVal);
        } else {
            localStorage.removeItem('dashboard_last_lat');
            localStorage.removeItem('dashboard_last_lng');
        }

        const countryCode = location.countryCode || (location.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        // Generate hierarchical slug
        const slug = buildLocationSlug(location);

        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
        setShowDropdown(false);

        setQuery(fullName);
        
        const locationParam = location.locationId ? `&locationId=${location.locationId}` : '';
        const geoParam = (latVal && lngVal) ? `&lat=${latVal}&lng=${lngVal}` : '';
        const searchParamsString = getUrlParams(fullName) + locationParam + geoParam;

        localStorage.setItem('last_hotel_search_slug', slug);
        localStorage.setItem('last_hotel_search_params', searchParamsString);
    };

    const handleSelectHotel = (hotel) => {
        const name = getHotelName(hotel);

        // Construct full name with location context
        let fullName = name;
        let locationContext = '';
        if (hotel.locationBreadcrumbs && hotel.locationBreadcrumbs.length > 0) {
            const parts = hotel.locationBreadcrumbs.map(b => b.name?.translations?.[currentLang] || b.name?.translations?.en || b.name?.defaultName);
            locationContext = parts.reverse().join(', ');
            fullName = `${name}, ${locationContext}`;
        } else if (hotel.countryCode) {
            locationContext = hotel.countryCode;
            fullName = `${name}, ${hotel.countryCode}`;
        }

        const hId = hotel.hotelId || hotel.id?.replace('hotel_', '');
        saveSearchHistoryItem(fullName, 'HOTEL', hId, locationContext);

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', 'HOTEL');
        localStorage.setItem('dashboard_last_hotelId', hId);

        const countryCode = hotel.countryCode || (hotel.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
        setShowDropdown(false);

        setQuery(fullName);

        const searchParamsString = getUrlParams(fullName);

        localStorage.setItem('last_hotel_search_slug', hotel.url || hId);
        localStorage.setItem('last_hotel_search_params', searchParamsString);
    };

    // Helper to get Hotel Name
    const getHotelName = (hotel) => {
        return hotel.name?.translations?.[currentLang] || hotel.name?.translations?.en || Object.values(hotel.name?.translations || {})[0] || 'Hotel';
    };

    // Helper to get Region Name
    const getRegionName = (region) => {
        if (region.locationBreadcrumbs && region.locationBreadcrumbs.length > 0) {
            const parts = region.locationBreadcrumbs.map(b => b.name?.translations?.[currentLang] || b.name?.translations?.en || b.name?.defaultName);
            return parts.reverse().join(', ');
        }
        return region.name?.translations?.[currentLang] || region.name?.translations?.en || Object.values(region.name?.translations || {})[0] || 'Unknown Region';
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

    const matchingHistory = query.trim()
        ? searchHistory.filter(item => item.query.toLowerCase().includes(query.toLowerCase().trim()))
        : searchHistory;

    const hasAnyResults = matchingHistory.length > 0 || results.regions.length > 0 || results.hotels.length > 0 || loading;

    return (
        <section className="relative group/search w-full flex flex-col items-center">
            <div className="relative w-full max-w-[1024px] bg-white dark:bg-[#202124] rounded-lg shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] px-4 pt-2 pb-10 border-none transition-all duration-300">
                
                {/* Top Options (Guests) - Google Flights style */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 relative z-[60]">
                    {/* Elegant Guest Selector */}
                    <div className="relative group/field" ref={guestWrapperRef}>
                        <button
                            type="button"
                            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium text-[13.5px] transition-colors cursor-pointer select-none ${
                                showGuestDropdown
                                    ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] rounded-t border-b-2 border-[#1a73e8]'
                                    : 'text-[#3c4043] dark:text-slate-200 hover:text-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] rounded border-b-2 border-transparent'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#1a73e8] dark:text-[#8ab4f8]">person</span>
                            <span>{totalAdults + totalChildren}</span>
                            <span className={`material-symbols-outlined text-[19px] ${showGuestDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>
                                {showGuestDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {/* Guest Dropdown - Google Flights Style */}
                        {showGuestDropdown && (
                            <div className="absolute top-full left-0 mt-0 w-80 sm:w-[340px] bg-white dark:bg-[#202124] rounded-b-lg rounded-tr-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] p-4 sm:p-5 z-[200] animate-in fade-in duration-150">
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-4">
                                    {roomState.map((room, index) => (
                                        <div key={index} className="pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                            {roomState.length > 1 && (
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">{ls.roomSingle} {index + 1}</span>
                                                    <button type="button" onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 text-[12px] font-medium px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">{ls.remove}</button>
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col gap-4">
                                                {/* Adults Row */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">{ls.adults}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))} 
                                                            disabled={room.adults <= 1}
                                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{room.adults}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))} 
                                                            disabled={room.adults >= 6} 
                                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Children Row */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-[13px] font-normal text-[#202124] dark:text-white">{ls.children}</div>
                                                        <div className="text-[11px] text-[#70757a] dark:text-slate-400 leading-tight">{ls.childrenAge}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))} 
                                                            disabled={room.children <= 0}
                                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-[13px] font-normal text-[#202124] dark:text-white">{room.children}</span>
                                                        <button 
                                                            type="button"
                                                            onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))} 
                                                            disabled={room.children >= 4} 
                                                            className="size-8 rounded-[4px] flex items-center justify-center transition-colors select-none disabled:bg-[#f1f3f4] disabled:text-[#bdc1c6] dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] dark:bg-[#1a73e8]/20 dark:text-[#8ab4f8] cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Child Ages */}
                                                {room.children > 0 && (
                                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                                        {room.childAges.map((age, ageIdx) => (
                                                            <div key={ageIdx} className="flex flex-col gap-1">
                                                                <span className="text-[11px] text-[#70757a] dark:text-slate-400">{ls.children} {ageIdx + 1} {ls.years}</span>
                                                                <select
                                                                    value={age}
                                                                    onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                                    className="w-full h-8 bg-white dark:bg-[#303134] rounded-[4px] border border-[#dadce0] dark:border-slate-600 text-[13px] px-2 focus:border-[#1a73e8] focus:ring-0 outline-none text-[#202124] dark:text-white cursor-pointer"
                                                                >
                                                                    {[...Array(18)].map((_, i) => <option key={i} value={i}>{i} {ls.years}</option>)}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {roomState.length < 5 && (
                                        <button type="button" onClick={addRoom} className="mt-3 text-[13px] text-[#1a73e8] dark:text-[#8ab4f8] font-medium hover:underline flex items-center cursor-pointer">
                                            <span className="material-symbols-outlined text-[18px] mr-1">add</span>
                                            {ls.addRoom}
                                        </button>
                                    )}
                                </div>

                                {/* Google Flights Style Footer */}
                                <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        type="button"
                                        onClick={() => setShowGuestDropdown(false)} 
                                        className="px-4 py-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] rounded cursor-pointer transition-colors"
                                    >
                                        {ls.cancel || 'Cancel'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setShowGuestDropdown(false)} 
                                        className="px-4 py-1.5 text-[13px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-[#f8fafd] dark:hover:bg-[#303134] rounded cursor-pointer transition-colors"
                                    >
                                        {ls.done || 'Done'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Search Input Row (Single Line: Destination Input + Nationality Input + Google Flights Twin Datepicker) */}
                <div className={`w-full flex flex-col md:flex-row items-stretch gap-2.5 sm:gap-3 relative ${isDatePickerOpen ? 'z-[100]' : 'z-50'}`}>
                    
                    {/* Destination Input (Flex-1 fills remaining space) */}
                    <div className="flex-1 min-w-0 relative group/field h-14 flex items-center border border-[#dadce0] dark:border-slate-600 rounded-[4px] bg-white dark:bg-[#303134] hover:border-[#bdc1c6] focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all font-roboto" ref={searchWrapperRef}>
                        <div className="flex items-center gap-3 h-full w-full px-3.5 sm:px-4">
                            <span className="material-symbols-outlined text-[19px] text-[#5f6368] dark:text-slate-400 flex-shrink-0">
                                {error ? 'error' : 'location_on'}
                            </span>
                            <input
                                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full p-0 text-[14px] font-normal text-[#202124] dark:text-white placeholder-[#70757a] dark:placeholder-slate-400 tracking-normal leading-normal truncate"
                                placeholder={ls.placeholder || "Nereye?"}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    isUserInteraction.current = true;
                                    setQuery(e.target.value);
                                    if (error) setError(false);
                                }}
                                onClick={(e) => {
                                    e.target.select();
                                    fetchSearchHistory();
                                    setShowDropdown(true);
                                }}
                                onFocus={() => {
                                    fetchSearchHistory();
                                    setShowDropdown(true);
                                }}
                                onKeyDown={handleKeyDown}
                            />
                            {loading && <div className="size-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>}
                        </div>

                        {/* Autocomplete Dropdown - Google Style */}
                        {showDropdown && hasAnyResults && (
                            <div className="absolute top-[calc(100%+6px)] left-0 w-full lg:w-[480px] bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] max-h-[440px] overflow-y-auto z-[300] py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                {/* 1. Past Searches Section */}
                                {matchingHistory.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-[#f1f3f4] dark:border-[#3c4043] mb-1">
                                            <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">Son Aramalar</span>
                                            {!query.trim() && (
                                                <button onClick={handleClearHistory} className="text-[11px] font-medium text-[#1a73e8] hover:underline transition-colors">Temizle</button>
                                            )}
                                        </div>
                                        <div>
                                            {matchingHistory.map((item, index) => {
                                                const itemType = item.type || item.searchType || 'SEARCH';
                                                let icon = 'history';
                                                if (itemType === 'LOCATION') icon = 'location_on';
                                                else if (itemType === 'HOTEL') icon = 'hotel';
                                                else if (itemType === 'AIRPORT') icon = 'flight';

                                                let title = item.query || '';
                                                let subtitle = item.subtitle || '';

                                                if (!subtitle || subtitle === title) {
                                                    if (title.includes(',')) {
                                                        const parts = title.split(',').map(s => s.trim());
                                                        title = parts[0];
                                                        subtitle = parts.slice(1).join(', ');
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={item.id || index}
                                                        onClick={() => handleSelectHistoryItem(item)}
                                                        className="w-full text-left px-4 py-3 min-h-[52px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors group cursor-pointer"
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1 mr-3">
                                                            <span className="material-symbols-outlined text-[19px] text-[#5f6368] dark:text-[#9aa0a6] mr-3.5 shrink-0 select-none">
                                                                {icon}
                                                            </span>
                                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                <div className="text-[14px] font-normal text-[#202124] dark:text-white leading-tight truncate">
                                                                    {title}
                                                                </div>
                                                                {subtitle && (
                                                                    <div className="text-[12px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                        {subtitle}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[#70757a] hover:text-[#d93025] dark:hover:text-red-400 rounded-full transition-all shrink-0 ml-2 cursor-pointer"
                                                            title="Sil"
                                                        >
                                                            <span className="material-symbols-outlined text-[17px] leading-none block">close</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Locations Section */}
                                {results.regions.length > 0 && (
                                    <div className={matchingHistory.length > 0 ? "border-t border-[#f1f3f4] dark:border-[#3c4043] pt-1" : ""}>
                                        <div className="px-4 pt-2 pb-1">
                                            <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">{ls.popularDestinations || 'Popüler Noktalar'}</span>
                                        </div>
                                        <div>
                                            {results.regions.map((region, index) => {
                                                const rawName = region.name?.translations?.[currentLang] || region.name?.translations?.en || region.name?.defaultName || '';
                                                const rawSub = getRegionName(region);

                                                let title = rawName;
                                                let subtitle = rawSub;

                                                if (rawSub === rawName) {
                                                    if (rawName.includes(',')) {
                                                        const parts = rawName.split(',').map(s => s.trim());
                                                        title = parts[0];
                                                        subtitle = parts.slice(1).join(', ');
                                                    } else {
                                                        subtitle = region.countryCode ? `${region.countryCode}` : (ls.cityRegion || 'City / Region');
                                                    }
                                                } else if (rawSub.startsWith(rawName + ', ')) {
                                                    subtitle = rawSub.slice(rawName.length + 2);
                                                }

                                                const lowerTitle = title.toLowerCase();
                                                let icon = 'location_on';
                                                if (lowerTitle.includes('airport') || lowerTitle.includes('havalimanı') || lowerTitle.includes('havaalanı')) {
                                                    icon = 'flight';
                                                } else if (lowerTitle.includes('tren') || lowerTitle.includes('train') || lowerTitle.includes('istasyon') || lowerTitle.includes('station')) {
                                                    icon = 'train';
                                                }

                                                return (
                                                    <button
                                                        key={region.locationId}
                                                        type="button"
                                                        onClick={() => handleSelectLocation(region)}
                                                        className={`w-full text-left px-4 py-3 min-h-[52px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group ${activeIndex === index ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1">
                                                            <span className="material-symbols-outlined text-[19px] text-[#5f6368] dark:text-[#9aa0a6] mr-3.5 shrink-0 select-none">
                                                                {icon}
                                                            </span>
                                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                <div className="text-[14px] font-normal text-[#202124] dark:text-white leading-tight truncate">
                                                                    {title}
                                                                </div>
                                                                {subtitle && (
                                                                    <div className="text-[12px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                        {subtitle}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Hotels Section */}
                                {results.hotels.length > 0 && (
                                    <div className={(matchingHistory.length > 0 || results.regions.length > 0) ? "border-t border-[#f1f3f4] dark:border-[#3c4043] pt-1" : ""}>
                                        <div className="px-4 pt-2 pb-1">
                                            <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">{ls.featuredHotels || 'Oteller'}</span>
                                        </div>
                                        <div>
                                            {results.hotels.map((hotel, index) => {
                                                const hotelTitle = getHotelName(hotel);
                                                let hotelSubtitle = hotel.locationBreadcrumbs 
                                                    ? hotel.locationBreadcrumbs.map(b => b.name?.translations?.[currentLang] || b.name?.translations?.en || b.name?.defaultName).reverse().join(', ') 
                                                    : (hotel.countryCode || '');

                                                if (hotelSubtitle.startsWith(hotelTitle + ', ')) {
                                                    hotelSubtitle = hotelSubtitle.slice(hotelTitle.length + 2);
                                                }

                                                return (
                                                    <button
                                                        key={hotel.hotelId}
                                                        type="button"
                                                        onClick={() => handleSelectHotel(hotel)}
                                                        className={`w-full text-left px-4 py-3 min-h-[52px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group ${activeIndex === (results.regions.length + index) ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1">
                                                            <span className="material-symbols-outlined text-[19px] text-[#5f6368] dark:text-[#9aa0a6] mr-3.5 shrink-0 select-none">
                                                                hotel
                                                            </span>
                                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                <div className="text-[14px] font-normal text-[#202124] dark:text-white leading-tight truncate">
                                                                    {hotelTitle}
                                                                </div>
                                                                {hotelSubtitle && (
                                                                    <div className="text-[12px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                        {hotelSubtitle}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Nationality Selector Input (Fixed clean width, matches autocomplete box style) */}
                    <div className="w-full md:w-[190px] lg:w-[210px] flex-shrink-0 relative h-14">
                        <NationalitySelect 
                            value={nationality} 
                            onChange={setNationality} 
                            inputStyle={true} 
                            onToggle={(isOpen) => {
                                if (isOpen) {
                                    setShowDropdown(false);
                                    setIsDatePickerOpen(false);
                                }
                            }}
                        />
                    </div>

                    {/* Twin Datepicker Container (Fixed clean width, guaranteed single line) */}
                    <div className={`w-full md:w-[330px] lg:w-[350px] flex-shrink-0 relative h-14 bg-white dark:bg-[#303134] flex items-center google-flight-date-trigger font-roboto ${
                        isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')
                            ? ''
                            : 'border border-[#dadce0] dark:border-slate-600 rounded-[4px] hover:border-[#bdc1c6] transition-all overflow-hidden'
                    }`}>
                        
                        {/* Check-In Half */}
                        <div
                            onClick={() => {
                                setActiveDateField('checkIn');
                                setIsDatePickerOpen(true);
                                setShowDropdown(false);
                            }}
                            className={`relative flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                isDatePickerOpen && activeDateField === 'checkIn'
                                    ? 'border-2 border-[#1a73e8] rounded-[4px] z-10 bg-white dark:bg-[#303134]'
                                    : isDatePickerOpen && activeDateField === 'checkOut'
                                    ? 'border border-[#dadce0] dark:border-slate-600 border-r-0 rounded-l-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                    : 'rounded-l-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="material-symbols-outlined text-[20px] text-[#1a73e8] dark:text-[#8ab4f8] flex-shrink-0">
                                    calendar_today
                                </span>
                                <span className="text-[13.5px] font-medium text-[#3c4043] dark:text-white truncate">
                                    {formatGoogleFlightDate(checkInDate) || ls.checkIn || 'Check-in'}
                                </span>
                            </div>

                            {/* Quick 1-day step buttons */}
                            <div className="flex items-center text-[#5f6368] dark:text-slate-300 shrink-0 ml-1">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stepCheckIn(-1); }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                    title={ls.dayBack || '1 day earlier'}
                                >
                                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stepCheckIn(1); }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                    title={ls.dayForward || '1 day later'}
                                >
                                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Middle Vertical Divider (only visible when neither half is actively focused) */}
                        {!(isDatePickerOpen && (activeDateField === 'checkIn' || activeDateField === 'checkOut')) && (
                            <div className="w-[1px] h-6 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />
                        )}

                        {/* Check-Out Half */}
                        <div
                            onClick={() => {
                                setActiveDateField('checkOut');
                                setIsDatePickerOpen(true);
                                setShowDropdown(false);
                            }}
                            className={`relative flex-1 h-full flex items-center justify-between px-3 sm:px-3.5 cursor-pointer transition-colors min-w-0 ${
                                isDatePickerOpen && activeDateField === 'checkOut'
                                    ? 'border-2 border-[#1a73e8] rounded-[4px] z-10 bg-white dark:bg-[#303134]'
                                    : isDatePickerOpen && activeDateField === 'checkIn'
                                    ? 'border border-[#dadce0] dark:border-slate-600 border-l-0 rounded-r-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                    : 'rounded-r-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/40'
                            }`}
                        >
                            <div className="flex items-center min-w-0 flex-1">
                                <span className="text-[13.5px] font-medium text-[#3c4043] dark:text-white truncate">
                                    {formatGoogleFlightDate(checkOutDate) || ls.checkOut || 'Check-out'}
                                </span>
                            </div>

                            {/* Quick 1-day step buttons */}
                            <div className="flex items-center text-[#5f6368] dark:text-slate-300 shrink-0 ml-1">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stepCheckOut(-1); }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                    title={ls.dayBack || '1 day earlier'}
                                >
                                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stepCheckOut(1); }}
                                    className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                    title={ls.dayForward || '1 day later'}
                                >
                                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Google Flights 2-Month Datepicker Popover */}
                        <GoogleFlightDatePicker
                            isOpen={isDatePickerOpen}
                            onClose={() => setIsDatePickerOpen(false)}
                            checkInDate={checkInDate}
                            checkOutDate={checkOutDate}
                            onCheckInChange={setCheckInDate}
                            onCheckOutChange={setCheckOutDate}
                            activeField={activeDateField}
                            setActiveField={setActiveDateField}
                            holidays={holidays}
                            countryCode={holidayCountryCode}
                            align="right"
                        />
                    </div>
                </div>

                {/* Overlapping Blue Search Button */}
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-[30]">
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium text-[14px] px-7 py-2.5 flex items-center justify-center gap-2 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        <span>{ls.searchBtn}</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DashboardSearch;
