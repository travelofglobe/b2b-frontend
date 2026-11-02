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

/* Master inline container: Circular icon badge on the left + clean typography label on the right */
.poi-marker-container {
    display: inline-flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), z-index 0.1s ease;
    transform-origin: 11px 11px;
}

.poi-custom-marker:hover {
    z-index: 9999 !important;
}

/* Circular icon badge */
.poi-marker-badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #ffffff;
    border: 1.5px solid #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15);
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
}

.dark .poi-marker-badge {
    border-color: rgba(255, 255, 255, 0.85);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

.poi-marker-badge .material-symbols-outlined {
    font-size: 13.5px !important;
    line-height: 1 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    font-variation-settings: 'FILL' 1, 'wght' 500;
}

/* High-definition, clean map typography with sharp vector stroke */
.poi-marker-label {
    margin-left: 5px;
    font-family: 'Plus Jakarta Sans', 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.2;
    color: #0f172a;
    letter-spacing: -0.015em;
    max-width: 135px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    paint-order: stroke fill;
    -webkit-text-stroke: 3px #ffffff;
    text-stroke: 3px #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
    transition: max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease;
}

.dark .poi-marker-label {
    color: #f8fafc;
    -webkit-text-stroke: 3px #0f172a;
    text-stroke: 3px #0f172a;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

/* Hover effects */
.poi-marker-container:hover .poi-marker-badge {
    transform: scale(1.18);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.32), 0 1px 3px rgba(0, 0, 0, 0.2);
}

.poi-marker-container:hover .poi-marker-label {
    max-width: 260px;
    color: #0284c7;
}

.dark .poi-marker-container:hover .poi-marker-label {
    color: #38bdf8;
}

/* Luxury Leaflet POI Popup */
.leaflet-popup.google-poi-popup {
    margin-bottom: 8px !important;
}

.google-poi-popup .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 18px !important;
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
    width: 265px !important;
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
 * Intelligent POI categorization with rich, harmonious gradients
 * and high-fidelity semantic icons.
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
        if (allText.includes('church') || allText.includes('kilise')) subIcon = 'church';

        return {
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#d97706',
            icon: subIcon,
            labelTr: 'Tarihi / Dini Yapı',
            labelEn: 'Place of Worship'
        };
    }

    // 2. Palace / Castle / Fortress / Historical Monument
    if (allText.includes('saray') || allText.includes('palace') || allText.includes('castle') || allText.includes('kale') || allText.includes('hisar') || allText.includes('fort') || allText.includes('monument') || allText.includes('anıt') || allText.includes('historic')) {
        let subIcon = 'castle';
        if (allText.includes('kale') || allText.includes('hisar') || allText.includes('fort')) subIcon = 'fort';

        return {
            gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
            color: '#ea580c',
            icon: subIcon,
            labelTr: 'Saray & Tarihi Anıt',
            labelEn: 'Palace & Castle'
        };
    }

    // 3. Museum / Art Gallery / Cultural Center
    if (allText.includes('museum') || allText.includes('müze') || allText.includes('gallery') || allText.includes('galeri') || allText.includes('art') || allText.includes('sanat') || allText.includes('cultural')) {
        return {
            gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
            color: '#9333ea',
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
            gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            color: '#0284c7',
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
            gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
            color: '#ea580c',
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
            gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
            color: '#e11d48',
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
            gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
            color: '#059669',
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
            gradient: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)',
            color: '#0f766e',
            icon: subIcon,
            labelTr: 'Plaj & Sahil',
            labelEn: 'Beach & Coast'
        };
    }

    // 9. Tourist Attraction / Lookout / Tower
    if (allText.includes('tourist') || allText.includes('attraction') || allText.includes('sight') || allText.includes('lookout') || allText.includes('tower') || allText.includes('kule') || allText.includes('seyir')) {
        return {
            gradient: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
            color: '#9333ea',
            icon: 'photo_camera',
            labelTr: 'Turistik Yer & Gezi',
            labelEn: 'Attraction & Sight'
        };
    }

    // 10. Stadium / Sports
    if (allText.includes('stadium') || allText.includes('stad') || allText.includes('sports') || allText.includes('arena') || allText.includes('spor') || allText.includes('karting') || allText.includes('bowling')) {
        return {
            gradient: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
            color: '#dc2626',
            icon: 'sports_soccer',
            labelTr: 'Spor & Aktivite',
            labelEn: 'Sports & Stadium'
        };
    }

    // 11. Hospital / Clinic / Medical
    if (allText.includes('hospital') || allText.includes('hastane') || allText.includes('medical') || allText.includes('klinik') || allText.includes('saglik') || allText.includes('sağlık')) {
        return {
            gradient: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
            color: '#0284c7',
            icon: 'local_hospital',
            labelTr: 'Sağlık / Hastane',
            labelEn: 'Hospital / Medical'
        };
    }

    // 12. University / College / Education
    if (allText.includes('university') || allText.includes('üniversite') || allText.includes('college') || allText.includes('education') || allText.includes('okul') || allText.includes('kolej') || allText.includes('campus')) {
        return {
            gradient: 'linear-gradient(135deg, #818cf8 0%, #4338ca 100%)',
            color: '#4f46e5',
            icon: 'school',
            labelTr: 'Üniversite & Eğitim',
            labelEn: 'University & Campus'
        };
    }

    // 13. Theater / Cinema / Show / Entertainment
    if (allText.includes('theater') || allText.includes('theatre') || allText.includes('cinema') || allText.includes('entertainment') || allText.includes('opera') || allText.includes('tiyatro') || allText.includes('sahne')) {
        return {
            gradient: 'linear-gradient(135deg, #e879f9 0%, #a21caf 100%)',
            color: '#c026d3',
            icon: 'theater_comedy',
            labelTr: 'Tiyatro & Sahne',
            labelEn: 'Theater & Shows'
        };
    }

    // Refined Slate default
    return {
        gradient: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)',
        color: '#64748b',
        icon: 'place',
        labelTr: 'Önemli Nokta',
        labelEn: 'Point of Interest'
    };
};

