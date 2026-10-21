import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const getCategoryMeta = (category = '', icon = '') => {
    const cat = (category || '').toUpperCase();
    const ic = (icon || '').toLowerCase();

    if (cat.includes('AIRPORT') || ic === 'flight') {
        return { color: '#0288D1', labelColor: '#01579B', icon: 'flight', labelTr: 'Havalimanı', labelEn: 'Airport' };
    }
    if (cat.includes('TRAIN') || cat.includes('METRO') || cat.includes('SUBWAY') || cat.includes('RAILWAY') || cat.includes('TRANSIT') || cat.includes('FERRY') || ic === 'train' || ic === 'directions_transit') {
        return { color: '#1A73E8', labelColor: '#1558D6', icon: 'directions_transit', labelTr: 'Ulaşım / İstasyon', labelEn: 'Station / Transit' };
    }
    if (cat.includes('BUS') || ic === 'directions_bus') {
        return { color: '#00897B', labelColor: '#004D40', icon: 'directions_bus', labelTr: 'Otogar / Durak', labelEn: 'Bus Station' };
    }
    if (cat.includes('RESTAURANT') || cat.includes('DINING') || cat.includes('CAFE') || cat.includes('BAR') || cat.includes('FOOD') || cat.includes('BAKERY') || ic === 'restaurant') {
        return { color: '#EA4335', labelColor: '#C5221F', icon: 'restaurant', labelTr: 'Restoran / Kafe', labelEn: 'Restaurant / Dining' };
    }
    if (cat.includes('BEACH') || cat.includes('COAST') || ic === 'beach_access') {
        return { color: '#0288D1', labelColor: '#01579B', icon: 'beach_access', labelTr: 'Plaj / Sahil', labelEn: 'Beach / Coast' };
    }
    if (cat.includes('MUSEUM') || cat.includes('GALLERY') || ic === 'museum') {
        return { color: '#8E24AA', labelColor: '#4A148C', icon: 'museum', labelTr: 'Müze / Galeri', labelEn: 'Museum / Gallery' };
    }
    if (cat.includes('PARK') || cat.includes('GARDEN') || cat.includes('NATURE') || cat.includes('MOUNTAIN') || ic === 'park') {
        return { color: '#2E7D32', labelColor: '#1B5E20', icon: 'park', labelTr: 'Park / Doğal Alan', labelEn: 'Park / Nature' };
    }
    if (cat.includes('RELIGIOUS') || cat.includes('MOSQUE') || cat.includes('CHURCH') || cat.includes('TEMPLE') || cat.includes('SYNAGOGUE')) {
        return { color: '#F57C00', labelColor: '#E65100', icon: 'account_balance', labelTr: 'Dini / Tarihi Mekan', labelEn: 'Religious / Sacred' };
    }
    if (cat.includes('MONUMENT') || cat.includes('HISTORIC') || cat.includes('CASTLE') || ic === 'account_balance') {
        return { color: '#9333EA', labelColor: '#7E22CE', icon: 'account_balance', labelTr: 'Tarihi Yer / Anıt', labelEn: 'Historical Landmark' };
    }
    if (cat.includes('SHOPPING') || cat.includes('MALL') || cat.includes('MARKET') || cat.includes('BAZAAR') || ic === 'shopping_bag') {
        return { color: '#E91E63', labelColor: '#AD1457', icon: 'shopping_bag', labelTr: 'Alışveriş', labelEn: 'Shopping' };
    }
    if (cat.includes('STADIUM') || cat.includes('ARENA') || cat.includes('SPORT') || ic === 'stadium') {
        return { color: '#D32F2F', labelColor: '#B71C1C', icon: 'stadium', labelTr: 'Stadyum / Spor', labelEn: 'Stadium / Sports' };
    }
    if (cat.includes('THEATER') || cat.includes('CINEMA') || cat.includes('OPERA') || cat.includes('ENTERTAINMENT') || ic === 'theater_comedy') {
        return { color: '#7B1FA2', labelColor: '#4A148C', icon: 'theater_comedy', labelTr: 'Kültür / Sanat', labelEn: 'Theater / Arts' };
    }
    return { color: '#9333EA', labelColor: '#7E22CE', icon: 'attractions', labelTr: 'Önemli Nokta', labelEn: 'Point of Interest' };
};

/**
 * Google Maps-styled POI Marker with custom icon badge and text label.
 */
const PoiMarker = React.memo(({ poi, currentLang = 'tr', onSelectPoi }) => {
    const lat = parseFloat(poi.lat || poi.latitude);
    const lng = parseFloat(poi.lng || poi.lon || poi.longitude);

    const meta = useMemo(() => {
        return getCategoryMeta(poi.category, poi.icon);
    }, [poi.category, poi.icon]);

    const badgeColor = poi.color || meta.color;
    const labelColor = poi.labelColor || meta.labelColor;
    const iconName = poi.icon || meta.icon;

    const icon = useMemo(() => {
        const html = `
            <div style="display:inline-flex;align-items:center;cursor:pointer;pointer-events:auto;user-select:none;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.25));transition:transform 0.15s ease;">
                <!-- Icon Circle Badge -->
                <div style="width:26px;height:26px;border-radius:50%;background:${badgeColor};color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;flex-shrink:0;">
                    <span class="material-symbols-outlined" style="font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;font-variation-settings:'FILL' 1;">
                        ${iconName}
                    </span>
                </div>
                <!-- Google Maps Vector Styled Label with Halo -->
                <span style="margin-left:5px;font-family:Roboto,-apple-system,sans-serif;font-size:12px;font-weight:700;color:${labelColor};text-shadow:-1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 1px 4px rgba(255,255,255,0.95);white-space:nowrap;letter-spacing:-0.1px;">
                    ${poi.name || ''}
                </span>
            </div>
        `;

        return L.divIcon({
            html,
            className: 'poi-custom-marker',
            iconSize: [160, 30],
            iconAnchor: [13, 13],
            popupAnchor: [0, -15]
        });
    }, [badgeColor, labelColor, iconName, poi.name]);

    if (isNaN(lat) || isNaN(lng)) return null;

    const categoryLabel = currentLang === 'tr' ? meta.labelTr : meta.labelEn;

    return (
        <Marker position={[lat, lng]} icon={icon}>
            <Popup className="google-poi-popup" closeButton={true}>
                <div className="p-1 max-w-[240px] font-sans">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: badgeColor }}
                        >
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
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
