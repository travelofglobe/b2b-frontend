import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * Google Maps-styled POI Marker with custom icon badge and text label.
 * Replicates the Belgrad Ormanı / Rumeli Hisarı aesthetic from Google Maps.
 */
const PoiMarker = React.memo(({ poi, currentLang = 'tr' }) => {
    const icon = useMemo(() => {
        const html = `
            <div style="display:inline-flex;align-items:center;cursor:pointer;pointer-events:auto;user-select:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.15));transition:transform 0.15s ease;">
                <!-- Icon Circle Badge -->
                <div style="width:28px;height:28px;border-radius:50%;background:${poi.color};color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;flex-shrink:0;">
                    <span class="material-symbols-outlined" style="font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;font-variation-settings:'FILL' 1;">
                        ${poi.icon}
                    </span>
                </div>
                <!-- Google Maps Vector Styled Label with Halo -->
                <span style="margin-left:6px;font-family:Roboto,-apple-system,sans-serif;font-size:13px;font-weight:700;color:${poi.labelColor};text-shadow:-1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 1px 4px rgba(255,255,255,0.95);white-space:nowrap;letter-spacing:-0.1px;">
                    ${poi.name}
                </span>
            </div>
        `;

        return L.divIcon({
            html,
            className: 'poi-custom-marker',
            iconSize: [160, 32],
            iconAnchor: [14, 14], // Centers badge circle on coordinate
            popupAnchor: [0, -16]
        });
    }, [poi]);

    const categoryLabels = {
        transit: currentLang === 'tr' ? 'Toplu Taşıma' : 'Transit',
        restaurants: currentLang === 'tr' ? 'Restoran & Yeme İçme' : 'Restaurant & Dining',
        tourist: currentLang === 'tr' ? 'Gezilecek Yer / Turistik' : 'Attraction & Sights',
        shopping: currentLang === 'tr' ? 'Alışveriş Bölgesi' : 'Shopping Area'
    };

    return (
        <Marker position={[poi.lat, poi.lng]} icon={icon}>
            <Popup className="google-poi-popup" closeButton={true}>
                <div className="p-1 max-w-[220px] font-sans">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: poi.color }}
                        >
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {poi.icon}
                            </span>
                        </div>
                        <h4 className="font-semibold text-[13.5px] text-[#202124] leading-tight m-0">
                            {poi.name}
                        </h4>
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-medium mb-1.5" style={{ backgroundColor: `${poi.color}18`, color: poi.color }}>
                        {categoryLabels[poi.category] || poi.category}
                    </div>
                    {poi.description && (
                        <p className="text-[11.5px] text-[#5f6368] leading-snug m-0">
                            {poi.description}
                        </p>
                    )}
                </div>
            </Popup>
        </Marker>
    );
});

export default PoiMarker;
