import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { parseGuestsParam, validateAndSanitizeDates, formatDateForUrl } from '../utils/searchParamsUtils';
import { hotelService } from '../services/hotelService';
import { locationService } from '../services/locationService';
import ListingSearch from '../components/ListingSearch';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import { useFavorites } from '../context/FavoritesContext';
import { MapContainer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import OpenFreeMapLayer from '../components/OpenFreeMapLayer';
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

import { LISTING_LOCALES, AMENITY_LOCALES, getAmenityText, getLayerLabel, tListing } from '../utils/hotelListingLocales';
import { MAP_POIS } from '../data/mapPoiData';
import PoiMarker from '../components/PoiMarker';
import HotelQuickLookDrawer from '../components/HotelQuickLookDrawer';

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// Map Location Watcher - single unified controller for map center & bounds fitting
// ═══════════════════════════════════════════════
const MapLocationWatcher = ({ slug, q, searchParams, hotels, shouldRefit, onRefitDone, isProgrammaticMoveRef }) => {
    const map = useMap();
    const prevLocationKeyRef = React.useRef('');

    React.useEffect(() => {
        const lat = parseFloat(searchParams?.get('lat'));
        const lng = parseFloat(searchParams?.get('lng') || searchParams?.get('lon'));
        const locationId = searchParams?.get('locationId');

        // 1. Explicit lat & lng in searchParams (highest priority, smooth animated flyTo)
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            const locKey = `geo_${locationId || ''}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
            if (prevLocationKeyRef.current !== locKey) {
                prevLocationKeyRef.current = locKey;
                if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
                map.flyTo([lat, lng], 13, { duration: 1.2 });
                if (onRefitDone) onRefitDone();
                setTimeout(() => {
                    if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
                }, 1200);
            }
            return;
        }

        // 2. Slug / query location resolution
        const target = resolveInitialLocation(slug, q, searchParams);
        if (target && target.center) {
            const locKey = `loc_${locationId || ''}_${slug || ''}_${target.center[0].toFixed(4)}_${target.center[1].toFixed(4)}`;
            if (prevLocationKeyRef.current !== locKey) {
                prevLocationKeyRef.current = locKey;
                if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
                map.flyTo(target.center, target.zoom || 12, { duration: 1.2 });
                if (onRefitDone) onRefitDone();
                setTimeout(() => {
                    if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
                }, 1200);
                return;
            }
        }

        // 3. Fallback: auto-fit hotel bounds with smooth flyToBounds when shouldRefit is true
        if (shouldRefit && hotels && hotels.length > 0) {
            const valid = hotels.filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)));
            if (valid.length > 0) {
                try {
                    const bounds = L.latLngBounds(valid.map(h => [parseFloat(h.lat), parseFloat(h.lng)]));
                    if (bounds.isValid()) {
                        if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = true;
                        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.2 });
                        if (onRefitDone) onRefitDone();
                        setTimeout(() => {
                            if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
                        }, 1200);
                    }
                } catch (_e) {}
            }
        }
    }, [slug, searchParams?.get('lat'), searchParams?.get('lng'), searchParams?.get('lon'), searchParams?.get('locationId'), shouldRefit, hotels, map, onRefitDone, isProgrammaticMoveRef]);

    return null;
};

// ═══════════════════════════════════════════════
// Map Bounds Watcher - triggers search on map move or zoom (user interactions)
// ═══════════════════════════════════════════════
const MapBoundsWatcher = ({ searchOnMove, onBoundsChange, onMapMoved, isProgrammaticMoveRef }) => {
    const debounceTimerRef = React.useRef(null);
    const lastBoundsDataRef = React.useRef(null);

    const handleUpdate = React.useCallback((map) => {
        if (isProgrammaticMoveRef && isProgrammaticMoveRef.current) {
            return;
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (isProgrammaticMoveRef && isProgrammaticMoveRef.current) {
                return;
            }

            const bounds = map.getBounds();
            const nw = bounds.getNorthWest();
            const se = bounds.getSouthEast();
            const currentZoom = map.getZoom();

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

            if (searchOnMove) {
                onBoundsChange(boundsData);
            } else {
                onMapMoved?.(boundsData);
            }
        }, 150);
    }, [searchOnMove, onBoundsChange, onMapMoved, isProgrammaticMoveRef]);

    useMapEvents({
        dragstart: () => {
            if (isProgrammaticMoveRef) isProgrammaticMoveRef.current = false;
        },
        moveend: (e) => {
            handleUpdate(e.target);
        }
    });

    React.useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

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

    React.useEffect(() => {
        return () => {
            if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        };
    }, []);

    const priceDisplay = hotel.price ? Math.round(hotel.price).toLocaleString('tr-TR') : '';

    // Smart placement: check if marker is near top ONLY when popup is active to avoid recalculations during map zoom
    const isNearTop = React.useMemo(() => {
        if (!active || !map || !hotel.lat || !hotel.lng) return false;
        try {
            const point = map.latLngToContainerPoint([parseFloat(hotel.lat), parseFloat(hotel.lng)]);
            return point.y < 250;
        } catch (e) {
            return false;
        }
    }, [active, map, hotel.lat, hotel.lng]);

    // Automatically open/close popup on hover or selection
    React.useEffect(() => {
        if (markerRef.current) {
            if (active) {
                markerRef.current.openPopup();
            } else {
                markerRef.current.closePopup();
            }
        }
    }, [active]);

    const handleMouseEnter = () => {
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
            leaveTimerRef.current = null;
        }
        if (!enterTimerRef.current) {
            enterTimerRef.current = setTimeout(() => {
                onHover(hotel);
                enterTimerRef.current = null;
            }, 180);
        }
    };

    const handleMouseLeave = () => {
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current);
            enterTimerRef.current = null;
        }
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current);
        }
        leaveTimerRef.current = setTimeout(() => {
            onHover(null);
            leaveTimerRef.current = null;
        }, 180);
    };

    const handleClick = () => {
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current);
            enterTimerRef.current = null;
        }
        onSelect(hotel);
    };

    const icon = React.useMemo(() => {
        // Measure text width for perfect bubble sizing
        const textWidth = measurePriceText(`${currencySymbol} ${priceDisplay}`);

        // Compact bubble geometry
        const H = 26; // Pill height
        const R = 13; // Pill corner radius
        const tailTipX = 33; // Pointer tail tip X coordinate
        const favWidth = isFav ? 14 : 0;
        const W = Math.max(58, Math.round(4 + 18 + 4 + textWidth + favWidth + 8));

        // Colors & styles matching Google Hotels
        const iconBg = active ? '#ea437b' : '#ee628e';
        const borderColor = active ? '#5f6368' : '#80868b';
        const scale = active ? 'scale(1.12)' : 'scale(1)';
        const shadow = active 
            ? 'drop-shadow(0 3px 6px rgba(60,64,67,0.35)) drop-shadow(0 1px 3px rgba(60,64,67,0.2))'
            : 'drop-shadow(0 1.5px 3px rgba(60,64,67,0.3)) drop-shadow(0 1px 2px rgba(60,64,67,0.15))';

        // Unified SVG path: compact rounded pill with smooth, curved concave downward pointer tail
        const path = `
            M ${R} 0
            L ${W - R} 0
            A ${R} ${R} 0 0 1 ${W} ${R}
            A ${R} ${R} 0 0 1 ${W - R} ${H}
            L 40 ${H}
            C 38 ${H}, 36 27.8, 34.8 30.2
            C 34.2 31.5, 32.8 31.5, 32.2 30.2
            C 31 27.8, 29 ${H}, 26 ${H}
            L ${R} ${H}
            A ${R} ${R} 0 0 1 0 ${R}
            A ${R} ${R} 0 0 1 ${R} 0
            Z
        `;

        const favSvg = isFav ? `
            <g transform="translate(${W - 17}, 6.5) scale(0.52)">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill="#1e8e3e"/>
            </g>
        ` : '';

        const html = `
            <div style="cursor:pointer;user-select:none;z-index:${active ? 1000 : isFav ? 500 : 1};">
                <svg width="${W}" height="34" viewBox="0 0 ${W} 34" style="overflow:visible;filter:${shadow};display:block;transform-origin:${tailTipX}px 32px;transform:${scale};transition:transform 0.15s ease;">
                    <path d="${path}" fill="#ffffff" stroke="${borderColor}" stroke-width="1.15" stroke-linejoin="round"/>
                    <circle cx="13" cy="13" r="9" fill="${iconBg}" style="transition:fill 0.2s ease;"/>
                    <g transform="translate(7.75, 7.75) scale(0.44)">
                        <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" fill="#ffffff"/>
                    </g>
                    <text x="26" y="13" dominant-baseline="central" font-family="'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="600" fill="#202124" letter-spacing="-0.1px">${currencySymbol}<tspan dx="2">${priceDisplay}</tspan></text>
                    ${favSvg}
                </svg>
            </div>
        `;

        return L.divIcon({
            className: 'google-hotel-map-marker',
            html,
            iconSize: [W, 34],
            iconAnchor: [tailTipX, 32],
        });
    }, [active, isFav, currencySymbol, priceDisplay]);

    const formattedRating = (parseFloat(hotel.rating) || 4.2).toFixed(1).replace('.', ',');
    const reviewCount = hotel.reviewCount || (hotel.stars ? hotel.stars * 115 + 42 : 432);
    const imageUrl = (hotel.images && hotel.images.length > 0) ? hotel.images[0] : (hotel.image || placeholderHotel);

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
            zIndexOffset={active ? 1000 : isFav ? 500 : 0}
            eventHandlers={{
                click: handleClick,
                mouseover: handleMouseEnter,
                mouseout: handleMouseLeave,
            }}
        >
            {active && (
                <Popup 
                className={`hotel-price-popup ${isNearTop ? 'popup-downwards' : ''}`}
                minWidth={220} 
                maxWidth={220} 
                autoPan={false} 
                closeButton={false} 
                offset={isNearTop ? [0, 8] : [0, -34]}
            >
                <style>{`
                    .leaflet-popup.hotel-price-popup {
                        transition: none !important;
                        -webkit-transition: none !important;
                    }
                    .hotel-price-popup .leaflet-popup-content-wrapper { 
                        padding: 0 !important; 
                        border-radius: 10px !important; 
                        overflow: hidden !important; 
                        box-shadow: 0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12) !important; 
                        border: none !important;
                        background: transparent !important;
                        transition: none !important;
                    }
                    .hotel-price-popup.popup-downwards {
                        bottom: auto !important;
                        top: 8px !important;
                        margin-bottom: 0 !important;
                    }
                    .hotel-price-popup.popup-downwards .leaflet-popup-content-wrapper {
                        transform-origin: top center !important;
                    }
                    .hotel-price-popup:not(.popup-downwards) .leaflet-popup-content-wrapper {
                        transform-origin: bottom center !important;
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
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{ 
                        width: '220px', 
                        fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
                        borderRadius: '10px',
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
                                    color: 'white', 
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
            )}
        </Marker>
    );
});

