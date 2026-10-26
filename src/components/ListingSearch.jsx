import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { tr, enUS, enGB, de, ru, ar, es, fr, it, pt, nl, pl, uk, bg, zhCN, ja, faIR, el } from 'date-fns/locale';
import HolidaySidePanel from "./HolidaySidePanel";
import 'react-datepicker/dist/react-datepicker.css';
import "../datepicker-custom.css";
import { useHolidays } from '../utils/useHolidays';
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms, validateAndSanitizeDates, resolveKnownCoordinates, getLocationIconMeta, buildLocationTree, getPropertyCategoryMeta, isPoiItem, resolveSearchTargetId, getItemPrimaryName, getLocationHierarchyParts, getRegionSubtitle, formatLocationFullName, buildLocationSlug } from '../utils/searchParamsUtils';
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

const ListingSearch = ({ isCompact = false }) => {
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase();
    const ls = getSearchLocale(currentLang);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const isGenericAreaText = (txt) => {
        if (!txt) return false;
        const lower = txt.trim().toLowerCase();
        return lower === 'this area' || lower === 'bu alan' || lower === 'search this area' || lower === 'listeyi güncelle';
    };

    // Initialize state from URL params or defaults
    const [query, setQuery] = useState(() => {
        const urlQ = searchParams.get('q');
        if (urlQ && !isGenericAreaText(urlQ)) return urlQ;
        const saved = localStorage.getItem('dashboard_last_search');
        if (saved && !isGenericAreaText(saved)) return saved;
        return '';
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
    const [isClearingHistory, setIsClearingHistory] = useState(false);

    const fetchSearchHistory = async () => {
        try {
            const res = await autocompleteService.getSearchHistory();
            const items = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            if (Array.isArray(items)) {
                setSearchHistory(items);
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
        if (isClearingHistory) return;
        setIsClearingHistory(true);
        try {
            await Promise.all([
                autocompleteService.clearSearchHistory(),
                new Promise(resolve => setTimeout(resolve, 350))
            ]);
            setSearchHistory([]);
        } catch (err) {
            console.error("Error clearing search history:", err);
        } finally {
            setIsClearingHistory(false);
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
            if (itemType === 'PROPERTY' || itemType === 'HOTEL') {
                localStorage.setItem('dashboard_last_search_param', 'togId');
                localStorage.setItem('dashboard_last_search_id', item.targetId);
                localStorage.setItem('dashboard_last_togId', item.targetId);
                localStorage.setItem('dashboard_last_hotelId', item.targetId);
                localStorage.removeItem('dashboard_last_regionId');
            } else {
                localStorage.setItem('dashboard_last_search_param', 'regionId');
                localStorage.setItem('dashboard_last_search_id', item.targetId);
                localStorage.setItem('dashboard_last_regionId', item.targetId);
                localStorage.removeItem('dashboard_last_togId');
            }
            localStorage.removeItem('dashboard_last_locationId');
        }

        if (itemType === 'HOTEL' && item.targetId) {
            const searchParamsString = getUrlParams({ query: item.query }) + `&togId=${item.targetId}` + (knownCoords ? `&lat=${knownCoords.lat}&lng=${knownCoords.lng}` : '');
            navigate(`/travel/hotels/detail/${item.targetId}?${searchParamsString}`);
        } else {
            const isHotel = (itemType === 'PROPERTY' || itemType === 'HOTEL');
            handleSearch({
                query: item.query,
                searchParam: isHotel ? 'togId' : 'regionId',
                searchId: item.targetId || null,
                togId: isHotel ? item.targetId : null,
                regionId: !isHotel ? item.targetId : null,
                lat: knownCoords?.lat,
                lng: knownCoords?.lng
            });
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

    // Reset active index when results, query or dropdown visibility change
    useEffect(() => {
        setActiveIndex(-1);
    }, [results, query, showDropdown]);

    // Scroll active keyboard item into view smoothly
    useEffect(() => {
        if (activeIndex >= 0) {
            const activeEl = document.querySelector('[data-autocomplete-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [activeIndex]);

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
        let nextOut = checkOutDate;
        if (checkOutDate && target >= checkOutDate) {
            nextOut = new Date(target);
            nextOut.setDate(nextOut.getDate() + 1);
            setCheckOutDate(nextOut);
        }
        handleSearch({ checkInDate: target, checkOutDate: nextOut });
    };

    const stepCheckOut = (days) => {
        const target = new Date(checkOutDate || new Date());
        target.setDate(target.getDate() + days);
        if (checkInDate && target <= checkInDate) return;
        setCheckOutDate(target);
        handleSearch({ checkInDate, checkOutDate: target });
    };

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);
    const initialGuestStateRef = useRef(null);
    const datePickerRef = useRef(null);
    const inputRef = useRef(null);

    const [error, setError] = useState(false);

    const isUserInteraction = useRef(false);
    const activeQueryRef = useRef('');
    const abortControllerRef = useRef(null);

    const [expandedNodes, setExpandedNodes] = useState({});
    const toggleExpand = (nodeId) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: prev[nodeId] === false ? true : false
        }));
    };

    // Keep checkInDate and checkOutDate synced when URL parameters change externally
    useEffect(() => {
        const checkinParam = searchParams.get('checkin');
        const checkoutParam = searchParams.get('checkout');
        if (checkinParam || checkoutParam) {
            const sanitized = validateAndSanitizeDates(checkinParam, checkoutParam);
            setCheckInDate(sanitized.checkInDate);
            setCheckOutDate(sanitized.checkOutDate);
        }
    }, [searchParams.get('checkin'), searchParams.get('checkout')]);

    // Sync query when URL 'q' param changes externally (e.g., map area search)
    useEffect(() => {
        const urlQ = searchParams.get('q');
        if (urlQ && !isGenericAreaText(urlQ) && urlQ !== query && !isUserInteraction.current) {
            setQuery(urlQ);
        }
    }, [searchParams.get('q')]);

    // Keep nationality synced when URL parameter changes externally
    useEffect(() => {
        const natParam = searchParams.get('nationality');
        if (natParam && natParam !== nationality) {
            setNationality(natParam);
        }
    }, [searchParams.get('nationality')]);

    // Keep roomState synced when URL parameter changes externally
    useEffect(() => {
        const guestsParam = searchParams.get('guests');
        if (guestsParam) {
            try {
                const parsed = parseGuestsParam(guestsParam);
                if (serializeGuestsParam(parsed) !== serializeGuestsParam(roomState)) {
                    setRoomState(parsed);
                }
            } catch (e) {
                console.error("Error parsing guests param:", e);
            }
        }
    }, [searchParams.get('guests')]);

    // Auto-search after 600ms debounce when user changes adults/children in roomState
    const isFirstGuestRender = useRef(true);
    useEffect(() => {
        if (isFirstGuestRender.current) {
            isFirstGuestRender.current = false;
            return;
        }
        const currentGuestParam = searchParams.get('guests');
        const newGuestParam = serializeGuestsParam(roomState);
        if (currentGuestParam && newGuestParam && currentGuestParam !== newGuestParam) {
            const timer = setTimeout(() => {
                handleSearch({ roomState });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [roomState]);

    // Debounce search
    useEffect(() => {
        // Only trigger search if user has interacted with the input
        if (!isUserInteraction.current) {
            return;
        }

        const trimmed = query.trim();
        if (trimmed.length < 3) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            activeQueryRef.current = '';
            setResults({ hotels: [], regions: [] });
            return;
        }

        // Clear stale results immediately when typing a new/different query
        if (activeQueryRef.current && activeQueryRef.current !== trimmed) {
            setResults({ hotels: [], regions: [] });
        }

        const timeoutId = setTimeout(() => {
            fetchResults(trimmed);
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
                setShowGuestDropdown(prev => {
                    if (prev) {
                        const currentGuestParam = searchParams.get('guests') || initialGuestStateRef.current;
                        const newGuestParam = serializeGuestsParam(roomState);
                        if (currentGuestParam && newGuestParam && currentGuestParam !== newGuestParam) {
                            handleSearch({ roomState });
                        }
                    }
                    return false;
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [roomState, searchParams]);

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

    const getCrumbsParts = (item) => {
        return getLocationHierarchyParts(item, currentLang);
    };

    const fetchResults = async (targetQuery) => {
        const q = (targetQuery !== undefined ? targetQuery : query).trim();
        if (q.length < 3) {
            setResults({ hotels: [], regions: [] });
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        activeQueryRef.current = q;

        setLoading(true);
        // Ensure stale results are cleared when starting the new request
        setResults({ hotels: [], regions: [] });

        try {
            const data = await autocompleteService.search(
                { query: q, types: ['PROPERTY', 'GEOGRAPHY_REGION', 'POI'] },
                controller.signal
            );

            // Ignore if active query changed while request was in-flight
            if (activeQueryRef.current !== q) return;

            const resultsData = data?.data || data;
            const items = resultsData?.content || (Array.isArray(resultsData) ? resultsData : []);
            const hotels = items.filter(item => item.type === 'PROPERTY' || item.type === 'HOTEL');
            const regions = items.filter(item => item.type === 'GEOGRAPHY_REGION' || item.type === 'POI' || item.type === 'LOCATION');
            setResults({ hotels, regions });
        } catch (error) {
            if (error.name === 'AbortError') return;
            // On error / 404, clear results so stale items never remain
            if (activeQueryRef.current === q) {
                setResults({ hotels: [], regions: [] });
            }
            console.error("Autocomplete fetch error in ListingSearch:", error);
        } finally {
            if (activeQueryRef.current === q) {
                setLoading(false);
            }
        }
    };

    const formatDateForUrl = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getUrlParams = (overrides = {}) => {
        const opts = typeof overrides === 'string' ? { query: overrides } : (overrides || {});
        const queryOverride = opts.query !== undefined ? opts.query : query;
        const checkInOverride = opts.checkInDate !== undefined ? opts.checkInDate : checkInDate;
        const checkOutOverride = opts.checkOutDate !== undefined ? opts.checkOutDate : checkOutDate;
        const guestsOverride = opts.roomState !== undefined ? opts.roomState : roomState;
        const natOverride = opts.nationality !== undefined ? opts.nationality : nationality;

        const guestsParam = serializeGuestsParam(guestsOverride);
        let params = `checkin=${formatDateForUrl(checkInOverride)}&checkout=${formatDateForUrl(checkOutOverride)}&guests=${encodeURIComponent(guestsParam)}&nationality=${encodeURIComponent(natOverride)}`;

        if (queryOverride) {
            params += `&q=${encodeURIComponent(queryOverride)}`;
        }

        // If on hotel search page, preserve active filter parameters
        if (window.location.pathname.startsWith('/travel/hotels/search/')) {
            const filterKeys = ['facilities', 'stars', 'categories', 'chains', 'guestRating', 'recommended', 'roomMaxAdult', 'roomMaxChildren', 'bounds', 'zoom'];
            filterKeys.forEach(k => {
                const v = searchParams.get(k);
                if (v && !params.includes(`&${k}=`)) {
                    params += `&${k}=${encodeURIComponent(v)}`;
                }
            });
        }
        return params;
    };



    const handleSearch = (overrides = {}) => {
        const opts = typeof overrides === 'string' ? { query: overrides } : (overrides || {});
        const activeQuery = opts.query !== undefined ? opts.query : query;
        
        if (!activeQuery.trim()) {
            setError(true);
            return;
        }

        if (activeQuery) {
            const savedLastSearch = localStorage.getItem('dashboard_last_search');
            const savedLastType = localStorage.getItem('dashboard_last_type');
            const savedLastHotelId = localStorage.getItem('dashboard_last_hotelId');

            if (activeQuery !== savedLastSearch) {
                saveSearchHistoryItem(activeQuery, 'SEARCH', null, null);
                localStorage.setItem('dashboard_last_search', activeQuery);
                localStorage.setItem('dashboard_last_type', 'SEARCH');
                localStorage.removeItem('dashboard_last_hotelId');
                localStorage.removeItem('dashboard_last_locationId');
                localStorage.removeItem('dashboard_last_search_param');
                localStorage.removeItem('dashboard_last_search_id');
                localStorage.removeItem('dashboard_last_togId');
                localStorage.removeItem('dashboard_last_regionId');
            }

            if (savedLastType === 'HOTEL' && activeQuery === savedLastSearch && savedLastHotelId) {
                const searchParamsString = getUrlParams(opts);
                navigate(`/travel/hotels/detail/${savedLastHotelId}?${searchParamsString}`);
                return;
            }
            
            // If query contains commas, try to build a hierarchical slug
            // e.g. "Üsküdar, İstanbul, Türkiye" -> ["Üsküdar", "İstanbul", "Türkiye"]
            const queryParts = activeQuery.split(',').map(p => p.trim().toLowerCase());
            let slug = activeQuery.toLowerCase().trim();
            
            // If currently on hotel search and query has not changed, keep current slug path
            const currentPath = window.location.pathname;
            const currentQ = searchParams.get('q');
            if (currentPath.startsWith('/travel/hotels/search/') && (activeQuery === (currentQ || query))) {
                const existingSlug = decodeURIComponent(currentPath.replace('/travel/hotels/search/', ''));
                if (existingSlug && !existingSlug.includes('?')) {
                    slug = existingSlug;
                }
            } else if (queryParts.length >= 2) {
                // If 3 parts: [District, City, Country] -> slug "istanbul/uskudar"
                // If 2 parts: [City, Country] -> slug "istanbul"
                const reversed = [...queryParts].reverse(); // [Country, City, District]
                slug = reversed.slice(1).join('/');
            }

            // Retrieve target parameter (togId or regionId) & coordinates
            const currentUrlTogId = searchParams.get('togId');
            const currentUrlRegionId = searchParams.get('regionId') || searchParams.get('locationId');
            const currentUrlPoiId = searchParams.get('poiId');
            const isSameQuery = (activeQuery === (currentQ || query));

            const savedParam = opts.searchParam || (isSameQuery ? (localStorage.getItem('dashboard_last_search_param') || (currentUrlTogId ? 'togId' : (currentUrlRegionId ? 'regionId' : null))) : null);
            const savedId = opts.searchId !== undefined ? opts.searchId : (isSameQuery ? (localStorage.getItem('dashboard_last_search_id') || currentUrlTogId || currentUrlRegionId) : null);
            const savedTogId = opts.togId || (isSameQuery ? (localStorage.getItem('dashboard_last_togId') || currentUrlTogId) : null);
            const savedRegionId = opts.regionId || (isSameQuery ? (localStorage.getItem('dashboard_last_regionId') || currentUrlRegionId) : null);
            const savedPoiId = opts.poiId || (isSameQuery ? (localStorage.getItem('dashboard_last_poiId') || currentUrlPoiId) : null);

            let targetIdParam = '';
            if (savedParam && savedId) {
                targetIdParam = `&${savedParam}=${savedId}`;
            } else if (savedTogId) {
                targetIdParam = `&togId=${savedTogId}`;
            } else if (savedPoiId) {
                targetIdParam = `&poiId=${savedPoiId}`;
            } else if (savedRegionId) {
                targetIdParam = `&regionId=${savedRegionId}`;
            }

            const savedType = localStorage.getItem('dashboard_last_type');
            const typeParam = (savedType === 'POI' || savedPoiId) ? '&type=POI' : '';

            let latVal = opts.lat || (isSameQuery ? (searchParams.get('lat') || localStorage.getItem('dashboard_last_lat')) : null);
            let lngVal = opts.lng || (isSameQuery ? (searchParams.get('lng') || localStorage.getItem('dashboard_last_lng')) : null);

            if (!latVal || !lngVal) {
                const known = resolveKnownCoordinates(activeQuery);
                if (known) {
                    latVal = known.lat;
                    lngVal = known.lng;
                    localStorage.setItem('dashboard_last_lat', known.lat);
                    localStorage.setItem('dashboard_last_lng', known.lng);
                } else if (!isSameQuery) {
                    localStorage.removeItem('dashboard_last_lat');
                    localStorage.removeItem('dashboard_last_lng');
                }
            }

            const geoParam = (latVal && lngVal) ? `&lat=${latVal}&lng=${lngVal}` : '';
            const searchParamsString = getUrlParams(opts) + targetIdParam + typeParam + geoParam;

            // Guard: If we are already on the exact same search URL and nothing changed, don't re-navigate!
            const currentUrlSlug = decodeURIComponent(window.location.pathname.replace('/travel/hotels/search/', '').split('?')[0]);
            if (window.location.pathname.startsWith('/travel/hotels/search/') && currentUrlSlug.toLowerCase() === slug.toLowerCase()) {
                const currentParams = new URLSearchParams(window.location.search);
                const targetParams = new URLSearchParams(searchParamsString);
                const keysToCheck = ['checkin', 'checkout', 'guests', 'nationality', 'q', 'togId', 'regionId', 'poiId', 'locationId', 'type', 'lat', 'lng'];
                const isIdentical = keysToCheck.every(key => (currentParams.get(key) || '') === (targetParams.get(key) || ''));
                if (isIdentical) {
                    return;
                }
            }

            localStorage.setItem('last_hotel_search_slug', slug);
            localStorage.setItem('last_hotel_search_params', searchParamsString);

            navigate(`/travel/hotels/search/${slug}?${searchParamsString}`, { state: { searchTimestamp: Date.now() } });
        }
    };

    const handleSelectLocation = (location) => {
        const fullName = formatLocationFullName(location, currentLang);
        const sub = getRegionSubtitle(location, currentLang);

        const isPoi = isPoiItem(location);
        const { param: targetParam, id: targetId } = resolveSearchTargetId(location);
        const locType = isPoi ? 'POI' : (location.type || 'GEOGRAPHY_REGION');
        saveSearchHistoryItem(fullName, locType, targetId, getRegionName(location));

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', locType);

        if (isPoi) {
            const poiIdVal = targetId || location.poiId || location.id;
            localStorage.setItem('dashboard_last_search_param', 'poiId');
            localStorage.setItem('dashboard_last_search_id', poiIdVal);
            localStorage.setItem('dashboard_last_poiId', poiIdVal);
            localStorage.removeItem('dashboard_last_togId');
            localStorage.removeItem('dashboard_last_regionId');
        } else if (targetParam && targetId) {
            localStorage.setItem('dashboard_last_search_param', targetParam);
            localStorage.setItem('dashboard_last_search_id', targetId);
            if (targetParam === 'togId') {
                localStorage.setItem('dashboard_last_togId', targetId);
                localStorage.removeItem('dashboard_last_regionId');
                localStorage.removeItem('dashboard_last_poiId');
            } else {
                localStorage.setItem('dashboard_last_regionId', targetId);
                localStorage.removeItem('dashboard_last_togId');
                localStorage.removeItem('dashboard_last_poiId');
            }
        }
        localStorage.removeItem('dashboard_last_locationId');

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

        const countryCode = location.countryCode || (location.ancestors?.find(b => b.type === 'country')?.name || location.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        // Generate hierarchical slug
        const slug = buildLocationSlug(location, currentLang);

        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
        setShowDropdown(false);

        setQuery(fullName);
        
        const targetIdParam = (targetParam && targetId) ? `&${targetParam}=${targetId}` : '';
        const typeParam = isPoi ? '&type=POI' : '';
        const geoParam = (latVal && lngVal) ? `&lat=${latVal}&lng=${lngVal}` : '';
        const searchParamsString = getUrlParams({ query: fullName }) + targetIdParam + typeParam + geoParam;

        localStorage.setItem('last_hotel_search_slug', slug);
        localStorage.setItem('last_hotel_search_params', searchParamsString);

        navigate(`/travel/hotels/search/${slug}?${searchParamsString}`, { state: { searchTimestamp: Date.now() } });
    };

    const handleSelectHotel = (hotel) => {
        const fullName = formatLocationFullName(hotel, currentLang);
        const locationContext = getRegionSubtitle(hotel, currentLang);

        const { param: targetParam, id: targetId } = resolveSearchTargetId(hotel);
        const hId = targetId || hotel.togId || hotel.propertyId || hotel.hotelId || hotel.id?.replace('hotel_', '').replace('property_', '');
        saveSearchHistoryItem(fullName, hotel.type || 'PROPERTY', hId, locationContext);

        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', hotel.type || 'PROPERTY');
        localStorage.setItem('dashboard_last_hotelId', hId);

        if (targetParam && targetId) {
            localStorage.setItem('dashboard_last_search_param', targetParam);
            localStorage.setItem('dashboard_last_search_id', targetId);
            localStorage.setItem('dashboard_last_togId', targetId);
            localStorage.removeItem('dashboard_last_regionId');
        }
        localStorage.removeItem('dashboard_last_locationId');

        let latVal = hotel.geoCoordinate?.lat || hotel.geoCoordinate?.latitude || hotel.lat || hotel.latitude;
        let lngVal = hotel.geoCoordinate?.lon || hotel.geoCoordinate?.lng || hotel.geoCoordinate?.longitude || hotel.lng || hotel.lon || hotel.longitude;
        if (latVal && lngVal) {
            localStorage.setItem('dashboard_last_lat', latVal);
            localStorage.setItem('dashboard_last_lng', lngVal);
        } else {
            localStorage.removeItem('dashboard_last_lat');
            localStorage.removeItem('dashboard_last_lng');
        }

        const countryCode = hotel.countryCode || (hotel.ancestors?.find(b => b.type === 'country')?.name || hotel.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        // Reset user interaction flag and close dropdown to prevent reopening
        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
        setShowDropdown(false);

        setQuery(fullName);

        const slug = buildLocationSlug(hotel, currentLang);
        const targetIdParam = (targetParam && targetId) ? `&${targetParam}=${targetId}` : '';
        const geoParam = (latVal && lngVal) ? `&lat=${latVal}&lng=${lngVal}` : '';
        const searchParamsString = getUrlParams({ query: fullName }) + targetIdParam + geoParam;

        localStorage.setItem('last_hotel_search_slug', slug);
        localStorage.setItem('last_hotel_search_params', searchParamsString);

        navigate(`/travel/hotels/search/${slug}?${searchParamsString}`, { state: { searchTimestamp: Date.now() } });
    };

    // Helper to get Hotel Name
    const getHotelName = (hotel) => {
        return hotel.name?.translations?.[currentLang] || hotel.name?.translations?.en || Object.values(hotel.name?.translations || {})[0] || 'Hotel';
    };

    // Helper to get Region Name / Subtitle
    const getRegionName = (region) => {
        return getRegionSubtitle(region, currentLang);
    };

    const matchingHistory = query.trim()
        ? searchHistory.filter(item => (item.query || '').toLowerCase().includes(query.toLowerCase().trim()))
        : searchHistory;

    const treeRegions = useMemo(() => {
        return buildLocationTree(results.regions);
    }, [results.regions]);

    const flatRegionsList = useMemo(() => {
        const list = [];
        treeRegions.forEach(parent => {
            list.push({ item: parent, isChild: false });
            const nodeId = String(parent.regionId || parent.poiId || parent.locationId || parent.id || '');
            const isExp = expandedNodes[nodeId] !== false; // expanded by default
            if (isExp && parent.children && parent.children.length > 0) {
                parent.children.forEach(child => {
                    list.push({ item: child, isChild: true, parentId: nodeId });
                });
            }
        });
        return list;
    }, [treeRegions, expandedNodes]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setShowDropdown(false);
            inputRef.current?.blur();
            return;
        }

        const historyCount = matchingHistory.length;
        const regionCount = flatRegionsList.length;
        const hotelCount = results.hotels.length;
        const totalItems = historyCount + regionCount + hotelCount;

        // Allow Enter key to trigger search actions regardless of dropdown state
        if (e.key === 'Enter') {
            e.preventDefault();
            // If dropdown is open and we have an active item, select it
            if (showDropdown && activeIndex >= 0 && activeIndex < totalItems) {
                if (activeIndex < historyCount) {
                    handleSelectHistoryItem(matchingHistory[activeIndex]);
                } else if (activeIndex < historyCount + regionCount) {
                    handleSelectLocation(flatRegionsList[activeIndex - historyCount].item);
                } else {
                    const hotelIdx = activeIndex - historyCount - regionCount;
                    if (results.hotels[hotelIdx]) {
                        handleSelectHotel(results.hotels[hotelIdx]);
                    }
                }
            } else {
                // Otherwise, trigger the main search
                handleSearch();
            }
            return;
        }

        // For navigation keys (ArrowDown / ArrowUp), we need the dropdown to be open and have items
        if (!showDropdown || totalItems === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
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

    const hasAnyResults = matchingHistory.length > 0 || flatRegionsList.length > 0 || results.hotels.length > 0 || loading;

    const renderHighlightedText = (text, currentQuery) => {
        if (!text) return null;
        if (!currentQuery || !currentQuery.trim()) {
            return <span className="font-normal text-[#202124] dark:text-white">{text}</span>;
        }

        const trimmedQuery = currentQuery.trim().toLowerCase();
        const lowerText = text.toLowerCase();

        // If text starts with query: query part is normal, remainder is bold
        if (lowerText.startsWith(trimmedQuery)) {
            const matched = text.slice(0, trimmedQuery.length);
            const remainder = text.slice(trimmedQuery.length);
            return (
                <span className="text-[#202124] dark:text-white">
                    <span className="font-normal">{matched}</span>
                    <span className="font-bold">{remainder}</span>
                </span>
            );
        }

        // Split words in query and bold words not in query
        const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean);
        if (queryTokens.length > 0) {
            const escapedTokens = queryTokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
            const parts = text.split(regex);
            return (
                <span className="text-[#202124] dark:text-white">
                    {parts.map((part, i) => {
                        const isToken = queryTokens.some(t => t.toLowerCase() === part.toLowerCase());
                        return isToken ? (
                            <span key={i} className="font-normal">{part}</span>
                        ) : (
                            <span key={i} className="font-bold">{part}</span>
                        );
                    })}
                </span>
            );
        }

        return <span className="font-medium text-[#202124] dark:text-white">{text}</span>;
    };

    return (
        <section className="relative group/search w-full">
            <div className="w-full flex flex-wrap items-center gap-2 relative z-50">
                <div className="flex-1 min-w-[110px] relative h-12 font-roboto" ref={searchWrapperRef}>
                    <div
                        className={`w-full transition-all ${
                            showDropdown && hasAnyResults
                                ? 'absolute top-0 left-0 w-full min-w-[320px] bg-white dark:bg-[#202124] rounded-[4px] border border-[#dadce0] dark:border-[#3c4043] shadow-[0_4px_24px_rgba(0,0,0,0.18),0_1px_4px_rgba(0,0,0,0.06)] z-[300] overflow-hidden'
                                : 'h-12 flex items-center border border-[#dadce0] dark:border-slate-600 rounded-[4px] bg-white dark:bg-[#303134] hover:border-[#bdc1c6] focus-within:border-[#1a73e8]'
                        }`}
                    >
                        <div className={`flex items-center ${isCompact && !(showDropdown && hasAnyResults) ? "gap-2 px-2.5" : "gap-3 px-4"} h-12 w-full ${showDropdown && hasAnyResults ? 'border-b border-[#dadce0] dark:border-[#3c4043]' : ''}`}>
                            <span className="material-symbols-outlined text-[22px] text-[#1a73e8] dark:text-blue-400 font-medium flex-shrink-0" style={{ fontVariationSettings: "'wght' 600, 'opsz' 22" }}>
                                {error ? 'error' : 'search'}
                            </span>
                            <input
                                ref={inputRef}
                                className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 w-full p-0 text-[14.5px] font-normal text-[#202124] dark:text-white placeholder-[#70757a] dark:placeholder-slate-400 tracking-normal leading-normal truncate"
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
                            {query && !loading && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        isUserInteraction.current = true;
                                        setQuery('');
                                        setResults({ hotels: [], regions: [] });
                                        fetchSearchHistory();
                                        setShowDropdown(true);
                                        inputRef.current?.focus();
                                    }}
                                    className="w-8 h-8 rounded-full text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-white hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors flex items-center justify-center flex-shrink-0 -mr-1"
                                    title="Temizle"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown - Google Travel Style */}
                        {showDropdown && hasAnyResults && (
                            <div className="max-h-[460px] overflow-y-auto py-1 scrollbar-thin">
                                {/* 1. Search History Items */}
                                {matchingHistory.length > 0 && (
                                    <div className={isClearingHistory ? 'opacity-40 pointer-events-none transition-opacity duration-200' : 'transition-opacity duration-200'}>
                                        <div className="flex items-center justify-between px-4 py-2 border-b border-[#f1f3f4] dark:border-[#3c4043] mb-1">
                                            <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">Son Aramalar</span>
                                            {!query.trim() && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearHistory}
                                                    disabled={isClearingHistory}
                                                    className="text-[11px] font-medium text-[#1a73e8] hover:underline transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-70"
                                                >
                                                    {isClearingHistory ? (
                                                        <>
                                                            <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                                                            <span>Temizleniyor...</span>
                                                        </>
                                                    ) : (
                                                        <span>Temizle</span>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            {matchingHistory.map((item, index) => {
                                                let title = item.query || '';
                                                let subtitle = item.subtitle || '';

                                                if (!subtitle || subtitle === title) {
                                                    if (title.includes(',')) {
                                                        const parts = title.split(',').map(s => s.trim());
                                                        title = parts[0];
                                                        subtitle = parts.slice(1).join(', ');
                                                    }
                                                }

                                                const itemType = item.type || item.searchType || 'SEARCH';
                                                let icon = 'history';
                                                const isHistoryPoi = itemType === 'POI';
                                                if (isHistoryPoi) icon = 'attractions';
                                                else if (itemType === 'LOCATION' || itemType === 'GEOGRAPHY_REGION') icon = 'location_on';
                                                else if (itemType === 'HOTEL') icon = 'hotel';
                                                else if (itemType === 'AIRPORT') icon = 'flight';

                                                const isActive = activeIndex === index;
                                                const thumbnail = item.thumbnailUrl || item.imageUrl || item.image || item.photo || null;

                                                return (
                                                    <div
                                                        key={item.id || `hist-${index}`}
                                                        data-autocomplete-active={isActive}
                                                        onClick={() => handleSelectHistoryItem(item)}
                                                        className={`w-full text-left px-4 py-2.5 min-h-[48px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors group cursor-pointer ${isActive ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1 mr-2">
                                                            <span className={`material-symbols-outlined text-[22px] ${isHistoryPoi ? 'text-amber-600 dark:text-amber-400' : 'text-[#5f6368] dark:text-[#9aa0a6]'} mr-4 shrink-0 select-none`}>
                                                                {icon}
                                                            </span>
                                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                <div className="text-[14.5px] leading-snug truncate flex items-center gap-1.5">
                                                                    <span className="truncate">{renderHighlightedText(title, query)}</span>
                                                                    {isHistoryPoi && (
                                                                        <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 uppercase shrink-0">
                                                                            POI
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {subtitle && (
                                                                    <div className="text-[12px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                        {subtitle}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {thumbnail ? (
                                                            <img
                                                                src={thumbnail}
                                                                alt={title}
                                                                className="w-10 h-10 rounded-lg object-cover shadow-xs shrink-0 ml-2 border border-black/5"
                                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-[#70757a] hover:text-[#202124] dark:hover:text-white rounded-full transition-all shrink-0 ml-2"
                                                                title="Sil"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px] leading-none block">close</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Locations / Regions */}
                                {/* 2. Locations / Regions (Tree Structure) */}
                                {results.regions.length > 0 && (
                                    <div className={matchingHistory.length > 0 ? "border-t border-[#f1f3f4] dark:border-[#3c4043] pt-1" : ""}>
                                        <div className="px-4 pt-2 pb-1">
                                            <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">{ls.popularDestinations || 'Popüler Noktalar'}</span>
                                        </div>
                                        <div>
                                            {treeRegions.map((region) => {
                                                const rawName = region.name?.translations?.[currentLang] || region.name?.translations?.en || region.name?.defaultName || '';
                                                const rawSub = getRegionName(region);

                                                let title = rawName;
                                                let subtitle = rawSub;

                                                const isPoi = isPoiItem(region);

                                                if (rawSub === rawName) {
                                                    if (rawName.includes(',')) {
                                                        const parts = rawName.split(',').map(s => s.trim());
                                                        title = parts[0];
                                                        subtitle = parts.slice(1).join(', ');
                                                    } else {
                                                        subtitle = region.countryCode ? `${region.countryCode}` : (isPoi ? (ls.pointOfInterest || 'Point of Interest') : (ls.cityRegion || 'City / Region'));
                                                    }
                                                } else if (rawSub.startsWith(rawName + ', ')) {
                                                    subtitle = rawSub.slice(rawName.length + 2);
                                                }

                                                const { icon: locationIcon } = getLocationIconMeta(region, title, subtitle, false);

                                                const hasChildren = region.children && region.children.length > 0;
                                                const parentNodeId = String(region.regionId || region.poiId || region.locationId || region.id || title);
                                                const isExpanded = expandedNodes[parentNodeId] !== false; // expanded by default

                                                const parentFlatIdx = flatRegionsList.findIndex(f => f.item === region);
                                                const isParentActive = activeIndex === (matchingHistory.length + parentFlatIdx);

                                                return (
                                                    <div key={parentNodeId} className="w-full">
                                                        {/* Parent Row */}
                                                        <div
                                                            data-autocomplete-active={isParentActive}
                                                            onClick={() => handleSelectLocation(region)}
                                                            className={`w-full text-left px-4 py-2.5 min-h-[48px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group ${isParentActive ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                        >
                                                            <div className="flex items-center min-w-0 flex-1 mr-2">
                                                                <span className={`material-symbols-outlined text-[22px] ${isPoi ? 'text-amber-600 dark:text-amber-400' : 'text-[#5f6368] dark:text-[#9aa0a6]'} mr-4 shrink-0 select-none`}>
                                                                    {locationIcon}
                                                                </span>
                                                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                    <div className="text-[14.5px] leading-snug truncate flex items-center gap-1.5">
                                                                        <span className="truncate">{renderHighlightedText(title, query)}</span>
                                                                        {isPoi && (
                                                                            <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 uppercase shrink-0">
                                                                                POI
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {subtitle && (
                                                                        <div className="text-[12px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                            {subtitle}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Chevron Toggle Button if has children */}
                                                            {hasChildren && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleExpand(parentNodeId);
                                                                    }}
                                                                    className="p-1 sm:p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-[#5f6368] dark:text-[#9aa0a6] transition-colors ml-2 shrink-0 cursor-pointer flex items-center gap-1.5"
                                                                    title={isExpanded ? 'POI\'leri Gizle' : 'POI\'leri Göster'}
                                                                >
                                                                    <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 uppercase">
                                                                        {region.children.length} POI
                                                                    </span>
                                                                    <span className="material-symbols-outlined text-[18px] leading-none">
                                                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Sub-regions Tree Branch (Nested) */}
                                                        {hasChildren && isExpanded && (
                                                            <div className="relative ml-6 sm:ml-7 pl-3 sm:pl-3.5 border-l-2 border-[#e8eaed] dark:border-[#3c4043] my-0.5 space-y-0.5">
                                                                {region.children.map((child) => {
                                                                    const rawChildName = child.name?.translations?.[currentLang] || child.name?.translations?.en || child.name?.defaultName || '';
                                                                    const rawChildSub = getRegionName(child);

                                                                    let childTitle = rawChildName;
                                                                    let childSubtitle = rawChildSub;

                                                                    const childIsPoi = isPoiItem(child);

                                                                    if (rawChildSub === rawChildName) {
                                                                        if (rawChildName.includes(',')) {
                                                                            const parts = rawChildName.split(',').map(s => s.trim());
                                                                            childTitle = parts[0];
                                                                            childSubtitle = parts.slice(1).join(', ');
                                                                        } else {
                                                                            childSubtitle = child.countryCode ? `${child.countryCode}` : (childIsPoi ? (ls.pointOfInterest || 'Point of Interest') : (ls.cityRegion || 'City / Region'));
                                                                        }
                                                                    } else if (rawChildSub.startsWith(rawChildName + ', ')) {
                                                                        childSubtitle = rawChildSub.slice(rawChildName.length + 2);
                                                                    }

                                                                    const { icon: childIcon } = getLocationIconMeta(child, childTitle, childSubtitle, true);

                                                                    const childFlatIdx = flatRegionsList.findIndex(f => f.item === child);
                                                                    const isChildActive = activeIndex === (matchingHistory.length + childFlatIdx);

                                                                    return (
                                                                        <div
                                                                            key={child.regionId || child.poiId || child.locationId || child.id || childTitle}
                                                                            data-autocomplete-active={isChildActive}
                                                                            onClick={() => handleSelectLocation(child)}
                                                                            className={`w-full text-left px-3.5 py-2.5 min-h-[46px] rounded hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group/child ${isChildActive ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                                        >
                                                                            <div className="flex items-center min-w-0 flex-1">
                                                                                <span className={`material-symbols-outlined text-[18px] ${childIsPoi ? 'text-amber-600 dark:text-amber-400' : 'text-[#70757a] dark:text-[#9aa0a6]'} mr-3 shrink-0 select-none`}>
                                                                                    {childIcon}
                                                                                </span>
                                                                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                                    <div className="text-[13.5px] leading-snug truncate flex items-center gap-1.5">
                                                                                        <span className="truncate">{renderHighlightedText(childTitle, query)}</span>
                                                                                        {childIsPoi && (
                                                                                            <span className="text-[8.5px] font-semibold tracking-wider px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 uppercase shrink-0">
                                                                                                POI
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {childSubtitle && (
                                                                                        <div className="text-[11.5px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                                            {childSubtitle}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Hotels */}
                                {results.hotels.length > 0 && (
                                    <div className={(matchingHistory.length > 0 || results.regions.length > 0) ? "border-t border-[#f1f3f4] dark:border-[#3c4043] pt-1" : ""}>
                                        <div className="px-4 pt-2 pb-1">
                                            <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">{ls.featuredHotels || 'Oteller'}</span>
                                        </div>
                                        <div>
                                            {results.hotels.map((hotel, index) => {
                                                const hotelTitle = getHotelName(hotel);
                                                const hotelMeta = getPropertyCategoryMeta(hotel, currentLang);
                                                const hotelSubtitle = getRegionSubtitle(hotel, currentLang);

                                                const itemIndex = matchingHistory.length + flatRegionsList.length + index;
                                                const isActive = activeIndex === itemIndex;
                                                const thumbnail = hotel.imageUrl || hotel.thumbnailUrl || hotel.image || hotel.heroImage || hotel.photos?.[0] || hotel.images?.[0] || null;

                                                return (
                                                    <div
                                                        key={hotel.togId || hotel.propertyId || hotel.hotelId || hotel.id || `hot-${index}`}
                                                        data-autocomplete-active={isActive}
                                                        onClick={() => handleSelectHotel(hotel)}
                                                        className={`w-full text-left px-4 py-2.5 min-h-[48px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group ${isActive ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                    >
                                                        <div className="flex items-center min-w-0 flex-1 mr-2">
                                                            <span className="material-symbols-outlined text-[22px] text-[#5f6368] dark:text-[#9aa0a6] mr-4 shrink-0 select-none">
                                                                {hotelMeta.icon}
                                                            </span>
                                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                <div className="text-[14.5px] leading-snug truncate flex items-center gap-1.5">
                                                                    <span className="truncate">{renderHighlightedText(hotelTitle, query)}</span>
                                                                    {hotelMeta.id !== 1 && (
                                                                        <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 uppercase shrink-0">
                                                                            {hotelMeta.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {hotelSubtitle && (
                                                                    <div className="text-[12px] font-normal text-[#70757a] dark:text-[#9aa0a6] leading-normal mt-0.5 truncate">
                                                                        {hotelSubtitle}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {thumbnail && (
                                                            <img
                                                                src={thumbnail}
                                                                alt={hotelTitle}
                                                                className="w-10 h-10 rounded-lg object-cover shadow-xs shrink-0 ml-2 border border-black/5"
                                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Twin Datepicker Container */}
                    <div className={`${isCompact ? "w-[220px]" : "w-full md:w-[330px] lg:w-[350px]"} flex-shrink-0 relative h-12 bg-white dark:bg-[#303134] flex items-center google-flight-date-trigger font-roboto transition-all duration-300 rounded-[4px] overflow-hidden ${
                        isDatePickerOpen
                            ? 'border-2 border-[#1a73e8]'
                            : 'border border-[#dadce0] dark:border-slate-600 hover:border-[#bdc1c6]'
                    }`}>
                        
                        {/* Check-In Half */}
                        <div
                            onClick={() => {
                                setActiveDateField('checkIn');
                                setIsDatePickerOpen(true);
                                setShowDropdown(false);
                                setShowGuestDropdown(false);
                            }}
                            className={`relative flex-1 h-full flex items-center justify-between ${isCompact ? "px-2" : "px-3 sm:px-3.5"} cursor-pointer transition-colors min-w-0 ${
                                isDatePickerOpen && activeDateField === 'checkIn'
                                    ? 'bg-blue-50/70 dark:bg-blue-950/40 text-[#1a73e8] dark:text-blue-400 font-medium'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                                <span className="material-symbols-outlined text-[20px] text-[#1a73e8] dark:text-blue-400 font-medium flex-shrink-0" style={{ fontVariationSettings: "'wght' 500, 'opsz' 20" }}>
                                    calendar_today
                                </span>
                                <span className={`${isCompact ? "text-[13px]" : "text-[15px]"} font-normal text-[#3c4043] dark:text-white truncate`}>
                                    {formatGoogleFlightDate(checkInDate) || 'Giriş'}
                                </span>
                            </div>

                            {/* Quick 1-day step buttons */}
                            {!isCompact && (
                                <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-1">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); stepCheckIn(-1); }}
                                        className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                        title="1 gün geri"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); stepCheckIn(1); }}
                                        className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                        title="1 gün ileri"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Middle Vertical Divider */}
                        <div className="w-[1px] h-7 bg-[#dadce0] dark:bg-slate-600 flex-shrink-0" />

                        {/* Check-Out Half */}
                        <div
                            onClick={() => {
                                setActiveDateField('checkOut');
                                setIsDatePickerOpen(true);
                                setShowDropdown(false);
                                setShowGuestDropdown(false);
                            }}
                            className={`relative flex-1 h-full flex items-center justify-between ${isCompact ? "px-2" : "px-3 sm:px-3.5"} cursor-pointer transition-colors min-w-0 ${
                                isDatePickerOpen && activeDateField === 'checkOut'
                                    ? 'bg-blue-50/70 dark:bg-blue-950/40 text-[#1a73e8] dark:text-blue-400 font-medium'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                            }`}
                        >
                            <div className="flex items-center min-w-0 flex-1">
                                <span className={`${isCompact ? "text-[13px]" : "text-[15px]"} font-normal text-[#3c4043] dark:text-white truncate`}>
                                    {formatGoogleFlightDate(checkOutDate) || 'Çıkış'}
                                </span>
                            </div>

                            {/* Quick 1-day step buttons */}
                            {!isCompact && (
                                <div className="flex items-center text-[#5f6368] dark:text-slate-400 shrink-0 ml-1">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); stepCheckOut(-1); }}
                                        className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                        title="1 gün geri"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); stepCheckOut(1); }}
                                        className="hover:bg-slate-200 dark:hover:bg-slate-600 p-0.5 rounded transition-colors"
                                        title="1 gün ileri"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Google Flights 2-Month Datepicker Popover */}
                        <GoogleFlightDatePicker
                            isOpen={isDatePickerOpen}
                            onClose={(inDate, outDate) => {
                                setIsDatePickerOpen(false);
                                const finalIn = inDate || checkInDate;
                                const finalOut = outDate || checkOutDate;
                                if (finalIn) setCheckInDate(finalIn);
                                if (finalOut) setCheckOutDate(finalOut);
                                const currentInStr = searchParams.get('checkin') || '';
                                const currentOutStr = searchParams.get('checkout') || '';
                                const newInStr = formatDateForUrl(finalIn);
                                const newOutStr = formatDateForUrl(finalOut);
                                if (currentInStr !== newInStr || currentOutStr !== newOutStr) {
                                    handleSearch({ checkInDate: finalIn, checkOutDate: finalOut });
                                }
                            }}
                            onApply={(inDate, outDate) => {
                                setIsDatePickerOpen(false);
                                const finalIn = inDate || checkInDate;
                                const finalOut = outDate || checkOutDate;
                                
                                const currentInStr = searchParams.get('checkin') || '';
                                const currentOutStr = searchParams.get('checkout') || '';
                                const newInStr = formatDateForUrl(finalIn);
                                const newOutStr = formatDateForUrl(finalOut);
                                
                                if (finalIn) setCheckInDate(finalIn);
                                if (finalOut) setCheckOutDate(finalOut);
                                
                                if (currentInStr !== newInStr || currentOutStr !== newOutStr) {
                                    handleSearch({ checkInDate: finalIn, checkOutDate: finalOut });
                                }
                            }}
                            checkInDate={checkInDate}
                            checkOutDate={checkOutDate}
                            onCheckInChange={setCheckInDate}
                            onCheckOutChange={setCheckOutDate}
                            activeField={activeDateField}
                            setActiveField={setActiveDateField}
                            holidays={holidays}
                            countryCode={holidayCountryCode}
                        />
                    </div>
                    {/* Elegant Guest Selector */}
                    <div className="relative group/field flex-shrink-0" ref={guestWrapperRef}>
                        <button
                            type="button"
                            onClick={() => {
                                if (!showGuestDropdown) {
                                    initialGuestStateRef.current = serializeGuestsParam(roomState);
                                    setShowGuestDropdown(true);
                                } else {
                                    setShowGuestDropdown(false);
                                    const currentGuestParam = searchParams.get('guests') || initialGuestStateRef.current;
                                    const newGuestParam = serializeGuestsParam(roomState);
                                    if (currentGuestParam !== newGuestParam) {
                                        handleSearch({ roomState });
                                    }
                                }
                            }}
                            className={`flex items-center ${isCompact ? "gap-1 px-2.5" : "gap-1.5 px-3.5"} border h-12 rounded-[4px] transition-colors text-[#3c4043] dark:text-slate-300 font-normal text-[14px] focus:outline-none cursor-pointer bg-white dark:bg-[#303134] ${
                                showGuestDropdown
                                    ? 'border-[#1a73e8]'
                                    : 'border-[#dadce0] dark:border-slate-600 hover:border-[#bdc1c6]'
                            }`}
                            style={showGuestDropdown ? { boxShadow: '0 0 0 1px #1a73e8' } : { boxShadow: 'none' }}
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#1a73e8] dark:text-blue-400 font-medium flex-shrink-0" style={{ fontVariationSettings: "'wght' 500, 'opsz' 20" }}>person</span>
                            <span className="text-[13.5px] font-normal text-[#3c4043] dark:text-slate-200">{totalAdults + totalChildren}</span>
                            <span className={`material-symbols-outlined text-[19px] ${showGuestDropdown ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-slate-300'}`}>
                                {showGuestDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {/* Guest Dropdown - Google Flights Style */}
                        {showGuestDropdown && (
                            <div className="absolute top-full right-0 w-[320px] sm:w-[340px] mt-2 bg-white dark:bg-[#202124] rounded-[4px] border border-[#dadce0] dark:border-slate-700 shadow-[0_4px_6px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] p-4 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-3 -mr-3">
                                    {roomState.map((room, index) => (
                                        <div key={index} className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 last:mb-0">
                                            {roomState.length > 1 && (
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{ls.roomSingle} {index + 1}</span>
                                                    <button onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">{ls.remove}</button>
                                                </div>
                                            )}
                                            
                                            <div className="flex flex-col gap-4">
                                                {/* Adults Row */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[14px] text-[#3c4043] dark:text-slate-300">{ls.adults}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))} 
                                                            disabled={room.adults <= 1}
                                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-[15px] font-medium text-[#3c4043] dark:text-white">{room.adults}</span>
                                                        <button 
                                                            onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))} 
                                                            disabled={room.adults >= 6} 
                                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Children Row */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] text-[#3c4043] dark:text-slate-300">{ls.children}</span>
                                                        <span className="text-[12px] text-slate-500">{ls.childrenAge}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))} 
                                                            disabled={room.children <= 0}
                                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-[15px] font-medium text-[#3c4043] dark:text-white">{room.children}</span>
                                                        <button 
                                                            onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))} 
                                                            disabled={room.children >= 4} 
                                                            className="w-8 h-8 rounded bg-[#e8f0fe] text-[#1a73e8] disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Child Ages */}
                                                {room.children > 0 && (
                                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                                        {room.childAges.map((age, ageIdx) => (
                                                             <div key={ageIdx} className="flex flex-col gap-1">
                                                                <span className="text-[12px] text-slate-500">{ls.children} {ageIdx + 1} {ls.years}</span>
                                                                <select
                                                                    value={age}
                                                                    onChange={(e) => updateChildAge(index, ageIdx, e.target.value)}
                                                                    className="w-full h-8 bg-white dark:bg-slate-800 rounded border border-[#dadce0] dark:border-slate-600 text-[13px] px-2 focus:border-[#1a73e8] focus:ring-0 outline-none text-[#3c4043] dark:text-white"
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
                                        <button onClick={addRoom} className="mt-4 text-[14px] text-[#1a73e8] font-medium hover:underline flex items-center">
                                            <span className="material-symbols-outlined text-[18px] mr-1">add</span>
                                            {ls.addRoom}
                                        </button>
                                    )}
                                </div>

                                {/* Google Flights Style Footer */}
                                <div className="flex items-center justify-end gap-6 mt-6 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (initialGuestStateRef.current) {
                                                setRoomState(parseGuestsParam(initialGuestStateRef.current));
                                            }
                                            setShowGuestDropdown(false);
                                        }} 
                                        className="text-[14px] text-[#1a73e8] font-medium hover:bg-blue-50 px-3 py-1.5 rounded transition-colors cursor-pointer"
                                    >
                                        İptal
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowGuestDropdown(false);
                                            const currentGuestParam = searchParams.get('guests') || initialGuestStateRef.current;
                                            const newGuestParam = serializeGuestsParam(roomState);
                                            if (currentGuestParam !== newGuestParam) {
                                                handleSearch({ roomState });
                                            }
                                        }} 
                                        className="text-[14px] text-[#1a73e8] font-medium hover:bg-blue-50 px-3 py-1.5 rounded transition-colors cursor-pointer"
                                    >
                                        Bitti
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compact Nationality Selector (Grouped with Guests) */}
                    <div className="flex-shrink-0 relative h-12 w-[76px] sm:w-[82px] transition-all duration-300">
                        <NationalitySelect 
                            value={nationality} 
                            onChange={(newNat) => {
                                const currentNat = searchParams.get('nationality') || nationality;
                                if (newNat && newNat !== currentNat) {
                                    setNationality(newNat);
                                    handleSearch({ nationality: newNat });
                                }
                            }} 
                            inputStyle={true} 
                            compact={true}
                            rounded="rounded-[4px]"
                            onToggle={(isOpen) => {
                                if (isOpen) {
                                    setShowDropdown(false);
                                    setIsDatePickerOpen(false);
                                    setShowGuestDropdown(false);
                                }
                            }}
                        />
                    </div>
            </div>
        </section>
    );
};

export default ListingSearch;
