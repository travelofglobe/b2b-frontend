import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * Intelligent POI categorization inspecting categories array, tags array, name, and category.
 * Assigns tailored icons and Google Maps-inspired harmonious colors.
 */
const getCategoryMeta = (poi = {}) => {
    const rawCategories = Array.isArray(poi?.categories) ? poi.categories.join(' ').toLowerCase() : '';
    const rawTags = Array.isArray(poi?.tags) ? poi.tags.join(' ').toLowerCase() : '';
    const category = (poi?.category || '').toLowerCase();
    const icon = (poi?.icon || '').toLowerCase();
    const name = (poi?.name || '').toLowerCase();
    const allText = `${rawCategories} ${rawTags} ${category} ${icon} ${name}`;

    // 1. Hospital / Clinic / Medical
    if (allText.includes('hospital') || allText.includes('hastane') || allText.includes('medicalclinic') || allText.includes('medicalcentre') || allText.includes('klinik') || allText.includes('saglik') || allText.includes('sağlık')) {
        return { color: '#0284c7', labelColor: '#0369a1', icon: 'local_hospital', labelTr: 'Sağlık / Hastane', labelEn: 'Hospital / Medical' };
    }

    // 2. Mosque / Place of Worship
    if (allText.includes('mosque') || allText.includes('cami') || allText.includes('placeofworship') || allText.includes('church') || allText.includes('kilise') || allText.includes('synagogue') || allText.includes('temple')) {
        return { color: '#d97706', labelColor: '#b45309', icon: 'account_balance', labelTr: 'İbadethane / Cami', labelEn: 'Place of Worship' };
    }

    // 3. Museum / Cultural
    if (allText.includes('museum') || allText.includes('müze') || allText.includes('gallery') || allText.includes('galeri') || allText.includes('cultural')) {
        return { color: '#8b5cf6', labelColor: '#6d28d9', icon: 'museum', labelTr: 'Müze / Kültür', labelEn: 'Museum' };
    }

    // 4. Shopping Mall / Center
    if (allText.includes('shopping') || allText.includes('mall') || allText.includes('avm') || allText.includes('bazaar') || allText.includes('çarşı') || allText.includes('market')) {
        return { color: '#e11d48', labelColor: '#be123c', icon: 'shopping_bag', labelTr: 'Alışveriş / AVM', labelEn: 'Shopping Mall' };
    }

    // 5. Lake / Waterbody / Beach
    if (allText.includes('lake') || allText.includes('göl') || allText.includes('waterbody') || allText.includes('beach') || allText.includes('sahil') || allText.includes('plaj') || allText.includes('coast')) {
        return { color: '#0284c7', labelColor: '#0369a1', icon: 'water', labelTr: 'Göl / Sahil', labelEn: 'Lake / Beach' };
    }

    // 6. Park / Nature / Arboretum
    if (allText.includes('park') || allText.includes('garden') || allText.includes('bahçe') || allText.includes('arboretum') || allText.includes('nature') || allText.includes('doğa')) {
        return { color: '#16a34a', labelColor: '#15803d', icon: 'park', labelTr: 'Park / Yeşil Alan', labelEn: 'Park / Nature' };
    }

    // 7. Stadium / Sports / Karting / Bowling
    if (allText.includes('stadium') || allText.includes('stad') || allText.includes('sportsfacility') || allText.includes('arena') || allText.includes('spor') || allText.includes('karting') || allText.includes('bowling') || allText.includes('racetrack')) {
        return { color: '#2563eb', labelColor: '#1d4ed8', icon: 'sports_soccer', labelTr: 'Spor / Aktivite', labelEn: 'Sports & Stadium' };
    }

    // 8. Waterpark / Theme Park
    if (allText.includes('waterpark') || allText.includes('themepark') || allText.includes('aqua') || allText.includes('lunapark') || allText.includes('amusement')) {
        return { color: '#0d9488', labelColor: '#0f766e', icon: 'attractions', labelTr: 'Eğlence / Su Parkı', labelEn: 'Theme / Water Park' };
    }

    // 9. University / Education
    if (allText.includes('university') || allText.includes('üniversite') || allText.includes('college') || allText.includes('education') || allText.includes('okul') || allText.includes('kolej') || allText.includes('campus')) {
        return { color: '#4f46e5', labelColor: '#4338ca', icon: 'school', labelTr: 'Üniversite / Eğitim', labelEn: 'University / Education' };
    }

    // 10. Convention Center / Exhibition Fair
    if (allText.includes('convention') || allText.includes('fuar') || allText.includes('congress') || allText.includes('kongre') || allText.includes('kultur merkezi') || allText.includes('eventconference')) {
        return { color: '#475569', labelColor: '#334155', icon: 'business_center', labelTr: 'Fuar / Kongre', labelEn: 'Convention / Expo' };
    }

    // 11. Lookout / Tower
    if (allText.includes('lookout') || allText.includes('tower') || allText.includes('kule') || allText.includes('seyir')) {
        return { color: '#f59e0b', labelColor: '#d97706', icon: 'visibility', labelTr: 'Seyir Noktası / Kule', labelEn: 'Observation Tower' };
    }

    // 12. Airport / Transit / Train / Bus
    if (allText.includes('airport') || allText.includes('havalimanı') || allText.includes('flight') || allText.includes('metro') || allText.includes('train') || allText.includes('transit') || allText.includes('station') || allText.includes('istasyon') || allText.includes('ferry') || allText.includes('otogar') || allText.includes('bus')) {
        return { color: '#0ea5e9', labelColor: '#0284c7', icon: 'directions_transit', labelTr: 'Ulaşım / İstasyon', labelEn: 'Station / Transit' };
    }

    // 13. Restaurant / Dining / Cafe
    if (allText.includes('restaurant') || allText.includes('dining') || allText.includes('cafe') || allText.includes('kafe') || allText.includes('bar') || allText.includes('food') || allText.includes('mutfak')) {
        return { color: '#ea580c', labelColor: '#c2410c', icon: 'restaurant', labelTr: 'Restoran / Kafe', labelEn: 'Restaurant / Dining' };
    }

    // 14. Historic Landmark
    if (allText.includes('historic') || allText.includes('landmark') || allText.includes('monument') || allText.includes('anıt') || allText.includes('castle') || allText.includes('kale') || allText.includes('saray') || allText.includes('palace')) {
        return { color: '#78716c', labelColor: '#57534e', icon: 'account_balance', labelTr: 'Tarihi Yer / Anıt', labelEn: 'Historical Landmark' };
    }

    // Calm neutral default (Slate gray, never aggressive purple)
    return { color: '#64748b', labelColor: '#475569', icon: 'place', labelTr: 'Önemli Nokta', labelEn: 'Point of Interest' };
};