/**
 * Modern Google Maps-styled POI Marker.
 * Compact, elegant, and non-intrusive inline layout:
 * [ (Circular Icon Badge)  Clean Typography Label ]
 */
const PoiMarker = React.memo(({ poi, currentLang = 'tr', onSelectPoi }) => {
    const markerRef = useRef(null);
    const lat = parseFloat(poi.lat || poi.latitude);
    const lng = parseFloat(poi.lng || poi.lon || poi.longitude);

    const meta = useMemo(() => {
        return getCategoryMeta(poi);
    }, [poi]);

    const badgeGradient = poi.gradient || (poi.color ? `linear-gradient(135deg, ${poi.color} 0%, ${poi.color} 100%)` : meta.gradient);
    const badgeColor = poi.color || meta.color;
    const iconName = poi.icon || poi.iconName || meta.icon;
    const displayName = poi.name || '';
    const escapedName = escapeHtml(displayName);

    const icon = useMemo(() => {
        const html = `
            <div class="poi-marker-container" title="${escapedName}">
                <!-- Subtle, high-definition circular icon badge (22px) -->
                <div class="poi-marker-badge" style="background: ${badgeGradient};">
                    <span class="material-symbols-outlined">${iconName}</span>
                </div>
                <!-- Clean, crisp vector-stroked label -->
                <span class="poi-marker-label">${escapedName}</span>
            </div>
        `;

        return L.divIcon({
            html,
            className: 'poi-custom-marker',
            iconSize: [160, 26],
            iconAnchor: [11, 13],
            popupAnchor: [0, -15]
        });
    }, [badgeGradient, iconName, escapedName]);

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
                                style={{ background: badgeGradient }}
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