// ═══════════════════════════════════════════════
// Google Hotels Style Card
// ═══════════════════════════════════════════════
const GoogleHotelCard = React.memo(({ hotel, searchParams, isSelected, isHovered, onHover, onSelect, currentLang, isFav, onToggleFav, isCompact = false }) => {
    const [imgIdx, setImgIdx] = React.useState(0);
    const images = hotel.images?.length > 0 ? hotel.images : [placeholderHotel];

    const getCurrencySymbol = (code) => {
        const sym = { USD: '$', EUR: '€', GBP: '£', TRY: '₺', AED: 'د.إ', SAR: 'ر.س', JPY: '¥', CNY: '¥', RUB: '₽' };
        return sym[code] || code || '$';
    };
    const currencySymbol = getCurrencySymbol(hotel.currency);
    const formattedPrice = hotel.price ? Math.round(hotel.price).toLocaleString('tr-TR') : '';

    const starTypeLabelMap = {
        tr: 'Yıldızlı Otel', en: 'Star Hotel', ar: 'نجوم', de: 'Sterne Hotel',
        fr: 'Étoiles', ru: 'Звезд', zh: '星酒店', es: 'Estrellas', it: 'Stelle', ja: '星ホテル'
    };
    const typeLabel = hotel.stars > 0
        ? `${hotel.stars} ${starTypeLabelMap[currentLang] || starTypeLabelMap.en}`
        : (hotel.type || 'Hotel');

    const ratingNum = parseFloat(hotel.rating) || 0;

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
    const hasMeal = hotel.boardName && !hotel.boardName.toLowerCase().includes('room only') && !hotel.boardName.toLowerCase().includes('sadece oda');
    const isGreatDeal = hasPriceDrop && hasMeal && hotel.hasFreeCancellation;
    const discountPercent = hasPriceDrop ? Math.round(((hotel.strikethroughPrice - hotel.price) / hotel.strikethroughPrice) * 100) : 0;

    const greatDealLabel = {
        tr: 'HARİKA FIRSAT', en: 'GREAT DEAL', ar: 'عرض رائع', de: 'TOLLES ANGEBOT',
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


    const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(p => (p + 1) % images.length); };
    const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(p => (p - 1 + images.length) % images.length); };
    const isActive = isSelected || isHovered;

    return (
        <div
            className={`flex py-4 pl-6 pr-4 border-b border-[#e8eaed] dark:border-slate-700 cursor-pointer transition-colors group ${isActive ? 'bg-[#f0f4ff] dark:bg-blue-900/10' : 'bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-800/40'}`}
            onMouseEnter={() => onHover(hotel)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(hotel)}
        >
            {/* Image */}
            <div className={`relative ${isCompact ? "w-[190px] h-[145px] mr-3.5" : "w-[260px] h-[175px] mr-5"} rounded-lg overflow-hidden shrink-0 bg-[#f1f3f4] transition-all duration-300`}>
                {isGreatDeal && (
                    <div className="absolute top-2 left-2 z-10 bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-2 py-1 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.15)] truncate max-w-[85%] border border-[#137333]/10">
                        {greatDealLabel[currentLang] || greatDealLabel.en}
                    </div>
                )}
                <img
                    src={images[imgIdx]}
                    alt={hotel.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = placeholderHotel; e.target.onerror = null; }}
                />
                {images.length > 1 && (
                    <>
                        <button 
                            onClick={prevImg} 
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#202124] shadow-[0_1px_4px_rgba(0,0,0,0.25)] backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[#202124]" style={{ fontSize: '18px' }}>chevron_left</span>
                        </button>
                        <button 
                            onClick={nextImg} 
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-[#202124] shadow-[0_1px_4px_rgba(0,0,0,0.25)] backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[#202124]" style={{ fontSize: '18px' }}>chevron_right</span>
                        </button>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {images.slice(0, 5).map((_, i) => (
                                <div key={i} className={`rounded-full transition-all ${i === imgIdx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`} />
                            ))}
                        </div>
                    </>
                )}
                <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav?.(); }}
                >
                    {isFav ? (
                        <span className="material-symbols-outlined text-[#8ab4f8] dark:text-[#8ab4f8]" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    ) : (
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>bookmark_border</span>
                    )}
                </button>
                {/* Recommended Badge */}
                {hotel.isRecommended && !isGreatDeal && (
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
                        to={`/travel/hotels/detail/${hotel.hotelId}?${searchParams.toString()}`}
                        target="_blank"
                        className="text-[20px] font-normal text-[#202124] dark:text-slate-100 hover:underline leading-[1.3] line-clamp-2"
                        onClick={e => e.stopPropagation()}
                    >
                        {hotel.name}
                    </Link>

                    {/* Rating */}
                    {ratingNum > 0 && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[13px] font-medium text-[#3c4043] dark:text-slate-200">{ratingNum.toFixed(1)}</span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} style={{ fontSize: '12px', color: i < Math.round(ratingNum) ? '#fabb05' : '#dadce0' }}>★</span>
                                ))}
                            </div>
                            <span className="text-[12px] text-[#70757a] dark:text-slate-400">({hotel.ratingLabel})</span>
                        </div>
                    )}

                    {/* Amenities grid (3x3 - 9 items) */}
                    {(() => {
                        const displayAmenities = [
                            ...(typeLabel ? [{ icon: 'hotel', label: typeLabel }] : []),
                            ...(hotel.boardName ? [{ icon: 'local_cafe', label: hotel.boardName }] : []),
                            ...(hotel.amenities || []).filter(a => {
                                const lbl = Array.isArray(a.label) ? a.label[0] : a.label;
                                return lbl && lbl !== typeLabel;
                            })
                        ].slice(0, 9);

                        return displayAmenities.length > 0 ? (
                            <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-2">
                                {displayAmenities.map((amenity, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-[13px] text-[#5f6368] dark:text-slate-300 min-w-0 font-roboto">
                                        <span className="material-symbols-outlined text-[#70757a] dark:text-slate-400 shrink-0" style={{ fontSize: '18px' }}>{amenity.icon}</span>
                                        <span className="truncate">
                                            {Array.isArray(amenity.label) ? amenity.label[0] : amenity.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : null;
                    })()}

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
                                {hotel.strikethroughPrice && (
                                    <div className="text-[13px] text-[#70757a] dark:text-slate-400 line-through leading-none mb-1 font-roboto">
                                        {currencySymbol}{Math.round(hotel.strikethroughPrice).toLocaleString('tr-TR')}
                                    </div>
                                )}
                                <span className="text-[22px] font-bold text-[#202124] dark:text-slate-100 leading-none font-roboto">
                                    {currencySymbol}{formattedPrice}
                                </span>
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
    const lat = parseFloat(searchParams?.get('lat'));
    const lng = parseFloat(searchParams?.get('lng') || searchParams?.get('lon'));
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { center: [lat, lng], zoom: 12, label: q || '' };
    }

    const cleanSlug = normalizeLoc(slug);
    if (cleanSlug) {
        for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
            if (cleanSlug.includes(key) || key.includes(cleanSlug)) {
                return val;
            }
        }
    }

    const cleanQ = normalizeLoc(q);
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
// Quick Amenities Filter List (Google Hotels Style)
// ═══════════════════════════════════════════════
export const QUICK_AMENITIES = [
    {
        id: 'free_wifi',
        labelTr: 'Ücretsiz kablosuz bağlantı',
        labelEn: 'Free Wi-Fi',
        labelAr: 'واي فاي مجاني',
        icon: 'wifi',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'wifi')) return true;
            if (h.facilityIds?.some(id => [98445, 48325, 3664, 334].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('wifi') || text.includes('wi-fi') || text.includes('kablosuz') || text.includes('internet');
        }
    },
    {
        id: 'free_breakfast',
        labelTr: 'Ücretsiz kahvaltı',
        labelEn: 'Free breakfast',
        labelAr: 'إفطار مجاني',
        icon: 'coffee',
        match: (h) => {
            const bName = (h.boardName || '').toLowerCase();
            if (bName.includes('breakfast') || bName.includes('kahvaltı') || bName.includes('bb') || bName.includes('bed & breakfast') || bName.includes('bed and breakfast') || bName.includes('half board') || bName.includes('all inclusive') || bName.includes('tam pansiyon') || bName.includes('yarım pansiyon')) return true;
            if (h.amenities?.some(a => ['coffee', 'free_breakfast', 'local_cafe'].includes(a.icon))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('breakfast') || text.includes('kahvaltı');
        }
    },
    {
        id: 'restaurant',
        labelTr: 'Restoran',
        labelEn: 'Restaurant',
        labelAr: 'مطعم',
        icon: 'restaurant',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'restaurant')) return true;
            if (h.facilityIds?.some(id => [641].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('restaurant') || text.includes('restoran') || text.includes('dining');
        }
    },
    {
        id: 'bar',
        labelTr: 'Bar',
        labelEn: 'Bar',
        labelAr: 'بار',
        icon: 'local_bar',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'local_bar')) return true;
            if (h.facilityIds?.some(id => [3134].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('bar') || text.includes('lounge');
        }
    },
    {
        id: 'kid_friendly',
        labelTr: 'Çocuklar için uygun',
        labelEn: 'Kid-friendly',
        labelAr: 'مناسب للأطفال',
        icon: 'stroller',
        match: (h) => {
            if (h.amenities?.some(a => ['child_friendly', 'child_care', 'stroller'].includes(a.icon))) return true;
            if (h.facilityIds?.some(id => [603, 1981, 1685].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('kid') || text.includes('child') || text.includes('çocuk') || text.includes('bebek') || text.includes('family') || text.includes('aile');
        }
    },
    {
        id: 'pets',
        labelTr: 'Evcil hayvan kabul ediliyor',
        labelEn: 'Pet-friendly',
        labelAr: 'يسمح بالحيوانات الأليفة',
        icon: 'pets',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'pets')) return true;
            if (h.facilityIds?.some(id => [606].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('pet') || text.includes('evcil') || text.includes('hayvan');
        }
    },
    {
        id: 'free_parking',
        labelTr: 'Ücretsiz park alanı',
        labelEn: 'Free parking',
        labelAr: 'موقف سيارات مجاني',
        icon: 'local_parking',
        match: (h) => {
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('ücretsiz park') || text.includes('free park') || text.includes('ücretsiz otopark') || text.includes('free self parking');
        }
    },
    {
        id: 'parking',
        labelTr: 'Park Alanı',
        labelEn: 'Parking',
        labelAr: 'موقف سيارات',
        icon: 'local_parking',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'local_parking')) return true;
            if (h.facilityIds?.some(id => [610].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('park') || text.includes('otopark') || text.includes('garage') || text.includes('valet');
        }
    },
    {
        id: 'ev_charging',
        labelTr: 'EV şarj noktası',
        labelEn: 'EV charger',
        labelAr: 'شاحن المركبات الكهربائية',
        icon: 'bolt',
        match: (h) => {
            if (h.amenities?.some(a => ['bolt', 'ev_station'].includes(a.icon))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('ev ') || text.includes('electric') || text.includes('şarj') || text.includes('charger');
        }
    },
    {
        id: 'room_service',
        labelTr: 'Oda servisi',
        labelEn: 'Room service',
        labelAr: 'خدمة الغرف',
        icon: 'room_service',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'room_service')) return true;
            if (h.facilityIds?.some(id => [611].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('room service') || text.includes('oda servisi');
        }
    },
    {
        id: 'gym',
        labelTr: 'Spor salonu',
        labelEn: 'Fitness center',
        labelAr: 'صالة رياضية',
        icon: 'fitness_center',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'fitness_center')) return true;
            if (h.facilityIds?.some(id => [1978, 98455, 47935].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('gym') || text.includes('fitness') || text.includes('spor salonu') || text.includes('sağlık kulübü');
        }
    },
    {
        id: 'spa',
        labelTr: 'Spa',
        labelEn: 'Spa',
        labelAr: 'سبا',
        icon: 'spa',
        match: (h) => {
            if (h.amenities?.some(a => ['spa', 'hot_tub'].includes(a.icon))) return true;
            if (h.facilityIds?.some(id => [1985, 650, 3891].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('spa') || text.includes('sauna') || text.includes('masaj') || text.includes('wellness') || text.includes('hamam') || text.includes('jakuzi');
        }
    },
    {
        id: 'pool',
        labelTr: 'Havuz',
        labelEn: 'Pool',
        labelAr: 'مسبح',
        icon: 'pool',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'pool')) return true;
            if (h.facilityIds?.some(id => [616, 649, 1685].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('pool') || text.includes('havuz');
        }
    },
    {
        id: 'indoor_pool',
        labelTr: 'Kapalı havuz',
        labelEn: 'Indoor pool',
        labelAr: 'مسبح داخلي',
        icon: 'pool',
        match: (h) => {
            if (h.facilityIds?.some(id => [649].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('indoor pool') || text.includes('kapalı havuz');
        }
    },
    {
        id: 'outdoor_pool',
        labelTr: 'Açık havuz',
        labelEn: 'Outdoor pool',
        labelAr: 'مسبح خارجي',
        icon: 'pool',
        match: (h) => {
            if (h.facilityIds?.some(id => [616].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('outdoor pool') || text.includes('açık havuz');
        }
    },
    {
        id: 'ac',
        labelTr: 'Klimalı',
        labelEn: 'Air conditioning',
        labelAr: 'تكييف هواء',
        icon: 'ac_unit',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'ac_unit')) return true;
            if (h.facilityIds?.some(id => [719].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('klima') || text.includes('air condition');
        }
    },
    {
        id: 'wheelchair',
        labelTr: 'Tekerlekli sandalyeye uygun',
        labelEn: 'Wheelchair accessible',
        labelAr: 'مناسب للكراسي المتحركة',
        icon: 'accessible',
        match: (h) => {
            if (h.amenities?.some(a => ['accessible', 'wheelchair_pickup'].includes(a.icon))) return true;
            if (h.facilityIds?.some(id => [1995].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('wheelchair') || text.includes('engelli') || text.includes('tekerlekli sandalye');
        }
    },
    {
        id: 'beach',
        labelTr: 'Plaj',
        labelEn: 'Beach',
        labelAr: 'شاطئ',
        icon: 'beach_access',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'beach_access')) return true;
            if (h.facilityIds?.some(id => [3724].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('beach') || text.includes('plaj');
        }
    },
    {
        id: 'all_inclusive',
        labelTr: 'Her şey dahil',
        labelEn: 'All-inclusive',
        labelAr: 'شامل كلياً',
        icon: 'all_inclusive',
        match: (h) => {
            const bName = (h.boardName || '').toLowerCase();
            return bName.includes('all inclusive') || bName.includes('her şey dahil') || bName.includes('ai') || JSON.stringify(h.amenities || []).toLowerCase().includes('all inclusive');
        }
    },
    {
        id: 'hot_tub',
        labelTr: 'Jakuzi',
        labelEn: 'Hot tub / Jacuzzi',
        labelAr: 'جاكوزي',
        icon: 'hot_tub',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'hot_tub')) return true;
            if (h.facilityIds?.some(id => [3891].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('jakuzi') || text.includes('jacuzzi') || text.includes('hot tub');
        }
    },
    {
        id: 'airport_shuttle',
        labelTr: 'Havalimanı servisi',
        labelEn: 'Airport shuttle',
        labelAr: 'خدمة نقل المطار',
        icon: 'airport_shuttle',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'airport_shuttle')) return true;
            if (h.facilityIds?.some(id => [98415].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('airport') || text.includes('havalimanı') || text.includes('havaalanı');
        }
    },
    {
        id: 'business_center',
        labelTr: 'İş merkezi',
        labelEn: 'Business center',
        labelAr: 'مركز أعمال',
        icon: 'business_center',
        match: (h) => {
            if (h.amenities?.some(a => ['business_center', 'meeting_room'].includes(a.icon))) return true;
            if (h.facilityIds?.some(id => [18006, 1991].includes(Number(id)))) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('business') || text.includes('iş merkezi') || text.includes('toplantı');
        }
    },
    {
        id: 'smoke_free',
        labelTr: 'Sigara içilmeyen otel',
        labelEn: 'Smoke-free hotel',
        labelAr: 'فندق خالي من التدخين',
        icon: 'smoke_free',
        match: (h) => {
            if (h.amenities?.some(a => a.icon === 'smoke_free')) return true;
            const text = JSON.stringify(h.amenities || []).toLowerCase();
            return text.includes('smoke free') || text.includes('sigara içilmez') || text.includes('non-smoking');
        }
    }
];

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
        tourist: false,
        transit: false,
        restaurants: false,
        shopping: false
    });

    const togglePoiCategory = React.useCallback((categoryKey) => {
        setActivePoiCategories(prev => ({
            ...prev,
            [categoryKey]: !prev[categoryKey]
        }));
    }, []);

    const toggleMapExpand = React.useCallback(() => {
        setIsMapExpanded(prev => !prev);
    }, []);

    React.useEffect(() => {
        if (!mapInstance) return;
        const t1 = setTimeout(() => mapInstance.invalidateSize(), 80);
        const t2 = setTimeout(() => mapInstance.invalidateSize(), 320);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
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

    const selectedAmenities = React.useMemo(() => {
        const p = searchParams.get('amenities');
        return p ? p.split(',').filter(Boolean) : [];
    }, [searchParams]);

    const handleToggleAmenity = (amenityId) => {
        const newParams = new URLSearchParams(searchParams);
        let nextList;
        if (selectedAmenities.includes(amenityId)) {
            nextList = selectedAmenities.filter(id => id !== amenityId);
        } else {
            nextList = [...selectedAmenities, amenityId];
        }
        if (nextList.length > 0) {
            newParams.set('amenities', nextList.join(','));
        } else {
            newParams.delete('amenities');
        }
        setSearchParams(newParams);
    };

    const handleClearAmenities = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('amenities');
        setSearchParams(newParams);
    };

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

    const [locationNames, setLocationNames] = React.useState({});
    const [facilityNames, setFacilityNames] = React.useState({});

    const getDefaultDates = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const fmt = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        return { checkin: fmt(tomorrow), checkout: fmt(dayAfter) };
    };

    const getSearchParams = () => {
        const starsParam = searchParams.get('stars');
        const freeCancellationParam = searchParams.get('freeCancellation');
        const prePaymentParam = searchParams.get('prePayment');
        const locationsParam = searchParams.get('locations');
        const roomTwinParam = searchParams.get('roomTwin');
        const roomMaxAdultParam = searchParams.get('roomMaxAdult');
        const roomMaxChildrenParam = searchParams.get('roomMaxChildren');
        const roomMaxExtraBedParam = searchParams.get('roomMaxExtraBed');
        const facilitiesParam = searchParams.get('facilities');
        return {
            stars: starsParam ? starsParam.split(',').map(Number) : [],
            freeCancellation: freeCancellationParam === 'true' ? true : freeCancellationParam === 'false' ? false : null,
            prePayment: prePaymentParam === 'true' ? true : prePaymentParam === 'false' ? false : null,
            locations: locationsParam ? locationsParam.split(',').map(Number) : [],
            roomTwin: roomTwinParam === 'true' ? true : roomTwinParam === 'false' ? false : null,
            roomMaxAdult: roomMaxAdultParam ? roomMaxAdultParam.split(',').map(Number) : null,
            roomMaxChildren: roomMaxChildrenParam ? roomMaxChildrenParam.split(',').map(Number) : null,
            roomMaxExtraBed: roomMaxExtraBedParam ? roomMaxExtraBedParam.split(',').map(Number) : null,
            facilities: facilitiesParam ? facilitiesParam.split(',').map(Number) : []
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
    const locationName = queryLocation && !isGenericAreaText(queryLocation)
        ? queryLocation.split(',')[0].trim()
        : slug ? getSlugDisplayName(slug) : '';

    const themeName = theme ? theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
    const campaignName = campaign ? campaign.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    const locationId = searchParams.get('locationId');

    // Resolve initial map center immediately so Turkey is not displayed needlessly
    const initialMapState = React.useMemo(() => {
        return resolveInitialLocation(slug, searchParams.get('q'), searchParams) || {
            center: [39.9, 32.8],
            zoom: 6,
            label: ''
        };
    }, []);

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
    const displayedHotels = React.useMemo(() => {
        let filtered = hotels;

        if (searchParams.get('recommended') === 'true') {
            filtered = filtered.filter(hotel => hotel.isRecommended === true);
        }

        if (selectedAmenities.length > 0) {
            filtered = filtered.filter(hotel => {
                return selectedAmenities.every(amenityId => {
                    const def = QUICK_AMENITIES.find(a => a.id === amenityId);
                    return def ? def.match(hotel) : true;
                });
            });
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
    }, [hotels, selectedAmenities, isPriceActive, priceRange, maxHotelPrice]);

    // Active POIs to render on the map (combines static curated MAP_POIS + dynamic POIs for any region)
    const activePois = React.useMemo(() => {
        const enabledCategories = Object.keys(activePoiCategories).filter(cat => activePoiCategories[cat]);
        if (enabledCategories.length === 0) return [];

        const staticMatches = MAP_POIS.filter(poi => activePoiCategories[poi.category]);

        // Calculate center of current hotels or map
        const validHotels = displayedHotels.filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)));
        let centerLat = null;
        let centerLng = null;

        if (validHotels.length > 0) {
            centerLat = validHotels.reduce((acc, h) => acc + parseFloat(h.lat), 0) / validHotels.length;
            centerLng = validHotels.reduce((acc, h) => acc + parseFloat(h.lng), 0) / validHotels.length;
        } else if (mapInstance) {
            try {
                const c = mapInstance.getCenter();
                centerLat = c.lat;
                centerLng = c.lng;
            } catch (_) {}
        }

        if (centerLat === null || centerLng === null) return staticMatches;

        // Check if any static POI is within ~50km of center
        const nearbyStatic = staticMatches.filter(poi => {
            const dLat = poi.lat - centerLat;
            const dLng = poi.lng - centerLng;
            return (dLat * dLat + dLng * dLng) < 0.25;
        });

        if (nearbyStatic.length > 0) {
            return nearbyStatic;
        }

        // Dynamic Fallback POI Generator for regions without static MAP_POIS entries:
        const dynamicPois = [];
        const locationName = hotels[0]?.location?.split(',')[0] || 'Bölge';

        enabledCategories.forEach((cat) => {
            if (cat === 'transit') {
                dynamicPois.push({
                    id: `dyn-transit-1`,
                    name: `${locationName} Ulaşım & Transfer Merkezi`,
                    category: 'transit',
                    lat: centerLat + 0.008,
                    lng: centerLng + 0.012,
                    icon: 'directions_transit',
                    color: '#1a73e8',
                    labelColor: '#1558d6',
                    description: `${locationName} bölgesel ulaşım ve otobüs/metro transfer noktası.`
                });
                dynamicPois.push({
                    id: `dyn-transit-2`,
                    name: `${locationName} Ana İstasyonu`,
                    category: 'transit',
                    lat: centerLat - 0.011,
                    lng: centerLng - 0.009,
                    icon: 'subway',
                    color: '#1a73e8',
                    labelColor: '#1558d6',
                    description: `Toplu taşıma ve şehir bağlantı durağı.`
                });
            } else if (cat === 'restaurants') {
                dynamicPois.push({
                    id: `dyn-rest-1`,
                    name: `${locationName} Gurme Restoranlar Bölgesi`,
                    category: 'restaurants',
                    lat: centerLat + 0.005,
                    lng: centerLng - 0.007,
                    icon: 'restaurant',
                    color: '#ea4335',
                    labelColor: '#c5221f',
                    description: `${locationName} popüler yemek ve lezzet mekanları.`
                });
                dynamicPois.push({
                    id: `dyn-rest-2`,
                    name: `${locationName} Sahil & Çarşı Kafeleri`,
                    category: 'restaurants',
                    lat: centerLat - 0.006,
                    lng: centerLng + 0.008,
                    icon: 'restaurant',
                    color: '#ea4335',
                    labelColor: '#c5221f',
                    description: `Açık hava kafeleri ve yerel lezzet alanları.`
                });
            } else if (cat === 'tourist') {
                dynamicPois.push({
                    id: `dyn-tourist-1`,
                    name: `${locationName} Tarihi Şehir Merkezi`,
                    category: 'tourist',
                    lat: centerLat - 0.004,
                    lng: centerLng + 0.005,
                    icon: 'attractions',
                    color: '#9333ea',
                    labelColor: '#7e22ce',
                    description: `${locationName} öne çıkan tarihi ve gezilecek alanı.`
                });
                dynamicPois.push({
                    id: `dyn-tourist-2`,
                    name: `${locationName} Manzara & Gezi Terası`,
                    category: 'tourist',
                    lat: centerLat + 0.010,
                    lng: centerLng - 0.004,
                    icon: 'park',
                    color: '#0f9d58',
                    labelColor: '#137333',
                    description: `Panoramik gezi ve doğa noktası.`
                });
            } else if (cat === 'shopping') {
                dynamicPois.push({
                    id: `dyn-shop-1`,
                    name: `${locationName} Alışveriş & Çarşı Caddesi`,
                    category: 'shopping',
                    lat: centerLat + 0.003,
                    lng: centerLng + 0.009,
                    icon: 'shopping_bag',
                    color: '#e91e63',
                    labelColor: '#ad1457',
                    description: `${locationName} mağazalar ve butik alışveriş caddesi.`
                });
            }
        });

        return [...nearbyStatic, ...dynamicPois];
    }, [activePoiCategories, displayedHotels, mapInstance, hotels]);

    // Results count text
    const resultsText = useMemo(() => {
        if (isLoading && totalProperties === 0) return tListing('searching', currentLang);
        const isCustomFiltered = selectedAmenities.length > 0 || isPriceActive;
        const count = isCustomFiltered ? displayedHotels.length : (totalProperties || hotels.length || 0);
        return `${locationName || ''} · ${count} ${tListing('results', currentLang)}`;
    }, [isLoading, totalProperties, locationName, currentLang, selectedAmenities.length, isPriceActive, displayedHotels.length, hotels.length]);

    // Active filter count for badge
    const activeFilterCount = React.useMemo(() => {
        const count = [
            searchParams.get('stars'), searchParams.get('locations'), searchParams.get('freeCancellation'),
            searchParams.get('prePayment'), searchParams.get('roomTwin'), searchParams.get('roomMaxAdult'),
            searchParams.get('roomMaxChildren'), searchParams.get('roomMaxExtraBed'), searchParams.get('facilities'),
            searchParams.get('amenities')
        ].filter(Boolean).length;
        return count + (isPriceActive ? 1 : 0);
    }, [searchParams, isPriceActive]);

    // Map hotel from API to UI model
    const mapApiHotelToModel = React.useCallback((apiHotel) => {
        const hotelNames = apiHotel.names || apiHotel.name;
        const name = hotelNames?.[currentLang] || hotelNames?.en || hotelNames?.defaultName || 'Unknown Hotel';
        const starCount = apiHotel.hotelStar?.star || 0;
        const starLabel = apiHotel.hotelStar?.names?.[currentLang] || apiHotel.hotelStar?.names?.en || '';
        let locationString = apiHotel.locationPathNames?.replace(/,/g, ', ');
        if (!locationString && Array.isArray(apiHotel.locationBreadcrumbs)) {
            const crumbs = apiHotel.locationBreadcrumbs
                .filter(crumb => crumb.locationType !== 'COUNTRY')
                .map(crumb => {
                    const n = crumb.name;
                    return n?.translations?.[currentLang] || n?.translations?.en || n?.defaultName;
                }).filter(Boolean);
            if (crumbs.length > 0) locationString = crumbs.join(', ');
        }
        const rating = apiHotel.score ? (apiHotel.score / 10000).toFixed(1) : '0';
        let ratingLabel = 'Good';
        const ratingVal = parseFloat(rating);
        if (ratingVal >= 9) ratingLabel = 'Superb';
        else if (ratingVal >= 8) ratingLabel = 'Excellent';
        else if (ratingVal >= 7) ratingLabel = 'Very Good';

        let amenities = [];
        const rawFacs = apiHotel.hotelFacilityIds || apiHotel.facilities || apiHotel.facilityIds || apiHotel.hotelFacilities;
        if (rawFacs && Array.isArray(rawFacs)) {
            const iconGroups = {};
            rawFacs.forEach(f => {
                const id = typeof f === 'object' ? (f.facilityId || f.id || f.value) : f;
                const match = FACILITY_ICON_MAP[Number(id)];
                if (match) {
                    const localizedLabel = typeof f === 'object' && f.names
                        ? (f.names[currentLang] || f.names.en || match.label) : match.label;
                    if (!iconGroups[match.icon]) {
                        iconGroups[match.icon] = { ...match, labels: [localizedLabel] };
                    } else if (!iconGroups[match.icon].labels.includes(localizedLabel)) {
                        iconGroups[match.icon].labels.push(localizedLabel);
                    }
                }
            });
            amenities = Object.values(iconGroups).map(g => ({ icon: g.icon, label: g.labels })).slice(0, 20);
        }
        if (amenities.length === 0) amenities = [{ icon: 'info', label: ['Details'] }];

        let imagesToMap = [];
        const seen = new Set();

        const addImage = (url) => {
            if (!url || typeof url !== 'string') return;
            const norm = url.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
            if (!seen.has(norm)) {
                seen.add(norm);
                imagesToMap.push(url);
            }
        };

        if (apiHotel.images && apiHotel.images.length > 0) {
            apiHotel.images.forEach(img => {
                const u = typeof img === 'object' ? (img.url || img.originalUrl) : img;
                addImage(u);
            });
        }

        if (apiHotel.rooms && apiHotel.rooms.length > 0) {
            apiHotel.rooms.forEach(r => {
                if (r.images && Array.isArray(r.images)) {
                    r.images.forEach(img => {
                        const u = typeof img === 'object' ? (img.url || img.originalUrl) : img;
                        addImage(u);
                    });
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

        return {
            id: apiHotel.id, hotelId: apiHotel.hotelId, name, type: starLabel || 'Hotel',
            stars: starCount, location: locationString || 'Unknown Location',
            image: imagesToMap[0], images: imagesToMap, rating, ratingLabel,
            ratingColor: 'bg-primary/10 text-primary', price: priceValue, currency: currencyCode,
            lat: apiHotel.coordinates?.lat, lng: apiHotel.coordinates?.lon,
            amenities, transportations: apiHotel.transportations || [],
            badges: [], roomName: selectedRoom?.name || selectedRoom?.roomName,
            boardName, isNonRefundable, hasFreeCancellation,
            strikethroughPrice: strikethroughPrice > priceValue ? strikethroughPrice : null,
            availableRoomsCount: apiHotel.rooms?.length || 0,
            isRecommended: apiHotel.isRecommended === true || apiHotel.preferred === true,
            locationBreadcrumbs: apiHotel.locationBreadcrumbs,
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

    // Load hotels from API (optionally using geo bounds for map-area search)
    const loadMoreHotels = React.useCallback(async (isReset = false, geoBounds = null) => {
        // If this is a reset search without explicit geoBounds, it's a new location/filter search.
        if (isReset && !geoBounds) {
            mapBoundsRef.current = null;
            setMapMoved(false);
            setShouldRefitMap(true);
        }

        const activeGeoBounds = geoBounds || (isReset ? null : mapBoundsRef.current);
        if (activeGeoBounds) {
            setShouldRefitMap(false);
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
            setHotels([]);
            setTotalProperties(0);
            pageRef.current = 0;
            hasMoreRef.current = true;
            setPage(0);
            setHasMore(true);
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const filters = getSearchParams();
            const currentPage = isReset ? 0 : pageRef.current;
            const baseRequest = {
                // Use geo bounds if provided (map area search), otherwise use locationId
                locationId: activeGeoBounds ? null : locationId,
                geo: activeGeoBounds?.bounds || null,
                zoom: activeGeoBounds?.zoom || null,
                size: 100,
                filters: {
                    locationIds: activeGeoBounds
                        ? [] // when searching by map bounds, don't restrict by locationId
                        : (filters.locations?.length > 0 ? filters.locations : (locationId ? [parseInt(locationId)] : null)),
                    stars: filters.stars,
                    hasFreeCancellation: filters.freeCancellation,
                    hasPrePayment: filters.prePayment,
                    roomTwin: filters.roomTwin,
                    roomMaxAdult: filters.roomMaxAdult,
                    roomMaxChildren: filters.roomMaxChildren,
                    roomMaxExtraBed: filters.roomMaxExtraBed,
                    facilities: filters.facilities
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
            const req1 = hotelService.searchHotels({ ...baseRequest, page: currentPage });
            const req2 = hotelService.searchHotels({ ...baseRequest, page: currentPage + 1 });
            const results = await Promise.allSettled([req1, req2]);
            const res1 = results[0]?.status === 'fulfilled' ? results[0].value : null;
            const res2 = results[1]?.status === 'fulfilled' ? results[1].value : null;
            if (res1 && res1.data) {
                const pageData1 = res1.data;
                const pageData2 = (res2 && res2.data) ? res2.data : null;
                const filtersData = res1.filters || res1.data.filters;
                const content1 = pageData1.content || [];
                const content2 = pageData2?.content || [];
                const combinedContent = [...content1, ...content2];
                const mappedHotels = combinedContent.map(h => mapApiHotelToModel(h));
                setHotels(prev => {
                    if (currentPage === 0) return mappedHotels;
                    const existingIds = new Set(prev.map(h => h.id));
                    return [...prev, ...mappedHotels.filter(h => !existingIds.has(h.id))];
                });
                setTotalProperties(pageData1.totalElements || 0);
                if (currentPage === 0 && filtersData) setDynamicFilters(filtersData);
                const noMore = (pageData1.last || pageData2?.last || combinedContent.length === 0);
                const nextHasMore = !noMore;
                setHasMore(nextHasMore);
                hasMoreRef.current = nextHasMore;
                const nextPage = currentPage + 2;
                setPage(nextPage);
                pageRef.current = nextPage;
                const newLocationNames = {};
                combinedContent.forEach(hotel => {
                    if (hotel.locationBreadcrumbs) {
                        hotel.locationBreadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) {
                                newLocationNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                            }
                        });
                    }
                });
                if (Object.keys(newLocationNames).length > 0) setLocationNames(prev => ({ ...prev, ...newLocationNames }));
                if (currentPage === 0 && nextHasMore) {
                    isFetchingRef.current = false;
                    setTimeout(() => { loadMoreHotels(false, activeGeoBounds); }, 50);
                    return;
                }
            } else {
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search request cancelled');
            } else {
                console.error('Error fetching hotels:', error);
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
                isFetchingRef.current = false;
            }
        }
    }, [locationId, mapApiHotelToModel, roomState, searchParams, sortConfig]);

    const handleMapBoundsChange = React.useCallback((boundsData) => {
        mapBoundsRef.current = boundsData;
        setMapMoved(false);
        loadMoreHotels(true, boundsData);
    }, [loadMoreHotels]);

    const handleMapMoved = React.useCallback((boundsData) => {
        mapBoundsRef.current = boundsData;
        setMapMoved(true);
    }, []);

    // Sync autocomplete (q + locationId) with map center after a geo-bounds search
    // Same logic as MapView.jsx syncBreadcrumbWithCenter
    React.useEffect(() => {
        if (!mapInstance || hotels.length === 0 || !mapBoundsRef.current) return;

        const syncAutocompleteWithCenter = () => {
            try {
                const center = mapInstance.getCenter();
                let closestHotel = null;
                let minDistance = Infinity;

                hotels.forEach(hotel => {
                    if (hotel.lat && hotel.lng) {
                        const dist = mapInstance.distance(center, [hotel.lat, hotel.lng]);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestHotel = hotel;
                        }
                    }
                });

                let crumb = null;
                let locName = '';

                if (closestHotel?.locationBreadcrumbs?.length > 0) {
                    const breadcrumbs = closestHotel.locationBreadcrumbs;
                    // Pick the most specific non-country crumb
                    crumb = [...breadcrumbs]
                        .reverse()
                        .find(c => c.locationType !== 'COUNTRY') || breadcrumbs[breadcrumbs.length - 1];

                    if (crumb) {
                        locName = typeof crumb.name === 'string'
                            ? crumb.name
                            : (crumb.name?.translations?.[currentLang] ||
                               crumb.name?.translations?.en ||
                               crumb.name?.translations?.tr ||
                               crumb.name?.defaultName || '');
                    }
                }

                // Fallback: If closestHotel has no locationBreadcrumbs, find from any hotel in results
                if (!locName) {
                    for (const h of hotels) {
                        if (h.locationBreadcrumbs?.length > 0) {
                            const b = [...h.locationBreadcrumbs].reverse().find(c => c.locationType !== 'COUNTRY') || h.locationBreadcrumbs[h.locationBreadcrumbs.length - 1];
                            if (b) {
                                crumb = b;
                                locName = typeof b.name === 'string'
                                    ? b.name
                                    : (b.name?.translations?.[currentLang] || b.name?.translations?.en || b.name?.translations?.tr || b.name?.defaultName || '');
                                if (locName) break;
                            }
                        }
                    }
                }

                // Fallback 2: closestHotel.location
                if (!locName && closestHotel?.location && closestHotel.location !== 'Unknown Location') {
                    locName = closestHotel.location.split(',')[0].trim();
                }

                if (locName) {
                    localStorage.setItem('dashboard_last_search', locName);
                    const targetLocId = crumb?.locationId ? String(crumb.locationId) : null;
                    if (targetLocId) {
                        localStorage.setItem('dashboard_last_locationId', targetLocId);
                    }
                }
            } catch (err) {
                console.warn('Autocomplete sync failed:', err);
            }
        };

        const timer = setTimeout(syncAutocompleteWithCenter, 400);
        return () => clearTimeout(timer);
    // Only re-run when hotels list changes after a geo search (mapBoundsRef tracks this)
    }, [hotels, mapInstance, currentLang, setSearchParams]);

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
                    const data = await locationService.fetchBreadcrumb(id);
                    if (data && data.data && Array.isArray(data.data)) {
                        data.data.forEach(crumb => {
                            if (crumb.locationId && crumb.name) newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                        });
                    } else if (data && data.breadcrumbs) {
                        data.breadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
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
        if (isSyncingQRef.current) {
            isSyncingQRef.current = false;
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
        return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
    }, [
        slug, locationId, sortConfig,
        searchParams.get('q'),
        location.state?.searchTimestamp,
        searchParams.get('checkin'), searchParams.get('checkout'),
        searchParams.get('guests'), searchParams.get('nationality'),
        searchParams.get('stars'), searchParams.get('freeCancellation'), searchParams.get('prePayment'),
        searchParams.get('locations'), searchParams.get('roomTwin'), searchParams.get('roomMaxAdult'),
        searchParams.get('roomMaxChildren'), searchParams.get('roomMaxExtraBed'), searchParams.get('facilities')
    ]);

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
    const handleFreeCancelChip = () => {
        const current = searchParams.get('freeCancellation');
        const newParams = new URLSearchParams(searchParams);
        if (current === 'true') newParams.delete('freeCancellation');
        else newParams.set('freeCancellation', 'true');
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
        return `${urlStars.slice().sort((a,b) => a-b).join(', ')} ${tListing('starPlural', currentLang)}`;
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
            <div className={`${isMapExpanded ? "w-[44%] min-w-[500px]" : "w-[62%]"} flex-shrink-0 flex flex-col relative z-[2000] border-r border-[#e8eaed] dark:border-slate-700 bg-white dark:bg-[#303134] shadow-[1px_0_4px_rgba(0,0,0,0.35)] dark:shadow-[1px_0_4px_rgba(0,0,0,0.7)] transition-[width] duration-300 ease-in-out`}>

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
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${
                                isPriceActive
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
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${
                                searchParams.get('recommended') === 'true'
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${searchParams.get('recommended') === 'true' ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                thumb_up
                            </span>
                            <span>{tListing('recommended', currentLang)}</span>
                        </button>

                        {/* 4. Offers / Deals (Teklifler) */}
                        <button
                            type="button"
                            onClick={handleFreeCancelChip}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${
                                searchParams.get('freeCancellation') === 'true'
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${searchParams.get('freeCancellation') === 'true' ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                sell
                            </span>
                            <span>{tListing('deals', currentLang)}</span>
                            <span className={`material-symbols-outlined text-[18px] ${searchParams.get('freeCancellation') === 'true' ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
                                arrow_drop_down
                            </span>
                        </button>

                        {/* 4. Hotel Star Rating Quick Filter Chip */}
                        <button
                            ref={starBtnRef}
                            type="button"
                            onClick={handleToggleStar}
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${
                                urlStars.length > 0
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
                            className={`flex items-center gap-1.5 border rounded-lg px-3 h-8 text-[13px] whitespace-nowrap shrink-0 transition-colors select-none font-roboto ${
                                selectedAmenities.length > 0
                                    ? 'bg-[#e8f0fe] dark:bg-blue-900/30 border-[#1a73e8]/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                    : isAmenitiesOpen
                                    ? 'border-[#dadce0] dark:border-slate-600 bg-white dark:bg-[#303134] text-[#202124] dark:text-white font-medium'
                                    : 'border-[#dadce0] dark:border-slate-600 text-[#3c4043] dark:text-slate-200 font-medium hover:bg-[#f8f9fa] dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${selectedAmenities.length > 0 ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'}`}>
                                room_service
                            </span>
                            <span>{tListing('amenities', currentLang)}</span>
                            {selectedAmenities.length > 0 && (
                                <span className="bg-[#1a73e8] text-white text-[10px] font-bold rounded-lg min-w-[16px] h-4 flex items-center justify-center px-1">
                                    {selectedAmenities.length}
                                </span>
                            )}
                            <span className={`material-symbols-outlined text-[18px] ${selectedAmenities.length > 0 ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'}`}>
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
                                        className={`text-[13px] font-medium font-roboto transition-colors select-none ${
                                            urlStars.length > 0
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
                                        className={`text-[13px] font-medium font-roboto transition-colors select-none ${
                                            isPriceActive
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

                                {/* 2-Column Grid */}
                                <div className="px-5 py-2 max-h-[420px] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 border border-[#dadce0] dark:border-slate-700 rounded-lg overflow-hidden">
                                        {QUICK_AMENITIES.map((amenity, index) => {
                                            const isSelected = selectedAmenities.includes(amenity.id);
                                            const label = getAmenityText(amenity.id, currentLang) || amenity.labelEn || amenity.labelTr;
                                            const isLeftCol = index % 2 === 0;
                                            const totalRows = Math.ceil(QUICK_AMENITIES.length / 2);
                                            const currentRow = Math.floor(index / 2);
                                            const isLastRow = currentRow === totalRows - 1;

                                            return (
                                                <button
                                                    key={amenity.id}
                                                    type="button"
                                                    onClick={() => handleToggleAmenity(amenity.id)}
                                                    className={`flex flex-col items-center justify-center py-3 px-2 text-center cursor-pointer transition-colors select-none ${
                                                        isLeftCol ? 'border-r border-[#dadce0] dark:border-slate-700' : ''
                                                    } ${
                                                        !isLastRow ? 'border-b border-[#dadce0] dark:border-slate-700' : ''
                                                    } ${
                                                        isSelected
                                                            ? 'bg-[#e8f0fe] dark:bg-blue-900/40 text-[#1a73e8] dark:text-blue-300 font-medium'
                                                            : 'bg-white dark:bg-[#303134] text-[#3c4043] dark:text-slate-200 hover:bg-[#f8f9fa] dark:hover:bg-slate-700/60'
                                                    }`}
                                                >
                                                    <span
                                                        className={`material-symbols-outlined text-[22px] mb-1 transition-colors ${
                                                            isSelected ? 'text-[#1a73e8] dark:text-blue-300' : 'text-[#3c4043] dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {amenity.icon}
                                                    </span>
                                                    <span className="text-[12.5px] leading-tight font-roboto">
                                                        {label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        {QUICK_AMENITIES.length % 2 !== 0 && (
                                            <div className="bg-white dark:bg-[#303134]" />
                                        )}
                                    </div>
                                </div>

                                {/* Footer with Temizle */}
                                <div className="px-5 pb-3 pt-0 flex justify-end items-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClearAmenities}
                                        disabled={selectedAmenities.length === 0}
                                        className={`text-[13px] font-medium font-roboto transition-colors select-none ${
                                            selectedAmenities.length > 0
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
                            isSelected={selectedHotel?.id === hotel.id}
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
                    {isLoading && hotels.length > 0 && (
                        <>{[...Array(3)].map((_, i) => <GoogleCardSkeleton key={`more-${i}`} />)}</>
                    )}

                    {/* Sentinel + end state */}
                    <div ref={loaderRef} className="py-4 flex items-center justify-center">
                        {!hasMore && hotels.length > 0 && (
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
                            zoomSnap={0.5}
                            zoomDelta={0.5}
                            wheelDebounceTime={40}
                            wheelPxPerZoomLevel={160}
                        >
                            <OpenFreeMapLayer style={mapLayer} />
                            {/* Capture map instance */}
                            <MapInstanceCapture setMap={setMapInstance} setIsMapReady={setIsMapReady} />

                            {/* Single unified map center & bounds controller */}
                            <MapLocationWatcher
                                slug={slug}
                                q={searchParams.get('q')}
                                searchParams={searchParams}
                                hotels={displayedHotels}
                                shouldRefit={shouldRefitMap}
                                onRefitDone={React.useCallback(() => setShouldRefitMap(false), [])}
                                isProgrammaticMoveRef={isProgrammaticMoveRef}
                            />

                            {/* Points of interest for selected categories */}
                            {activePois.map(poi => (
                                <PoiMarker key={poi.id} poi={poi} currentLang={currentLang} />
                            ))}

                            {/* Price markers for hotels with coordinates */}
                            {displayedHotels
                                .filter(h => h.lat && h.lng && !isNaN(parseFloat(h.lat)) && !isNaN(parseFloat(h.lng)))
                                .map(hotel => (
                                    <PriceMarker
                                        key={hotel.id}
                                        hotel={hotel}
                                        isSelected={selectedHotel?.id === hotel.id}
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
                            className="w-10 h-10 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 text-[#3c4043] dark:text-slate-200 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] flex items-center justify-center transition-all cursor-pointer group"
                            title={isMapExpanded ? tListing('collapseMap', currentLang) : tListing('expandMap', currentLang)}
                        >
                            <span className="material-symbols-outlined text-[20px] text-[#5f6368] dark:text-slate-300 group-hover:text-[#1a73e8] transition-colors">
                                {isMapExpanded ? 'fullscreen_exit' : 'fullscreen'}
                            </span>
                        </button>

                        {/* 4 Category Icons: Transit, Restaurants, Attractions, Shopping */}
                        <div className="bg-white dark:bg-[#303134] rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] flex flex-col items-center py-2 px-1 gap-1">
                            {/* 1. Public Transport */}
                            <button
                                type="button"
                                onClick={() => togglePoiCategory('transit')}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    activePoiCategories.transit
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    activePoiCategories.restaurants
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    activePoiCategories.tourist
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    activePoiCategories.shopping
                                        ? 'bg-[#fce4ec] dark:bg-pink-900/40 text-[#e91e63] dark:text-pink-300 ring-2 ring-[#e91e63]/30 shadow-xs'
                                        : 'text-[#5f6368] dark:text-slate-300 hover:bg-[#f1f3f4] dark:hover:bg-slate-700'
                                }`}
                                title={tListing('shoppingAreas', currentLang)}
                            >
                                <span className="material-symbols-outlined text-[19px]">shopping_bag</span>
                            </button>
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

                    {/* Top center: Search-on-move toggle OR "Listeyi güncelle" button */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1005] pointer-events-auto">
                    {/* Always show the toggle */}
                    {!mapMoved && (
                        <div className="flex items-center gap-2 bg-white dark:bg-[#303134] rounded-full px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                            <button
                                onClick={() => setSearchOnMapMove(v => !v)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                                    searchOnMapMove
                                        ? 'bg-[#1a73e8] border-[#1a73e8]'
                                        : 'bg-white dark:bg-[#303134] border-[#80868b] dark:border-slate-500'
                                }`}
                            >
                                {searchOnMapMove && (
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>check</span>
                                )}
                            </button>
                            <span
                                onClick={() => setSearchOnMapMove(v => !v)}
                                className="text-[13px] font-medium text-[#3c4043] dark:text-slate-200 cursor-pointer select-none whitespace-nowrap"
                            >
                                {tListing('searchMapMoves', currentLang)}
                            </span>
                        </div>
                    )}

                    {/* Show manual update button when map moved but searchOnMove is off */}
                    {mapMoved && !searchOnMapMove && (
                        <button
                            onClick={() => {
                                isUserPanRef.current = false;
                                setShouldRefitMap(false);
                                setMapMoved(false);
                                loadMoreHotels(true, mapBoundsRef.current);
                            }}
                            className="flex items-center gap-2 bg-white dark:bg-[#303134] hover:bg-[#f8f9fa] dark:hover:bg-slate-700 rounded-full px-4 py-2 text-[13px] font-medium text-[#3c4043] dark:text-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.35)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-colors cursor-pointer"
                        >
                            <span className={`material-symbols-outlined text-[#1a73e8] ${isLoading ? 'animate-spin' : ''}`} style={{ fontSize: '18px' }}>refresh</span>
                            {tListing('searchThisArea', currentLang)}
                        </button>
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
                                            className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                                                isSelected 
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
                className={`absolute top-0 right-0 h-full w-[380px] bg-white dark:bg-[#202124] border-l border-[#dadce0] dark:border-slate-700 shadow-[-8px_0_24px_rgba(0,0,0,0.16),-2px_0_6px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.6)] flex flex-col z-[2010] transform transition-transform duration-300 ease-in-out ${
                    isFavOpen 
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
                                            <span className="material-symbols-outlined text-[#1a73e8] dark:text-[#8ab4f8] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
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