/**
 * Modern Google Maps-styled POI Marker.
 * Compact, elegant, and non-intrusive so it never obscures hotel price markers.
 */
const PoiMarker = React.memo(({ poi, currentLang = 'tr', onSelectPoi }) => {
    const lat = parseFloat(poi.lat || poi.latitude);
    const lng = parseFloat(poi.lng || poi.lon || poi.longitude);

    const meta = useMemo(() => {
        return getCategoryMeta(poi);
    }, [poi]);

    const badgeColor = poi.color || meta.color;
    const labelColor = poi.labelColor || meta.labelColor;
    const iconName = poi.iconName || meta.icon;

    const icon = useMemo(() => {
        const html = `
            <div class="poi-marker-container" style="display:inline-flex;align-items:center;cursor:pointer;pointer-events:auto;user-select:none;transition:transform 0.15s ease;">
                <!-- Subtle Icon Circle Badge (20px compact, non-dominating) -->
                <div style="width:20px;height:20px;border-radius:50%;background:${badgeColor};color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.25);border:1.5px solid #ffffff;flex-shrink:0;">
                    <span class="material-symbols-outlined" style="font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;font-variation-settings:'FILL' 1;">
                        ${iconName}
                    </span>
                </div>
                <!-- Clean, crisp label with halo, truncated to prevent overcrowding -->
                <span style="margin-left:4px;font-family:Roboto,-apple-system,sans-serif;font-size:11px;font-weight:600;color:${labelColor};text-shadow:0 0 3px #fff, 0 0 3px #fff, 0 1px 2px #fff;white-space:nowrap;letter-spacing:-0.1px;max-width:125px;overflow:hidden;text-overflow:ellipsis;">
                    ${poi.name || ''}
                </span>
            </div>
        `;

        return L.divIcon({
            html,
            className: 'poi-custom-marker',
            iconSize: [140, 24],
            iconAnchor: [10, 10],
            popupAnchor: [0, -12]
        });
    }, [badgeColor, labelColor, iconName, poi.name]);

    if (isNaN(lat) || isNaN(lng)) return null;

    const categoryLabel = currentLang === 'tr' ? meta.labelTr : meta.labelEn;

    return (
        // zIndexOffset={-500} guarantees POI markers stay below hotel price pins (PriceMarker)
        <Marker position={[lat, lng]} icon={icon} zIndexOffset={-500}>
            <Popup className="google-poi-popup" closeButton={true}>
                <div className="p-1 max-w-[240px] font-sans">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: badgeColor }}
                        >
                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {iconName}
                            </span>
                        </div>
                        <h4 className="font-semibold text-[13px] text-[#202124] leading-tight m-0">
                            {poi.name}
                        </h4>
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-medium mb-1.5" style={{ backgroundColor: `${badgeColor}18`, color: badgeColor }}>
                        {categoryLabel}
                    </div>
                    {poi.nameFull && poi.nameFull !== poi.name && (
                        <p className="text-[11.5px] text-[#5f6368] leading-snug m-0 mb-2">
                            {poi.nameFull}
                        </p>
                    )}
                    {onSelectPoi && (
                        <button
                            type="button"
                            onClick={() => onSelectPoi(poi)}
                            className="w-full mt-1 px-2.5 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                            {currentLang === 'tr' ? 'Bu Noktanın Çevresinde Ara' : 'Search Hotels Near Here'}
                        </button>
                    )}
                </div>
            </Popup>
        </Marker>
    );
});

export default PoiMarker;
