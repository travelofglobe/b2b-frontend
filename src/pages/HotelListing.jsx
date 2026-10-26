import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { parseGuestsParam, validateAndSanitizeDates, formatDateForUrl } from '../utils/searchParamsUtils';
import { hotelService } from '../services/hotelService';
import { geographyService } from '../services/geographyService';
import { poiService } from '../services/poiService';
import ListingSearch from '../components/ListingSearch';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import { useFavorites } from '../context/FavoritesContext';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import OpenFreeMapLayer from '../components/OpenFreeMapLayer';
import SmoothWheelZoom from '../components/SmoothWheelZoom';
import { useDarkMode } from '../hooks/useDarkMode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths for Vite
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { LISTING_LOCALES, AMENITY_LOCALES, getAmenityText, getLayerLabel, tListing, getAmenityIcon } from '../utils/hotelListingLocales';
import PoiMarker from '../components/PoiMarker';
import HotelQuickLookDrawer from '../components/HotelQuickLookDrawer';
import { resolveFacility } from '../utils/facilityUtils';
import { getPropertyCategoryMeta } from '../utils/searchParamsUtils';

export const POI_CATEGORIES = [
    {
        key: 'transit',
        labelTr: 'Ulaşım & Taşıma',
        labelEn: 'Transit & Transport',
        icon: 'directions_transit',
        color: '#1a73e8',
        activeClass: 'bg-[#e8f0fe] dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 ring-2 ring-[#1a73e8]/30 shadow-xs',
        esCategories: ['AIRPORT', 'TRAIN_STATION', 'METRO_STATION', 'SUBWAY_STATION', 'BUS_STATION', 'TRANSIT', 'FERRY', 'STATION', 'PORT'],
        isPrimary: true
    },
    {
        key: 'restaurants',
        labelTr: 'Restoranlar & Yeme-İçme',
        labelEn: 'Restaurants & Dining',
        icon: 'restaurant',
        color: '#ea4335',
        activeClass: 'bg-[#fce8e6] dark:bg-red-900/40 text-[#ea4335] dark:text-red-300 ring-2 ring-[#ea4335]/30 shadow-xs',
        esCategories: ['RESTAURANT', 'DINING', 'CAFE', 'BAR', 'FOOD', 'BAKERY'],
        isPrimary: true
    },
    {
        key: 'tourist',
        labelTr: 'Turistik Yerler & Gezi',
        labelEn: 'Attractions & Sights',
        icon: 'photo_camera',
        color: '#9333ea',
        activeClass: 'bg-[#f3e8fd] dark:bg-purple-900/40 text-[#9333ea] dark:text-purple-300 ring-2 ring-[#9333ea]/30 shadow-xs',
        esCategories: ['ATTRACTION', 'TOURIST', 'POINT_OF_INTEREST', 'LANDMARK', 'MONUMENT', 'HISTORIC'],
        isPrimary: true
    },
    {
        key: 'shopping',
        labelTr: 'Alışveriş & Çarşılar',
        labelEn: 'Shopping & Malls',
        icon: 'shopping_bag',
        color: '#e91e63',
        activeClass: 'bg-[#fce4ec] dark:bg-pink-900/40 text-[#e91e63] dark:text-pink-300 ring-2 ring-[#e91e63]/30 shadow-xs',
        esCategories: ['SHOPPING', 'SHOPPING_MALL', 'SHOPPING_CENTER', 'MARKET', 'BAZAAR'],
        isPrimary: true
    },
    {
        key: 'museum',
        labelTr: 'Müzeler & Sanat',
        labelEn: 'Museums & Art',
        icon: 'museum',
        color: '#8e24aa',
        activeClass: 'bg-[#f3e8fd] dark:bg-purple-900/40 text-[#8e24aa] dark:text-purple-300 ring-2 ring-[#8e24aa]/30 shadow-xs',
        esCategories: ['MUSEUM', 'GALLERY'],
        isPrimary: false
    },
    {
        key: 'park',
        labelTr: 'Parklar & Doğa',
        labelEn: 'Parks & Nature',
        icon: 'park',
        color: '#2e7d32',
        activeClass: 'bg-[#e8f5e9] dark:bg-green-900/40 text-[#2e7d32] dark:text-green-300 ring-2 ring-[#2e7d32]/30 shadow-xs',
        esCategories: ['PARK', 'GARDEN', 'NATURE'],
        isPrimary: false
    },
    {
        key: 'beach',
        labelTr: 'Plajlar & Sahiller',
        labelEn: 'Beaches & Coast',
        icon: 'beach_access',
        color: '#0288d1',
        activeClass: 'bg-[#e1f5fe] dark:bg-sky-900/40 text-[#0288d1] dark:text-sky-300 ring-2 ring-[#0288d1]/30 shadow-xs',
        esCategories: ['BEACH', 'COAST'],
        isPrimary: false
    },
    {
        key: 'stadium',
        labelTr: 'Stadyum & Spor',
        labelEn: 'Stadiums & Sports',
        icon: 'stadium',
        color: '#d32f2f',
        activeClass: 'bg-[#ffebee] dark:bg-red-900/40 text-[#d32f2f] dark:text-red-300 ring-2 ring-[#d32f2f]/30 shadow-xs',
        esCategories: ['STADIUM', 'ARENA', 'SPORT'],
        isPrimary: false
    },
    {
        key: 'theater',
        labelTr: 'Tiyatro & Kültür',
        labelEn: 'Theaters & Shows',
        icon: 'theater_comedy',
        color: '#7b1fa2',
        activeClass: 'bg-[#f3e5f5] dark:bg-purple-900/40 text-[#7b1fa2] dark:text-purple-300 ring-2 ring-[#7b1fa2]/30 shadow-xs',
        esCategories: ['THEATER', 'CINEMA', 'ENTERTAINMENT', 'OPERA'],
        isPrimary: false
    },
    {
        key: 'historic',
        labelTr: 'Tarihi & Dini Yerler',
        labelEn: 'Historic & Religious',
        icon: 'account_balance',
        color: '#f57c00',
        activeClass: 'bg-[#fff3e0] dark:bg-amber-900/40 text-[#f57c00] dark:text-amber-300 ring-2 ring-[#f57c00]/30 shadow-xs',
        esCategories: ['RELIGIOUS', 'MOSQUE', 'CHURCH', 'TEMPLE', 'CASTLE'],
        isPrimary: false
    }
];

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// Map Location Watcher - single unified controller for map center & bounds fitting
// ═══════════════════════════════════════════════
const MapLocationWatcher = ({ slug, q, searchParams, hotels, isLoading, shouldRefit, onRefitDone, isProgrammaticMoveRef }) => {
    const map = useMap();
    const lastTargetLocationRef = React.useRef('');
    const lastFittedBoundsRef = React.useRef('');

    // 1. Immediately pan/fly map to target search city when search parameters change (even during isLoading)
    React.useEffect(() => {
        // If the URL already has custom map bounds, user is navigating/browsing the map! DO NOT flyTo or override zoom!
        if (searchParams?.get('bounds')) {
            return;
        }

        const lat = parseFloat(searchParams?.get('lat'));
        const lng = parseFloat(searchParams?.get('lng') || searchParams?.get('lon'));
        const targetId = searchParams?.get('poiId') || searchParams?.get('regionId') || searchParams?.get('togId') || searchParams?.get('locationId') || searchParams?.get('hotelId') || '';
        const currentQ = searchParams?.get('q') || q || '';
        // Only trigger when target destination ID or slug or primary search query changes (NOT on map-derived center lat/lng)
        const searchTargetKey = `${slug || ''}_${targetId}_${currentQ}`;

        if (searchTargetKey !== lastTargetLocationRef.current) {
            lastTargetLocationRef.current = searchTargetKey;
            lastFittedBoundsRef.current = '';

            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && map) {
                const center = map.getCenter();
                const dist = map.distance(center, [lat, lng]);
                // If map is not already centered on this target city (e.g. > 500m away)
                if (dist > 500) {
                    if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
                    const isPoi = searchParams?.get('type') === 'POI' || Boolean(searchParams?.get('poiId'));
                    const isHotel = searchParams?.get('type') === 'HOTEL' || Boolean(searchParams?.get('hotelId') || searchParams?.get('togId'));
                    let targetZoom = isHotel ? 15 : (isPoi ? 12 : 11);
                    const cleanSlug = normalizeLoc(slug);
                    if (cleanSlug && KNOWN_DESTINATIONS[cleanSlug]?.zoom) {
                        targetZoom = KNOWN_DESTINATIONS[cleanSlug].zoom;
                    }
                    map.flyTo([lat, lng], targetZoom, { duration: 0.9 });
                    setTimeout(() => {
                        if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
                    }, 1000);
                }
            }
        }
    }, [slug, q, searchParams?.get('poiId'), searchParams?.get('regionId'), searchParams?.get('togId'), searchParams?.get('locationId'), searchParams?.get('hotelId'), searchParams?.get('q'), searchParams?.get('bounds'), map, isProgrammaticMoveRef]);

    // 2. Auto-fit bounds once hotels are loaded and shouldRefit is true
    React.useEffect(() => {
        if (isLoading || !shouldRefit || !map) return;
        // Never auto-fit bounds if viewing custom map bounds
        if (searchParams?.get('bounds')) {
            if (onRefitDone) onRefitDone();
            return;
        }

        const isPoi = searchParams?.get('type') === 'POI' || Boolean(searchParams?.get('poiId'));
        const isHotel = searchParams?.get('type') === 'HOTEL' || Boolean(searchParams?.get('hotelId') || searchParams?.get('togId'));
        const lat = parseFloat(searchParams?.get('lat'));
        const lng = parseFloat(searchParams?.get('lng') || searchParams?.get('lon'));
        const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
        const hasRegionOrCity = Boolean(searchParams?.get('regionId') || searchParams?.get('locationId') || slug);

        // A. Single hotel search
        if (isHotel) {
            if (onRefitDone) onRefitDone();
            return;
        }

        // B. POI search: keep map strictly focused around the POI coordinates
        if (isPoi && hasCoords) {
            const valid = (hotels || []).filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)));
            const closeHotels = valid.filter(h => map.distance([lat, lng], [parseFloat(h.lat), parseFloat(h.lng)]) < 25000);

            if (closeHotels.length > 0) {
                try {
                    const points = closeHotels.map(h => [parseFloat(h.lat), parseFloat(h.lng)]);
                    points.push([lat, lng]);
                    const bounds = L.latLngBounds(points);
                    if (bounds.isValid()) {
                        const boundsKey = `poi_${closeHotels.length}_${bounds.getNorthEast().lat.toFixed(3)}_${bounds.getSouthWest().lng.toFixed(3)}`;
                        if (lastFittedBoundsRef.current !== boundsKey) {
                            lastFittedBoundsRef.current = boundsKey;
                            if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
                            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.0 });
                            if (onRefitDone) onRefitDone();
                            setTimeout(() => {
                                if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
                            }, 1100);
                            return;
                        }
                    }
                } catch (_e) { }
            } else {
                map.setView([lat, lng], 12);
                if (onRefitDone) onRefitDone();
                return;
            }
        }
        // C. City / Region search with known coords, regionId or slug:
        // Do NOT auto-fit/zoom into the subset of hotels on page 1.
        // In cities like Istanbul, page 1 hotels are tightly clustered in a single neighborhood (e.g. Sultanahmet),
        // and zooming in to that cluster restricts the map view and breaks the wide city overview.
        else if (hasCoords || hasRegionOrCity) {
            if (onRefitDone) onRefitDone();
            return;
        }
        // D. Fallback only when there are NO coordinates and NO region/city context:
        else if (hotels && hotels.length > 0) {
            const valid = hotels.filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)));
            if (valid.length > 0) {
                try {
                    const bounds = L.latLngBounds(valid.map(h => [parseFloat(h.lat), parseFloat(h.lng)]));
                    if (bounds.isValid()) {
                        const boundsKey = `${valid.length}_${bounds.getNorthEast().lat.toFixed(3)}_${bounds.getSouthWest().lng.toFixed(3)}`;
                        if (lastFittedBoundsRef.current !== boundsKey) {
                            lastFittedBoundsRef.current = boundsKey;
                            if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
                            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 12, duration: 1.0 });
                            if (onRefitDone) onRefitDone();
                            setTimeout(() => {
                                if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
                            }, 1100);
                            return;
                        }
                    }
                } catch (_e) { }
            }
        }

        if (onRefitDone) onRefitDone();
    }, [hotels, isLoading, shouldRefit, map, onRefitDone, isProgrammaticMoveRef, searchParams, slug]);

    return null;
};

// ═══════════════════════════════════════════════
// Map Bounds Watcher - triggers search on map move or zoom (user interactions)
// ═══════════════════════════════════════════════
const MapBoundsWatcher = ({ searchOnMove, onBoundsChange, onMapMoved, isProgrammaticMoveRef }) => {
    const timerRef = React.useRef(null);
    const lastBoundsDataRef = React.useRef(null);

    const searchOnMoveRef = React.useRef(searchOnMove);
    searchOnMoveRef.current = searchOnMove;

    const onBoundsChangeRef = React.useRef(onBoundsChange);
    onBoundsChangeRef.current = onBoundsChange;

    const onMapMovedRef = React.useRef(onMapMoved);
    onMapMovedRef.current = onMapMoved;

    React.useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleUpdate = React.useCallback((map) => {
        if (isProgrammaticMoveRef && isProgrammaticMoveRef.current) {
            return;
        }

        if (timerRef.current) clearTimeout(timerRef.current);

        const bounds = map.getBounds();
        const nw = bounds.getNorthWest();
        const se = bounds.getSouthEast();
        const currentZoom = Math.round(map.getZoom());

        const boundsData = {
            bounds: {
                topLeft: { lat: nw.lat, lon: nw.lng },
                bottomRight: { lat: se.lat, lon: se.lng }
            },
            zoom: currentZoom
        };

        // Avoid duplicate triggers if bounds and zoom haven't actually changed
        const prev = lastBoundsDataRef.current;
        if (prev) {
            const eps = 0.000001;
            if (
                prev.zoom === currentZoom &&
                Math.abs(prev.bounds.topLeft.lat - boundsData.bounds.topLeft.lat) < eps &&
                Math.abs(prev.bounds.topLeft.lon - boundsData.bounds.topLeft.lon) < eps &&
                Math.abs(prev.bounds.bottomRight.lat - boundsData.bounds.bottomRight.lat) < eps &&
                Math.abs(prev.bounds.bottomRight.lon - boundsData.bounds.bottomRight.lon) < eps
            ) {
                return;
            }
        }

        lastBoundsDataRef.current = boundsData;

        // If searchOnMove is enabled (checkbox checked), debounce and trigger search
        if (searchOnMoveRef.current) {
            timerRef.current = setTimeout(() => {
                if (isProgrammaticMoveRef && isProgrammaticMoveRef.current) {
                    return;
                }
                onBoundsChangeRef.current?.(boundsData);
            }, 400);
        } else {
            // When searchOnMove is disabled, do not search automatically:
            // Signal that map has moved so "Search this area" button appears
            onMapMovedRef.current?.(boundsData);
        }
    }, [isProgrammaticMoveRef]);

    useMapEvents({
        dragstart: () => {
            if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
        },
        zoomstart: () => {
            if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
        },
        moveend: (e) => {
            handleUpdate(e.target);
        }
    });

    return null;
};

// Capture map instance
const MapInstanceCapture = ({ setMap, setIsMapReady }) => {
    const map = useMap();
    React.useEffect(() => {
        if (map) {
            setMap(map);
            map.invalidateSize();
            if (setIsMapReady) setIsMapReady(true);
        }
        return () => {
            setMap(null);
            if (setIsMapReady) setIsMapReady(false);
        };
    }, [map, setMap, setIsMapReady]);
    return null;
};

// ═══════════════════════════════════════════════
// Google Hotels Style Price Marker & Hover Popup
// ═══════════════════════════════════════════════
let _measureCanvas = null;
let _measureCtx = null;
const measurePriceText = (text) => {
    if (typeof document === 'undefined') return 36;
    if (!_measureCanvas) {
        _measureCanvas = document.createElement('canvas');
        _measureCtx = _measureCanvas.getContext('2d');
    }
    if (_measureCtx) {
        _measureCtx.font = '600 12px "Google Sans", Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
        return _measureCtx.measureText(text).width;
    }
    return 36;
};

const PriceMarker = React.memo(({
    hotel,
    isSelected,
    isHovered,
    onSelect,
    onHover,
    searchParams,
    currencySymbol,
    isFav,
    onToggleFav,
    currentLang
}) => {
    const map = useMap();
    const active = isSelected || isHovered;
    const markerRef = React.useRef(null);
    const enterTimerRef = React.useRef(null);
    const leaveTimerRef = React.useRef(null);
    const [isMarkerDirectHovered, setIsMarkerDirectHovered] = React.useState(false);

    React.useEffect(() => {
        return () => {
            if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        };
    }, []);

    const hasPrice = Boolean(hotel.price && Number(hotel.price) > 0);
    const priceDisplay = hasPrice
        ? `${currencySymbol} ${Math.round(hotel.price).toLocaleString('tr-TR')}`
        : (hotel.rating ? `★ ${(parseFloat(hotel.rating) || 4.2).toFixed(1).replace('.', ',')}` : '★ 4.2');

    const checkIsNearTop = React.useCallback(() => {
        if (!map || !hotel.lat || !hotel.lng) return false;
        try {
            const point = map.latLngToContainerPoint([parseFloat(hotel.lat), parseFloat(hotel.lng)]);
            const mapHeight = map.getSize ? map.getSize().y : 700;
            // If the marker point is in the upper half of the map or within 380px of top, open downwards
            return point.y < Math.max(380, mapHeight * 0.48);
        } catch (e) {
            return false;
        }
    }, [map, hotel.lat, hotel.lng]);

    const [isNearTop, setIsNearTop] = React.useState(false);

    // Update position whenever hover happens or when marker moves
    React.useEffect(() => {
        if (isMarkerDirectHovered) {
            setIsNearTop(checkIsNearTop());
        }
    }, [isMarkerDirectHovered, checkIsNearTop]);

    // Automatically open/close popup on direct marker hover and toggle marker-hovered class on any hover
    React.useEffect(() => {
        if (markerRef.current) {
            const el = markerRef.current.getElement ? markerRef.current.getElement() : null;
            if (el) {
                if (isHovered) {
                    el.classList.add('marker-hovered');
                } else {
                    el.classList.remove('marker-hovered');
                }
            }
            if (isMarkerDirectHovered) {
                markerRef.current.openPopup();
            } else {
                markerRef.current.closePopup();
            }
        }
    }, [isHovered, isMarkerDirectHovered, isNearTop]);

    React.useEffect(() => {
        if (!isHovered) {
            setIsMarkerDirectHovered(false);
        }
    }, [isHovered]);

    const handleMouseEnter = React.useCallback(() => {
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
        }
        if (isMarkerDirectHovered) return;
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current);
        }
        setIsNearTop(checkIsNearTop());
        enterTimerRef.current = setTimeout(() => {
            setIsNearTop(checkIsNearTop());
            setIsMarkerDirectHovered(true);
            onHover(hotel);
            enterTimerRef.current = null;
        }, 400);
    }, [isMarkerDirectHovered, onHover, hotel, checkIsNearTop]);

    const handleMouseLeave = React.useCallback(() => {
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current);
            enterTimerRef.current = null;
        }
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
        }
        leaveTimerRef.current = setTimeout(() => {
            setIsMarkerDirectHovered(false);
            onHover(null);
            leaveTimerRef.current = null;
        }, 300);
    }, [onHover]);

    const handlePopupMouseEnter = React.useCallback(() => {
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
        }
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current);
            enterTimerRef.current = null;
        }
        setIsNearTop(checkIsNearTop());
        setIsMarkerDirectHovered(true);
        onHover(hotel);
    }, [onHover, hotel, checkIsNearTop]);

    const handlePopupMouseLeave = React.useCallback(() => {
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
        }
        leaveTimerRef.current = setTimeout(() => {
            setIsMarkerDirectHovered(false);
            onHover(null);
            leaveTimerRef.current = null;
        }, 300);
    }, [onHover]);

    const handleClick = React.useCallback(() => {
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current);
            enterTimerRef.current = null;
        }
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
        }
        setIsMarkerDirectHovered(false);
        if (markerRef.current) {
            markerRef.current.closePopup();
        }
        onHover(null);
        // Zaten seçiliyse deselect et (quick view kapat)
        if (isSelected) {
            onSelect(null);
        } else {
            onSelect(hotel);
        }
    }, [hotel, isSelected, onHover, onSelect]);

    const icon = React.useMemo(() => {
        // Measure text width for perfect bubble sizing
        const textWidth = measurePriceText(priceDisplay);

        // Compact bubble geometry
        const H = 26; // Pill height
        const R = 13; // Fully rounded capsule radius (no sharp corners)
        const favWidth = isFav ? 14 : 0;
        const W = Math.max(64, Math.round(26 + textWidth + favWidth + 10));
        const centerX = Math.round(W / 2);
        const tailTipX = centerX; // Pointer tail tip X coordinate exactly centered

        const catMeta = getPropertyCategoryMeta(hotel, currentLang);
        const catIcon = catMeta?.icon || 'hotel';
        const pinkCircleColor = '#f06293';

        // Colors & styles matching Rose/Pink #f06293 theme
        const bgFill = isSelected ? '#f06293' : '#ffffff';
        const borderColor = isSelected ? '#e91e63' : '#dadce0';
        const textColor = isSelected ? '#ffffff' : '#202124';
        const textWeight = isSelected ? '700' : '600';
        const scale = isSelected ? 'scale(1.22)' : 'scale(1)';
        const shadow = isSelected 
            ? 'drop-shadow(0 4px 12px rgba(240,98,147,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            : 'drop-shadow(0 1.5px 3px rgba(0,0,0,0.1)) drop-shadow(0 0.5px 1.5px rgba(0,0,0,0.06))';

        // Unified SVG path: fully rounded pill / capsule with smooth centered curved tail
        const tR = centerX + 7;
        const tL = centerX - 7;
        const path = `
            M ${R} 0
            L ${W - R} 0
            A ${R} ${R} 0 0 1 ${W} ${R}
            A ${R} ${R} 0 0 1 ${W - R} ${H}
            L ${tR} ${H}
            C ${centerX + 5} ${H}, ${centerX + 3} 27.8, ${centerX + 1.8} 30.2
            C ${centerX + 1.2} 31.5, ${centerX - 0.2} 31.5, ${centerX - 0.8} 30.2
            C ${centerX - 2} 27.8, ${centerX - 4} ${H}, ${tL} ${H}
            L ${R} ${H}
            A ${R} ${R} 0 0 1 0 ${R}
            A ${R} ${R} 0 0 1 ${R} 0
            Z
        `;

        const favColor = isSelected ? '#ffffff' : '#f97316';
        const favSvg = isFav ? `
            <g transform="translate(${W - 17}, 6.5) scale(0.52)">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="${favColor}"/>
            </g>
        ` : '';

        const iconGroup = isSelected ? `
            <foreignObject x="4" y="4" width="18" height="18" style="overflow:visible;pointer-events:none;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#ffffff;line-height:1;">
                    <span class="material-symbols-outlined" style="font-size:12px;line-height:1;font-variation-settings:'FILL' 1;color:#ffffff;">
                        ${catIcon}
                    </span>
                </div>
            </foreignObject>
        ` : `
            <circle class="marker-circle" cx="13" cy="13" r="9" fill="${pinkCircleColor}" style="transition:fill 0.35s ease;"/>
            <foreignObject x="4" y="4" width="18" height="18" style="overflow:visible;pointer-events:none;">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#ffffff;line-height:1;">
                    <span class="material-symbols-outlined" style="font-size:12px;line-height:1;font-variation-settings:'FILL' 1;color:#ffffff;">
                        ${catIcon}
                    </span>
                </div>
            </foreignObject>
        `;

        const html = `
            <div style="cursor:pointer;user-select:none;">
                <svg width="${W}" height="34" viewBox="0 0 ${W} 34" style="overflow:visible;filter:${shadow};display:block;transform-origin:${tailTipX}px 32px;transform:${scale};">
                    <path class="marker-bubble-path" d="${path}" fill="${bgFill}" stroke="${borderColor}" stroke-width="${isSelected ? 1.0 : 0.75}" stroke-linejoin="round" style="transition:stroke 0.35s ease, fill 0.35s ease;"/>
                    ${iconGroup}
                    <text x="26" y="13" dominant-baseline="central" font-family="'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="${textWeight}" fill="${textColor}" letter-spacing="-0.1px">${priceDisplay}</text>
                    ${favSvg}
                </svg>
            </div>
        `;

        return L.divIcon({
            className: `google-hotel-map-marker ${isSelected ? 'marker-selected' : ''}`,
            html,
            iconSize: [W, 34],
            iconAnchor: [tailTipX, 32],
        });
    }, [isSelected, isFav, priceDisplay, hotel, currentLang]);

    const formattedRating = (parseFloat(hotel.rating) || 4.2).toFixed(1).replace('.', ',');
    const reviewCount = hotel.reviewCount || (hotel.stars ? hotel.stars * 115 + 42 : 432);
    const imageUrl = (hotel.images && hotel.images.length > 0) ? hotel.images[0] : (hotel.image || hotel.thumbnail || placeholderHotel);

    const showPricesText = {
        tr: 'Fiyatları göster',
        en: 'Show prices',
        de: 'Preise anzeigen',
        fr: 'Voir les prix',
        ru: 'Показать цены',
        ar: 'عرض الأسعار'
    }[currentLang] || 'Fiyatları göster';

    const quickLookText = {
        tr: 'Hızlı Bakış',
        en: 'Quick look',
        de: 'Schnellansicht',
        fr: 'Aperçu rapide',
        ru: 'Быстрый просмотр',
        ar: 'نظرة سريعة',
        es: 'Vista rápida',
        it: 'Visualizzazione rapida',
        zh: '快捷查看'
    }[currentLang] || 'Hızlı Bakış';

    return (
        <Marker
            ref={markerRef}
            position={[parseFloat(hotel.lat), parseFloat(hotel.lng)]}
            icon={icon}
            zIndexOffset={isSelected ? 3000 : (isHovered ? 2500 : (isFav ? 500 : 0))}
            eventHandlers={{
                click: handleClick,
                mouseover: handleMouseEnter,
                mouseout: handleMouseLeave,
            }}
        >
            <Popup
                key={isNearTop ? 'down' : 'up'}
                className={`hotel-price-popup ${isNearTop ? 'popup-downwards' : ''}`}
                minWidth={220}
                maxWidth={220}
                autoPan={false}
                closeButton={false}
                offset={isNearTop ? [0, 4] : [0, -38]}
            >
                <style>{`
                .leaflet-popup.hotel-price-popup,
                .leaflet-fade-anim .leaflet-popup.hotel-price-popup {
                    transition: none !important;
                    -webkit-transition: none !important;
                    animation: none !important;
                    pointer-events: auto !important;
                }
                    .hotel-price-popup .leaflet-popup-content-wrapper { 
                        padding: 0 !important; 
                        border-radius: 6px !important; 
                        overflow: hidden !important; 
                        box-shadow: 0 1px 4px rgba(0,0,0,0.35) !important; 
                        border: none !important;
                        background: #ffffff !important;
                        transition: none !important;
                    }
                    .dark .hotel-price-popup .leaflet-popup-content-wrapper {
                        box-shadow: 0 1px 4px rgba(0,0,0,0.7) !important;
                    }
                    .hotel-price-popup.popup-downwards {
                        bottom: auto !important;
                        top: 0px !important;
                        margin-top: 0 !important;
                        margin-bottom: 0 !important;
                    }
                    .hotel-price-popup.popup-downwards .leaflet-popup-content-wrapper {
                        transform-origin: top center !important;
                        margin-top: 0 !important;
                    }
                    .hotel-price-popup:not(.popup-downwards) {
                        margin-bottom: 0 !important;
                    }
                    .hotel-price-popup:not(.popup-downwards) .leaflet-popup-content-wrapper {
                        transform-origin: bottom center !important;
                        margin-bottom: 0 !important;
                    }
                    .hotel-price-popup .leaflet-popup-content { 
                        margin: 0 !important; 
                        width: 220px !important; 
                        line-height: normal !important; 
                    }
                    .hotel-price-popup .leaflet-popup-tip-container { 
                        display: none !important; 
                    }
                    .hotel-price-popup a.leaflet-popup-close-button { 
                        display: none !important; 
                    }
                `}</style>
                    <div
                        onMouseEnter={handlePopupMouseEnter}
                        onMouseLeave={handlePopupMouseLeave}
                        style={{
                            width: '220px',
                            fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                            borderRadius: '6px',
                            overflow: 'hidden',
                            background: '#ffffff',
                        }}
                    >
                        <div style={{ position: 'relative', width: '100%', height: '118px', backgroundColor: '#f1f3f4' }}>
                            <img
                                src={imageUrl}
                                alt={hotel.name}
                                onError={e => { e.target.src = placeholderHotel; e.target.onerror = null; }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '28px',
                                    height: '28px',
                                    background: 'rgba(32,33,36,0.55)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(2px)',
                                    transition: 'background 0.2s'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onToggleFav) onToggleFav();
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(32,33,36,0.8)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(32,33,36,0.55)'}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        color: isFav ? '#fb923c' : 'white',
                                        fontSize: '16px',
                                        fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0",
                                        lineHeight: 1
                                    }}
                                >
                                    bookmark
                                </span>
                            </div>
                        </div>
                        <div style={{ padding: '10px 12px 12px 12px' }}>
                            <div
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#202124',
                                    lineHeight: '1.25',
                                    marginBottom: '3px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                title={hotel.name}
                            >
                                {hotel.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '10px', fontSize: '12px' }}>
                                <span style={{ color: '#5f6368', fontWeight: 500 }}>{formattedRating}</span>
                                <span style={{ color: '#fbbc04', fontSize: '11px' }}>★</span>
                                <span style={{ color: '#1a73e8', textDecoration: 'none' }}>({reviewCount.toLocaleString('tr-TR')})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(hotel);
                                    }}
                                    style={{
                                        flex: 1,
                                        border: '1px solid #dadce0',
                                        borderRadius: '18px',
                                        padding: '6px 4px',
                                        textAlign: 'center',
                                        color: '#1a73e8',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        backgroundColor: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '3px',
                                        transition: 'all 0.15s ease',
                                        boxSizing: 'border-box'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.backgroundColor = '#f8fafd';
                                        e.currentTarget.style.borderColor = '#1a73e8';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                        e.currentTarget.style.borderColor = '#dadce0';
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span>
                                    <span>{quickLookText}</span>
                                </button>
                                <Link
                                    to={`/travel/hotels/detail/${hotel.hotelId}?${searchParams.toString()}`}
                                    target="_blank"
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        flex: 1,
                                        border: '1px solid #1a73e8',
                                        borderRadius: '18px',
                                        padding: '6px 4px',
                                        textAlign: 'center',
                                        color: '#ffffff',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        transition: 'all 0.15s ease',
                                        backgroundColor: '#1a73e8',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.backgroundColor = '#1557b0';
                                        e.currentTarget.style.borderColor = '#1557b0';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.backgroundColor = '#1a73e8';
                                        e.currentTarget.style.borderColor = '#1a73e8';
                                    }}
                                >
                                    {showPricesText}
                                </Link>
                            </div>
                        </div>
                    </div>
                </Popup>
        </Marker>
    );
});

