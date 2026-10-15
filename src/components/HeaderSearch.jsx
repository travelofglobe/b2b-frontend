import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { autocompleteService } from '../services/autocompleteService';
import { useToast } from '../context/ToastContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import { enGB, tr, es, ru, zhCN, ja, faIR, fr, it, el, pt, ar } from 'date-fns/locale';
import HolidaySidePanel from "./HolidaySidePanel";
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker-custom.css";
import { useHolidays } from '../utils/useHolidays';
import { parseGuestsParam, serializeGuestsParam, convertOldParamsToRooms, validateAndSanitizeDates, formatDateForUrl, resolveKnownCoordinates, getLocationIconMeta, buildLocationTree, getPropertyCategoryMeta, isPoiItem, resolveSearchTargetId, getItemPrimaryName, getLocationHierarchyParts, getRegionSubtitle, formatLocationFullName, buildLocationSlug } from '../utils/searchParamsUtils';
import NationalitySelect from './NationalitySelect';
import { getUserCountryCode } from '../utils/geoUtils';
import { useTranslation } from 'react-i18next';

// Register dynamic locales
registerLocale('en', enGB);
registerLocale('tr', tr);
registerLocale('es', es);
registerLocale('ru', ru);
registerLocale('zh', zhCN);
registerLocale('ja', ja);
registerLocale('fa', faIR);
registerLocale('fr', fr);
registerLocale('it', it);
registerLocale('el', el);
registerLocale('pt', pt);
registerLocale('ar', ar);

import { getSearchLocale } from '../utils/searchLocales';

