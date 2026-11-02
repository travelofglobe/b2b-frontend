import React, { useMemo, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * Global CSS styles for POI markers and Leaflet popups.
 * Injected once into document.head to ensure vector-crisp rendering,
 * smooth hover transitions, and seamless dark mode support.
 */
const POI_GLOBAL_STYLES = `
/* Custom Leaflet POI Marker container */
.poi-custom-marker {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
}

/* Master wrapper: pointer events are disabled on container, enabled on children */
.poi-marker-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    cursor: pointer;
    user-select: none;
    pointer-events: none;
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), z-index 0.1s ease;
}

.poi-custom-marker:hover {
    z-index: 9999 !important;
}

/* Pin head & SVG teardrop */
.poi-pin-head {
    position: relative;
    width: 32px;
    height: 38px;
    pointer-events: auto;
    transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: 16px 37px;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.22));
}

.poi-marker-wrapper:hover .poi-pin-head {
    transform: translateY(-4px) scale(1.14);
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.32));
}

.poi-pin-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
}

/* Centered Material Symbol Icon inside Pin head */
.poi-pin-glyph {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff !important;
    font-size: 15px !important;
    line-height: 1 !important;
    font-variation-settings: 'FILL' 1, 'wght' 500;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

/* Sleek Floating Name Tag below Pin needle */
.poi-pin-label {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 3px;
    padding: 2px 8.5px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(15, 23, 42, 0.09);
    border-radius: 9999px;
    box-shadow: 0 2px 6px -1px rgba(15, 23, 42, 0.16), 0 1px 2px rgba(15, 23, 42, 0.08);
    transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    max-width: 125px;
}

.dark .poi-pin-label {
    background: rgba(24, 27, 36, 0.95);
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
}

.poi-pin-label-text {
    font-family: 'Plus Jakarta Sans', 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.25;
    color: #0f172a;
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dark .poi-pin-label-text {
    color: #f1f5f9;
}

/* Label hover expansion */
.poi-marker-wrapper:hover .poi-pin-label {
    max-width: 250px;
    background: #ffffff;
    box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.22);
    border-color: rgba(15, 23, 42, 0.18);
}

.dark .poi-marker-wrapper:hover .poi-pin-label {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.22);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.7);
}

/* Luxury Leaflet POI Popup */
.leaflet-popup.google-poi-popup {
    margin-bottom: 8px !important;
}

.google-poi-popup .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 20px !important;
    overflow: hidden !important;
    background: #ffffff !important;
    box-shadow: 0 20px 45px -8px rgba(15, 23, 42, 0.24), 0 8px 18px -4px rgba(15, 23, 42, 0.1) !important;
    border: 1px solid rgba(15, 23, 42, 0.08) !important;
}

.dark .google-poi-popup .leaflet-popup-content-wrapper {
    background: #1e293b !important;
    border-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 22px 50px -6px rgba(0, 0, 0, 0.75) !important;
}

.google-poi-popup .leaflet-popup-content {
    margin: 0 !important;
    width: 270px !important;
    line-height: normal !important;
}

.google-poi-popup .leaflet-popup-tip-container {
    display: none !important;
}

.google-poi-popup a.leaflet-popup-close-button {
    display: none !important;
}

.google-poi-popup-card {
    padding: 16px;
    font-family: 'Plus Jakarta Sans', 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('poi-marker-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'poi-marker-styles';
    styleEl.textContent = POI_GLOBAL_STYLES;
    document.head.appendChild(styleEl);
}

/**
 * Safely escapes HTML special characters to prevent injection.
 */
const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/**
 * Intelligent POI categorization with Apple Maps & Google Maps-inspired
 * rich color gradients and high-fidelity semantic icons.
 */
const getCategoryMeta = (poi = {}) => {
    const rawCategories = Array.isArray(poi?.categories) ? poi.categories.join(' ').toLowerCase() : '';
    const rawTags = Array.isArray(poi?.tags) ? poi.tags.join(' ').toLowerCase() : '';
    const category = (poi?.category || '').toLowerCase();
    const icon = (poi?.icon || '').toLowerCase();
    const name = (poi?.name || '').toLowerCase();
    const allText = `${rawCategories} ${rawTags} ${category} ${icon} ${name}`;

    // 1. Mosque / Church / Synagogue / Place of Worship
    if (allText.includes('mosque') || allText.includes('cami') || allText.includes('placeofworship') || allText.includes('church') || allText.includes('kilise') || allText.includes('synagogue') || allText.includes('havra') || allText.includes('temple')) {
        let subIcon = 'account_balance';
        if (allText.includes('mosque') || allText.includes('cami')) subIcon = 'account_balance';
        else if (allText.includes('church') || allText.includes('kilise')) subIcon = 'church';

        return {
            colorTop: '#f59e0b',
            colorBottom: '#d97706',
            color: '#d97706',
            shadowColor: '#d97706',
            icon: subIcon,
            labelTr: 'Tarihi / Dini Yapı',
            labelEn: 'Historic Place of Worship'
        };
    }

    // 2. Palace / Castle / Fortress / Historical Monument
    if (allText.includes('saray') || allText.includes('palace') || allText.includes('castle') || allText.includes('kale') || allText.includes('hisar') || allText.includes('fort') || allText.includes('monument') || allText.includes('anıt') || allText.includes('historic')) {
        let subIcon = 'castle';
        if (allText.includes('kale') || allText.includes('hisar') || allText.includes('fort')) subIcon = 'fort';

        return {
            colorTop: '#ea580c',
            colorBottom: '#9a3412',
            color: '#ea580c',
            shadowColor: '#ea580c',
            icon: subIcon,
            labelTr: 'Saray & Tarihi Anıt',
            labelEn: 'Palace & Castle'
        };
    }

    // 3. Museum / Art Gallery / Cultural Center
    if (allText.includes('museum') || allText.includes('müze') || allText.includes('gallery') || allText.includes('galeri') || allText.includes('art') || allText.includes('sanat') || allText.includes('cultural')) {
        return {
            colorTop: '#a855f7',
            colorBottom: '#6b21a8',
            color: '#8b5cf6',
            shadowColor: '#8b5cf6',
            icon: 'museum',
            labelTr: 'Müze & Sanat',
            labelEn: 'Museum & Art'
        };
    }

    // 4. Airport / Metro / Train / Ferry / Transit
    if (allText.includes('airport') || allText.includes('havalimanı') || allText.includes('flight') || allText.includes('metro') || allText.includes('subway') || allText.includes('train') || allText.includes('transit') || allText.includes('station') || allText.includes('istasyon') || allText.includes('ferry') || allText.includes('otogar') || allText.includes('bus') || allText.includes('iskele')) {
        let subIcon = 'directions_transit';
        if (allText.includes('airport') || allText.includes('havalimanı') || allText.includes('flight')) subIcon = 'flight';
        else if (allText.includes('metro') || allText.includes('subway')) subIcon = 'subway';
        else if (allText.includes('train') || allText.includes('tren') || allText.includes('rail')) subIcon = 'train';
        else if (allText.includes('ferry') || allText.includes('iskele') || allText.includes('vapur')) subIcon = 'directions_boat';
        else if (allText.includes('bus') || allText.includes('otogar') || allText.includes('otobüs')) subIcon = 'directions_bus';

        return {
            colorTop: '#38bdf8',
            colorBottom: '#0284c7',
            color: '#0284c7',
            shadowColor: '#0284c7',
            icon: subIcon,
            labelTr: 'Ulaşım & Taşıma',
            labelEn: 'Transit & Transport'
        };
    }

    // 5. Restaurant / Dining / Cafe / Food
    if (allText.includes('restaurant') || allText.includes('dining') || allText.includes('cafe') || allText.includes('kafe') || allText.includes('coffee') || allText.includes('kahve') || allText.includes('food') || allText.includes('lokanta') || allText.includes('mutfak') || allText.includes('bakery') || allText.includes('fırın') || allText.includes('bar') || allText.includes('pub')) {
        let subIcon = 'restaurant';
        if (allText.includes('cafe') || allText.includes('kafe') || allText.includes('coffee') || allText.includes('kahve')) subIcon = 'local_cafe';
        else if (allText.includes('bakery') || allText.includes('fırın') || allText.includes('pastane')) subIcon = 'bakery_dining';
        else if (allText.includes('bar') || allText.includes('pub')) subIcon = 'local_bar';

        return {
            colorTop: '#fb923c',
            colorBottom: '#ea580c',
            color: '#ea580c',
            shadowColor: '#ea580c',
            icon: subIcon,
            labelTr: 'Restoran & Yeme-İçme',
            labelEn: 'Restaurant & Dining'
        };
    }

    // 6. Shopping Mall / Bazaar / Market
    if (allText.includes('shopping') || allText.includes('mall') || allText.includes('avm') || allText.includes('bazaar') || allText.includes('çarşı') || allText.includes('market') || allText.includes('outlet')) {
        let subIcon = 'shopping_bag';
        if (allText.includes('bazaar') || allText.includes('çarşı') || allText.includes('market')) subIcon = 'storefront';

        return {
            colorTop: '#fb7185',
            colorBottom: '#e11d48',
            color: '#e11d48',
            shadowColor: '#e11d48',
            icon: subIcon,
            labelTr: 'Alışveriş & Çarşı',
            labelEn: 'Shopping & Malls'
        };
    }

    // 7. Park / Nature / Forest / Garden
    if (allText.includes('park') || allText.includes('garden') || allText.includes('bahçe') || allText.includes('arboretum') || allText.includes('nature') || allText.includes('doğa') || allText.includes('forest') || allText.includes('orman')) {
        let subIcon = 'park';
        if (allText.includes('forest') || allText.includes('orman')) subIcon = 'forest';

        return {
            colorTop: '#34d399',
            colorBottom: '#059669',
            color: '#059669',
            shadowColor: '#059669',
            icon: subIcon,
            labelTr: 'Park & Doğa',
            labelEn: 'Park & Nature'
        };
    }

    // 8. Beach / Coast / Marina / Sea
    if (allText.includes('beach') || allText.includes('sahil') || allText.includes('plaj') || allText.includes('coast') || allText.includes('lake') || allText.includes('göl') || allText.includes('water') || allText.includes('waterfall') || allText.includes('marina')) {
        let subIcon = 'beach_access';
        if (allText.includes('marina') || allText.includes('yat')) subIcon = 'sailing';
        else if (allText.includes('lake') || allText.includes('göl')) subIcon = 'water';

        return {
            colorTop: '#2dd4bf',
            colorBottom: '#0f766e',
            color: '#0f766e',
            shadowColor: '#0f766e',
            icon: subIcon,
            labelTr: 'Plaj & Sahil',
            labelEn: 'Beach & Coast'
        };
    }

    // 9. Tourist Attraction / Lookout / Tower
    if (allText.includes('tourist') || allText.includes('attraction') || allText.includes('sight') || allText.includes('lookout') || allText.includes('tower') || allText.includes('kule') || allText.includes('seyir')) {
        return {
            colorTop: '#c084fc',
            colorBottom: '#7e22ce',
            color: '#9333ea',
            shadowColor: '#9333ea',
            icon: 'photo_camera',
            labelTr: 'Turistik Yer & Gezi',
            labelEn: 'Attraction & Sight'
        };
    }

    // 10. Stadium / Sports
    if (allText.includes('stadium') || allText.includes('stad') || allText.includes('sports') || allText.includes('arena') || allText.includes('spor') || allText.includes('karting') || allText.includes('bowling')) {
        return {
            colorTop: '#f87171',
            colorBottom: '#dc2626',
            color: '#dc2626',
            shadowColor: '#dc2626',
            icon: 'sports_soccer',
            labelTr: 'Spor & Aktivite',
            labelEn: 'Sports & Stadium'
        };
    }

    // 11. Hospital / Clinic / Medical
    if (allText.includes('hospital') || allText.includes('hastane') || allText.includes('medical') || allText.includes('klinik') || allText.includes('saglik') || allText.includes('sağlık')) {
        return {
            colorTop: '#38bdf8',
            colorBottom: '#0369a1',
            color: '#0284c7',
            shadowColor: '#0284c7',
            icon: 'local_hospital',
            labelTr: 'Sağlık / Hastane',
            labelEn: 'Hospital / Medical'
        };
    }

    // 12. University / College / Education
    if (allText.includes('university') || allText.includes('üniversite') || allText.includes('college') || allText.includes('education') || allText.includes('okul') || allText.includes('kolej') || allText.includes('campus')) {
        return {
            colorTop: '#818cf8',
            colorBottom: '#4338ca',
            color: '#4f46e5',
            shadowColor: '#4f46e5',
            icon: 'school',
            labelTr: 'Üniversite & Eğitim',
            labelEn: 'University & Campus'
        };
    }

    // 13. Theater / Cinema / Show / Entertainment
    if (allText.includes('theater') || allText.includes('theatre') || allText.includes('cinema') || allText.includes('entertainment') || allText.includes('opera') || allText.includes('tiyatro') || allText.includes('sahne')) {
        return {
            colorTop: '#e879f9',
            colorBottom: '#a21caf',
            color: '#c026d3',
            shadowColor: '#c026d3',
            icon: 'theater_comedy',
            labelTr: 'Tiyatro & Sahne',
            labelEn: 'Theater & Shows'
        };
    }

    // Refined Slate default
    return {
        colorTop: '#94a3b8',
        colorBottom: '#475569',
        color: '#64748b',
        shadowColor: '#64748b',
        icon: 'place',
        labelTr: 'Önemli Nokta',
        labelEn: 'Point of Interest'
    };
};

/**
 * Modern Apple Maps & Google Maps-styled POI Marker.
 * Features an iconic teardrop pin with vector-sharp gradients, crisp white glyph,
 * and a floating typography chip centered below the anchor needle.
 */
const PoiMarker = React.memo(({ poi, currentLang = 'tr', onSelectPoi }) => {
    const markerRef = useRef(null);
    const lat = parseFloat(poi.lat || poi.latitude);
    const lng = parseFloat(poi.lng || poi.lon || poi.longitude);

    const meta = useMemo(() => {
        return getCategoryMeta(poi);
    }, [poi]);

    const colorTop = poi.colorTop || meta.colorTop;
    const colorBottom = poi.colorBottom || meta.colorBottom;
    const badgeColor = poi.color || meta.color;
    const iconName = poi.icon || poi.iconName || meta.icon;
    const displayName = poi.name || '';
    const escapedName = escapeHtml(displayName);
    const uniqueGradId = useMemo(() => `poi-grad-${Math.random().toString(36).substring(2, 9)}`, []);

    const icon = useMemo(() => {
        const html = `
            <div class="poi-marker-wrapper" title="${escapedName}">
                <!-- Teardrop Pin Body -->
                <div class="poi-pin-head">
                    <svg class="poi-pin-svg" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="${uniqueGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="${colorTop}" />
                                <stop offset="100%" stop-color="${colorBottom}" />
                            </linearGradient>
                        </defs>
                        <!-- Teardrop Pin Shape: exactly 32x38, tip at (16, 37) -->
                        <path d="M16 1.5 C7.716 1.5 1 8.216 1 16.5 C1 24.8 14.5 35.8 15.35 36.5 C15.75 36.85 16.25 36.85 16.65 36.5 C17.5 35.8 31 24.8 31 16.5 C31 8.216 24.284 1.5 16 1.5 Z"
                              fill="url(#${uniqueGradId})"
                              stroke="#ffffff"
                              stroke-width="2"
                              stroke-linejoin="round" />
                        <!-- Inner subtle translucent disc for icon depth -->
                        <circle cx="16" cy="16.5" r="10.5" fill="rgba(255, 255, 255, 0.2)" />
                    </svg>
                    <!-- White Centered Icon Glyph -->
                    <span class="material-symbols-outlined poi-pin-glyph">${iconName}</span>
                </div>

                <!-- Floating Label Tag Underneath -->
                <div class="poi-pin-label">
                    <span class="poi-pin-label-text">${escapedName}</span>
                </div>
            </div>
        `;

        return L.divIcon({
            html,
            className: 'poi-custom-marker',
            iconSize: [150, 64],
            iconAnchor: [75, 37],
            popupAnchor: [0, -40]
        });
    }, [colorTop, colorBottom, iconName, escapedName, uniqueGradId]);

    if (isNaN(lat) || isNaN(lng)) return null;

    const categoryLabel = currentLang === 'tr' ? meta.labelTr : meta.labelEn;

    return (
        // zIndexOffset={-500} ensures POI markers stay below hotel price pins (PriceMarker)
        <Marker
            ref={markerRef}
            position={[lat, lng]}
            icon={icon}
            zIndexOffset={-500}
        >
            <Popup
                className="google-poi-popup"
                autoPan={true}
                closeButton={false}
                offset={[0, -10]}
            >
                <div className="google-poi-popup-card">
                    {/* Header: Icon, Category Badge & Custom Close Button */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${colorTop} 0%, ${colorBottom} 100%)` }}
                            >
                                <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {iconName}
                                </span>
                            </div>
                            <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide uppercase truncate"
                                style={{ backgroundColor: `${badgeColor}18`, color: badgeColor }}
                            >
                                {categoryLabel}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => markerRef.current?.closePopup()}
                            className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                            title="Kapat"
                        >
                            <span className="material-symbols-outlined text-[17px]">close</span>
                        </button>
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-[14.5px] text-slate-900 dark:text-white leading-snug m-0">
                        {poi.name}
                    </h4>

                    {/* Localized Full Name */}
                    {poi.nameFull && poi.nameFull !== poi.name && (
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug mt-1 mb-0">
                            {poi.nameFull}
                        </p>
                    )}

                    {/* Description if present */}
                    {poi.description && (
                        <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5 mb-0 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                            {poi.description}
                        </p>
                    )}

                    {/* Search Nearby Action Button */}
                    {onSelectPoi && (
                        <button
                            type="button"
                            onClick={() => onSelectPoi(poi)}
                            className="w-full mt-3.5 py-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                            <span>{currentLang === 'tr' ? 'Bu Noktanın Çevresinde Otel Ara' : 'Search Hotels Near Here'}</span>
                        </button>
                    )}
                </div>
            </Popup>
        </Marker>
    );
});

export default PoiMarker;