// ═══════════════════════════════════════════════
// Google Hotels Style Spatially Aggregated Cluster Marker
// ═══════════════════════════════════════════════
const ClusterMarker = React.memo(({ cluster, onClusterClick }) => {
    const count = cluster.count || 0;
    const countDisplay = count > 999 ? `${(count / 1000).toFixed(1)}k` : `${count}`;

    const icon = React.useMemo(() => {
        const size = count > 100 ? 44 : (count > 20 ? 38 : 34);
        const half = size / 2;
        const html = `
            <div style="cursor:pointer;user-select:none;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;transition:transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);" class="group hover:scale-110 active:scale-95">
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #F75270 0%, #e11d48 100%);
                    color: #ffffff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif;
                    font-weight: 700;
                    font-size: ${count > 99 ? '12px' : '13px'};
                    box-shadow: 0 4px 14px rgba(247, 82, 112, 0.45), 0 2px 6px rgba(0,0,0,0.18);
                    border: 2.5px solid #ffffff;
                    line-height: 1;
                ">
                    <span>${countDisplay}</span>
                </div>
            </div>
        `;
        return L.divIcon({
            className: 'google-hotel-cluster-marker',
            html,
            iconSize: [size, size],
            iconAnchor: [half, half],
        });
    }, [count, countDisplay]);

    const handleClick = React.useCallback(() => {
        if (onClusterClick) {
            onClusterClick(cluster);
        }
    }, [cluster, onClusterClick]);

    if (!cluster.lat || !cluster.lng) return null;

    return (
        <Marker
            position={[parseFloat(cluster.lat), parseFloat(cluster.lng)]}
            icon={icon}
            zIndexOffset={1000}
            eventHandlers={{
                click: handleClick
            }}
        />
    );
});