const HeaderSearch = () => {
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').split('-')[0].toLowerCase();
    const ls = getSearchLocale(currentLang);

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
        return searchParams.get('nationality') || localStorage.getItem('dashboard_last_nationality') || getUserCountryCode();
    });

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

    // -- Room State Manipulators --
    const addRoom = (e) => {
        if (e) e.stopPropagation();
        setRoomState(prev => [...prev, { adults: 2, children: 0, childAges: [] }]);
    };

    const removeRoom = (index) => {
        setRoomState(prev => prev.filter((_, i) => i !== index));
    };

    const updateRoom = (index, field, value) => {
        setRoomState(prev => {
            const newState = [...prev];
            newState[index] = { ...newState[index], [field]: value };
            
            if (field === 'children') {
                const currentAges = newState[index].childAges || [];
                if (value > currentAges.length) {
                    newState[index].childAges = [...currentAges, ...Array(value - currentAges.length).fill(0)];
                } else if (value < currentAges.length) {
                    newState[index].childAges = currentAges.slice(0, value);
                }
            }
            return newState;
        });
    };

    const updateChildAge = (roomIndex, childIndex, age) => {
        setRoomState(prev => {
            const newState = [...prev];
            const newAges = [...(newState[roomIndex].childAges || [])];
            newAges[childIndex] = parseInt(age, 10);
            newState[roomIndex] = { ...newState[roomIndex], childAges: newAges };
            return newState;
        });
    };

    // Computed totals for display
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;

    // -- UI State --
    const [destinationCountryCode, setDestinationCountryCode] = useState(() => {
        return localStorage.getItem('dashboard_last_countryCode') || null;
    });
    const [visibleMonth, setVisibleMonth] = useState(new Date());

    const { holidays } = useHolidays(destinationCountryCode);

    const [results, setResults] = useState({ hotels: [], regions: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchHistory, setSearchHistory] = useState([]);

    const fetchSearchHistory = async () => {
        try {
            const res = await autocompleteService.getSearchHistory();
            const items = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
            if (Array.isArray(items)) {
                setSearchHistory(items);
            }
        } catch (err) {
            console.error("Error fetching search history in HeaderSearch:", err);
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
            console.error("Error clearing search history in HeaderSearch:", err);
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
            console.error("Error saving search history in HeaderSearch:", err);
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
    };

    const handleDeleteHistoryItem = async (e, id) => {
        if (e) e.stopPropagation();
        if (!id) return;
        try {
            await autocompleteService.deleteSearchHistoryItem(id);
            setSearchHistory(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Error deleting search history item in HeaderSearch:", err);
        }
    };

    const searchWrapperRef = useRef(null);
    const guestWrapperRef = useRef(null);
    const datePickerRef = useRef(null);
    const inputRef = useRef(null);
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

    // -- Effects --

    // Debounce search
    useEffect(() => {
        // Only search if the user has interacted (typed)
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

    // -- Handlers --

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
            console.error("Autocomplete fetch error in HeaderSearch:", error);
        } finally {
            if (activeQueryRef.current === q) {
                setLoading(false);
            }
        }
    };

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

        // For navigation keys, we need the dropdown to be open and have results
        if (!showDropdown || totalItems === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
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
            const savedLastSearch = localStorage.getItem('dashboard_last_search');
            const savedLastType = localStorage.getItem('dashboard_last_type');
            const savedLastHotelId = localStorage.getItem('dashboard_last_hotelId');

            if (query !== savedLastSearch) {
                saveSearchHistoryItem(query, 'SEARCH', null, null);
                localStorage.setItem('dashboard_last_search', query);
                localStorage.setItem('dashboard_last_type', 'SEARCH');
                localStorage.removeItem('dashboard_last_hotelId');
                localStorage.removeItem('dashboard_last_locationId');
                localStorage.removeItem('dashboard_last_search_param');
                localStorage.removeItem('dashboard_last_search_id');
                localStorage.removeItem('dashboard_last_togId');
                localStorage.removeItem('dashboard_last_regionId');
            }

            if (savedLastType === 'HOTEL' && query === savedLastSearch && savedLastHotelId) {
                const searchParamsString = getUrlParams();
                navigate(`/travel/hotels/detail/${savedLastHotelId}?${searchParamsString}`);
                return;
            }

            localStorage.setItem('dashboard_last_search', query);
            const savedParam = localStorage.getItem('dashboard_last_search_param');
            const savedId = localStorage.getItem('dashboard_last_search_id');
            const savedTogId = localStorage.getItem('dashboard_last_togId');
            const savedRegionId = localStorage.getItem('dashboard_last_regionId');
            const savedLat = localStorage.getItem('dashboard_last_lat');
            const savedLng = localStorage.getItem('dashboard_last_lng');

            let targetIdParam = '';
            if (savedParam && savedId) {
                targetIdParam = `&${savedParam}=${savedId}`;
            } else if (savedTogId) {
                targetIdParam = `&togId=${savedTogId}`;
            } else if (savedRegionId) {
                targetIdParam = `&regionId=${savedRegionId}`;
            }

            const geoParam = (savedLat && savedLng) ? `&lat=${savedLat}&lng=${savedLng}` : '';

            // Build hierarchical slug if possible
            const queryParts = query.split(',').map(p => p.trim().toLowerCase());
            let slug = query.toLowerCase();

            if (queryParts.length >= 2) {
                const reversed = queryParts.reverse();
                slug = reversed.slice(1).join('/');
            }

            const searchParamsString = getUrlParams() + targetIdParam + geoParam;

            localStorage.setItem('last_hotel_search_slug', slug);
            localStorage.setItem('last_hotel_search_params', searchParamsString);

            if (isMapPage) {
                navigate(`/map?${searchParamsString}`);
            } else {
                navigate(`/travel/hotels/search/${slug}?${searchParamsString}`);
            }
        }
    };

    const handleSelectLocation = (location) => {
        const fullName = formatLocationFullName(location, currentLang);
        const sub = getRegionSubtitle(location, currentLang);

        const { param: targetParam, id: targetId } = resolveSearchTargetId(location);
        const locType = location.type || (location.poiId ? 'POI' : 'GEOGRAPHY_REGION');
        saveSearchHistoryItem(fullName, locType, targetId, getRegionName(location));

        const slug = buildLocationSlug(location, currentLang);

        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
        setShowDropdown(false);

        setQuery(fullName);
        localStorage.setItem('dashboard_last_search', fullName);
        localStorage.setItem('dashboard_last_type', locType);
        if (targetParam && targetId) {
            localStorage.setItem('dashboard_last_search_param', targetParam);
            localStorage.setItem('dashboard_last_search_id', targetId);
            if (targetParam === 'togId') {
                localStorage.setItem('dashboard_last_togId', targetId);
                localStorage.removeItem('dashboard_last_regionId');
            } else {
                localStorage.setItem('dashboard_last_regionId', targetId);
                localStorage.removeItem('dashboard_last_togId');
            }
        }
        localStorage.removeItem('dashboard_last_locationId');

        let latVal = location.geoCoordinate?.lat || location.geoCoordinate?.latitude || location.lat || location.latitude;
        let lngVal = location.geoCoordinate?.lon || location.geoCoordinate?.lng || location.geoCoordinate?.longitude || location.lng || location.lon || location.longitude;

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

        if (!isMapPage) {
            const targetIdParam = (targetParam && targetId) ? `&${targetParam}=${targetId}` : '';
            const geoParam = (latVal && lngVal) ? `&lat=${latVal}&lng=${lngVal}` : '';
            const searchParamsString = getUrlParams(fullName) + targetIdParam + geoParam;

            localStorage.setItem('last_hotel_search_slug', slug);
            localStorage.setItem('last_hotel_search_params', searchParamsString);
        }
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

        // Close dropdown FIRST before updating query to prevent reopening
        isUserInteraction.current = false;
        setResults({ hotels: [], regions: [] });
        setShowDropdown(false);

        const countryCode = hotel.countryCode || (hotel.ancestors?.find(b => b.type === 'country')?.name || hotel.locationBreadcrumbs?.find(b => b.locationType === 'COUNTRY')?.countryCode);
        if (countryCode) {
            setDestinationCountryCode(countryCode);
            localStorage.setItem('dashboard_last_countryCode', countryCode);
        }

        setQuery(fullName);

        const slug = buildLocationSlug(hotel, currentLang);
        const targetIdParam = (targetParam && targetId) ? `&${targetParam}=${targetId}` : '';
        const geoParam = (latVal && lngVal) ? `&lat=${latVal}&lng=${lngVal}` : '';
        const searchParamsString = getUrlParams(fullName) + targetIdParam + geoParam;

        localStorage.setItem('last_hotel_search_slug', slug);
        localStorage.setItem('last_hotel_search_params', searchParamsString);
    };

    const getRegionName = (region) => {
        return getRegionSubtitle(region, currentLang);
    };

    const getHotelName = (hotel) => hotel.name?.translations?.[currentLang] || hotel.name?.translations?.en || Object.values(hotel.name?.translations || {})[0] || 'Hotel';

    const matchingHistory = query.trim()
        ? searchHistory.filter(item => item.query.toLowerCase().includes(query.toLowerCase().trim()))
        : searchHistory;

    const hasAnyResults = matchingHistory.length > 0 || flatRegionsList.length > 0 || results.hotels.length > 0 || loading;

    return (
        <div className="hidden xl:flex items-center bg-slate-100 dark:bg-[#233648] rounded-2xl px-3 py-2 gap-2 border border-slate-200 dark:border-transparent relative shadow-md h-[60px]">
            {/* 1. Destination / Query */}
            <div className="flex items-center px-4 border-r border-slate-300 dark:border-slate-600 relative h-full group/dest" ref={searchWrapperRef}>
                <span className="material-symbols-outlined text-slate-400 text-xl mr-3 group-hover/dest:text-primary transition-colors">location_on</span>
                <input
                    ref={inputRef}
                    className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-xs w-[180px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 p-0"
                    placeholder={ls.headerPlaceholder}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        isUserInteraction.current = true;
                        setQuery(e.target.value);
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
                        className="w-7 h-7 rounded-full text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-white hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] transition-colors flex items-center justify-center flex-shrink-0 ml-1"
                        title="Temizle"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                )}

                {/* Autocomplete Dropdown - Google Style */}
                {showDropdown && hasAnyResults && (
                    <div className="absolute top-full left-0 w-[480px] mt-2 bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] max-h-[440px] overflow-y-auto z-[1200] py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* 1. Past Searches Section */}
                        {matchingHistory.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between px-4 py-2 border-b border-[#f1f3f4] dark:border-[#3c4043] mb-1">
                                    <span className="text-[11px] font-medium text-[#70757a] dark:text-slate-400 uppercase tracking-wider">Son Aramalar</span>
                                    {!query.trim() && (
                                        <button
                                            onClick={handleClearHistory}
                                            className="text-[11px] font-medium text-[#1a73e8] hover:underline transition-colors"
                                        >
                                            Temizle
                                        </button>
                                    )}
                                </div>
                                <div>
                                    {matchingHistory.map((item, index) => {
                                        const itemType = item.type || item.searchType || 'SEARCH';
                                        let icon = 'history';
                                        const isHistoryPoi = itemType === 'POI';
                                        if (isHistoryPoi) icon = 'attractions';
                                        else if (itemType === 'LOCATION' || itemType === 'GEOGRAPHY_REGION') icon = 'location_on';
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
                                                className="w-full text-left px-4 py-3 min-h-[56px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors group cursor-pointer"
                                            >
                                                <div className="flex items-center min-w-0 flex-1 mr-3">
                                                    <span className={`material-symbols-outlined text-[20px] ${isHistoryPoi ? 'text-amber-600 dark:text-amber-400' : 'text-[#70757a] dark:text-slate-400'} mr-4 shrink-0 select-none`}>
                                                        {icon}
                                                    </span>
                                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                        <div className="text-[15px] font-medium text-[#3c4043] dark:text-white leading-tight truncate flex items-center gap-1.5">
                                                            <span className="truncate">{title}</span>
                                                            {isHistoryPoi && (
                                                                <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 uppercase shrink-0">
                                                                    POI
                                                                </span>
                                                            )}
                                                        </div>
                                                        {subtitle && (
                                                            <div className="text-[12px] font-normal text-[#70757a] dark:text-slate-400 leading-normal mt-0.5 truncate">{subtitle}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[#70757a] hover:text-[#d93025] dark:hover:text-red-400 rounded-full transition-all shrink-0 ml-2"
                                                    title="Bu aramayı sil"
                                                >
                                                    <span className="material-symbols-outlined text-[18px] leading-none block">close</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2. Locations & Regions Section */}
                        {/* 2. Locations Section (Tree Structure) */}
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

                                        const { icon } = getLocationIconMeta(region, title, subtitle, false);

                                        const hasChildren = region.children && region.children.length > 0;
                                        const parentNodeId = String(region.regionId || region.poiId || region.locationId || region.id || title);
                                        const isExpanded = expandedNodes[parentNodeId] !== false; // expanded by default

                                        const parentFlatIdx = flatRegionsList.findIndex(f => f.item === region);
                                        const isParentActive = activeIndex === (matchingHistory.length + parentFlatIdx);

                                        return (
                                            <div key={parentNodeId} className="w-full">
                                                {/* Parent Row */}
                                                <div
                                                    onClick={() => handleSelectLocation(region)}
                                                    className={`w-full text-left px-4 py-3 min-h-[52px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group ${isParentActive ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                >
                                                    <div className="flex items-center min-w-0 flex-1">
                                                        <span className={`material-symbols-outlined text-[19px] ${isPoi ? 'text-amber-600 dark:text-amber-400' : 'text-[#5f6368] dark:text-[#9aa0a6]'} mr-3.5 shrink-0 select-none`}>
                                                            {icon}
                                                        </span>
                                                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                            <div className="text-[14px] font-normal text-[#202124] dark:text-white leading-tight truncate flex items-center gap-1.5">
                                                                <span className="truncate">{title}</span>
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
                                                                    onClick={() => handleSelectLocation(child)}
                                                                    className={`w-full text-left px-3.5 py-2.5 min-h-[46px] rounded hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group/child ${isChildActive ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                                                >
                                                                    <div className="flex items-center min-w-0 flex-1">
                                                                        <span className={`material-symbols-outlined text-[18px] ${childIsPoi ? 'text-amber-600 dark:text-amber-400' : 'text-[#70757a] dark:text-[#9aa0a6]'} mr-3 shrink-0 select-none`}>
                                                                            {childIcon}
                                                                        </span>
                                                                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                                            <div className="text-[13.5px] font-normal text-[#202124] dark:text-white leading-tight truncate flex items-center gap-1.5">
                                                                                <span className="truncate">{childTitle}</span>
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

                        {/* 3. Hotels Section */}
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

                                        return (
                                            <button
                                                key={hotel.togId || hotel.propertyId || hotel.hotelId || hotel.id || index}
                                                onClick={() => handleSelectHotel(hotel)}
                                                className={`w-full text-left px-4 py-3 min-h-[56px] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] flex items-center justify-between transition-colors cursor-pointer group ${activeIndex === (matchingHistory.length + flatRegionsList.length + index) ? 'bg-[#f1f3f4] dark:bg-[#303134]' : ''}`}
                                            >
                                                <div className="flex items-center min-w-0 flex-1 mr-3">
                                                    <span className="material-symbols-outlined text-[20px] text-[#70757a] dark:text-slate-400 mr-4 shrink-0 select-none">
                                                        {hotelMeta.icon}
                                                    </span>
                                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                        <div className="text-[15px] font-medium text-[#3c4043] dark:text-white leading-tight truncate flex items-center gap-1.5">
                                                            <span className="truncate">{hotelTitle}</span>
                                                            {hotelMeta.id !== 1 && (
                                                                <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 uppercase shrink-0">
                                                                    {hotelMeta.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {hotelSubtitle && (
                                                            <div className="text-[12px] font-normal text-[#70757a] dark:text-slate-400 leading-normal mt-0.5 truncate">
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

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex items-center justify-center py-4 text-[#70757a] gap-2">
                                <div className="size-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-normal">Aranıyor...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Date Picker */}
            <div className="flex items-center justify-between px-4 border-r border-slate-300 dark:border-slate-600 cursor-pointer h-full group/date w-[340px] shrink-0" onClick={() => datePickerRef.current?.setOpen(true)}>
                <div className="flex items-center flex-1">
                    <span className="material-symbols-outlined text-slate-400 text-xl mr-3 group-hover/date:text-primary transition-colors">calendar_month</span>
                    <div className="w-[180px] min-w-[180px] [&>div]:w-full [&>div>input]:w-full datepicker-header">
                        <DatePicker
                            ref={datePickerRef}
                            selected={checkInDate}
                            onChange={(dates) => {
                                const [start, end] = dates;

                                // Validation: checkout must be at least 1 day after checkin
                                if (start && end) {
                                    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                                    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                                    if (endDay <= startDay) {
                                        // Auto-correct: set checkout to next day
                                        const nextDay = new Date(startDay);
                                        nextDay.setDate(nextDay.getDate() + 1);
                                        setCheckInDate(start);
                                        setCheckOutDate(nextDay);
                                        return;
                                    }
                                }

                                setCheckInDate(start);
                                setCheckOutDate(end);
                            }}
                            startDate={checkInDate}
                            endDate={checkOutDate}
                            selectsRange
                            minDate={new Date()}
                            maxDate={checkInDate && !checkOutDate ? new Date(checkInDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null}
                            monthsShown={2}
                            onCalendarOpen={() => setVisibleMonth(checkInDate || new Date())}
                            onMonthChange={(date) => setVisibleMonth(date)}
                            locale={currentLang}
                            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none shadow-none w-full p-0 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                            wrapperClassName="w-full"
                            dateFormat="dd MMM yyyy"
                            calendarClassName="shadow-2xl border-none font-sans"
                            popperPlacement="bottom-start"
                            renderDayContents={(day, date) => {
                                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                const holiday = holidays?.find(h => h.date === formattedDate || h.holidayDate === formattedDate);
                                
                                if (holiday) {
                                    const lowerName = (holiday.holidayName || holiday.name || '').toLowerCase();
                                    const isReligious = lowerName.includes('eid') || lowerName.includes('ramazan') || lowerName.includes('kurban');
                                    const typeClass = isReligious ? 'type-religious' : 'type-public';
                                    
                                    // Handle language matching for tooltip
                                    const langPrefix = (i18n.language || 'en').substring(0, 2).toLowerCase();
                                    const hCountry = (holiday.countryCode || destinationCountryCode || '').toLowerCase();
                                    const isLocalLang = langPrefix === hCountry;
                                    const displayTooltipName = (isLocalLang && holiday.localName) ? holiday.localName : (holiday.holidayName || holiday.name);

                                    return (
                                        <div className={`holiday-day-container ${typeClass}`}>
                                            {day}
                                            <div className="holiday-tooltip">
                                                <div className="holiday-tooltip-country">
                                                    {holiday.countryCode || destinationCountryCode}
                                                </div>
                                                <div className="holiday-tooltip-name">{displayTooltipName}</div>
                                                <div className="holiday-tooltip-type">{isReligious ? 'Dini Tatil' : 'Resmi Tatil'}</div>
                                            </div>
                                        </div>
                                    );
                                }
                                return day;
                            }}
                        >
                            <HolidaySidePanel holidays={holidays} visibleMonth={visibleMonth} />
                        </DatePicker>
                    </div>
                </div>
                {checkInDate && checkOutDate && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 whitespace-nowrap animate-in fade-in zoom-in duration-300">
                        <span className="material-symbols-outlined text-[14px] leading-none">bedtime</span>
                        <span className="text-[10px] font-medium uppercase tracking-tight">
                            {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))} {Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) === 1 ? ls.nightSingle : ls.nights}
                        </span>
                    </div>
                )}
            </div>

            {/* Nationality Selector */}
            <div className="flex items-center px-4 h-full">
                <NationalitySelect
                    value={nationality}
                    onChange={setNationality}
                    compact={true}
                />
            </div>

            {/* 3. Guests Dropdown */}
            <div className="flex items-center px-3 relative" ref={guestWrapperRef}>
                <span className="material-symbols-outlined text-[#70757a] text-[20px] mr-1.5">group</span>
                <button
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="bg-transparent border-none focus:ring-0 text-[13px] min-w-[80px] text-left text-[#202124] dark:text-white font-normal whitespace-nowrap cursor-pointer"
                >
                    {totalAdults} {ls.adults.substring(0, 3)}, {totalChildren} {ls.children.substring(0, 3)}
                </button>

                {/* Guest Dropdown Panel */}
                {showGuestDropdown && (
                    <div className="absolute top-full right-0 mt-3 w-[280px] bg-white dark:bg-[#202124] rounded-lg border border-[#dadce0] dark:border-[#3c4043] shadow-[0_2px_6px_2px_rgba(60,64,67,0.15),0_1px_2px_0_rgba(60,64,67,0.3)] p-3 z-[1200] overflow-y-auto max-h-[80vh] font-roboto">
                        {roomState.map((room, index) => (
                            <div key={index} className="mb-3 pb-3 border-b border-[#dadce0]/60 dark:border-[#3c4043]/60 last:mb-0 last:pb-0 last:border-0 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[11px] font-medium uppercase text-[#70757a] tracking-wider">{ls.roomSingle} {index + 1}</div>
                                    {roomState.length > 1 && (
                                        <button
                                            onClick={() => removeRoom(index)}
                                            className="text-[#d93025] hover:text-red-700 text-[11px] font-medium uppercase tracking-wider cursor-pointer"
                                        >
                                            {ls.remove}
                                        </button>
                                    )}
                                </div>

                                {/* Adults */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[13px] font-normal text-[#202124] dark:text-slate-200">{ls.adults}</div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateRoom(index, 'adults', Math.max(1, room.adults - 1))}
                                            className="w-6 h-6 rounded-full bg-[#f1f3f4] dark:bg-[#303134] flex items-center justify-center text-[#3c4043] dark:text-slate-400 hover:bg-[#e8f0fe] hover:text-[#1a73e8] transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                        </button>
                                        <span className="w-3 text-center text-[13px] font-medium text-[#202124] dark:text-white">{room.adults}</span>
                                        <button
                                            onClick={() => updateRoom(index, 'adults', Math.min(6, room.adults + 1))}
                                            className="w-6 h-6 rounded-full bg-[#f1f3f4] dark:bg-[#303134] flex items-center justify-center text-[#3c4043] dark:text-slate-400 hover:bg-[#e8f0fe] hover:text-[#1a73e8] transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[13px] font-normal text-[#202124] dark:text-slate-200">{ls.children}</div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateRoom(index, 'children', Math.max(0, room.children - 1))}
                                            className="w-6 h-6 rounded-full bg-[#f1f3f4] dark:bg-[#303134] flex items-center justify-center text-[#3c4043] dark:text-slate-400 hover:bg-[#e8f0fe] hover:text-[#1a73e8] transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">remove</span>
                                        </button>
                                        <span className="w-3 text-center text-[13px] font-medium text-[#202124] dark:text-white">{room.children}</span>
                                        <button
                                            onClick={() => updateRoom(index, 'children', Math.min(4, room.children + 1))}
                                            className="w-6 h-6 rounded-full bg-[#f1f3f4] dark:bg-[#303134] flex items-center justify-center text-[#3c4043] dark:text-slate-400 hover:bg-[#e8f0fe] hover:text-[#1a73e8] transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Child Ages */}
                                {room.children > 0 && (
                                    <div className="mb-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{ls.children} {ls.years}</div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {room.childAges.map((age, ageIndex) => (
                                                <select
                                                    key={ageIndex}
                                                    value={age}
                                                    onChange={(e) => updateChildAge(index, ageIndex, e.target.value)}
                                                    className="w-full h-7 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] px-1 focus:border-primary focus:ring-0"
                                                >
                                                    {[...Array(18)].map((_, i) => (
                                                        <option key={i} value={i}>{i} {ls.years.substring(0, 2)}</option>
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
                                className="w-full py-1.5 bg-[#e8f0fe] dark:bg-blue-900/20 text-[#1a73e8] rounded-lg text-[12px] font-medium hover:bg-[#d2e3fc] dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                {ls.addRoom}
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