// ═══════════════════════════════════════════════
// Google Hotels Style Card
// ═══════════════════════════════════════════════
const GoogleHotelCard = React.memo(({ hotel, searchParams, isSelected, isHovered, onHover, onSelect, currentLang, isFav, onToggleFav, isCompact = false }) => {
    const [imgIdx, setImgIdx] = React.useState(0);
    const images = React.useMemo(() => {
        const raw = hotel.images?.length > 0 ? hotel.images : (hotel.image ? [hotel.image] : []);
        const clean = raw.map(img => {
            if (!img) return null;
            let u = typeof img === 'object' ? (img.url || img.originalUrl || img.path || img.src || img.href) : String(img);
            if (!u || typeof u !== 'string') return null;
            u = u.trim();
            if (u.startsWith('http://')) u = 'https://' + u.slice(7);
            else if (u.startsWith('//')) u = 'https:' + u;
            return u;
        }).filter(Boolean);

        return clean.length > 0 ? clean : [placeholderHotel];
    }, [hotel.images, hotel.image]);

    const getCurrencySymbol = (code) => {
        const sym = { USD: '$', EUR: '€', GBP: '£', TRY: '₺', AED: 'د.إ', SAR: 'ر.س', JPY: '¥', CNY: '¥', RUB: '₽' };
        return sym[code] || code || '$';
    };
    const currencySymbol = getCurrencySymbol(hotel.currency);
    const formattedPrice = hotel.price ? Math.round(hotel.price).toLocaleString('tr-TR') : '';

    const starLabel = React.useMemo(() => {
        const count = Math.round(Number(hotel.stars) || 0);
        if (count > 0) {
            const labels = {
                tr: `${count} yıldızlı otel`,
                en: `${count}-star hotel`,
                de: `${count}-Sterne-Hotel`,
                ar: `فندق ${count} نجوم`,
                fr: `Hôtel ${count} étoiles`,
                es: `Hotel de ${count} estrellas`,
                ru: `${count}-звездочный отель`
            };
            return labels[currentLang] || labels.en;
        }
        return hotel.type || (currentLang === 'tr' ? 'Otel' : 'Hotel');
    }, [hotel.stars, hotel.type, currentLang]);

    const ratingNum = parseFloat(hotel.rating) || 0;
    const displayRating = React.useMemo(() => {
        if (!ratingNum || ratingNum <= 0) return null;
        let val = ratingNum;
        if (val > 5.0) {
            val = val / 2; // Normalize 10-point scale to Google's 5.0 scale
        }
        const str = val.toFixed(1);
        return currentLang === 'tr' ? str.replace('.', ',') : str;
    }, [ratingNum, currentLang]);

    const displayAmenities = React.useMemo(() => {
        const items = [];

        // 1. Star / Category info is ALWAYS the 1st item in Google
        items.push({ icon: 'hotel', label: starLabel });

        // 2. Meal / Board (e.g. Kahvaltı ($), Kahvaltı Dahil, Sadece Oda)
        if (hotel.boardName) {
            const bLower = hotel.boardName.toLowerCase();
            const isBreakfast = bLower.includes('breakfast') || bLower.includes('kahvalt');
            const icon = isBreakfast ? 'free_breakfast' : 'restaurant';
            items.push({ icon, label: hotel.boardName });
        }

        // 3. Hotel facilities/amenities
        if (Array.isArray(hotel.amenities)) {
            hotel.amenities.forEach(a => {
                const label = typeof a === 'object' ? (Array.isArray(a.label) ? a.label[0] : a.label) : String(a);
                const icon = (typeof a === 'object' && a.icon) ? a.icon : 'check_circle';
                if (label && label.toLowerCase() !== starLabel.toLowerCase()) {
                    items.push({ icon, label });
                }
            });
        }

        // Deduplicate
        const seen = new Set();
        const unique = [];
        items.forEach(item => {
            const key = (item.label || '').trim().toLowerCase();
            if (key && !seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        });

        const sliced = unique.slice(0, 9);
        if (unique.length > 9 && sliced.length === 9) {
            sliced[8] = {
                icon: 'checklist',
                label: currentLang === 'tr' ? 'Tüm özelliklere sahip' : 'All amenities'
            };
        }
        return sliced;
    }, [starLabel, hotel.boardName, hotel.amenities, currentLang]);

    const showPricesLabel = {
        tr: 'Fiyatları göster', en: 'Show prices', ar: 'عرض الأسعار', de: 'Preise anzeigen',
        fr: 'Voir les prix', ru: 'Показать цены', zh: '查看价格', es: 'Ver precios', it: 'Mostra prezzi', ja: '料金を見る', fa: 'نمایش قیمت'
    };
    const quickLookLabel = {
        tr: 'Hızlı Bakış', en: 'Quick look', ar: 'نظرة سريعة', de: 'Schnellansicht',
        fr: 'Aperçu rapide', ru: 'Быстрый просмотр', zh: '快捷查看', es: 'Vista rápida', it: 'Visualizzazione rapida', ja: 'クイックビュー', fa: 'نمای سریع'
    };
    const freeCancelLabel = {
        tr: 'Ücretsiz iptal', en: 'Free cancellation', ar: 'إلغاء مجاني', de: 'Kostenlose Stornierung',
        fr: 'Annulation gratuite', ru: 'Бесплатная отмена', zh: '免费取消', es: 'Cancelación gratuita', it: 'Cancellazione gratuita'
    };
    const hasPriceDrop = hotel.strikethroughPrice && hotel.strikethroughPrice > hotel.price;
    const isGreatDeal = hasPriceDrop || Boolean(hotel.isRecommended);
    const discountPercent = hasPriceDrop ? Math.round(((hotel.strikethroughPrice - hotel.price) / hotel.strikethroughPrice) * 100) : 20;

    const greatDealLabel = {
        tr: 'FIRSAT', en: 'DEAL', ar: 'عرض', de: 'ANGEBOT',
        fr: 'SUPER OFFRE', ru: 'ОТЛИЧНОЕ ПРЕДЛОЖЕНИЕ', zh: '超值特价', es: 'GRAN OFERTA', it: 'OTTIMO AFFARE'
    };

    const lessThanUsualLabel = (percent) => {
        const labels = {
            tr: `Normalden %${percent} daha az`,
            en: `${percent}% less than usual`,
            ar: `أقل بنسبة ${percent}٪ من المعتاد`,
            de: `${percent}% weniger als üblich`,
            fr: `${percent}% de moins que d'habitude`,
            ru: `На ${percent}% дешевле обычного`,
            zh: `比平时低 ${percent}%`,
            es: `${percent}% menos de lo habitual`,
            it: `Il ${percent}% in meno del solito`
        };
        return labels[currentLang] || labels.en;
    };


    const [isLocalHovered, setIsLocalHovered] = React.useState(false);
    const isCardHovered = isHovered || isLocalHovered;

    // Auto-slide effect on hover with smooth zoom-in
    React.useEffect(() => {
        let intervalId;
        if (isCardHovered && images.length > 1) {
            intervalId = setInterval(() => {
                setImgIdx((prev) => (prev + 1) % images.length);
            }, 3500);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isCardHovered, images.length]);

    const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(p => (p + 1) % images.length); };
    const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(p => (p - 1 + images.length) % images.length); };
    const isActive = isSelected || isCardHovered;

    return (
        <div
            id={`hotel-card-${hotel.id || hotel.hotelId}`}
            className={`flex py-4 pl-6 pr-4 border-b border-[#e8eaed] dark:border-slate-700 cursor-pointer transition-colors group ${isActive ? 'bg-[#f0f4ff] dark:bg-blue-900/10' : 'bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-800/40'}`}
            onMouseEnter={() => { setIsLocalHovered(true); onHover(hotel); }}
            onMouseLeave={() => { setIsLocalHovered(false); onHover(null); }}
            onClick={() => onSelect(hotel)}
        >
            {/* Image */}
            <div className={`relative ${isCompact ? "w-[190px] h-[145px] mr-3.5" : "w-[260px] h-[175px] mr-5"} rounded-lg overflow-hidden shrink-0 bg-[#f1f3f4] transition-all duration-300`}>
                {isGreatDeal && (
                    <div className="absolute top-2 left-2 z-10 bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-2 py-1 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.15)] truncate max-w-[85%] border border-[#137333]/10">
                        {greatDealLabel[currentLang] || greatDealLabel.en}
                    </div>
                )}

                {/* Image Crossfade Slider */}
                <div className="w-full h-full relative overflow-hidden bg-[#f1f3f4] dark:bg-slate-800">
                    {images.map((img, i) => (
                        <div
                            key={i}
                            className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-700 ease-in-out ${
                                i === imgIdx ? 'opacity-100 z-[2]' : 'opacity-0 z-[1] pointer-events-none'
                            }`}
                        >
                            <img
                                src={img || placeholderHotel}
                                alt={hotel.name}
                                onError={e => {
                                    if (e.target.src !== placeholderHotel) {
                                        e.target.src = placeholderHotel;
                                    }
                                    e.target.onerror = null;
                                }}
                                className={`w-full h-full object-cover select-none will-change-transform transition-transform duration-[3800ms] ease-out ${
                                    isCardHovered && i === imgIdx ? 'scale-[1.08]' : 'scale-100'
                                }`}
                                loading={i === 0 ? 'eager' : 'lazy'}
                                decoding="async"
                            />
                        </div>
                    ))}
                </div>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImg}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#202124] shadow-[0_1px_4px_rgba(0,0,0,0.25)] backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-95 cursor-pointer z-10"
                        >
                            <span className="material-symbols-outlined text-[#202124]" style={{ fontSize: '18px' }}>chevron_left</span>
                        </button>
                        <button
                            onClick={nextImg}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#202124] shadow-[0_1px_4px_rgba(0,0,0,0.25)] backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-95 cursor-pointer z-10"
                        >
                            <span className="material-symbols-outlined text-[#202124]" style={{ fontSize: '18px' }}>chevron_right</span>
                        </button>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
                            {images.slice(0, 5).map((_, i) => (
                                <div key={i} className={`rounded-full transition-all ${i === imgIdx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`} />
                            ))}
                        </div>
                    </>
                )}
                <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav?.(); }}
                >
                    {isFav ? (
                        <span className="material-symbols-outlined text-[#f97316] dark:text-[#fb923c]" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    ) : (
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>bookmark_border</span>
                    )}
                </button>
                {/* Recommended Badge */}
                {hotel.isRecommended && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="relative flex items-center gap-1 px-2.5 pb-2 pt-4">
                            <span className="material-symbols-outlined text-amber-400" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                            <span className="text-white text-[11px] font-semibold tracking-wide drop-shadow-sm">
                                {currentLang === 'tr' ? 'Öneriliyor' : currentLang === 'ar' ? 'موصى به' : currentLang === 'de' ? 'Empfohlen' : currentLang === 'fr' ? 'Recommandé' : currentLang === 'ru' ? 'Рекомендуется' : 'Recommended'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex gap-4 py-1">
                {/* Left Column (Details) */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    {/* Name */}
                    <Link
                        to={`/travel/hotels/detail/${hotel.togId || hotel.hotelId || hotel.id}?${searchParams.toString()}`}
                        target="_blank"
                        className="text-[20px] font-normal text-[#202124] dark:text-slate-100 hover:underline leading-[1.3] line-clamp-2"
                        onClick={e => e.stopPropagation()}
                    >
                        {hotel.name}
                    </Link>

                    {/* Star Rating line (Google style) */}
                    {hotel.stars > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[13px]">
                            <span className="font-medium text-[#5f6368] dark:text-slate-300 font-roboto">
                                {starLabel}
                            </span>
                            <div className="flex items-center text-[#fabb05] text-[12px] tracking-tight">
                                {[...Array(Math.min(5, Math.max(1, Math.round(hotel.stars))))].map((_, i) => (
                                    <span key={i} className="leading-none select-none">★</span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-[13px] text-[#5f6368] dark:text-slate-400 font-roboto mt-0.5">
                            {starLabel}
                        </div>
                    )}

                    {/* Google-style Amenities grid (3x3 - 9 items) */}
                    {displayAmenities.length > 0 && (
                        <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-2">
                            {displayAmenities.map((amenity, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[12.5px] text-[#3c4043] dark:text-slate-300 min-w-0 font-roboto" title={amenity.label}>
                                    <span className="material-symbols-outlined text-[#5f6368] dark:text-slate-400 shrink-0" style={{ fontSize: '17px' }}>
                                        {amenity.icon}
                                    </span>
                                    <span className="truncate">
                                        {amenity.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bottom row: free cancel + board Name */}
                    <div className="flex items-center gap-2 min-w-0 mt-auto pt-4">
                        {hotel.hasFreeCancellation && (
                            <span className="text-[12px] text-[#0d652d] dark:text-green-400 font-medium truncate font-roboto">
                                {freeCancelLabel[currentLang] || freeCancelLabel.en}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Column (Price & CTA) */}
                <div className="shrink-0 flex flex-col items-end justify-between min-w-[130px]">
                    <div className="text-right mt-1">
                        {isGreatDeal ? (
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="bg-[#e6f4ea] text-[#137333] text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-[#137333]/10">
                                        {greatDealLabel[currentLang] || greatDealLabel.en}
                                    </span>
                                    <span className="text-[22px] font-bold text-[#1e8e3e] leading-none font-roboto">
                                        {currencySymbol}{formattedPrice}
                                    </span>
                                </div>
                                <div className="text-[13px] text-[#3c4043] dark:text-slate-300 font-medium leading-none font-roboto">
                                    {lessThanUsualLabel(discountPercent)}
                                </div>
                            </div>
                        ) : (
                            <>
                                {formattedPrice ? (
                                    <>
                                        {hotel.strikethroughPrice && (
                                            <div className="text-[13px] text-[#70757a] dark:text-slate-400 line-through leading-none mb-1 font-roboto">
                                                {currencySymbol}{Math.round(hotel.strikethroughPrice).toLocaleString('tr-TR')}
                                            </div>
                                        )}
                                        <span className="text-[22px] font-bold text-[#202124] dark:text-slate-100 leading-none font-roboto">
                                            {currencySymbol}{formattedPrice}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[14px] font-semibold text-[#1a73e8] dark:text-blue-400 font-roboto">
                                        {showPricesLabel[currentLang] || showPricesLabel.en}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 flex-wrap sm:flex-nowrap justify-end">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(hotel);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 border border-[#dadce0] dark:border-slate-600 hover:border-[#1a73e8] dark:hover:border-blue-400 bg-white dark:bg-[#303134] hover:bg-[#f8fafd] dark:hover:bg-blue-900/20 text-[#1a73e8] dark:text-blue-400 text-[13px] font-medium h-[31px] px-3 rounded-full transition-all whitespace-nowrap font-roboto cursor-pointer shadow-xs active:scale-[0.98]"
                            title={quickLookLabel[currentLang] || quickLookLabel.en}
                        >
                            <span className="material-symbols-outlined text-[17px]">visibility</span>
                            <span>{quickLookLabel[currentLang] || quickLookLabel.en}</span>
                        </button>

                        <Link
                            to={`/travel/hotels/detail/${hotel.hotelId}?${searchParams.toString()}`}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center justify-center bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] text-white text-[13.5px] font-medium h-[31px] px-3.5 rounded-full transition-colors whitespace-nowrap font-roboto shadow-[0_1px_2px_rgba(60,64,67,0.3)] hover:shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] active:scale-[0.98]"
                        >
                            {showPricesLabel[currentLang] || showPricesLabel.en}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
});

// ═══════════════════════════════════════════════
// Skeleton loader card (mirrors GoogleHotelCard 1:1 in dimensions & layout)
// ═══════════════════════════════════════════════
const GoogleCardSkeleton = ({ isCompact = false }) => (
    <div className="flex py-4 pl-6 pr-4 border-b border-[#e8eaed] dark:border-slate-700 animate-pulse bg-white dark:bg-[#303134]">
        {/* Image skeleton: mirrors w-[260px] h-[175px] rounded-lg mr-5 */}
        <div className={`relative ${isCompact ? "w-[190px] h-[145px] mr-3.5" : "w-[260px] h-[175px] mr-5"} rounded-lg bg-[#f1f3f4] dark:bg-slate-700/80 shrink-0 overflow-hidden transition-all duration-300`}>
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/10 dark:bg-black/25" />
        </div>

        {/* Info skeleton: mirrors flex-1 min-w-0 flex flex-col gap-1 py-1 */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 py-1 justify-between">
            <div>
                {/* Name + Price row */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="h-5 bg-[#e8eaed] dark:bg-slate-700 rounded-md w-3/4" />
                        <div className="h-4 bg-[#f1f3f4] dark:bg-slate-700/60 rounded-md w-1/3" />
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 mt-1">
                        <div className="h-3.5 bg-[#f1f3f4] dark:bg-slate-700/60 rounded w-16" />
                        <div className="h-6 bg-[#e8eaed] dark:bg-slate-700 rounded-md w-24" />
                    </div>
                </div>

                {/* Rating row */}
                <div className="flex items-center gap-1.5 mt-2">
                    <div className="h-3.5 w-6 bg-[#e8eaed] dark:bg-slate-700 rounded" />
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-[#e8eaed] dark:bg-slate-700 rounded-xs" />
                        ))}
                    </div>
                    <div className="h-3 w-16 bg-[#f1f3f4] dark:bg-slate-700/60 rounded ml-1" />
                </div>

                {/* Amenities grid (3 cols) */}
                <div className="grid grid-cols-3 gap-x-3 gap-y-2 mt-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-[#e8eaed] dark:bg-slate-700 shrink-0" />
                            <div className="h-3 bg-[#f1f3f4] dark:bg-slate-700/70 rounded w-20" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom row: cancellation/board on left + CTA button on right */}
            <div className="flex items-center justify-between mt-auto pt-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-3.5 w-24 bg-[#e8eaed] dark:bg-slate-700/70 rounded-full" />
                    <div className="h-3.5 w-20 bg-[#f1f3f4] dark:bg-slate-700/50 rounded-full" />
                </div>
                <div className="shrink-0 flex items-center gap-2">
                    <div className="h-[31px] w-24 bg-[#e8eaed] dark:bg-slate-700/60 rounded-full" />
                    <div className="h-[31px] w-28 bg-[#e8eaed] dark:bg-slate-700 rounded-full" />
                </div>
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════
// OpenFreeMap Styles Configuration
// ═══════════════════════════════════════════════
const MAP_LAYERS = {
    google: {
        id: 'google',
        label: 'Google Maps Stili',
        labelEn: 'Google Maps Style',
        desc: 'Google Maps renk paletiyle optimize edilmiş modern vektör harita',
        icon: 'map'
    },
    liberty: {
        id: 'liberty',
        label: 'OpenFreeMap Liberty',
        labelEn: 'OpenFreeMap Liberty',
        desc: 'Tam detaylı ve zengin vektör harita stili',
        icon: 'explore'
    },
    bright: {
        id: 'bright',
        label: 'OpenFreeMap Bright',
        labelEn: 'OpenFreeMap Bright',
        desc: 'Canlı, renkli ve yüksek kontrastlı modern harita stili',
        icon: 'light_mode'
    },
    dark: {
        id: 'dark',
        label: 'OpenFreeMap Dark',
        labelEn: 'OpenFreeMap Dark',
        desc: 'Gece ve karanlık tema için optimize edilmiş koyu harita',
        icon: 'dark_mode'
    },
    positron: {
        id: 'positron',
        label: 'OpenFreeMap Positron',
        labelEn: 'OpenFreeMap Positron',
        desc: 'Açık gri, sade ve minimalist harita stili',
        icon: 'contrast'
    },
    fiord: {
        id: 'fiord',
        label: 'OpenFreeMap Fiord',
        labelEn: 'OpenFreeMap Fiord',
        desc: 'Yumuşak mavi ve pastel tonlarında sakin harita',
        icon: 'palette'
    },
    auto: {
        id: 'auto',
        label: 'Otomatik (Google / Koyu)',
        labelEn: 'Auto (Google / Dark)',
        desc: 'Aydınlık modda Google Maps, karanlık modda Dark stile geçer',
        icon: 'brightness_auto'
    }
};

// ═══════════════════════════════════════════════
// Known Destinations Coordinates & Initial Location Resolver
// ═══════════════════════════════════════════════
const KNOWN_DESTINATIONS = {
    istanbul: { center: [41.0082, 28.9784], zoom: 11, label: 'İstanbul' },
    antalya: { center: [36.8969, 30.7133], zoom: 11, label: 'Antalya' },
    ankara: { center: [39.9334, 32.8597], zoom: 11, label: 'Ankara' },
    izmir: { center: [38.4237, 27.1428], zoom: 11, label: 'İzmir' },
    bodrum: { center: [37.0344, 27.4305], zoom: 12, label: 'Bodrum' },
    mugla: { center: [37.0344, 27.4305], zoom: 10, label: 'Muğla' },
    fethiye: { center: [36.6217, 29.1164], zoom: 12, label: 'Fethiye' },
    oludeniz: { center: [36.5489, 29.1245], zoom: 13, label: 'Ölüdeniz' },
    gocek: { center: [36.7533, 28.9392], zoom: 13, label: 'Göcek' },
    dalaman: { center: [36.7667, 28.8028], zoom: 12, label: 'Dalaman' },
    marmaris: { center: [36.8550, 28.2742], zoom: 12, label: 'Marmaris' },
    cesme: { center: [38.3236, 26.3040], zoom: 12, label: 'Çeşme' },
    alacati: { center: [38.2819, 26.3742], zoom: 13, label: 'Alaçatı' },
    alanya: { center: [36.5438, 31.9998], zoom: 12, label: 'Alanya' },
    kemer: { center: [36.6025, 30.5600], zoom: 12, label: 'Kemer' },
    side: { center: [36.7667, 31.3889], zoom: 12, label: 'Side' },
    belek: { center: [36.8625, 31.0556], zoom: 12, label: 'Belek' },
    kusadasi: { center: [37.8579, 27.2610], zoom: 12, label: 'Kuşadası' },
    kas: { center: [36.2000, 29.6389], zoom: 13, label: 'Kaş' },
    kalkan: { center: [36.2644, 29.4144], zoom: 13, label: 'Kalkan' },
    ayvalik: { center: [39.3193, 26.6965], zoom: 12, label: 'Ayvalık' },
    cunda: { center: [39.3333, 26.6600], zoom: 13, label: 'Cunda' },
    bozcaada: { center: [39.8333, 26.0667], zoom: 12, label: 'Bozcaada' },
    didim: { center: [37.3734, 27.2564], zoom: 12, label: 'Didim' },
    datca: { center: [36.7262, 27.6860], zoom: 12, label: 'Datça' },
    trabzon: { center: [41.0027, 39.7168], zoom: 11, label: 'Trabzon' },
    rize: { center: [41.0201, 40.5234], zoom: 11, label: 'Rize' },
    bursa: { center: [40.1885, 29.0610], zoom: 11, label: 'Bursa' },
    uludag: { center: [40.1264, 29.1306], zoom: 12, label: 'Uludağ' },
    kapadokya: { center: [38.6431, 34.8289], zoom: 11, label: 'Kapadokya' },
    cappadocia: { center: [38.6431, 34.8289], zoom: 11, label: 'Kapadokya' },
    goreme: { center: [38.6431, 34.8289], zoom: 12, label: 'Göreme' },
    urgup: { center: [38.6319, 34.9125], zoom: 12, label: 'Ürgüp' },
    nevsehir: { center: [38.6244, 34.7144], zoom: 11, label: 'Nevşehir' },
    eskisehir: { center: [39.7667, 30.5256], zoom: 11, label: 'Eskişehir' },
    adana: { center: [37.0000, 35.3213], zoom: 11, label: 'Adana' },
    gaziantep: { center: [37.0662, 37.3833], zoom: 11, label: 'Gaziantep' },
    konya: { center: [37.8714, 32.4846], zoom: 11, label: 'Konya' },
    denizli: { center: [37.7765, 29.0864], zoom: 11, label: 'Denizli' },
    pamukkale: { center: [37.9137, 29.1187], zoom: 12, label: 'Pamukkale' },
    bolu: { center: [40.7358, 31.6061], zoom: 11, label: 'Bolu' },
    sapanca: { center: [40.6931, 30.2644], zoom: 12, label: 'Sapanca' },
    yalova: { center: [40.6549, 29.2842], zoom: 11, label: 'Yalova' },
    canakkale: { center: [40.1553, 26.4142], zoom: 11, label: 'Çanakkale' },
    girne: { center: [35.3333, 33.3167], zoom: 12, label: 'Girne' },
    kibris: { center: [35.1667, 33.3667], zoom: 10, label: 'Kıbrıs' },
    dubai: { center: [25.2048, 55.2708], zoom: 11, label: 'Dubai' },
    london: { center: [51.5074, -0.1278], zoom: 11, label: 'London' },
    paris: { center: [48.8566, 2.3522], zoom: 11, label: 'Paris' },
    rome: { center: [41.9028, 12.4964], zoom: 11, label: 'Rome' },
    milan: { center: [45.4642, 9.1900], zoom: 11, label: 'Milan' },
    barcelona: { center: [41.3851, 2.1734], zoom: 11, label: 'Barcelona' },
    madrid: { center: [40.4168, -3.7038], zoom: 11, label: 'Madrid' },
    berlin: { center: [52.5200, 13.4050], zoom: 11, label: 'Berlin' },
    munich: { center: [48.1351, 11.5820], zoom: 11, label: 'Munich' },
    amsterdam: { center: [52.3676, 4.9041], zoom: 11, label: 'Amsterdam' },
    vienna: { center: [48.2082, 16.3738], zoom: 11, label: 'Vienna' },
    prague: { center: [50.0755, 14.4378], zoom: 11, label: 'Prague' },
    athens: { center: [37.9838, 23.7275], zoom: 11, label: 'Athens' },
    newyork: { center: [40.7128, -74.0060], zoom: 11, label: 'New York' },
    tokyo: { center: [35.6762, 139.6503], zoom: 11, label: 'Tokyo' },
    doha: { center: [25.2854, 51.5310], zoom: 11, label: 'Doha' },
    riyadh: { center: [24.7136, 46.6753], zoom: 11, label: 'Riyadh' },
    jeddah: { center: [21.5433, 39.1728], zoom: 11, label: 'Jeddah' },
    makkah: { center: [21.3891, 39.8579], zoom: 11, label: 'Makkah' },
    madinah: { center: [24.5247, 39.5692], zoom: 11, label: 'Madinah' }
};

const normalizeLoc = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
};

const resolveInitialLocation = (slug, q, searchParams) => {
    const isPoi = searchParams?.get('type') === 'POI' || Boolean(searchParams?.get('poiId'));
    const isHotel = searchParams?.get('type') === 'HOTEL' || Boolean(searchParams?.get('hotelId') || searchParams?.get('togId'));

    let knownZoom = null;
    const cleanSlug = normalizeLoc(slug);
    if (cleanSlug) {
        for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
            if (cleanSlug.includes(key) || key.includes(cleanSlug)) {
                knownZoom = val.zoom;
                break;
            }
        }
    }
    const cleanQ = normalizeLoc(q);
    if (!knownZoom && cleanQ) {
        for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
            if (cleanQ.includes(key)) {
                knownZoom = val.zoom;
                break;
            }
        }
    }

    const zoomParam = parseInt(searchParams?.get('zoom'));
    const defaultZoom = !isNaN(zoomParam) && zoomParam > 0 ? zoomParam : (isHotel ? 15 : (isPoi ? 12 : (knownZoom || 11)));

    const boundsParam = searchParams?.get('bounds');
    if (boundsParam) {
        const parts = boundsParam.split(',').map(Number);
        if (parts.length === 4 && parts.every(p => !isNaN(p))) {
            const [nwLat, nwLng, seLat, seLng] = parts;
            return { center: [(nwLat + seLat) / 2, (nwLng + seLng) / 2], zoom: defaultZoom, label: q || '' };
        }
    }

    const lat = parseFloat(searchParams?.get('lat'));
    const lng = parseFloat(searchParams?.get('lng') || searchParams?.get('lon'));
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { center: [lat, lng], zoom: defaultZoom, label: q || '' };
    }

    if (cleanSlug) {
        for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
            if (cleanSlug.includes(key) || key.includes(cleanSlug)) {
                return val;
            }
        }
    }

    if (cleanQ) {
        for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
            if (cleanQ.includes(key)) {
                return val;
            }
        }
    }

    return null;
};

// ═══════════════════════════════════════════════
// Legacy quick amenities export for backwards compatibility
export const QUICK_AMENITIES = [];

// ═══════════════════════════════════════════════
// Main HotelListing Component
// ═══════════════════════════════════════════════
const HotelListing = () => {
    // Facility icon map
    const FACILITY_ICON_MAP = {
        98445: { icon: 'wifi', label: 'Free Wifi' }, 48325: { icon: 'wifi', label: 'Wifi Access' },
        3664: { icon: 'wifi', label: 'High Speed Internet' }, 616: { icon: 'pool', label: 'Outdoor Pool' },
        649: { icon: 'pool', label: 'Indoor Pool' }, 1685: { icon: 'pool', label: 'Kids Pool' },
        1985: { icon: 'spa', label: 'Spa' }, 1978: { icon: 'fitness_center', label: 'Health Club' },
        98455: { icon: 'fitness_center', label: 'Fitness' }, 47935: { icon: 'fitness_center', label: 'Gym' },
        641: { icon: 'restaurant', label: 'Restaurant' }, 3134: { icon: 'local_bar', label: 'Bar' },
        606: { icon: 'pets', label: 'Pets Allowed' }, 719: { icon: 'ac_unit', label: 'Air Conditioning' },
        101165: { icon: 'inventory_2', label: 'Minibar' }, 618: { icon: 'sports_tennis', label: 'Tennis' },
        3164: { icon: 'casino', label: 'Casino' }, 3154: { icon: 'nightlife', label: 'Night Club' },
        3891: { icon: 'hot_tub', label: 'Jacuzzi' }, 650: { icon: 'spa', label: 'Sauna' },
        3064: { icon: 'atm', label: 'ATM' }, 18006: { icon: 'business_center', label: 'Business Centre' },
        18366: { icon: 'local_laundry_service', label: 'Laundry' }, 603: { icon: 'child_care', label: 'Babysitting' },
        638: { icon: 'explore', label: 'Tour Desk' }, 646: { icon: 'support_agent', label: 'Concierge' },
        666: { icon: 'car_rental', label: 'Car Rental' }, 1993: { icon: 'lock', label: 'Safety Box' },
        1995: { icon: 'wheelchair_pickup', label: 'Wheelchair Access' }, 2007: { icon: 'elevator', label: 'Elevator' },
        98485: { icon: 'security', label: 'Security' }, 100075: { icon: 'smoking_rooms', label: 'Smoking Area' },
        1687: { icon: 'water_sports', label: 'Water Sports' }, 1981: { icon: 'child_friendly', label: 'Kids Club' },
        3724: { icon: 'beach_access', label: 'Beach' }, 18126: { icon: 'directions_bike', label: 'Bicycle Rental' },
        98415: { icon: 'airport_shuttle', label: 'Airport Shuttle' }
    };

    const { i18n } = useTranslation();
    const rawLang = i18n.language || localStorage.getItem('language') || 'tr';
    const currentLang = rawLang.toLowerCase().startsWith('tr') ? 'tr' : rawLang;
    const navigate = useNavigate();

    const params = useParams();
    const slug = params['*'] || params.slug;
    const { theme, campaign } = params;
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const { favorites, isFavorite, toggleFavorite } = useFavorites();
    const [isFavOpen, setIsFavOpen] = React.useState(false);
    const favOpenTimerRef = React.useRef(null);
    const favCloseTimerRef = React.useRef(null);

    const handleFavMouseEnter = React.useCallback(() => {
        if (favCloseTimerRef.current) {
            clearTimeout(favCloseTimerRef.current);
            favCloseTimerRef.current = null;
        }
        if (!isFavOpen && !favOpenTimerRef.current) {
            favOpenTimerRef.current = setTimeout(() => {
                setIsFavOpen(true);
                favOpenTimerRef.current = null;
            }, 300);
        }
    }, [isFavOpen]);

    const handleFavMouseLeave = React.useCallback(() => {
        if (favOpenTimerRef.current) {
            clearTimeout(favOpenTimerRef.current);
            favOpenTimerRef.current = null;
        }
        if (isFavOpen && !favCloseTimerRef.current) {
            favCloseTimerRef.current = setTimeout(() => {
                setIsFavOpen(false);
                favCloseTimerRef.current = null;
            }, 250);
        }
    }, [isFavOpen]);

    const handleFavButtonClick = React.useCallback(() => {
        if (favOpenTimerRef.current) {
            clearTimeout(favOpenTimerRef.current);
            favOpenTimerRef.current = null;
        }
        if (favCloseTimerRef.current) {
            clearTimeout(favCloseTimerRef.current);
            favCloseTimerRef.current = null;
        }
        setIsFavOpen(prev => !prev);
    }, []);

    const handleCloseFav = React.useCallback(() => {
        if (favOpenTimerRef.current) {
            clearTimeout(favOpenTimerRef.current);
            favOpenTimerRef.current = null;
        }
        if (favCloseTimerRef.current) {
            clearTimeout(favCloseTimerRef.current);
            favCloseTimerRef.current = null;
        }
        setIsFavOpen(false);
    }, []);

    React.useEffect(() => {
        return () => {
            if (favOpenTimerRef.current) clearTimeout(favOpenTimerRef.current);
            if (favCloseTimerRef.current) clearTimeout(favCloseTimerRef.current);
        };
    }, []);

    const [hotels, setHotels] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isLoadingMore, setIsLoadingMore] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [totalProperties, setTotalProperties] = React.useState(0);
    const [dynamicFilters, setDynamicFilters] = React.useState(null);
    const [sortConfig, setSortConfig] = React.useState({ field: null, order: 'DESC' });
    const abortControllerRef = React.useRef(null);
    const isFetchingRef = React.useRef(false);
    const pageRef = React.useRef(0);
    const hasMoreRef = React.useRef(true);

    // UI state
    const [selectedHotel, setSelectedHotel] = React.useState(null);
    const [isQuickLookOpen, setIsQuickLookOpen] = React.useState(false);
    const closeTimeoutRef = React.useRef(null);

    const handleSelectHotel = React.useCallback((hotel) => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        if (hotel) {
            setSelectedHotel(hotel);
            setIsQuickLookOpen(true);
            const cardEl = document.getElementById(`hotel-card-${hotel.id || hotel.hotelId}`);
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            setIsQuickLookOpen(false);
            closeTimeoutRef.current = setTimeout(() => {
                setSelectedHotel(null);
                closeTimeoutRef.current = null;
            }, 320);
        }
    }, []);

    const handleCloseQuickLook = React.useCallback(() => {
        handleSelectHotel(null);
    }, [handleSelectHotel]);

    // Independent Map Markers & Clusters state
    const [mapMarkers, setMapMarkers] = React.useState([]);
    const [mapClusters, setMapClusters] = React.useState([]);
    const [isMapMarkersLoading, setIsMapMarkersLoading] = React.useState(false);
    const mapAbortControllerRef = React.useRef(null);

    // POI Map Markers state & pool (Elasticsearch geography_poi)
    const [poiMarkers, setPoiMarkers] = React.useState([]);
    const [isPoiLoading, setIsPoiLoading] = React.useState(false);
    const poiPoolRef = React.useRef(new Map());
    const lastPoiFetchedBoundsRef = React.useRef(null);
    const poiAbortControllerRef = React.useRef(null);

    const [hoveredHotel, setHoveredHotel] = React.useState(null);
    const [shouldRefitMap, setShouldRefitMap] = React.useState(true);
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
    const [searchOnMapMove, setSearchOnMapMove] = React.useState(false);
    const [mapMoved, setMapMoved] = React.useState(false);
    const [mapInstance, setMapInstance] = React.useState(null);
    const [isMapReady, setIsMapReady] = React.useState(false);
    const isDark = useDarkMode();
    const userChangedLayerRef = React.useRef(false);
    const [mapLayer, setMapLayer] = React.useState('google');
    const [isLayerMenuOpen, setIsLayerMenuOpen] = React.useState(false);

    // Map expansion & POI category states
    const [isMapExpanded, setIsMapExpanded] = React.useState(false);
    const [activePoiCategories, setActivePoiCategories] = React.useState({
        transit: false,
        restaurants: false,
        tourist: false,
        shopping: false,
        museum: false,
        park: false,
        beach: false,
        stadium: false,
        theater: false,
        historic: false
    });
    const [isPoiMenuOpen, setIsPoiMenuOpen] = React.useState(false);
    const poiMenuRef = React.useRef(null);

    const togglePoiCategory = React.useCallback((categoryKey) => {
        setActivePoiCategories(prev => ({
            ...prev,
            [categoryKey]: !prev[categoryKey]
        }));
    }, []);

    const clearAllPoiCategories = React.useCallback(() => {
        setActivePoiCategories({
            transit: false,
            restaurants: false,
            tourist: false,
            shopping: false,
            museum: false,
            park: false,
            beach: false,
            stadium: false,
            theater: false,
            historic: false
        });
    }, []);

    const hasAnyActivePoiCategories = React.useMemo(() => {
        return Object.values(activePoiCategories).some(Boolean);
    }, [activePoiCategories]);

    const hasActiveSecondaryPoiCategories = React.useMemo(() => {
        return POI_CATEGORIES.filter(c => !c.isPrimary).some(c => activePoiCategories[c.key]);
    }, [activePoiCategories]);

    const activeEsCategories = React.useMemo(() => {
        const list = [];
        POI_CATEGORIES.forEach(cat => {
            if (activePoiCategories[cat.key] && Array.isArray(cat.esCategories)) {
                list.push(...cat.esCategories);
            }
        });
        return Array.from(new Set(list));
    }, [activePoiCategories]);

    const activeEsCategoriesRef = React.useRef(activeEsCategories);
    React.useEffect(() => {
        activeEsCategoriesRef.current = activeEsCategories;
    }, [activeEsCategories]);

    // Click outside to close POI flyout menu
    React.useEffect(() => {
        if (!isPoiMenuOpen) return;
        const handleClickOutside = (e) => {
            if (poiMenuRef.current && !poiMenuRef.current.contains(e.target)) {
                setIsPoiMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPoiMenuOpen]);

    const toggleMapExpand = React.useCallback(() => {
        setIsMapExpanded(prev => !prev);
    }, []);

    React.useEffect(() => {
        if (!mapInstance) return;

        isProgrammaticMoveRef.current = true;

        const timer = setTimeout(() => {
            mapInstance.invalidateSize({ pan: false });
            setTimeout(() => {
                isProgrammaticMoveRef.current = false;
            }, 100);
        }, 510);

        return () => {
            clearTimeout(timer);
        };
    }, [isMapExpanded, mapInstance]);

    React.useEffect(() => {
        if (!userChangedLayerRef.current) {
            setMapLayer('google');
        }
    }, [isDark]);
    const layerMenuRef = React.useRef(null);
    const mapBoundsRef = React.useRef(null); // stores last known bounds for manual search
    const isUserPanRef = React.useRef(false);
    const isProgrammaticMoveRef = React.useRef(false);
    const isSyncingQRef = React.useRef(false);
    const isMapBoundsSyncRef = React.useRef(false);
    const mapMoveDebounceRef = React.useRef(null);
    React.useEffect(() => {
        return () => {
            if (mapMoveDebounceRef.current) clearTimeout(mapMoveDebounceRef.current);
        };
    }, []);
    const listScrollRef = React.useRef(null);
    const loaderRef = React.useRef(null);
    const sortDropdownRef = React.useRef(null);
    // ── Quick Filter: Amenities ──
    const [isAmenitiesOpen, setIsAmenitiesOpen] = React.useState(false);
    const [amenitiesPosition, setAmenitiesPosition] = React.useState({ top: 0, left: 0 });
    const amenitiesBtnRef = React.useRef(null);
    const amenitiesDropdownRef = React.useRef(null);

    // ── Quick Filter: Hotel Star Rating (Otel sınıfı) ──
    const [isStarOpen, setIsStarOpen] = React.useState(false);
    const [starPosition, setStarPosition] = React.useState({ top: 0, left: 0 });
    const starBtnRef = React.useRef(null);
    const starDropdownRef = React.useRef(null);

    // ── Quick Filter: Price (Fiyat) ──
    const [isPriceOpen, setIsPriceOpen] = React.useState(false);
    const [pricePosition, setPricePosition] = React.useState({ top: 0, left: 0 });
    const priceBtnRef = React.useRef(null);
    const priceDropdownRef = React.useRef(null);

    const urlStars = React.useMemo(() => {
        const p = searchParams.get('stars');
        return p ? p.split(',').map(Number) : [];
    }, [searchParams]);

    // Dynamic price boundaries from loaded hotels
    const { minHotelPrice, maxHotelPrice } = React.useMemo(() => {
        let min = Infinity;
        let max = -Infinity;
        hotels.forEach(h => {
            if (h.price && h.price > 0) {
                if (h.price < min) min = h.price;
                if (h.price > max) max = h.price;
            }
        });
        if (min === Infinity) min = 0;
        if (max === -Infinity || max <= 0) max = 10000;
        const roundedMax = Math.max(10000, Math.ceil(max / 1000) * 1000);
        return { minHotelPrice: 0, maxHotelPrice: roundedMax };
    }, [hotels]);

    const [priceRange, setPriceRange] = React.useState([0, 10000]);
    const [isPriceCustomized, setIsPriceCustomized] = React.useState(false);

    React.useEffect(() => {
        if (!isPriceCustomized) {
            setPriceRange([0, maxHotelPrice]);
        }
    }, [maxHotelPrice, isPriceCustomized]);

    const priceHistogram = React.useMemo(() => {
        const bucketCount = 24;
        const buckets = new Array(bucketCount).fill(0);
        const validPrices = hotels.map(h => h.price).filter(p => p && p > 0);

        if (validPrices.length > 0) {
            const step = maxHotelPrice / bucketCount;
            validPrices.forEach(p => {
                const idx = Math.min(bucketCount - 1, Math.floor(p / step));
                if (idx >= 0) buckets[idx]++;
            });
        } else {
            const defaultCurve = [1, 2, 4, 7, 12, 18, 25, 28, 24, 20, 15, 11, 8, 6, 4, 3, 2, 2, 1, 1, 1, 0, 0, 1];
            return defaultCurve.map((val, i) => ({
                height: Math.max(4, Math.min(42, Math.round((val / 28) * 42))),
                index: i
            }));
        }

        const maxInBucket = Math.max(1, ...buckets);
        return buckets.map((count, i) => ({
            height: count === 0 ? 3 : Math.max(4, Math.min(42, Math.round((count / maxInBucket) * 42))),
            count,
            index: i
        }));
    }, [hotels, maxHotelPrice]);

    const isPriceActive = isPriceCustomized && (priceRange[0] > 0 || priceRange[1] < maxHotelPrice);

    const updateStarPosition = React.useCallback(() => {
        if (starBtnRef.current) {
            const rect = starBtnRef.current.getBoundingClientRect();
            // Use the chip row container's bottom border for precise alignment
            const rowEl = starBtnRef.current.closest('[class*="border-b"]');
            const rowBottom = rowEl ? rowEl.getBoundingClientRect().bottom : rect.bottom;
            const popupWidth = 340;
            let left = rect.left;
            if (left + popupWidth > window.innerWidth - 16) {
                left = window.innerWidth - 16 - popupWidth;
            }
            setStarPosition({
                top: rowBottom,
                left: Math.round(Math.max(8, left))
            });
        }
    }, []);

    const updatePricePosition = React.useCallback(() => {
        if (priceBtnRef.current) {
            const rect = priceBtnRef.current.getBoundingClientRect();
            // Use the chip row container's bottom border for precise alignment
            const rowEl = priceBtnRef.current.closest('[class*="border-b"]');
            const rowBottom = rowEl ? rowEl.getBoundingClientRect().bottom : rect.bottom;
            const popupWidth = 340;
            let left = rect.left;
            if (left + popupWidth > window.innerWidth - 16) {
                left = window.innerWidth - 16 - popupWidth;
            }
            setPricePosition({
                top: rowBottom,
                left: Math.round(Math.max(8, left))
            });
        }
    }, []);

    const handleToggleStar = () => {
        if (!isStarOpen) {
            updateStarPosition();
            setIsPriceOpen(false);
            setIsAmenitiesOpen(false);
        }
        setIsStarOpen(prev => !prev);
    };

    const handleTogglePrice = () => {
        if (!isPriceOpen) {
            updatePricePosition();
            setIsStarOpen(false);
            setIsAmenitiesOpen(false);
        }
        setIsPriceOpen(prev => !prev);
    };

    const handleClearStars = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('stars');
        setSearchParams(newParams);
    };

    const handleClearPrice = () => {
        setPriceRange([0, maxHotelPrice]);
        setIsPriceCustomized(false);
    };

    React.useEffect(() => {
        if (!isStarOpen) return;
        updateStarPosition();
        window.addEventListener('resize', updateStarPosition);
        window.addEventListener('scroll', updateStarPosition, true);
        return () => {
            window.removeEventListener('resize', updateStarPosition);
            window.removeEventListener('scroll', updateStarPosition, true);
        };
    }, [isStarOpen, updateStarPosition]);

    React.useEffect(() => {
        if (!isPriceOpen) return;
        updatePricePosition();
        window.addEventListener('resize', updatePricePosition);
        window.addEventListener('scroll', updatePricePosition, true);
        return () => {
            window.removeEventListener('resize', updatePricePosition);
            window.removeEventListener('scroll', updatePricePosition, true);
        };
    }, [isPriceOpen, updatePricePosition]);

    const [locationNames, setLocationNames] = React.useState({});
    const [facilityNames, setFacilityNames] = React.useState({});
    const [amenitySearch, setAmenitySearch] = React.useState('');

    const selectedFacilities = React.useMemo(() => {
        const p = searchParams.get('facilities');
        return p ? p.split(',').map(Number).filter(Boolean) : [];
    }, [searchParams]);

    const handleToggleFacility = (facilityId) => {
        const idNum = Number(facilityId);
        const newParams = new URLSearchParams(searchParams);
        let nextList;
        if (selectedFacilities.includes(idNum)) {
            nextList = selectedFacilities.filter(id => id !== idNum);
        } else {
            nextList = [...selectedFacilities, idNum];
        }
        if (nextList.length > 0) {
            newParams.set('facilities', nextList.join(','));
        } else {
            newParams.delete('facilities');
        }
        newParams.delete('amenities');
        setSearchParams(newParams);
    };

    const handleClearFacilities = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('facilities');
        newParams.delete('amenities');
        setSearchParams(newParams);
    };

    const availableFacilities = React.useMemo(() => {
        const raw = dynamicFilters?.hotelFacilityIds || [];
        return raw.map(fac => {
            const facId = Number(fac.value);
            const label = fac.label || facilityNames[facId] || facilityNames[fac.value] || ('Facility ' + facId);
            return {
                id: facId,
                label: label,
                count: fac.count || 0,
                icon: getAmenityIcon(label)
            };
        });
    }, [dynamicFilters?.hotelFacilityIds, facilityNames]);

    const filteredFacilities = React.useMemo(() => {
        let list = [...availableFacilities].sort((a, b) => (b.count || 0) - (a.count || 0));
        if (amenitySearch.trim()) {
            const q = amenitySearch.toLowerCase();
            list = list.filter(f => f.label.toLowerCase().includes(q));
        }
        return list;
    }, [availableFacilities, amenitySearch]);

    const updateAmenitiesPosition = React.useCallback(() => {
        if (amenitiesBtnRef.current) {
            const rect = amenitiesBtnRef.current.getBoundingClientRect();
            const container = amenitiesBtnRef.current.closest('.relative.shrink-0');
            const containerRect = container ? container.getBoundingClientRect() : rect;
            const popupWidth = 360;
            let relativeLeft = rect.left - containerRect.left;
            if (containerRect.left + relativeLeft + popupWidth > window.innerWidth - 16) {
                relativeLeft = window.innerWidth - 16 - popupWidth - containerRect.left;
            }
            setAmenitiesPosition({
                left: Math.round(Math.max(0, relativeLeft))
            });
        }
    }, []);

    const handleToggleAmenities = () => {
        if (!isAmenitiesOpen) {
            updateAmenitiesPosition();
            setIsStarOpen(false);
            setIsPriceOpen(false);
        }
        setIsAmenitiesOpen(prev => !prev);
    };

    React.useEffect(() => {
        if (!isAmenitiesOpen) return;
        updateAmenitiesPosition();
        window.addEventListener('resize', updateAmenitiesPosition);
        window.addEventListener('scroll', updateAmenitiesPosition, true);
        return () => {
            window.removeEventListener('resize', updateAmenitiesPosition);
            window.removeEventListener('scroll', updateAmenitiesPosition, true);
        };
    }, [isAmenitiesOpen, updateAmenitiesPosition]);



    const getDefaultDates = () => {
        const checkin = new Date();
        checkin.setDate(checkin.getDate() + 2);
        const checkout = new Date(checkin);
        checkout.setDate(checkout.getDate() + 1);
        const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        return { checkin: fmt(checkin), checkout: fmt(checkout) };
    };

    const getSearchParams = () => {
        const starsParam = searchParams.get('stars');
        const locationsParam = searchParams.get('locations');
        const categoriesParam = searchParams.get('categories');
        const chainsParam = searchParams.get('chains');
        const guestRatingParam = searchParams.get('guestRating');
        const roomMaxAdultParam = searchParams.get('roomMaxAdult');
        const roomMaxChildrenParam = searchParams.get('roomMaxChildren');
        const facilitiesParam = searchParams.get('facilities');
        const recommendedParam = searchParams.get('recommended');

        let minGuestRating = null;
        if (guestRatingParam) {
            const parsed = parseFloat(guestRatingParam);
            if (!isNaN(parsed)) minGuestRating = parsed;
        }

        return {
            stars: starsParam ? starsParam.split(',').map(Number) : [],
            locations: locationsParam ? locationsParam.split(',').map(decodeURIComponent).filter(Boolean) : [],
            categories: categoriesParam ? categoriesParam.split(',').map(decodeURIComponent).filter(Boolean) : [],
            chains: chainsParam ? chainsParam.split(',').map(decodeURIComponent).filter(Boolean) : [],
            guestRating: guestRatingParam || null,
            minGuestRating: minGuestRating,
            roomMaxAdult: roomMaxAdultParam ? roomMaxAdultParam.split(',').map(Number) : null,
            roomMaxChildren: roomMaxChildrenParam ? roomMaxChildrenParam.split(',').map(Number) : null,
            facilities: facilitiesParam ? facilitiesParam.split(',').map(Number) : [],
            recommended: recommendedParam === 'true' ? true : null
        };
    };

    // Parse params
    const roomState = useMemo(() => {
        const guestsParam = searchParams.get('guests');
        if (guestsParam) return parseGuestsParam(guestsParam);
        const adults = searchParams.get('adults');
        const children = searchParams.get('children');
        return [{ adults: parseInt(adults) || 2, children: parseInt(children) || 0, childAges: [] }];
    }, [searchParams]);

    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;
    const totalGuests = totalAdults + totalChildren;

    const queryLocation = searchParams.get('q');
    const getSlugDisplayName = (s) => {
        if (!s) return null;
        const decoded = decodeURIComponent(s);
        const parts = decoded.split('/');
        return parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    const isGenericAreaText = (txt) => {
        if (!txt) return false;
        const lower = txt.trim().toLowerCase();
        return lower === 'this area' || lower === 'bu alan' || lower === 'search this area' || lower === 'listeyi güncelle';
    };

    const activeMapArea = React.useMemo(() => {
        const boundsParam = searchParams.get('bounds');
        if (!boundsParam || !hotels || hotels.length === 0) return null;

        let centerLat = null;
        let centerLng = null;
        if (mapInstance && typeof mapInstance.getCenter === 'function') {
            const c = mapInstance.getCenter();
            centerLat = c.lat;
            centerLng = c.lng;
        } else {
            const parts = boundsParam.split(',').map(Number);
            if (parts.length === 4 && parts.every(p => !isNaN(p))) {
                centerLat = (parts[0] + parts[2]) / 2;
                centerLng = (parts[1] + parts[3]) / 2;
            }
        }

        let closest = null;
        let minDist = Infinity;
        for (const h of hotels) {
            if (h.lat != null && h.lng != null && centerLat != null && centerLng != null) {
                const d = Math.pow(h.lat - centerLat, 2) + Math.pow(h.lng - centerLng, 2);
                if (d < minDist) {
                    minDist = d;
                    closest = h;
                }
            }
        }
        if (!closest) closest = hotels[0];
        if (!closest) return null;

        // 1. Check ancestors
        if (Array.isArray(closest.ancestors) && closest.ancestors.length > 0) {
            const nonCountry = closest.ancestors.filter(a => {
                const t = (a.type || '').toLowerCase();
                return t !== 'country' && t !== 'continent' && t !== 'world';
            });
            if (nonCountry.length > 0) {
                const specific = nonCountry[0];
                const cityNode = nonCountry.find(a => (a.type || '').toLowerCase() === 'city');
                if (cityNode && specific && specific !== cityNode && specific.name && cityNode.name) {
                    return `${specific.name}, ${cityNode.name}`;
                }
                if (specific && specific.name) {
                    return specific.name;
                }
            }
        }

        // 2. Check locationBreadcrumbs
        if (Array.isArray(closest.locationBreadcrumbs) && closest.locationBreadcrumbs.length > 0) {
            const nonCountry = closest.locationBreadcrumbs.filter(b => {
                const t = (b.locationType || '').toUpperCase();
                return t !== 'COUNTRY' && t !== 'CONTINENT' && t !== 'WORLD';
            });
            if (nonCountry.length > 0) {
                const getCrumbName = (c) => {
                    if (!c) return '';
                    if (typeof c.name === 'string') return c.name;
                    return c.name?.translations?.[currentLang] || c.name?.translations?.en || c.name?.defaultName || '';
                };
                const specificName = getCrumbName(nonCountry[0]);
                const cityName = getCrumbName(nonCountry.find(b => (b.locationType || '').toUpperCase() === 'CITY'));
                if (specificName && cityName && specificName !== cityName) {
                    return `${specificName}, ${cityName}`;
                }
                if (specificName) return specificName;
            }
        }

        // 3. Check city / address
        if (closest.city) return closest.city;
        if (closest.address?.cityName) return closest.address.cityName;

        return null;
    }, [searchParams, hotels, mapInstance, currentLang]);

    const locationName = React.useMemo(() => {
        const boundsParam = searchParams.get('bounds');
        if (boundsParam && activeMapArea) {
            return activeMapArea;
        }
        if (queryLocation && !isGenericAreaText(queryLocation)) {
            return queryLocation.split(',')[0].trim();
        }
        if (slug) {
            return getSlugDisplayName(slug);
        }
        return '';
    }, [searchParams, activeMapArea, queryLocation, slug]);

    const themeName = theme ? theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
    const campaignName = campaign ? campaign.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    const togId = searchParams.get('togId') || searchParams.get('hotelId') || '';
    const regionId = searchParams.get('regionId') || searchParams.get('locationId') || '';
    const locationId = regionId;
    const poiId = searchParams.get('poiId') || '';
    const isPoiSearch = searchParams.get('type') === 'POI' || Boolean(poiId);
    const paramLat = parseFloat(searchParams.get('lat'));
    const paramLng = parseFloat(searchParams.get('lng') || searchParams.get('lon'));
    const hasValidCoords = !isNaN(paramLat) && !isNaN(paramLng) && paramLat !== 0 && paramLng !== 0;

    // Resolve initial map center immediately so Turkey is not displayed needlessly
    const initialMapState = React.useMemo(() => {
        return resolveInitialLocation(slug, searchParams.get('q'), searchParams) || {
            center: [39.9, 32.8],
            zoom: 6,
            label: ''
        };
    }, [slug, searchParams]);

    // Build initial geographic bounding box for instant map marker fetching (~10-15km radius)
    const initialPoiBounds = React.useMemo(() => {
        const boundsParam = searchParams.get('bounds');
        if (boundsParam) {
            const parts = boundsParam.split(',').map(Number);
            if (parts.length === 4 && parts.every(p => !isNaN(p))) {
                const [nwLat, nwLng, seLat, seLng] = parts;
                const zoomVal = parseInt(searchParams.get('zoom')) || 12;
                return {
                    bounds: {
                        topLeft: { lat: nwLat, lon: nwLng },
                        bottomRight: { lat: seLat, lon: seLng }
                    },
                    zoom: zoomVal
                };
            }
        }
        if (hasValidCoords) {
            const zoomVal = parseInt(searchParams.get('zoom')) || 12;
            const latDelta = zoomVal >= 13 ? 0.05 : 0.08;
            const lonDelta = zoomVal >= 13 ? 0.07 : 0.12;
            return {
                bounds: {
                    topLeft: { lat: paramLat + latDelta, lon: paramLng - lonDelta },
                    bottomRight: { lat: paramLat - latDelta, lon: paramLng + lonDelta }
                },
                zoom: zoomVal
            };
        }
        if (initialMapState?.center && Array.isArray(initialMapState.center)) {
            const [cLat, cLng] = initialMapState.center;
            if (!isNaN(cLat) && !isNaN(cLng) && cLat !== 39.9) {
                return {
                    bounds: {
                        topLeft: { lat: cLat + 0.08, lon: cLng - 0.12 },
                        bottomRight: { lat: cLat - 0.08, lon: cLng + 0.12 }
                    },
                    zoom: initialMapState.zoom || 11
                };
            }
        }
        return null;
    }, [hasValidCoords, paramLat, paramLng, searchParams, initialMapState]);

    // Date formatting - Google Hotels style
    const formatDateShort = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return new Intl.DateTimeFormat(currentLang, { day: 'numeric', month: 'short', weekday: 'short' }).format(d);
        } catch (e) { return dateStr; }
    };

    // Guest display
    const guestDisplay = useMemo(() => {
        const parts = [];
        if (totalGuests > 0) parts.push(`${totalGuests}`);
        if (totalRooms > 1) parts.push(`${totalRooms} ${tListing('rooms', currentLang)}`);
        return parts.join(', ') || '2';
    }, [totalGuests, totalRooms, currentLang]);

    // Filtered hotels based on selected quick amenities & price range
    // Filtered hotels based on selected price range & client-side overrides
    const displayedHotels = React.useMemo(() => {
        let filtered = hotels;

        if (searchParams.get('recommended') === 'true') {
            filtered = filtered.filter(hotel => hotel.isRecommended === true);
        }

        if (isPriceActive) {
            filtered = filtered.filter(hotel => {
                if (!hotel.price || hotel.price <= 0) return true;
                const matchesMin = hotel.price >= priceRange[0];
                const matchesMax = priceRange[1] >= maxHotelPrice ? true : hotel.price <= priceRange[1];
                return matchesMin && matchesMax;
            });
        }
        return filtered;
    }, [hotels, searchParams, isPriceActive, priceRange, maxHotelPrice]);

    // Results count text
    const resultsText = useMemo(() => {
        if (isLoading && totalProperties === 0) return tListing('searching', currentLang);
        const count = isPriceActive ? displayedHotels.length : (totalProperties || hotels.length || 0);
        return `${locationName || ''} · ${count} ${tListing('results', currentLang)}`;
    }, [isLoading, totalProperties, locationName, currentLang, isPriceActive, displayedHotels.length, hotels.length]);

    // Active filter count for badge
    const activeFilterCount = React.useMemo(() => {
        const count = [
            searchParams.get('stars'), searchParams.get('locations'), searchParams.get('categories'),
            searchParams.get('chains'), searchParams.get('guestRating'), searchParams.get('roomMaxAdult'),
            searchParams.get('roomMaxChildren'), searchParams.get('facilities'), searchParams.get('recommended')
        ].filter(Boolean).length;
        return count + (isPriceActive ? 1 : 0);
    }, [searchParams, isPriceActive]);

    // Map hotel from API to UI model
    const mapApiHotelToModel = React.useCallback((apiHotel) => {
        const hotelNames = apiHotel.names || apiHotel.name;
        const name = apiHotel.name || hotelNames?.[currentLang] || hotelNames?.en || hotelNames?.defaultName || 'Unknown Hotel';
        const starCount = apiHotel.starRating != null
            ? Number(apiHotel.starRating)
            : (apiHotel.propertyRating ? parseFloat(apiHotel.propertyRating) : (apiHotel.rating || apiHotel.hotelStar?.star || 0));
        const starLabel = apiHotel.categoryName || (apiHotel.propertyRating ? `${apiHotel.propertyRating} Stars` : (apiHotel.hotelStar?.names?.[currentLang] || apiHotel.hotelStar?.names?.en || ''));
        let locationString = apiHotel.locationPathNames?.replace(/,/g, ', ');
        if (!locationString && Array.isArray(apiHotel.ancestors)) {
            const ancestorNames = apiHotel.ancestors.map(a => a.name).filter(Boolean);
            if (ancestorNames.length > 0) locationString = ancestorNames.join(', ');
        }
        if (!locationString && Array.isArray(apiHotel.locationBreadcrumbs)) {
            const crumbs = apiHotel.locationBreadcrumbs
                .filter(crumb => crumb.locationType !== 'COUNTRY')
                .map(crumb => {
                    const n = crumb.name;
                    return n?.translations?.[currentLang] || n?.translations?.en || n?.defaultName;
                }).filter(Boolean);
            if (crumbs.length > 0) locationString = crumbs.join(', ');
        }
        if (!locationString && apiHotel.address?.cityName) {
            locationString = [apiHotel.address.cityName, apiHotel.address.countryCode].filter(Boolean).join(', ');
        }
        const rating = apiHotel.guestOverall != null
            ? Number(apiHotel.guestOverall).toFixed(1)
            : (apiHotel.score ? (apiHotel.score > 10 ? (apiHotel.score / 10000).toFixed(1) : Number(apiHotel.score).toFixed(1)) : '0');
        let ratingLabel = 'Good';
        const ratingVal = parseFloat(rating);
        if (ratingVal >= 9) ratingLabel = 'Superb';
        else if (ratingVal >= 8) ratingLabel = 'Excellent';
        else if (ratingVal >= 7) ratingLabel = 'Very Good';

        let amenities = [];
        const rawFacs = apiHotel.facilities || apiHotel.hotelFacilityIds || apiHotel.facilityIds || apiHotel.hotelFacilities || apiHotel.amenities;
        if (rawFacs && Array.isArray(rawFacs)) {
            const seenLabels = new Set();
            rawFacs.forEach(f => {
                const resolved = resolveFacility(f, currentLang);
                if (resolved && resolved.label) {
                    const norm = resolved.label.trim().toLowerCase();
                    if (!seenLabels.has(norm)) {
                        seenLabels.add(norm);
                        amenities.push(resolved);
                    }
                }
            });
        }

        let imagesToMap = [];
        const seen = new Set();

        const addImage = (rawUrl) => {
            if (!rawUrl) return;
            let url = typeof rawUrl === 'object' ? (rawUrl.url || rawUrl.originalUrl || rawUrl.path || rawUrl.src || rawUrl.href || '') : String(rawUrl);
            if (!url || typeof url !== 'string') return;
            url = url.trim();
            if (url.startsWith('http://')) {
                url = 'https://' + url.slice(7);
            } else if (url.startsWith('//')) {
                url = 'https:' + url;
            }
            const norm = url.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
            if (!seen.has(norm)) {
                seen.add(norm);
                imagesToMap.push(url);
            }
        };

        if (apiHotel.image) addImage(apiHotel.image);
        if (apiHotel.mainImage) addImage(apiHotel.mainImage);
        if (apiHotel.thumbnail) addImage(apiHotel.thumbnail);
        if (apiHotel.heroImage) addImage(apiHotel.heroImage);

        if (apiHotel.images && apiHotel.images.length > 0) {
            apiHotel.images.forEach(img => addImage(img));
        }

        if (apiHotel.rooms && apiHotel.rooms.length > 0) {
            apiHotel.rooms.forEach(r => {
                if (r.images && Array.isArray(r.images)) {
                    r.images.forEach(img => addImage(img));
                }
            });
        }

        if (imagesToMap.length === 0) imagesToMap = [placeholderHotel];

        let lowestRoom = null;
        let lowestPrice = Infinity;
        if (apiHotel.rooms && apiHotel.rooms.length > 0) {
            apiHotel.rooms.forEach(room => {
                const ratePrice = room?.hubRateModel?.price;
                const priceValue = ratePrice?.calculatedAmount || ratePrice?.totalPaymentAmount || ratePrice?.markupCalculatedPrice?.holder?.saleAmount || 0;
                if (priceValue > 0 && priceValue < lowestPrice) { lowestPrice = priceValue; lowestRoom = room; }
            });
        }
        const selectedRoom = lowestRoom || apiHotel.rooms?.[0];
        const hubRate = selectedRoom?.hubRateModel;
        const ratePrice = hubRate?.price;
        const priceValue = lowestPrice !== Infinity ? lowestPrice : (ratePrice?.calculatedAmount || ratePrice?.totalPaymentAmount || ratePrice?.markupCalculatedPrice?.holder?.saleAmount || 0);
        const currencyCode = ratePrice?.currency || 'USD';
        const boardName = selectedRoom?.boardName || hubRate?.boardName || selectedRoom?.boardCode || (selectedRoom?.boardType ? selectedRoom.boardType.replace(/_/g, ' ') : null);
        const isNonRefundable = hubRate?.nonRefundable === true || selectedRoom?.nonRefundable === true || hubRate?.refundable === false || selectedRoom?.refundable === false;
        const cancellationPolicies = hubRate?.cancellationPolicies || selectedRoom?.cancellationPolicies;
        const hasFreeCancellation = hubRate?.refundable === true || selectedRoom?.refundable === true || (cancellationPolicies && cancellationPolicies.length > 0 && cancellationPolicies.some(cp => cp.amount === 0 || cp.penaltyAmount === 0)) || (!isNonRefundable && cancellationPolicies?.length > 0);
        const strikethroughPrice = ratePrice?.strikethroughPrice || ratePrice?.originalPrice || (priceValue > 0 ? priceValue * 1.15 : 0);

        const hotelIdentifier = apiHotel.togId || apiHotel.id || apiHotel.hotelId;

        return {
            id: hotelIdentifier, hotelId: hotelIdentifier, togId: hotelIdentifier, name, type: starLabel || 'Hotel',
            categoryId: apiHotel.categoryId ?? apiHotel.category?.id ?? apiHotel.category,
            categoryName: apiHotel.categoryName ?? apiHotel.category?.name,
            stars: starCount, location: locationString || 'Unknown Location',
            image: imagesToMap[0], images: imagesToMap,
            price: priceValue, currency: currencyCode,
            lat: apiHotel.coordinates?.lat, lng: apiHotel.coordinates?.lon,
            amenities, transportations: apiHotel.transportations || [],
            badges: [], roomName: selectedRoom?.name || selectedRoom?.roomName,
            boardName, isNonRefundable, hasFreeCancellation,
            strikethroughPrice: strikethroughPrice > priceValue ? strikethroughPrice : null,
            availableRoomsCount: apiHotel.rooms?.length || 0,
            isRecommended: Boolean(apiHotel.isRecommended || apiHotel.preferred || apiHotel.is_recommended || apiHotel.recommended || apiHotel.isPreferred),
            locationBreadcrumbs: apiHotel.locationBreadcrumbs || (Array.isArray(apiHotel.ancestors) ? apiHotel.ancestors.map(a => ({
                locationId: a.regionId,
                id: a.regionId,
                locationType: (a.type || '').toUpperCase(),
                name: a.name
            })) : []),
            ancestors: apiHotel.ancestors,
            address: apiHotel.address,
            city: apiHotel.address?.cityName || apiHotel.citySlug,
            checkinBeginTime: apiHotel.checkinBeginTime || apiHotel.checkIn,
            checkoutTime: apiHotel.checkoutTime || apiHotel.checkOut,
            checkinMinAge: apiHotel.checkinMinAge || apiHotel.minAge,
            facilityIds: (rawFacs && Array.isArray(rawFacs))
                ? rawFacs.map(f => typeof f === 'object' ? (f.facilityId || f.id || f.value) : f).map(Number).filter(Boolean)
                : []
        };
    }, []);

    // Save to localStorage
    React.useEffect(() => {
        if (slug) localStorage.setItem('last_hotel_search_slug', slug);
        const currentParams = searchParams.toString();
        if (currentParams) localStorage.setItem('last_hotel_search_params', currentParams);
    }, [slug, searchParams]);

    // Client-side marker pool to accumulate map pins without flickering
    const markerPoolRef = React.useRef(new Map());
    const lastFetchedBoundsRef = React.useRef(null);
    const mapFetchDebounceRef = React.useRef(null);

    // Pan threshold check: skips re-fetch if movement is less than 15% of viewport width/height
    const isSignificantPan = (newBounds, oldBounds) => {
        if (!oldBounds || !newBounds || !oldBounds.bounds || !newBounds.bounds) return true;
        if (newBounds.zoom !== oldBounds.zoom) return true;
        const oldLat = (oldBounds.bounds.topLeft.lat + oldBounds.bounds.bottomRight.lat) / 2;
        const oldLng = (oldBounds.bounds.topLeft.lon + oldBounds.bounds.bottomRight.lon) / 2;
        const newLat = (newBounds.bounds.topLeft.lat + newBounds.bounds.bottomRight.lat) / 2;
        const newLng = (newBounds.bounds.topLeft.lon + newBounds.bounds.bottomRight.lon) / 2;
        const latSpan = Math.abs(newBounds.bounds.topLeft.lat - newBounds.bounds.bottomRight.lat);
        const lngSpan = Math.abs(newBounds.bounds.bottomRight.lon - newBounds.bounds.topLeft.lon);
        return Math.abs(newLat - oldLat) > latSpan * 0.15 || Math.abs(newLng - oldLng) > lngSpan * 0.15;
    };

    // Calculate buffered bounds around visible map viewport.
    // bufferFactor = 0.6 means 60% extra margin on each side (top, bottom, left, right).
    const getBufferedBounds = React.useCallback((boundsData, bufferFactor = 0.6) => {
        if (!boundsData || !boundsData.bounds) return null;
        const { topLeft, bottomRight } = boundsData.bounds;
        const minLat = Math.min(topLeft.lat, bottomRight.lat);
        const maxLat = Math.max(topLeft.lat, bottomRight.lat);
        const minLon = Math.min(topLeft.lon, bottomRight.lon);
        const maxLon = Math.max(topLeft.lon, bottomRight.lon);
        const latSpan = Math.max(maxLat - minLat, 0.001);
        const lonSpan = Math.max(maxLon - minLon, 0.001);

        return {
            minLat: minLat - latSpan * bufferFactor,
            maxLat: maxLat + latSpan * bufferFactor,
            minLon: minLon - lonSpan * bufferFactor,
            maxLon: maxLon + lonSpan * bufferFactor
        };
    }, []);

    const isPointInBufferedBounds = React.useCallback((lat, lngOrLon, buffered) => {
        if (!buffered) return true;
        const pLat = parseFloat(lat);
        const pLng = parseFloat(lngOrLon);
        if (isNaN(pLat) || isNaN(pLng)) return false;
        return pLat >= buffered.minLat && pLat <= buffered.maxLat && pLng >= buffered.minLon && pLng <= buffered.maxLon;
    }, []);

    // Culls markers and POIs outside the visible map viewport + buffer to maintain peak performance and avoid DOM bloat
    const cullOutOfViewMarkers = React.useCallback((boundsData, bufferFactor = 0.6) => {
        const buffered = getBufferedBounds(boundsData, bufferFactor);
        if (!buffered) return;

        let prunedHotels = false;
        for (const [id, marker] of markerPoolRef.current.entries()) {
            if (!isPointInBufferedBounds(marker.lat, marker.lng ?? marker.lon, buffered)) {
                markerPoolRef.current.delete(id);
                prunedHotels = true;
            }
        }
        if (prunedHotels) {
            setMapMarkers(Array.from(markerPoolRef.current.values()));
        }

        let prunedPois = false;
        for (const [id, poi] of poiPoolRef.current.entries()) {
            if (!isPointInBufferedBounds(poi.lat, poi.lng ?? poi.lon, buffered)) {
                poiPoolRef.current.delete(id);
                prunedPois = true;
            }
        }
        if (prunedPois) {
            setPoiMarkers(Array.from(poiPoolRef.current.values()));
        }
    }, [getBufferedBounds, isPointInBufferedBounds]);

    // Dedicated Map Search: Fetches priced markers with viewport buffer and dynamic zoom density
    const fetchMapMarkers = React.useCallback(async (geoBounds = null, isReset = false, forceFetch = false) => {
        const bounds = geoBounds || mapBoundsRef.current || initialPoiBounds;
        if (!bounds || !bounds.bounds) return;

        if (!forceFetch && !isReset && !isSignificantPan(bounds, lastFetchedBoundsRef.current)) {
            return;
        }

        // Cull markers outside the buffered viewport before querying new ones
        cullOutOfViewMarkers(bounds, 0.6);

        if (isReset) {
            markerPoolRef.current.clear();
            setMapMarkers([]);
        }

        const prevZoom = lastFetchedBoundsRef.current?.zoom || 0;
        const currentZoom = bounds.zoom || (mapInstance && typeof mapInstance.getZoom === 'function' ? Math.round(mapInstance.getZoom()) : 12);
        const isZoomIn = prevZoom > 0 && currentZoom > prevZoom;

        lastFetchedBoundsRef.current = bounds;

        if (mapAbortControllerRef.current) {
            mapAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        mapAbortControllerRef.current = controller;
        setIsMapMarkersLoading(true);

        const filters = getSearchParams();
        // When zooming in or resetting, do not exclude hotel IDs so denser hotels in the focused view are loaded
        const existingIds = (isZoomIn || isReset) ? null : Array.from(markerPoolRef.current.keys());

        // Dynamic density: load more hotels as user zooms in deeper
        let dynamicLimit = 150;
        if (currentZoom >= 16) {
            dynamicLimit = 300;
        } else if (currentZoom >= 14) {
            dynamicLimit = 250;
        } else if (currentZoom >= 12) {
            dynamicLimit = 180;
        } else {
            dynamicLimit = 120;
        }

        try {
            const res = await hotelService.searchHotelMapMarkers({
                locationId: (isPoiSearch || bounds?.bounds) ? null : (regionId || locationId || null),
                regionId: (isPoiSearch || bounds?.bounds) ? null : (regionId || null),
                geo: bounds.bounds,
                zoom: currentZoom,
                limit: dynamicLimit,
                forceMarkers: true,
                excludeHotelIds: existingIds,
                filters: {
                    togIds: filters.hotelIds || null,
                    stars: filters.stars?.length > 0 ? filters.stars : null,
                    categoryNames: filters.categories?.length > 0 ? filters.categories : null,
                    chainNames: filters.chains?.length > 0 ? filters.chains : null,
                    guestRatings: filters.guestRating ? [filters.guestRating] : null,
                    minGuestRating: filters.minGuestRating || null,
                    preferred: filters.recommended ?? null,
                    isRecommended: filters.recommended ?? null,
                    facilities: filters.facilities?.length > 0 ? filters.facilities : null
                },
                searchCriteria: (() => {
                    const sanitized = validateAndSanitizeDates(searchParams.get('checkin'), searchParams.get('checkout'));
                    return {
                        checkin: formatDateForUrl(sanitized.checkInDate),
                        checkout: formatDateForUrl(sanitized.checkOutDate),
                        nationality: searchParams.get('nationality') || 'TR',
                        rooms: roomState
                    };
                })(),
                signal: controller.signal
            });

            if (res && Array.isArray(res.markers)) {
                let hasNew = false;
                const buffered = getBufferedBounds(bounds, 0.6);
                res.markers.forEach(m => {
                    if (m && m.id && m.lat && m.lng && m.price && Number(m.price) > 0) {
                        // Only retain markers inside the buffered viewport
                        if (isPointInBufferedBounds(m.lat, m.lng, buffered)) {
                            markerPoolRef.current.set(m.id, {
                                id: m.id,
                                hotelId: m.id,
                                name: m.name,
                                lat: m.lat,
                                lng: m.lng,
                                price: m.price,
                                currency: m.currency || 'TRY',
                                rating: m.rating,
                                stars: m.stars,
                                thumbnail: m.thumbnail,
                                image: m.thumbnail,
                                city: m.city,
                                isRecommended: m.isRecommended,
                                categoryId: m.categoryId,
                                categoryName: m.categoryName
                            });
                            hasNew = true;
                        }
                    }
                });
                if (hasNew || isReset || markerPoolRef.current.size > 0) {
                    setMapMarkers(Array.from(markerPoolRef.current.values()));
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching map markers:', err);
            }
        } finally {
            if (mapAbortControllerRef.current === controller) {
                setIsMapMarkersLoading(false);
            }
        }
    }, [regionId, locationId, isPoiSearch, initialPoiBounds, roomState, searchParams, cullOutOfViewMarkers, mapInstance, getBufferedBounds, isPointInBufferedBounds]);

    const fetchMapMarkersRef = React.useRef(fetchMapMarkers);
    fetchMapMarkersRef.current = fetchMapMarkers;

    // Dedicated POI Map Search: Fetches POIs from Elasticsearch geography_poi via b2b-backend
    // Dedicated POI Map Search: Fetches POIs without clearing existing points (zero flicker / persistent)
    const fetchPoiMarkers = React.useCallback(async (geoBounds = null, isReset = false) => {
        const currentCats = activeEsCategoriesRef.current;
        if (!currentCats || currentCats.length === 0) {
            if (poiAbortControllerRef.current) {
                poiAbortControllerRef.current.abort();
            }
            poiPoolRef.current.clear();
            setPoiMarkers([]);
            setIsPoiLoading(false);
            return;
        }

        const bounds = geoBounds || mapBoundsRef.current || initialPoiBounds;
        if (!bounds || !bounds.bounds) return;

        // Skip redundant requests if movement is insignificant
        if (!isReset && !isSignificantPan(bounds, lastPoiFetchedBoundsRef.current)) {
            return;
        }

        // Only clear the pool if user explicitly changed category (isReset = true)
        if (isReset) {
            poiPoolRef.current.clear();
            setPoiMarkers([]);
        } else {
            // Prune only POIs far outside a generous buffer (+100% margin) to keep memory clean
            cullOutOfViewMarkers(bounds, 1.0);
        }

        lastPoiFetchedBoundsRef.current = bounds;

        if (poiAbortControllerRef.current) {
            poiAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        poiAbortControllerRef.current = controller;

        try {
            setIsPoiLoading(true);
            const currentZoom = bounds.zoom || (mapInstance && typeof mapInstance.getZoom === 'function' ? Math.round(mapInstance.getZoom()) : 12);
            const res = await poiService.searchPoiMapMarkers({
                geo: bounds.bounds,
                zoom: currentZoom,
                categories: currentCats,
                limit: currentZoom >= 14 ? 150 : 100,
                signal: controller.signal
            });

            if (res && res.pois && Array.isArray(res.pois)) {
                const buffered = getBufferedBounds(bounds, 1.0);
                let hasNew = false;
                res.pois.forEach(poi => {
                    const pid = poi.id || poi.poiId;
                    if (pid && !poiPoolRef.current.has(pid) && isPointInBufferedBounds(poi.lat, poi.lng ?? poi.lon, buffered)) {
                        poiPoolRef.current.set(pid, poi);
                        hasNew = true;
                    }
                });
                if (hasNew || isReset) {
                    setPoiMarkers(Array.from(poiPoolRef.current.values()));
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching POI markers:', err);
            }
        } finally {
            if (poiAbortControllerRef.current === controller) {
                setIsPoiLoading(false);
            }
        }
    }, [initialPoiBounds, mapInstance, cullOutOfViewMarkers, getBufferedBounds, isPointInBufferedBounds]);

    // Whenever active POI categories change, refetch POIs matching the active categories
    const prevEsCategoriesKeyRef = React.useRef(null);
    React.useEffect(() => {
        const key = (activeEsCategories || []).slice().sort().join(',');
        if (key === prevEsCategoriesKeyRef.current) return;
        prevEsCategoriesKeyRef.current = key;

        if (activeEsCategories.length > 0) {
            const bounds = mapBoundsRef.current || initialPoiBounds;
            if (bounds) {
                fetchPoiMarkers(bounds, true);
            }
        } else {
            if (poiAbortControllerRef.current) {
                poiAbortControllerRef.current.abort();
            }
            poiPoolRef.current.clear();
            setPoiMarkers([]);
            setIsPoiLoading(false);
        }
    }, [activeEsCategories, fetchPoiMarkers, initialPoiBounds]);

    const handleClusterClick = React.useCallback((cluster) => {
        if (!mapInstance || !cluster.lat || !cluster.lng) return;
        const currentZoom = typeof mapInstance.getZoom === 'function' ? mapInstance.getZoom() : 11;
        mapInstance.setView([parseFloat(cluster.lat), parseFloat(cluster.lng)], Math.min(currentZoom + 2.5, 16), {
            animate: true,
            duration: 0.5
        });
    }, [mapInstance]);

    // Load hotels from API (paginated listing, size 20)
    const loadMoreHotels = React.useCallback(async (isReset = false, geoBounds = null) => {
        // Reset search clears previous results; only clear marker pool if this is a brand new location search (not map bounds search)
        if (isReset) {
            if (!geoBounds && !searchParams.get('bounds') && !mapBoundsRef.current) {
                mapBoundsRef.current = null;
                setMapMoved(false);
                setShouldRefitMap(true);
            } else {
                setShouldRefitMap(false);
            }
        }

        const activeGeoBounds = geoBounds || mapBoundsRef.current || initialPoiBounds || null;
        if (activeGeoBounds) {
            setShouldRefitMap(false);
            mapBoundsRef.current = activeGeoBounds;
        }
        if (isReset && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
            isFetchingRef.current = false;
        }
        if (!isReset) {
            if (isFetchingRef.current || !hasMoreRef.current) return;
        }
        isFetchingRef.current = true;
        if (isReset) {
            setIsLoading(true);
            setIsLoadingMore(false);
            setHotels([]);
            setTotalProperties(0);
            pageRef.current = 0;
            hasMoreRef.current = true;
            setPage(0);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const filters = getSearchParams();
            const currentPage = isReset ? 0 : pageRef.current;
            const baseRequest = {
                // Use geo bounds if provided (map area search), otherwise use regionIds
                regionIds: activeGeoBounds
                    ? []
                    : (filters.regionIds?.length > 0 ? filters.regionIds : (filters.locations?.length > 0 ? filters.locations : (regionId ? [String(regionId)] : null))),
                geo: activeGeoBounds?.bounds || null,
                zoom: activeGeoBounds?.zoom || null,
                size: 20,
                filters: {
                    togIds: activeGeoBounds ? (filters.hotelIds || null) : (togId ? [parseInt(togId)] : (filters.hotelIds || null)),
                    regionIds: activeGeoBounds
                        ? []
                        : (filters.regionIds?.length > 0 ? filters.regionIds : (filters.locations?.length > 0 ? filters.locations : (regionId ? [String(regionId)] : null))),
                    stars: filters.stars?.length > 0 ? filters.stars : null,
                    categoryNames: filters.categories?.length > 0 ? filters.categories : null,
                    chainNames: filters.chains?.length > 0 ? filters.chains : null,
                    guestRatings: filters.guestRating ? [filters.guestRating] : null,
                    minGuestRating: filters.minGuestRating || null,
                    facilities: filters.facilities?.length > 0 ? filters.facilities : null,
                    isRecommended: filters.recommended,
                    preferred: filters.recommended,
                    roomMaxAdult: filters.roomMaxAdult,
                    roomMaxChildren: filters.roomMaxChildren
                },
                searchCriteria: (() => {
                    const sanitized = validateAndSanitizeDates(searchParams.get('checkin'), searchParams.get('checkout'));
                    return {
                        checkin: formatDateForUrl(sanitized.checkInDate),
                        checkout: formatDateForUrl(sanitized.checkOutDate),
                        nationality: searchParams.get('nationality') || 'TR',
                        rooms: roomState
                    };
                })(),
                sort: sortConfig.field ? sortConfig : null,
                signal: controller.signal
            };
            const res = await hotelService.searchHotels({ ...baseRequest, page: currentPage, size: 20 });
            if (res && res.data) {
                const pageData = res.data;
                const filtersData = res.filters || res.data.filters;
                const content = pageData.content || [];
                const mappedHotels = content.map(h => mapApiHotelToModel(h));
                setHotels(prev => {
                    if (currentPage === 0) return mappedHotels;
                    const existingIds = new Set(prev.map(h => h.id));
                    return [...prev, ...mappedHotels.filter(h => !existingIds.has(h.id))];
                });
                setTotalProperties(pageData.totalElements || 0);
                if (currentPage === 0 && filtersData) setDynamicFilters(filtersData);
                const nextHasMore = Boolean(!pageData.last && (pageData.totalPages ? (currentPage + 1 < pageData.totalPages) : true));
                setHasMore(nextHasMore);
                hasMoreRef.current = nextHasMore;
                const nextPage = currentPage + 1;
                setPage(nextPage);
                pageRef.current = nextPage;

                // Auto-fetch if page returned 0 priced hotels OR if list has fewer than 8 cards to enable continuous scrolling
                const totalLoaded = (currentPage === 0 ? mappedHotels.length : (hotels.length + mappedHotels.length));
                if ((mappedHotels.length === 0 || totalLoaded < 8) && nextHasMore) {
                    setTimeout(() => {
                        loadMoreHotels(false, mapBoundsRef.current || activeGeoBounds);
                    }, 80);
                }

                const newLocationNames = {};
                content.forEach(hotel => {
                    if (hotel.locationBreadcrumbs) {
                        hotel.locationBreadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) {
                                newLocationNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                            }
                        });
                    }
                });
                if (Object.keys(newLocationNames).length > 0) setLocationNames(prev => ({ ...prev, ...newLocationNames }));
            } else {
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search request cancelled');
            } else {
                console.error('Error fetching hotels:', error);
                // Do not permanently kill pagination on transient network errors
            }
        } finally {
            isFetchingRef.current = false;
            setIsLoadingMore(false);
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [locationId, regionId, togId, isPoiSearch, initialPoiBounds, mapApiHotelToModel, roomState, searchParams, sortConfig, fetchMapMarkers, hotels.length]);

    // Infinite scroll observer for loading more hotel cards on scroll
    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting && hasMoreRef.current && !isFetchingRef.current && !isLoading) {
                loadMoreHotels(false, mapBoundsRef.current);
            }
        }, {
            root: listScrollRef.current,
            threshold: 0.1,
            rootMargin: '400px'
        });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) observer.unobserve(currentLoader);
            observer.disconnect();
        };
    }, [loadMoreHotels, isLoading, hasMore, hotels.length]);

    // Map markers derived from the accumulated map marker pool + current page hotels with valid prices
    // Filtered by visible bounds + buffer to prevent off-screen markers from cluttering the DOM
    const effectiveMapMarkers = React.useMemo(() => {
        const currentBounds = mapBoundsRef.current || initialPoiBounds;
        const buffered = currentBounds ? getBufferedBounds(currentBounds, 0.6) : null;

        if (displayedHotels && displayedHotels.length > 0) {
            displayedHotels.forEach(h => {
                const hid = h.id || h.hotelId;
                if (hid && h.lat && h.lng && h.price && Number(h.price) > 0 && !markerPoolRef.current.has(hid)) {
                    if (isPointInBufferedBounds(h.lat, h.lng, buffered)) {
                        markerPoolRef.current.set(hid, h);
                    }
                }
            });
        }
        return Array.from(markerPoolRef.current.values())
            .filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)) && h.price && Number(h.price) > 0)
            .filter(h => isPointInBufferedBounds(h.lat, h.lng, buffered));
    }, [mapMarkers, displayedHotels, getBufferedBounds, isPointInBufferedBounds, initialPoiBounds]);

    // Filtered POIs that stay persistent in memory and never flicker or disappear while panning
    const effectivePoiMarkers = React.useMemo(() => {
        const currentBounds = mapBoundsRef.current || initialPoiBounds;
        const buffered = currentBounds ? getBufferedBounds(currentBounds, 0.8) : null;
        return Array.from(poiPoolRef.current.values())
            .filter(p => p.lat && p.lng && !isNaN(parseFloat(p.lat)) && !isNaN(parseFloat(p.lng)))
            .filter(p => isPointInBufferedBounds(p.lat, p.lng ?? p.lon, buffered));
    }, [poiMarkers, getBufferedBounds, isPointInBufferedBounds]);

    const updateUrlWithMapBounds = React.useCallback((boundsData) => {
        if (!boundsData || !boundsData.bounds) return;
        const nw = boundsData.bounds.topLeft;
        const se = boundsData.bounds.bottomRight;
        const centerLat = ((nw.lat + se.lat) / 2).toFixed(5);
        const centerLng = ((nw.lon + se.lon) / 2).toFixed(5);
        const currentZoom = boundsData.zoom || (mapInstance?.getZoom ? Math.round(mapInstance.getZoom()) : 12);
        const boundsStr = `${nw.lat.toFixed(5)},${nw.lon.toFixed(5)},${se.lat.toFixed(5)},${se.lon.toFixed(5)}`;

        isMapBoundsSyncRef.current = true;
        isSyncingQRef.current = true;
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('bounds', boundsStr);
            next.set('lat', centerLat);
            next.set('lng', centerLng);
            next.set('zoom', String(currentZoom));
            // Custom map area search: clear regionId/locationId constraints so hotels in view are not blocked
            next.delete('regionId');
            next.delete('locationId');
            next.delete('togId');
            return next;
        }, { replace: true });
    }, [mapInstance, setSearchParams]);

    const handleMapBoundsChange = React.useCallback(async (boundsData) => {
        if (!boundsData) return;
        if (mapMoveDebounceRef.current) {
            clearTimeout(mapMoveDebounceRef.current);
        }
        mapBoundsRef.current = boundsData;
        isMapBoundsSyncRef.current = true;
        isSyncingQRef.current = true;
        updateUrlWithMapBounds(boundsData);

        // Immediately cull markers outside the new viewport + buffer
        cullOutOfViewMarkers(boundsData, 0.6);

        try {
            // Existing points in view remain on the map without flickering, while out-of-buffer markers are culled
            const hotelPromise = loadMoreHotels(true, boundsData);
            const mapMarkerPromise = fetchMapMarkers(boundsData, false, true);
            const poiPromise = (activeEsCategoriesRef.current && activeEsCategoriesRef.current.length > 0)
                ? fetchPoiMarkers(boundsData, false)
                : Promise.resolve();
            await Promise.all([hotelPromise, mapMarkerPromise, poiPromise]);
        } finally {
            setMapMoved(false);
            setTimeout(() => {
                isMapBoundsSyncRef.current = false;
                isSyncingQRef.current = false;
            }, 250);
        }
    }, [loadMoreHotels, fetchMapMarkers, fetchPoiMarkers, updateUrlWithMapBounds, cullOutOfViewMarkers]);

    const handleSelectPoiFromMap = React.useCallback((poi) => {
        if (!poi || !poi.lat || !poi.lng) return;
        if (mapInstance) {
            mapInstance.flyTo([parseFloat(poi.lat), parseFloat(poi.lng)], 13, { duration: 0.8 });
        }
        setTimeout(() => {
            if (mapBoundsRef.current) {
                handleMapBoundsChange(mapBoundsRef.current);
            }
        }, 850);
    }, [mapInstance, handleMapBoundsChange]);

    const handleMapMoved = React.useCallback((boundsData) => {
        mapBoundsRef.current = boundsData;
        setMapMoved(true);
        if (mapMoveDebounceRef.current) {
            clearTimeout(mapMoveDebounceRef.current);
        }
    }, []);

    const handleToggleSearchOnMove = React.useCallback(() => {
        setSearchOnMapMove(prev => {
            const next = !prev;
            if (next && mapBoundsRef.current) {
                handleMapBoundsChange(mapBoundsRef.current);
            }
            return next;
        });
    }, [handleMapBoundsChange]);

    // Sync autocomplete (q + locationId) with map center after a geo-bounds search
    React.useEffect(() => {
        if (!mapInstance || hotels.length === 0 || !mapBoundsRef.current) return;

        const syncAutocompleteWithCenter = () => {
            try {
                const center = mapInstance.getCenter();
                if (!center) return;

                const currentZoom = typeof mapInstance.getZoom === 'function' ? mapInstance.getZoom() : 11;
                const currentLocationId = searchParams.get('regionId') || searchParams.get('locationId');
                const currentQ = searchParams.get('q');

                // Find closest hotel that has locationBreadcrumbs
                let closestHotel = null;
                let minDistance = Infinity;

                hotels.forEach(hotel => {
                    if (hotel.lat && hotel.lng && Array.isArray(hotel.locationBreadcrumbs) && hotel.locationBreadcrumbs.length > 0) {
                        const dist = mapInstance.distance(center, [hotel.lat, hotel.lng]);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestHotel = hotel;
                        }
                    }
                });

                // Fallback to any hotel with location data if closest has no breadcrumbs
                if (!closestHotel) {
                    closestHotel = hotels.find(h => (Array.isArray(h.locationBreadcrumbs) && h.locationBreadcrumbs.length > 0) || (Array.isArray(h.ancestors) && h.ancestors.length > 0) || h.city || h.location);
                }

                // If map center is too far from hotels (e.g. > 35 km away in another city like Bursa before new hotels load), don't falsely sync old city
                if (!closestHotel || (minDistance !== Infinity && minDistance > 35000)) {
                    return;
                }

                // Helper to extract localized name from name object or string
                const getLocalizedCrumbName = (nameObj) => {
                    if (!nameObj) return '';
                    if (typeof nameObj === 'string') return nameObj;
                    return (
                        nameObj.translations?.[currentLang] ||
                        nameObj.translations?.en ||
                        nameObj.translations?.tr ||
                        nameObj.defaultName ||
                        Object.values(nameObj.translations || {})[0] ||
                        ''
                    );
                };

                // Helper to detect if a crumb represents Country or Continent
                const isCountryOrContinent = (crumb) => {
                    if (!crumb) return false;
                    const t = (crumb.locationType || crumb.type || '').toUpperCase();
                    const n = getLocalizedCrumbName(crumb.name).toLowerCase();
                    return t.includes('COUNTRY') || t.includes('CONTINENT') || n === 'türkiye' || n === 'turkey';
                };

                // Build normalized breadcrumb array
                let rawBreadcrumbs = [];
                if (Array.isArray(closestHotel.locationBreadcrumbs) && closestHotel.locationBreadcrumbs.length > 0) {
                    rawBreadcrumbs = closestHotel.locationBreadcrumbs.filter(Boolean);
                } else if (Array.isArray(closestHotel.ancestors) && closestHotel.ancestors.length > 0) {
                    rawBreadcrumbs = closestHotel.ancestors.map(a => ({
                        locationId: a.regionId,
                        id: a.regionId,
                        locationType: a.type || '',
                        name: a.name
                    }));
                }

                let breadcrumbs = [...rawBreadcrumbs];
                // If breadcrumbs is ordered Leaf-to-Root, normalize to Root-to-Leaf (Country first)
                if (breadcrumbs.length > 1 && isCountryOrContinent(breadcrumbs[breadcrumbs.length - 1])) {
                    breadcrumbs.reverse();
                }

                // Append hotel city if not already present in breadcrumbs
                const hotelCity = closestHotel.city || closestHotel.address?.cityName;
                if (hotelCity && !breadcrumbs.some(b => getLocalizedCrumbName(b.name).toLowerCase() === hotelCity.toLowerCase())) {
                    breadcrumbs.push({
                        locationId: null,
                        locationType: 'CITY',
                        name: hotelCity
                    });
                }

                // Append district if available from hotel location string (e.g. "Beylikdüzü, Istanbul")
                if (closestHotel.location && typeof closestHotel.location === 'string') {
                    const parts = closestHotel.location.split(',').map(p => p.trim()).filter(Boolean);
                    if (parts.length > 1) {
                        const districtPart = parts[0];
                        if (districtPart && !breadcrumbs.some(b => getLocalizedCrumbName(b.name).toLowerCase() === districtPart.toLowerCase())) {
                            breadcrumbs.push({
                                locationId: null,
                                locationType: 'DISTRICT',
                                name: districtPart
                            });
                        }
                    }
                }

                // Filter out Country crumbs to isolate sub-regions (neighborhood, district, city, province)
                const subRegionCrumbs = breadcrumbs.filter(b => !isCountryOrContinent(b));
                const countryCrumb = breadcrumbs.find(b => isCountryOrContinent(b)) || { name: 'Türkiye', locationType: 'COUNTRY' };

                // "En alt bölgeyi set edebilirsin"
                // Pick the lowest (most granular) sub-region crumb
                let targetCrumb = null;
                if (subRegionCrumbs.length > 0) {
                    // Lowest sub-region is the leaf element (e.g. District / Neighborhood)
                    targetCrumb = subRegionCrumbs[subRegionCrumbs.length - 1];
                } else if (currentZoom < 6) {
                    targetCrumb = countryCrumb;
                } else {
                    targetCrumb = { name: hotelCity || 'Istanbul', locationType: 'CITY' };
                }

                if (!targetCrumb) return;

                const targetLocId = String(targetCrumb.locationId ?? targetCrumb.id ?? '');
                const isBoundsSearch = Boolean(searchParams.get('bounds'));

                // Construct full hierarchical label starting with the lowest sub-region:
                // e.g. "Beylikdüzü, Istanbul, Türkiye" or "Istanbul, Türkiye"
                const uniqueNames = [];
                const addUniqueName = (name) => {
                    const trimmed = (name || '').trim();
                    if (trimmed && !uniqueNames.some(existing => existing.toLowerCase() === trimmed.toLowerCase())) {
                        uniqueNames.push(trimmed);
                    }
                };

                // Add lowest sub-region first
                addUniqueName(getLocalizedCrumbName(targetCrumb.name));

                // Add intermediate regions/cities (reversed from leaf to root)
                const intermediate = [...subRegionCrumbs].reverse();
                intermediate.forEach(c => addUniqueName(getLocalizedCrumbName(c.name)));

                // Finally add country
                if (countryCrumb) {
                    addUniqueName(getLocalizedCrumbName(countryCrumb.name));
                }

                const fullName = uniqueNames.join(', ');

                if (fullName) {
                    localStorage.setItem('dashboard_last_search', fullName);
                    if (targetLocId && !isBoundsSearch) {
                        localStorage.setItem('dashboard_last_search_param', 'regionId');
                        localStorage.setItem('dashboard_last_search_id', targetLocId);
                        localStorage.setItem('dashboard_last_regionId', targetLocId);
                        localStorage.removeItem('dashboard_last_locationId');
                        localStorage.removeItem('dashboard_last_togId');
                    }
                    const currentTargetLoc = searchParams.get('regionId') || searchParams.get('locationId');
                    if (searchParams.get('q') !== fullName || (!isBoundsSearch && targetLocId && currentTargetLoc !== targetLocId)) {
                        isSyncingQRef.current = true;
                        isMapBoundsSyncRef.current = true;
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set('q', fullName);
                        if (!isBoundsSearch && center && center.lat && center.lng) {
                            newParams.set('lat', center.lat.toFixed(4));
                            newParams.set('lng', center.lng.toFixed(4));
                        }
                        if (targetLocId && !isBoundsSearch) {
                            newParams.set('regionId', targetLocId);
                            newParams.delete('locationId');
                            newParams.delete('togId');
                        } else {
                            newParams.delete('regionId');
                            newParams.delete('locationId');
                            newParams.delete('togId');
                        }
                        setSearchParams(newParams, { replace: true });
                    }
                }
            } catch (err) {
                console.warn('Autocomplete sync failed:', err);
            }
        };

        const timer = setTimeout(syncAutocompleteWithCenter, 400);
        return () => clearTimeout(timer);
    }, [hotels, mapInstance, currentLang, searchParams, setSearchParams]);

    // Pre-populate location names from hotel ancestors to reduce redundant network calls
    React.useEffect(() => {
        if (!hotels || hotels.length === 0) return;
        const extracted = {};
        hotels.forEach(h => {
            if (Array.isArray(h.ancestors)) {
                h.ancestors.forEach(a => {
                    if (a.regionId && a.name && !locationNames[a.regionId]) {
                        extracted[a.regionId] = a.name;
                    }
                });
            }
        });
        if (Object.keys(extracted).length > 0) {
            setLocationNames(prev => ({ ...prev, ...extracted }));
        }
    }, [hotels, locationNames]);

    // Fetch missing location names
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.locationId) return;
        const missingLocIds = dynamicFilters.locationId.map(f => f.value).filter(id => !locationNames[id]);
        if (missingLocIds.length === 0) return;
        let isMounted = true;
        const fetchMissingNames = async () => {
            const newNames = {};
            await Promise.allSettled(missingLocIds.map(async (id) => {
                try {
                    const data = await geographyService.fetchBreadcrumb(id);
                    if (data && data.data && Array.isArray(data.data)) {
                        data.data.forEach(crumb => {
                            const cId = crumb.locationId || crumb.regionId || crumb.id;
                            if (cId && crumb.name) newNames[cId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr || crumb.displayName;
                        });
                    } else if (data && data.breadcrumbs) {
                        data.breadcrumbs.forEach(crumb => {
                            const cId = crumb.locationId || crumb.regionId || crumb.id;
                            if (cId && crumb.name) newNames[cId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr || crumb.displayName;
                        });
                    }
                } catch (error) { console.error(`Failed to fetch breadcrumb for location ${id}`, error); }
            }));
            if (isMounted && Object.keys(newNames).length > 0) setLocationNames(prev => ({ ...prev, ...newNames }));
        };
        fetchMissingNames();
        return () => { isMounted = false; };
    }, [dynamicFilters, locationNames]);

    // Fetch missing facility names
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.hotelFacilityIds) return;
        const missingFacIds = dynamicFilters.hotelFacilityIds.map(f => f.value).filter(id => !facilityNames[id]);
        if (missingFacIds.length === 0) return;
        let isMounted = true;
        const fetchMissingNames = async () => {
            try {
                const data = await hotelService.fetchFacilityNames(missingFacIds);
                if (isMounted && data && Array.isArray(data)) {
                    const newNames = {};
                    data.forEach(fac => { newNames[fac.facilityId] = fac.nameEn || fac.nameTr || fac.nameDe || `Facility ${fac.facilityId}`; });
                    if (Object.keys(newNames).length > 0) setFacilityNames(prev => ({ ...prev, ...newNames }));
                }
            } catch (error) { console.error(`Failed to fetch facility names`, error); }
        };
        fetchMissingNames();
        return () => { isMounted = false; };
    }, [dynamicFilters, facilityNames]);

    // Reset on filter/location change
    React.useEffect(() => {
        if (isSyncingQRef.current || isMapBoundsSyncRef.current) {
            isSyncingQRef.current = false;
            isMapBoundsSyncRef.current = false;
            return;
        }
        setPage(0);
        setHasMore(true);
        setSelectedHotel(null);
        setIsQuickLookOpen(false);
        setShouldRefitMap(true);
        mapBoundsRef.current = null;
        setMapMoved(false);
        if (listScrollRef.current) listScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        loadMoreHotels(true);

        const targetBounds = initialPoiBounds || (mapInstance ? {
            bounds: {
                topLeft: { lat: mapInstance.getBounds().getNorthWest().lat, lon: mapInstance.getBounds().getNorthWest().lng },
                bottomRight: { lat: mapInstance.getBounds().getSouthEast().lat, lon: mapInstance.getBounds().getSouthEast().lng }
            },
            zoom: Math.round(mapInstance.getZoom())
        } : null);
        if (targetBounds) {
            fetchMapMarkersRef.current(targetBounds, true, true);
        }

        return () => {
            if (!isMapBoundsSyncRef.current && !isSyncingQRef.current && abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [
        slug, locationId, sortConfig,
        searchParams.get('q'), searchParams.get('poiId'), searchParams.get('type'),
        searchParams.get('lat'), searchParams.get('lng'),
        location.state?.searchTimestamp,
        searchParams.get('checkin'), searchParams.get('checkout'),
        searchParams.get('nationality'), searchParams.get('guests'),
        searchParams.get('adults'), searchParams.get('children'),
        searchParams.get('stars'), searchParams.get('locations'), searchParams.get('categories'),
        searchParams.get('chains'), searchParams.get('guestRating'),
        searchParams.get('roomMaxAdult'), searchParams.get('roomMaxChildren'), searchParams.get('facilities'),
        searchParams.get('recommended'),
        initialPoiBounds, mapInstance
    ]);

    // Fast initial map marker fetch as soon as Leaflet map mounts if markers not yet populated
    React.useEffect(() => {
        if (isMapReady && mapInstance && markerPoolRef.current.size === 0 && !isMapMarkersLoading) {
            try {
                const nw = mapInstance.getBounds().getNorthWest();
                const se = mapInstance.getBounds().getSouthEast();
                const currentBounds = {
                    bounds: {
                        topLeft: { lat: nw.lat, lon: nw.lng },
                        bottomRight: { lat: se.lat, lon: se.lng }
                    },
                    zoom: Math.round(mapInstance.getZoom())
                };
                fetchMapMarkersRef.current(currentBounds, false, true);
            } catch (_) {}
        }
    }, [isMapReady, mapInstance, isMapMarkersLoading]);

    // Close sort, layer, amenities, star, and price dropdowns on outside click
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) setIsSortOpen(false);
            if (layerMenuRef.current && !layerMenuRef.current.contains(event.target)) setIsLayerMenuOpen(false);
            if (
                amenitiesDropdownRef.current && !amenitiesDropdownRef.current.contains(event.target) &&
                amenitiesBtnRef.current && !amenitiesBtnRef.current.contains(event.target)
            ) {
                setIsAmenitiesOpen(false);
            }
            if (
                starDropdownRef.current && !starDropdownRef.current.contains(event.target) &&
                starBtnRef.current && !starBtnRef.current.contains(event.target)
            ) {
                setIsStarOpen(false);
            }
            if (
                priceDropdownRef.current && !priceDropdownRef.current.contains(event.target) &&
                priceBtnRef.current && !priceBtnRef.current.contains(event.target)
            ) {
                setIsPriceOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sort
    const sortOptions = [
        { value: 'recommended', label: tListing('recommended', currentLang), icon: 'thumb_up' },
        { value: 'rating_desc', label: tListing('ratingDesc', currentLang), icon: 'star_rate' },
        { value: 'rating_asc', label: tListing('ratingAsc', currentLang), icon: 'star_half' },
        { value: 'star_desc', label: tListing('starDesc', currentLang), icon: 'star' },
        { value: 'star_asc', label: tListing('starAsc', currentLang), icon: 'grade' },
    ];
    const currentSortValue = sortConfig.field
        ? `${sortConfig.field === 'hotelStarCategoryId' ? 'star' : 'rating'}_${sortConfig.order.toLowerCase()}`
        : 'recommended';
    const currentSortOption = sortOptions.find(opt => opt.value === currentSortValue) || sortOptions[0];
    const handleSortSelect = (val) => {
        let newSort = { field: null, order: 'DESC' };
        switch (val) {
            case 'star_desc': newSort = { field: 'hotelStarCategoryId', order: 'DESC' }; break;
            case 'star_asc': newSort = { field: 'hotelStarCategoryId', order: 'ASC' }; break;
            case 'rating_desc': newSort = { field: 'rating', order: 'DESC' }; break;
            case 'rating_asc': newSort = { field: 'rating', order: 'ASC' }; break;
            default: newSort = { field: null, order: 'DESC' };
        }
        setSortConfig(newSort);
        setIsSortOpen(false);
    };

    // Filter chip handlers
    const handleStarChipToggle = (star) => {
        const currentStars = searchParams.get('stars') ? searchParams.get('stars').split(',').map(Number) : [];
        const newStars = currentStars.includes(star) ? currentStars.filter(s => s !== star) : [...currentStars, star];
        const newParams = new URLSearchParams(searchParams);
        if (newStars.length > 0) newParams.set('stars', newStars.join(','));
        else newParams.delete('stars');
        setSearchParams(newParams);
    };
    const handleRatingChip = () => {
        const current = searchParams.get('guestRating');
        const newParams = new URLSearchParams(searchParams);
        if (current === '4.0+') newParams.delete('guestRating');
        else newParams.set('guestRating', '4.0+');
        setSearchParams(newParams);
    };

    const handleRecommendedChip = () => {
        const current = searchParams.get('recommended');
        const newParams = new URLSearchParams(searchParams);
        if (current === 'true') newParams.delete('recommended');
        else newParams.set('recommended', 'true');
        setSearchParams(newParams);
    };

    // Scroll-based infinite loading
    const handleListScroll = React.useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 2500 && hasMoreRef.current && !isFetchingRef.current && hotels.length > 0) {
            loadMoreHotels(false, mapBoundsRef.current);
        }
    }, [loadMoreHotels, hotels.length]);

    // Currency symbols
    const getCurrencySymbol = (code) => {
        const sym = { USD: '$', EUR: '€', GBP: '£', TRY: '₺', AED: 'د.إ', SAR: 'ر.س', JPY: '¥', CNY: '¥', RUB: '₽' };
        return sym[code] || code || '$';
    };

    const currentCurrencySymbol = React.useMemo(() => {
        const hotelWithCurr = hotels.find(h => h.currency);
        return getCurrencySymbol(hotelWithCurr ? hotelWithCurr.currency : 'TRY');
    }, [hotels]);

    const starChipLabel = React.useMemo(() => {
        if (urlStars.length === 0) {
            return tListing('hotelClass', currentLang);
        }
        if (urlStars.length === 1) {
            return `${urlStars[0]} ${tListing('starSingle', currentLang)}`;
        }
        return `${urlStars.slice().sort((a, b) => a - b).join(', ')} ${tListing('starPlural', currentLang)}`;
    }, [urlStars, currentLang]);

    const priceChipLabel = React.useMemo(() => {
        if (isPriceActive) {
            return `${currentCurrencySymbol}${priceRange[0].toLocaleString('tr-TR')} - ${currentCurrencySymbol}${priceRange[1].toLocaleString('tr-TR')}${priceRange[1] >= maxHotelPrice ? '+' : ''}`;
        }
        return tListing('price', currentLang);
    }, [isPriceActive, priceRange, maxHotelPrice, currentCurrencySymbol, currentLang]);

    const minPercent = Math.max(0, Math.min(100, (priceRange[0] / maxHotelPrice) * 100));
    const maxPercent = Math.max(0, Math.min(100, (priceRange[1] / maxHotelPrice) * 100));

    // ════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════
    return (
        <div className="flex h-full overflow-hidden bg-white dark:bg-[#202124] font-sans">

            {/* ════════════════════════════════════════════
                LEFT PANEL: Hotel List
            ════════════════════════════════════════════ */}
            <div className={`${isMapExpanded ? "w-[44%] min-w-[500px]" : "w-[62%]"} flex-shrink-0 flex flex-col relative z-[2000] border-r border-[#e8eaed] dark:border-slate-700 bg-white dark:bg-[#303134] shadow-[1px_0_4px_rgba(0,0,0,0.35)] dark:shadow-[1px_0_4px_rgba(0,0,0,0.7)] transition-[width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[width]`}>

                {/* Slide-in Hotel Detail Quick Look Drawer */}
                <HotelQuickLookDrawer
                    hotel={selectedHotel}
                    isOpen={isQuickLookOpen}
                    onClose={handleCloseQuickLook}
                    searchParams={searchParams}
                    currencySymbol={selectedHotel ? getCurrencySymbol(selectedHotel.currency) : '$'}
                    isFav={selectedHotel ? isFavorite(String(selectedHotel.hotelId || selectedHotel.id)) : false}
                    onToggleFav={() => selectedHotel && toggleFavorite(selectedHotel)}
                    currentLang={currentLang}
                />

                {/* Search Context Bar */}
                <div className="pl-6 pr-4 pt-4 pb-2 shrink-0 bg-white dark:bg-[#303134] flex items-center w-full relative z-50">
                    <ListingSearch isCompact={isMapExpanded} />
                </div>

                {/* Filter Chips Row */}
                <div className="relative shrink-0 border-b border-[#e8eaed] dark:border-slate-700 bg-white dark:bg-[#303134] z-[40]">
                    <div className="flex items-center gap-2 pl-6 pr-4 py-2 overflow-x-auto scrollbar-hide">
                        {/* 1. All Filters - Google Outlined Button */}
                        <button
                            type="button"
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="flex items-center gap-1.5 border border-[#dadce0] dark:border-slate-600 rounded-lg px-3 h-8 text-[#1a73e8] dark:text-blue-400 font-medium text-[13px] bg-white dark:bg-[#303134] hover:bg-blue-50/50 dark:hover:bg-blue-950/30 shrink-0 transition-colors select-none font-roboto"
                        >
                            <span className="material-symbols-outlined text-[18px] text-[#1a73e8] dark:text-blue-400">tune</span>
                            <span>{tListing('allFilters', currentLang)}</span>
                            {activeFilterCount > 0 && (
                                <span className="bg-[#1a73e8] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 ml-0.5">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* 2. Price Quick Filter Chip */}
                        <button
                            ref={priceBtnRef}
                            type="button"
                            onClick={handleTogglePrice}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${isPriceActive
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : isPriceOpen
                                        ? 'border-[#dadce0] dark:border-slate-600 bg-white dark:bg-[#303134] text-[#202124] dark:text-white font-medium'
                                        : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isPriceActive ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                payments
                            </span>
                            <span>{priceChipLabel}</span>
                            <span className={`material-symbols-outlined text-[18px] ${isPriceActive ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                {isPriceOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {/* 3. Recommended (Önerilenler) */}
                        <button
                            type="button"
                            onClick={handleRecommendedChip}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${searchParams.get('recommended') === 'true'
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${searchParams.get('recommended') === 'true' ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                thumb_up
                            </span>
                            <span>{tListing('recommended', currentLang)}</span>
                        </button>

                        {/* 4. Guest Rating 4.0+ */}
                        <button
                            type="button"
                            onClick={handleRatingChip}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${searchParams.get('guestRating') === '4.0+'
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${searchParams.get('guestRating') === '4.0+' ? 'text-[#1a73e8] dark:text-blue-300' : 'text-amber-500'}`}>
                                grade
                            </span>
                            <span>4.0+ {currentLang === 'tr' ? 'Puan' : 'Rating'}</span>
                        </button>

                        {/* 4. Hotel Star Rating Quick Filter Chip */}
                        <button
                            ref={starBtnRef}
                            type="button"
                            onClick={handleToggleStar}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${urlStars.length > 0
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : isStarOpen
                                        ? 'border-[#dadce0] dark:border-slate-600 bg-white dark:bg-[#303134] text-[#202124] dark:text-white font-medium'
                                        : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${urlStars.length > 0 ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                stars
                            </span>
                            <span>{starChipLabel}</span>
                            <span className={`material-symbols-outlined text-[18px] ${urlStars.length > 0 ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                {isStarOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>

                        {/* 5. Amenities (Sunulan olanaklar) Quick Filter Button */}
                        <button
                            ref={amenitiesBtnRef}
                            type="button"
                            onClick={handleToggleAmenities}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${selectedFacilities.length > 0
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : isAmenitiesOpen
                                        ? 'border-[#dadce0] dark:border-slate-600 bg-white dark:bg-[#303134] text-[#202124] dark:text-white font-medium'
                                        : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${selectedFacilities.length > 0 ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                room_service
                            </span>
                            <span>{tListing('amenities', currentLang)}</span>
                            {selectedFacilities.length > 0 && (
                                <span className="bg-[#1a73e8] text-white text-[10px] font-bold rounded-lg min-w-[16px] h-4 flex items-center justify-center px-1">
                                    {selectedFacilities.length}
                                </span>
                            )}
                            <span className={`material-symbols-outlined text-[18px] ${selectedFacilities.length > 0 ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                {isAmenitiesOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>
                    </div>

                    <style>{`
                        .google-range-slider::-webkit-slider-thumb {
                            appearance: none;
                            pointer-events: auto;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            cursor: grab;
                            opacity: 0;
                        }
                        .google-range-slider::-moz-range-thumb {
                            pointer-events: auto;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            cursor: grab;
                            opacity: 0;
                            border: none;
                        }
                        .leaflet-container {
                            transition: opacity 0.6s ease-out, filter 0.5s ease;
                        }
                        .maplibregl-canvas {
                            transition: opacity 0.5s ease-out;
                        }
                        .google-hotel-map-marker svg {
                            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease !important;
                            transform-origin: 33px 32px;
                            will-change: transform;
                        }
                        .google-hotel-map-marker:hover svg,
                        .google-hotel-map-marker.marker-hovered svg {
                            transform: scale(1.14) !important;
                            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.08)) !important;
                        }
                        .google-hotel-map-marker:hover .marker-circle,
                        .google-hotel-map-marker.marker-hovered .marker-circle {
                            fill: #df3d5a !important;
                        }
                        .google-hotel-map-marker:hover .marker-bubble-path,
                        .google-hotel-map-marker.marker-hovered .marker-bubble-path {
                            stroke: #bdc1c6 !important;
                        }
                        .google-hotel-map-marker.marker-selected svg {
                            transform: scale(1.22) !important;
                        }
                    `}</style>

                    {/* ════════════════════════════════════════════
                        POPUP 1: Otel Sınıfı (Hotel Stars) Dropdown Overlay
                    ════════════════════════════════════════════ */}
                    {isStarOpen && ReactDOM.createPortal(
                        <>
                            <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsStarOpen(false)} />
                            <div
                                ref={starDropdownRef}
                                style={{
                                    position: 'fixed',
                                    top: `${starPosition.top}px`,
                                    left: `${starPosition.left}px`,
                                    zIndex: 9999
                                }}
                                className="w-[340px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#303134] rounded-lg shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] border border-[#dadce0] dark:border-slate-700 flex flex-col animate-in fade-in zoom-in-95 duration-150"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between pt-3.5 px-5 pb-1 shrink-0">
                                    <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100 font-roboto">
                                        {tListing('hotelClass', currentLang)}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsStarOpen(false)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#5f6368] hover:text-[#202124] dark:text-slate-400 dark:hover:text-white hover:bg-[#f1f3f4] dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>

                                {/* 2x2 Grid */}
                                <div className="px-5 py-2">
                                    <div className="grid grid-cols-2 border border-[#dadce0] dark:border-slate-700 rounded-lg overflow-hidden">
                                        {[2, 3, 4, 5].map((star, index, arr) => {
                                            const isSelected = urlStars.includes(star);
                                            let desc = '';
                                            if (star === 2) desc = tListing('star2Desc', currentLang);
                                            else if (star === 3) desc = tListing('star3Desc', currentLang);
                                            else if (star === 4) desc = tListing('star4Desc', currentLang);
                                            else if (star === 5) desc = tListing('star5Desc', currentLang);
                                            const isLeftCol = index % 2 === 0;
                                            const isLastRow = index >= arr.length - 2;
                                            return (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleStarChipToggle(star)}
                                                    className={`py-3 px-2 text-center flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${isLeftCol ? 'border-r border-[#dadce0] dark:border-slate-700' : ''} ${!isLastRow ? 'border-b border-[#dadce0] dark:border-slate-700' : ''} ${isSelected ? 'bg-[#e8f0fe] dark:bg-blue-900/30' : 'bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50'}`}
                                                >
                                                    <span className={`text-[13.5px] font-medium font-roboto ${isSelected ? 'text-[#1a73e8] dark:text-blue-300 font-semibold' : 'text-[#202124] dark:text-slate-100'}`}>
                                                        {star} {tListing('starSingle', currentLang)}
                                                    </span>
                                                    <span className={`text-[11.5px] mt-0.5 font-roboto leading-snug ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                                        {desc}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer with Temizle */}
                                <div className="px-5 pb-3 pt-0 flex justify-end items-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClearStars}
                                        disabled={urlStars.length === 0}
                                        className={`text-[13px] font-medium font-roboto transition-colors select-none ${urlStars.length > 0
                                                ? 'text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-0.5 cursor-pointer'
                                                : 'text-[#bdc1c6] dark:text-slate-600 px-2 py-0.5 cursor-default'
                                            }`}
                                    >
                                        {tListing('clear', currentLang)}
                                    </button>
                                </div>
                            </div>
                        </>,
                        document.body
                    )}

                    {/* ════════════════════════════════════════════
                        POPUP 2: Fiyat (Price) Dropdown Overlay
                    ════════════════════════════════════════════ */}
                    {isPriceOpen && ReactDOM.createPortal(
                        <>
                            <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setIsPriceOpen(false)} />
                            <div
                                ref={priceDropdownRef}
                                style={{
                                    position: 'fixed',
                                    top: `${pricePosition.top}px`,
                                    left: `${pricePosition.left}px`,
                                    zIndex: 9999
                                }}
                                className="w-[340px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#303134] rounded-lg shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] border border-[#dadce0] dark:border-slate-700 flex flex-col animate-in fade-in zoom-in-95 duration-150"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between pt-3.5 px-5 pb-1 shrink-0">
                                    <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100 font-roboto">
                                        {tListing('price', currentLang)}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsPriceOpen(false)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#5f6368] hover:text-[#202124] dark:text-slate-400 dark:hover:text-white hover:bg-[#f1f3f4] dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>

                                {/* Slider and Histogram Content */}
                                <div className="px-10 pt-8 pb-3 flex flex-col">
                                    {/* Histogram Bars */}
                                    <div className="flex items-center gap-[2px] h-[34px] px-1 mb-0 relative z-0 pointer-events-none select-none">
                                        {priceHistogram.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex-1 bg-[#dadce0] dark:bg-slate-600 rounded-t-[2px] transition-all"
                                                style={{ height: `${Math.round(item.height * 0.85)}px` }}
                                            />
                                        ))}
                                    </div>

                                    {/* Range Slider Container */}
                                    <div className="relative w-full h-7 flex items-center">
                                        {/* Inactive Base Track */}
                                        <div className="absolute left-0 right-0 h-[4px] bg-[#dadce0] dark:bg-slate-600 rounded-full pointer-events-none" />

                                        {/* Active Track Highlight */}
                                        <div
                                            className="absolute h-[4px] bg-[#1a73e8] rounded-full pointer-events-none z-10"
                                            style={{
                                                left: `${minPercent}%`,
                                                width: `${Math.max(0, maxPercent - minPercent)}%`
                                            }}
                                        />

                                        {/* Left Thumb Dot */}
                                        <div
                                            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#1a73e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                                            style={{ left: `${minPercent}%` }}
                                        />

                                        {/* Left Tooltip Bubble */}
                                        <div
                                            className="absolute -top-8 bg-[#1a73e8] text-white text-[12px] font-medium px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap pointer-events-none z-30 select-none flex items-center justify-center font-roboto"
                                            style={{
                                                left: `${minPercent}%`,
                                                transform: minPercent < 15 ? `translateX(-${Math.max(15, minPercent * 3.3)}%)` : 'translateX(-50%)'
                                            }}
                                        >
                                            <span>{currentCurrencySymbol}{priceRange[0].toLocaleString('tr-TR')}</span>
                                            <div
                                                className="absolute top-full w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#1a73e8]"
                                                style={{
                                                    left: minPercent < 15 ? `${Math.max(15, minPercent * 3.3)}%` : '50%',
                                                    transform: 'translateX(-50%)'
                                                }}
                                            />
                                        </div>

                                        {/* Right Thumb Dot */}
                                        <div
                                            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#1a73e8] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] pointer-events-none z-10"
                                            style={{ left: `${maxPercent}%` }}
                                        />

                                        {/* Right Tooltip Bubble */}
                                        <div
                                            className="absolute -top-8 bg-[#1a73e8] text-white text-[12px] font-medium px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap pointer-events-none z-30 select-none flex items-center justify-center font-roboto"
                                            style={{
                                                left: `${maxPercent}%`,
                                                transform: maxPercent > 85 ? `translateX(-${50 + (maxPercent - 85) * 2.3}%)` : 'translateX(-50%)'
                                            }}
                                        >
                                            <span>{currentCurrencySymbol}{priceRange[1].toLocaleString('tr-TR')}{priceRange[1] >= maxHotelPrice ? '+' : ''}</span>
                                            <div
                                                className="absolute top-full w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#1a73e8]"
                                                style={{
                                                    left: maxPercent > 85 ? `${50 + (maxPercent - 85) * 2.3}%` : '50%',
                                                    transform: 'translateX(-50%)'
                                                }}
                                            />
                                        </div>

                                        {/* Hidden interactive range inputs */}
                                        <input
                                            type="range"
                                            min={0}
                                            max={maxHotelPrice}
                                            step={100}
                                            value={priceRange[0]}
                                            onChange={(e) => {
                                                const val = Math.min(Number(e.target.value), priceRange[1] - 100);
                                                setPriceRange([val, priceRange[1]]);
                                                setIsPriceCustomized(true);
                                            }}
                                            className={`google-range-slider absolute inset-0 w-full pointer-events-none appearance-none bg-transparent ${priceRange[0] > maxHotelPrice * 0.5 ? 'z-30' : 'z-20'}`}
                                        />
                                        <input
                                            type="range"
                                            min={0}
                                            max={maxHotelPrice}
                                            step={100}
                                            value={priceRange[1]}
                                            onChange={(e) => {
                                                const val = Math.max(Number(e.target.value), priceRange[0] + 100);
                                                setPriceRange([priceRange[0], val]);
                                                setIsPriceCustomized(true);
                                            }}
                                            className={`google-range-slider absolute inset-0 w-full pointer-events-none appearance-none bg-transparent ${priceRange[1] <= maxHotelPrice * 0.5 ? 'z-30' : 'z-20'}`}
                                        />
                                    </div>
                                </div>

                                {/* Footer with Temizle */}
                                <div className="px-5 pb-3 pt-0 flex justify-end items-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClearPrice}
                                        disabled={!isPriceActive}
                                        className={`text-[13px] font-medium font-roboto transition-colors select-none ${isPriceActive
                                                ? 'text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-0.5 cursor-pointer'
                                                : 'text-[#bdc1c6] dark:text-slate-600 px-2 py-0.5 cursor-default'
                                            }`}
                                    >
                                        {tListing('clear', currentLang)}
                                    </button>
                                </div>
                            </div>
                        </>,
                        document.body
                    )}

                    {/* ════════════════════════════════════════════
                        POPUP 3: Sunulan Olanaklar Dropdown Popup Overlay
                    ════════════════════════════════════════════ */}
                    {isAmenitiesOpen && (
                        <>
                            <div className="fixed inset-0 z-[2400] bg-transparent" onClick={() => setIsAmenitiesOpen(false)} />
                            <div
                                ref={amenitiesDropdownRef}
                                style={{
                                    top: `${amenitiesPosition.top}px`,
                                    left: `${amenitiesPosition.left}px`
                                }}
                                className="fixed z-[2500] w-[350px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#303134] rounded-lg shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] border border-[#dadce0] dark:border-slate-700 flex flex-col animate-in fade-in zoom-in-95 duration-150"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between pt-3.5 px-5 pb-1 shrink-0">
                                    <h3 className="text-[16px] font-medium text-[#202124] dark:text-slate-100 font-roboto">
                                        {tListing('amenities', currentLang)}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsAmenitiesOpen(false)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#5f6368] hover:text-[#202124] dark:text-slate-400 dark:hover:text-white hover:bg-[#f1f3f4] dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>

                                {/* Search Bar (if more than 6 amenities) */}
                                {availableFacilities.length > 6 && (
                                    <div className="px-5 pt-2 pb-1 shrink-0">
                                        <div className="relative group/search">
                                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] transition-colors">
                                                search
                                            </span>
                                            <input
                                                type="text"
                                                placeholder={tListing('searchAmenities', currentLang)}
                                                value={amenitySearch}
                                                onChange={(e) => setAmenitySearch(e.target.value)}
                                                className="w-full pl-8 pr-7 py-1.5 bg-[#f1f3f4] dark:bg-slate-700/60 border border-transparent focus:border-blue-500 rounded-lg text-xs text-[#202124] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all font-roboto"
                                            />
                                            {amenitySearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAmenitySearch('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 2-Column Grid */}
                                <div className="px-5 py-2 max-h-[380px] overflow-y-auto custom-scrollbar">
                                    {filteredFacilities.length === 0 ? (
                                        <div className="py-8 text-center text-[#5f6368] dark:text-slate-400 text-xs font-roboto">
                                            {amenitySearch ? tListing('noAmenitiesFound', currentLang) : (isLoading ? tListing('searching', currentLang) : tListing('noAmenitiesFound', currentLang))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 border border-[#dadce0] dark:border-slate-700 rounded-lg overflow-hidden">
                                            {filteredFacilities.map((amenity, index) => {
                                                const isSelected = selectedFacilities.includes(amenity.id);
                                                const isLeftCol = index % 2 === 0;
                                                const totalRows = Math.ceil(filteredFacilities.length / 2);
                                                const currentRow = Math.floor(index / 2);
                                                const isLastRow = currentRow === totalRows - 1;

                                                return (
                                                    <button
                                                        key={amenity.id}
                                                        type="button"
                                                        onClick={() => handleToggleFacility(amenity.id)}
                                                        className={`flex flex-col items-center justify-center py-2.5 px-2 text-center cursor-pointer transition-colors select-none min-h-[72px] ${isLeftCol ? 'border-r border-[#dadce0] dark:border-slate-700' : ''
                                                            } ${!isLastRow ? 'border-b border-[#dadce0] dark:border-slate-700' : ''
                                                            } ${isSelected
                                                                ? 'bg-[#e8f0fe] dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                                                : 'bg-white dark:bg-[#303134] text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/60'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`material-symbols-outlined text-[20px] mb-1 transition-colors ${isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'
                                                                }`}
                                                        >
                                                            {amenity.icon}
                                                        </span>
                                                        <span className="text-[12px] leading-snug font-roboto line-clamp-2 px-1">
                                                            {amenity.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                            ({amenity.count})
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                            {filteredFacilities.length % 2 !== 0 && (
                                                <div className="bg-white dark:bg-[#303134]" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer with Temizle */}
                                <div className="px-5 pb-3 pt-1 flex justify-end items-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClearFacilities}
                                        disabled={selectedFacilities.length === 0}
                                        className={`text-[13px] font-medium font-roboto transition-colors select-none ${selectedFacilities.length > 0
                                                ? 'text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-0.5 cursor-pointer'
                                                : 'text-[#bdc1c6] dark:text-slate-600 px-2 py-0.5 cursor-default'
                                            }`}
                                    >
                                        {tListing('clear', currentLang)}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Filter Popup Overlay */}
                    {isFilterDrawerOpen && (
                        <>
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsFilterDrawerOpen(false)} />
                            <div className="absolute top-full left-6 mt-0 w-[360px] max-w-[90vw] bg-white dark:bg-[#303134] rounded-lg shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] border border-[#dadce0] dark:border-slate-700 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                <div className="flex items-center justify-center relative px-5 py-4 border-b border-[#e8eaed] dark:border-slate-700 shrink-0">
                                    <h2 className="text-[16px] font-medium text-[#202124] dark:text-slate-100">
                                        {tListing('filters', currentLang)}
                                    </h2>
                                    <button onClick={() => setIsFilterDrawerOpen(false)} className="absolute right-4 text-[#5f6368] hover:text-[#202124] dark:hover:text-white transition-colors p-1 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-slate-700">
                                        <span className="material-symbols-outlined text-xl leading-none">close</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <Sidebar
                                        filters={dynamicFilters}
                                        locationNames={locationNames}
                                        facilityNames={facilityNames}
                                        hideHeader={true}
                                        sortOptions={sortOptions}
                                        currentSortValue={currentSortValue}
                                        onSortChange={handleSortSelect}
                                        priceRange={priceRange}
                                        setPriceRange={setPriceRange}
                                        maxHotelPrice={maxHotelPrice}
                                        priceHistogram={priceHistogram}
                                        currentCurrencySymbol={currentCurrencySymbol}
                                        setIsPriceCustomized={setIsPriceCustomized}
                                    />
                                </div>
                                <div className="px-5 py-4 border-t border-[#e8eaed] dark:border-slate-700 flex justify-between items-center bg-white dark:bg-[#303134] shrink-0">
                                    <span className="text-[14px] font-medium text-[#5f6368] dark:text-slate-400">{hotels.length} {tListing('results', currentLang)}</span>
                                    <button onClick={() => {
                                        setSearchParams(new URLSearchParams());
                                        setIsFilterDrawerOpen(false);
                                    }} className="text-[#5f6368] dark:text-slate-400 text-[14px] font-medium hover:text-[#202124] dark:hover:text-white transition-colors">
                                        {tListing('clearAll', currentLang)}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Results count + Sort row */}
                <div className="flex items-center justify-between pl-6 pr-4 py-2.5 shrink-0 bg-white dark:bg-[#303134]">
                    <p className="text-[15.5px] font-medium text-[#202124] dark:text-slate-100 font-roboto tracking-tight truncate">
                        {resultsText}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Sort dropdown */}
                        <div className="relative shrink-0" ref={sortDropdownRef}>
                            <button
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-1 text-[13px] text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '16px' }}>{currentSortOption.icon}</span>
                                <span className="hidden sm:inline text-[13px] font-medium">{currentSortOption.label}</span>
                                <span className={`material-symbols-outlined text-[#70757a] transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} style={{ fontSize: '18px' }}>expand_more</span>
                            </button>
                            {isSortOpen && (
                                <div className="absolute right-0 top-full mt-1 w-[240px] bg-white dark:bg-[#303134] rounded-2xl border border-[#e8eaed] dark:border-slate-700 shadow-xl z-[200] py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                    {sortOptions.map(opt => {
                                        const isSelected = opt.value === currentSortValue;
                                        return (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleSortSelect(opt.value)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left transition-colors ${isSelected ? 'bg-[#e8f0fe] dark:bg-blue-900/30 text-[#1a73e8] font-medium' : 'text-[#3c4043] dark:text-slate-300 hover:bg-[#f8f9fa] dark:hover:bg-slate-700'}`}
                                            >
                                                <span className={`material-symbols-outlined ${isSelected ? 'text-[#1a73e8]' : 'text-[#70757a]'}`} style={{ fontSize: '18px' }}>{opt.icon}</span>
                                                <span className="flex-1">{opt.label}</span>
                                                {isSelected && <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '16px' }}>check</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <span
                            className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-400 hover:text-[#202124] dark:hover:text-white cursor-pointer select-none"
                            title="Sonuç bilgisi"
                        >
                            info
                        </span>
                    </div>
                </div>
                {/* ── Scrollable Hotel List ── */}
                <div
                    ref={listScrollRef}
                    className="flex-1 overflow-y-auto"
                    onScroll={handleListScroll}
                >
                    {/* Initial skeleton */}
                    {isLoading && hotels.length === 0 && (
                        <>{[...Array(6)].map((_, i) => <GoogleCardSkeleton key={i} isCompact={isMapExpanded} />)}</>
                    )}

                    {/* Hotel cards */}
                    {displayedHotels.map(hotel => (
                        <GoogleHotelCard
                            key={hotel.id}
                            hotel={hotel}
                            searchParams={searchParams}
                            isSelected={Boolean(selectedHotel && (selectedHotel.id === hotel.id || (selectedHotel.hotelId && hotel.hotelId && selectedHotel.hotelId === hotel.hotelId)))}
                            isHovered={hoveredHotel?.id === hotel.id}
                            onHover={setHoveredHotel}
                            onSelect={handleSelectHotel}
                            currentLang={currentLang}
                            isFav={isFavorite(String(hotel.hotelId || hotel.id))}
                            onToggleFav={() => toggleFavorite(hotel)}
                            isCompact={isMapExpanded}
                        />
                    ))}

                    {/* Loading more */}
                    {(isLoadingMore || (isLoading && hotels.length > 0)) && (
                        <div className="py-4 space-y-4">
                            <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-blue-50/90 dark:bg-slate-800/90 rounded-2xl mx-4 border border-blue-200/60 dark:border-slate-700 shadow-sm animate-pulse">
                                <span className="material-symbols-outlined text-[20px] text-[#1a73e8] dark:text-blue-400 animate-spin">progress_activity</span>
                                <span className="text-[13px] font-medium text-[#1a73e8] dark:text-blue-300">
                                    {tListing('loadingMore', currentLang) || 'Daha fazla otel yükleniyor...'}
                                </span>
                            </div>
                            {[...Array(2)].map((_, i) => <GoogleCardSkeleton key={`more-${i}`} isCompact={isMapExpanded} />)}
                        </div>
                    )}

                    {/* Sentinel + end state */}
                    <div ref={loaderRef} className="py-4 flex items-center justify-center">
                        {!hasMore && hotels.length > 0 && !isLoadingMore && (
                            <div className="flex items-center gap-3 text-[12px] text-[#70757a] dark:text-slate-400 w-full px-4">
                                <div className="flex-1 h-px bg-[#e8eaed] dark:bg-slate-700" />
                                {tListing('reachedEnd', currentLang)}
                                <div className="flex-1 h-px bg-[#e8eaed] dark:bg-slate-700" />
                            </div>
                        )}
                    </div>

                    {/* Empty state for filtered quick amenities */}
                    {displayedHotels.length === 0 && hotels.length > 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                            <span className="material-symbols-outlined text-5xl text-[#dadce0] dark:text-slate-600 mb-4">filter_alt_off</span>
                            <h3 className="text-[16px] font-medium text-[#3c4043] dark:text-slate-200 mb-2">
                                {tListing('noFilterMatch', currentLang)}
                            </h3>
                            <p className="text-[13px] text-[#70757a] dark:text-slate-400 mb-4">
                                {tListing('noFilterMatchDesc', currentLang)}
                            </p>
                            <button
                                onClick={handleClearAmenities}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a73e8] hover:bg-[#1558d6] text-white text-[13px] font-medium rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                                {tListing('clearAmenities', currentLang)}
                            </button>
                        </div>
                    )}

                    {/* Empty state when no hotels returned from search */}
                    {hotels.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                            <span className="material-symbols-outlined text-5xl text-[#dadce0] dark:text-slate-600 mb-4">search_off</span>
                            <h3 className="text-[16px] font-medium text-[#3c4043] dark:text-slate-300 mb-2">
                                {tListing('noProperties', currentLang)}
                            </h3>
                            <p className="text-[13px] text-[#70757a] dark:text-slate-400">
                                {tListing('tryAdjusting', currentLang)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ════════════════════════════════════════════
                RIGHT PANEL: Map & Favorites Sidebar
            ════════════════════════════════════════════ */}
            <div className="flex-1 relative flex overflow-hidden">
                <div className="flex-1 relative overflow-hidden">
                    {/* Top inner shadow - Soft realistic inset shadow inside the top of the map */}
                    <div className="absolute inset-0 pointer-events-none z-[1001] shadow-[inset_0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)]" />

                    <div className={`w-full h-full transition-opacity duration-700 ease-out ${isMapReady ? 'opacity-100' : 'opacity-0'}`}>
                        <MapContainer
                            center={initialMapState.center}
                            zoom={initialMapState.zoom}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={true}
                            zoomAnimation={true}
                            markerZoomAnimation={true}
                            fadeAnimation={true}
                            zoomSnap={0}
                            zoomDelta={0.5}
                            scrollWheelZoom={false}
                        >
                            <OpenFreeMapLayer style={mapLayer} />
                            {/* Orantılı zoom: yavaş çevirince az, hızlı çevirince çok */}
                            <SmoothWheelZoom sensitivity={1} />
                            {/* Capture map instance */}
                            <MapInstanceCapture setMap={setMapInstance} setIsMapReady={setIsMapReady} />

                            {/* Single unified map center & bounds controller */}
                            <MapLocationWatcher
                                slug={slug}
                                q={searchParams.get('q')}
                                searchParams={searchParams}
                                hotels={displayedHotels}
                                isLoading={isLoading}
                                shouldRefit={shouldRefitMap}
                                onRefitDone={React.useCallback(() => setShouldRefitMap(false), [])}
                                isProgrammaticMoveRef={isProgrammaticMoveRef}
                            />

                            {/* Dynamic POI markers from Elasticsearch geography_poi */}
                            {effectivePoiMarkers.map(poi => (
                                <PoiMarker
                                    key={poi.id || poi.poiId}
                                    poi={poi}
                                    currentLang={currentLang}
                                    onSelectPoi={handleSelectPoiFromMap}
                                />
                            ))}



                            {/* Price markers for hotels with coordinates */}
                            {effectiveMapMarkers
                                .filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)))
                                .map(hotel => (
                                    <PriceMarker
                                        key={hotel.id || hotel.hotelId}
                                        hotel={hotel}
                                        isSelected={Boolean(selectedHotel && (selectedHotel.id === hotel.id || (selectedHotel.hotelId && hotel.hotelId && selectedHotel.hotelId === hotel.hotelId)))}
                                        isHovered={hoveredHotel?.id === hotel.id}
                                        onSelect={handleSelectHotel}
                                        onHover={setHoveredHotel}
                                        searchParams={searchParams}
                                        currencySymbol={getCurrencySymbol(hotel.currency)}
                                        isFav={isFavorite(String(hotel.hotelId || hotel.id))}
                                        onToggleFav={() => toggleFavorite(hotel)}
                                        currentLang={currentLang}
                                    />
                                ))
                            }

                            {/* Map move detector */}
                            <MapBoundsWatcher
                                searchOnMove={searchOnMapMove}
                                onBoundsChange={handleMapBoundsChange}
                                onMapMoved={handleMapMoved}
                                isProgrammaticMoveRef={isProgrammaticMoveRef}
                            />
                        </MapContainer>
                    </div>

                    {/* Top-left: Expand Button + 4 Category Icons (Google Maps style) */}
                    <div className="absolute top-3.5 left-3.5 z-[1005] flex flex-col gap-2.5 pointer-events-auto">
                        {/* Map Expansion Toggle (resizes map width without fullscreen) */}
                        <button
                            type="button"
                            onClick={toggleMapExpand}
                            className="w-10 h-10 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 text-[#3c4043] dark:text-slate-200 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] flex items-center justify-center transition-all duration-300 cursor-pointer group active:scale-95"
                            title={isMapExpanded ? tListing('collapseMap', currentLang) : tListing('expandMap', currentLang)}
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-300 group-hover:text-[#1a73e8] transition-all duration-300">
                                {isMapExpanded ? 'fullscreen_exit' : 'fullscreen'}
                            </span>
                        </button>

                        {/* POI Category Icons: 4 Primary + Expandable More Menu */}
                        <div className="relative bg-white dark:bg-[#303134] rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] flex flex-col items-center py-2 px-1 gap-1">
                            {/* 1. Public Transport */}
                            <button
                                type="button"
                                onClick={() => togglePoiCategory('transit')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${activePoiCategories.transit
                                        ? 'bg-[#e8f0fe] dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 ring-2 ring-[#1a73e8]/30 shadow-xs'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                                    }`}
                                title={tListing('publicTransport', currentLang)}
                            >
                                <span className="material-symbols-outlined text-[19px]">directions_transit</span>
                            </button>

                            {/* 2. Restaurants */}
                            <button
                                type="button"
                                onClick={() => togglePoiCategory('restaurants')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${activePoiCategories.restaurants
                                        ? 'bg-[#fce8e6] dark:bg-red-900/40 text-[#ea4335] dark:text-red-300 ring-2 ring-[#ea4335]/30 shadow-xs'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                                    }`}
                                title={tListing('restaurants', currentLang)}
                            >
                                <span className="material-symbols-outlined text-[19px]">restaurant</span>
                            </button>

                            {/* 3. Touristic places / Attractions */}
                            <button
                                type="button"
                                onClick={() => togglePoiCategory('tourist')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${activePoiCategories.tourist
                                        ? 'bg-[#f3e8fd] dark:bg-purple-900/40 text-[#9333ea] dark:text-purple-300 ring-2 ring-[#9333ea]/30 shadow-xs'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                                    }`}
                                title={tListing('touristAttractions', currentLang)}
                            >
                                <span className="material-symbols-outlined text-[19px]">photo_camera</span>
                            </button>

                            {/* 4. Shopping areas */}
                            <button
                                type="button"
                                onClick={() => togglePoiCategory('shopping')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${activePoiCategories.shopping
                                        ? 'bg-[#fce4ec] dark:bg-pink-900/40 text-[#e91e63] dark:text-pink-300 ring-2 ring-[#e91e63]/30 shadow-xs'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                                    }`}
                                title={tListing('shoppingAreas', currentLang)}
                            >
                                <span className="material-symbols-outlined text-[19px]">shopping_bag</span>
                            </button>

                            {/* Divider line */}
                            <div className="w-5 h-[1px] bg-gray-200 dark:bg-slate-600 my-0.5" />

                            {/* 5. More Categories Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setIsPoiMenuOpen(v => !v)}
                                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    isPoiMenuOpen
                                        ? 'bg-[#f1f3f4] dark:bg-slate-700 text-[#1a73e8] dark:text-blue-400'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                                }`}
                                title={currentLang === 'tr' ? 'Daha Fazla Kategori' : 'More Categories'}
                            >
                                <span className={`material-symbols-outlined text-[19px] ${isPoiLoading ? 'animate-spin text-amber-500' : ''}`}>
                                    {isPoiLoading ? 'progress_activity' : 'more_horiz'}
                                </span>
                                {hasActiveSecondaryPoiCategories && !isPoiLoading && (
                                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1a73e8] ring-1 ring-white dark:ring-[#303134]" />
                                )}
                            </button>

                            {/* Expandable POI Categories Flyout Menu */}
                            {isPoiMenuOpen && (
                                <div
                                    ref={poiMenuRef}
                                    className="absolute left-[48px] top-12 z-[1010] bg-white dark:bg-[#303134] rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.22)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.65)] border border-gray-100 dark:border-slate-700/80 p-3 min-w-[240px] pointer-events-auto transition-all animate-in fade-in zoom-in-95"
                                >
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-slate-700">
                                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-200">
                                            <span className="material-symbols-outlined text-[16px] text-gray-500 dark:text-gray-400">category</span>
                                            <span>{currentLang === 'tr' ? 'POI Kategorileri' : 'POI Categories'}</span>
                                        </div>
                                        {hasAnyActivePoiCategories && (
                                            <button
                                                type="button"
                                                onClick={clearAllPoiCategories}
                                                className="text-[11px] font-medium text-[#1a73e8] hover:text-[#1558d6] dark:text-blue-400 hover:underline cursor-pointer"
                                            >
                                                {currentLang === 'tr' ? 'Temizle' : 'Clear'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
                                        {POI_CATEGORIES.filter(c => !c.isPrimary).map(cat => {
                                            const isActive = activePoiCategories[cat.key];
                                            return (
                                                <button
                                                    key={cat.key}
                                                    type="button"
                                                    onClick={() => togglePoiCategory(cat.key)}
                                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer group ${
                                                        isActive
                                                            ? 'bg-gray-100 dark:bg-slate-700/70 font-medium'
                                                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/40 text-gray-700 dark:text-slate-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                                                            style={{ backgroundColor: cat.color }}
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                                                        </span>
                                                        <span className="text-[12px] select-none text-gray-800 dark:text-gray-200">
                                                            {currentLang === 'tr' ? cat.labelTr : cat.labelEn}
                                                        </span>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ml-3 ${
                                                        isActive
                                                            ? 'bg-[#1a73e8] border-[#1a73e8]'
                                                            : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 group-hover:border-gray-400'
                                                    }`}>
                                                        {isActive && (
                                                            <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top-right: Zoom in / Zoom out controls (Google Maps style) */}
                    <div className="absolute top-3.5 right-3.5 z-[1005] flex flex-col bg-white dark:bg-[#303134] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] overflow-hidden pointer-events-auto">
                        <button
                            type="button"
                            onClick={() => mapInstance?.zoomIn()}
                            className="w-10 h-10 flex items-center justify-center text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title={tListing('zoomIn', currentLang)}
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                        <div className="w-6 h-[1px] bg-[#e8eaed] dark:bg-slate-600 mx-auto" />
                        <button
                            type="button"
                            onClick={() => mapInstance?.zoomOut()}
                            className="w-10 h-10 flex items-center justify-center text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title={tListing('zoomOut', currentLang)}
                        >
                            <span className="material-symbols-outlined text-[20px]">remove</span>
                        </button>
                    </div>

                    {/* Top center: Either "Listeyi güncelle" (when map moved & manual mode) OR "Harita hareket ettiğinde listeyi güncelle" toggle */}
                    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[1005] pointer-events-auto flex items-center gap-2">
                        {mapMoved && !searchOnMapMove ? (
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => {
                                    isUserPanRef.current = false;
                                    setShouldRefitMap(false);
                                    handleMapBoundsChange(mapBoundsRef.current);
                                }}
                                className="flex items-center gap-1.5 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 text-[#1a73e8] dark:text-blue-400 font-semibold rounded-full px-4 py-2 text-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all cursor-pointer active:scale-95 border border-[#1a73e8]/30 whitespace-nowrap disabled:opacity-100 disabled:cursor-wait"
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
                                <span>{isLoading ? (tListing('searching', currentLang) || 'Aranıyor...') : tListing('searchThisArea', currentLang)}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-white dark:bg-[#303134] rounded-full px-3.5 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                                <button
                                    type="button"
                                    onClick={handleToggleSearchOnMove}
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${searchOnMapMove
                                            ? 'bg-[#1a73e8] border-[#1a73e8]'
                                            : 'bg-white dark:bg-[#303134] border-[#80868b] dark:border-slate-500'
                                        }`}
                                >
                                    {searchOnMapMove && (
                                        <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                                    )}
                                </button>
                                <span
                                    onClick={handleToggleSearchOnMove}
                                    className="text-[12px] font-medium text-[#3c4043] dark:text-slate-200 cursor-pointer select-none whitespace-nowrap"
                                >
                                    {tListing('searchMapMoves', currentLang)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom-left: Map layer switcher (Google Maps style) */}
                    <div className="absolute bottom-5 left-4 z-[1005] pointer-events-auto" ref={layerMenuRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsLayerMenuOpen(v => !v)}
                                className="flex items-center gap-2 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 text-[#3c4043] dark:text-slate-200 rounded-full px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-all cursor-pointer select-none text-[13px] font-medium"
                                title={tListing('mapLayer', currentLang)}
                            >
                                <span className="material-symbols-outlined text-[#1a73e8]" style={{ fontSize: '18px' }}>
                                    layers
                                </span>
                                <span>{getLayerLabel(MAP_LAYERS[mapLayer], currentLang)}</span>
                                <span className="material-symbols-outlined text-[16px] text-gray-500">
                                    {isLayerMenuOpen ? 'expand_more' : 'expand_less'}
                                </span>
                            </button>

                            {isLayerMenuOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-slate-700 rounded-xl shadow-xl p-2 flex flex-col gap-1 text-left animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        {tListing('mapStyle', currentLang)}
                                    </div>
                                    {Object.values(MAP_LAYERS).map(layer => {
                                        const isSelected = mapLayer === layer.id;
                                        return (
                                            <button
                                                key={layer.id}
                                                onClick={() => {
                                                    userChangedLayerRef.current = true;
                                                    setMapLayer(layer.id);
                                                    setIsLayerMenuOpen(false);
                                                }}
                                                className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-[#1a73e8] dark:text-[#8ab4f8]'
                                                        : 'hover:bg-[#f8f9fa] dark:hover:bg-slate-800 text-[#3c4043] dark:text-slate-200'
                                                    }`}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] mt-0.5 ${isSelected ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-gray-400'}`}>
                                                    {layer.icon || 'public'}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-[13px] font-medium leading-tight flex items-center justify-between">
                                                        {getLayerLabel(layer, currentLang)}
                                                        {isSelected && (
                                                            <span className="material-symbols-outlined text-[16px] text-[#1a73e8] dark:text-[#8ab4f8]">check</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                                        {layer.desc}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                {/* Favorites Right Sidebar Dock (Google Style - Fixed width) */}
                <div
                    className="w-[58px] shrink-0 relative bg-white dark:bg-[#202124] border-l border-[#dadce0] dark:border-slate-700 flex flex-col z-[2000]"
                    onMouseEnter={handleFavMouseEnter}
                    onMouseLeave={handleFavMouseLeave}
                >
                    <div className="flex flex-col items-center w-full bg-white dark:bg-[#202124]">
                        {/* Top bookmark button block matching screenshot */}
                        <button
                            onClick={handleFavButtonClick}
                            title={tListing('savedPlansTitle', currentLang)}
                            className="w-full h-[56px] bg-white dark:bg-[#202124] flex items-center justify-center border-b border-[#dadce0] dark:border-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] hover:bg-[#f8f9fa] dark:hover:bg-slate-800 transition-colors cursor-pointer relative z-10 group"
                        >
                            <span
                                className="material-symbols-outlined text-[25px] text-[#3c4043] dark:text-slate-200 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors"
                                style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                            >
                                bookmarks
                            </span>
                            {favorites.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 bg-[#1a73e8] text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-0.5 flex items-center justify-center shadow-xs">
                                    {favorites.length}
                                </span>
                            )}
                        </button>

                        {/* Circular thumbnails underneath */}
                        <div className="flex flex-col gap-3 py-3.5 items-center w-full">
                            {favorites.slice(0, 6).map(fav => (
                                <div
                                    key={fav.hotelId || fav.id}
                                    onClick={handleFavButtonClick}
                                    title={fav.name || fav.hotelName || fav.names?.en || 'Otel'}
                                    className="w-9 h-9 rounded-full overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                                >
                                    <img src={fav.image || fav.images?.[0]?.url || placeholderHotel} className="w-full h-full object-cover" alt="" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Favorites Overlay Drawer (Floats over the map without changing map dimensions) */}
                <div
                    className={`absolute top-0 right-0 h-full w-[380px] bg-white dark:bg-[#202124] border-l border-[#dadce0] dark:border-slate-700 shadow-[-8px_0_24px_rgba(0,0,0,0.16),-2px_0_6px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.6)] flex flex-col z-[2010] transform transition-transform duration-300 ease-in-out ${isFavOpen
                            ? 'translate-x-0 pointer-events-auto'
                            : 'translate-x-full pointer-events-none'
                        }`}
                    onMouseEnter={handleFavMouseEnter}
                    onMouseLeave={handleFavMouseLeave}
                >
                    <div className="flex items-center justify-between p-4 pb-3 border-b border-[#f1f3f4] dark:border-slate-700/60">
                        <div>
                            <h2 className="text-[17px] font-medium text-[#202124] dark:text-white">{tListing('savedPlans', currentLang)}</h2>
                            <p className="text-[12px] text-[#70757a] dark:text-slate-400">{favorites.length} {tListing('savedHotels', currentLang)}</p>
                        </div>
                        <button
                            onClick={handleCloseFav}
                            className="w-9 h-9 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-slate-700 flex items-center justify-center text-[#5f6368] dark:text-slate-400 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#202124]">
                        {favorites.length === 0 ? (
                            <div className="text-center mt-12 px-6">
                                <div className="w-14 h-14 mx-auto rounded-full bg-[#f1f3f4] dark:bg-slate-700/60 flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-[#70757a] dark:text-slate-400 text-3xl">bookmark_border</span>
                                </div>
                                <h3 className="text-[15px] font-medium text-[#202124] dark:text-white mb-2">{tListing('nothingHereYet', currentLang)}</h3>
                                <p className="text-[13px] text-[#70757a] dark:text-slate-400 leading-relaxed">{tListing('nothingHereYetDesc', currentLang)}</p>
                            </div>
                        ) : (
                            <div className="p-4 flex flex-col gap-3">
                                {favorites.map(fav => (
                                    <div
                                        key={fav.hotelId || fav.id}
                                        className="bg-white dark:bg-[#303134] rounded-2xl border border-[#dadce0] dark:border-slate-700 p-3 flex gap-3 cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-slate-700/50 hover:shadow-sm transition-all"
                                        onClick={() => window.open(`/travel/hotels/detail/${fav.hotelId || fav.id}`, '_blank')}
                                    >
                                        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#f1f3f4] dark:bg-slate-800">
                                            <img src={fav.image || fav.images?.[0]?.url || placeholderHotel} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                            <h4 className="text-[14px] font-semibold text-[#3c4043] dark:text-white leading-[1.25] line-clamp-2">{fav.name || fav.hotelName || fav.names?.en || 'Otel'}</h4>
                                            <div className="flex items-center gap-1 mt-1 text-[12px] text-[#70757a] dark:text-slate-400">
                                                {fav.rating && (
                                                    <>
                                                        <span className="font-semibold text-[#3c4043] dark:text-slate-200">{fav.rating}</span>
                                                        <span className="material-symbols-outlined text-[#fbbc04] text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                        <span>({fav.reviewCount || 100})</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-[12px] text-[#70757a] dark:text-slate-400 mt-0.5 truncate">
                                                {fav.stars ? `${fav.stars} ${tListing('starSingle', currentLang)}` : ''}
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center justify-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(fav); }}
                                                title={tListing('removeFromSaved', currentLang)}
                                                className="w-9 h-9 rounded-full border border-[#dadce0] dark:border-slate-600 bg-white dark:bg-[#303134] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors shadow-xs"
                                            >
                                                <span className="material-symbols-outlined text-[#f97316] dark:text-[#fb923c] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelListing;
