import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * SmoothWheelZoom — Orantılı (proportional) wheel zoom
 *
 * Davranış:
 *   - Yavaş çevirince → az zoom
 *   - Hızlı çevirince → çok zoom
 *   - Kademe/snap yok — delta ile tam orantılı sürekli zoom
 *   - Fare konumu zoom merkezi olarak kullanılır (Google Maps davranışı)
 */
export default function SmoothWheelZoom({ sensitivity = 1 }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // Leaflet'in kendi scroll zoom'unu kapat
        map.scrollWheelZoom.disable();

        const onWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Delta normalize — farklı cihazlar farklı birim gönderir
            let delta = e.deltaY;
            if (e.deltaMode === 1) delta *= 15;   // DOM_DELTA_LINE (Firefox)
            if (e.deltaMode === 2) delta *= 300;  // DOM_DELTA_PAGE

            // Orantılı zoom miktarı:
            // Tipik fare notch ≈ 120 delta → 120/250 ≈ 0.48 zoom seviyesi
            // sensitivity ile ayarlanabilir
            const zoomChange = -(delta / 250) * sensitivity;

            // Fare pozisyonunu zoom merkezi yap
            const rect = map.getContainer().getBoundingClientRect();
            const latlng = map.containerPointToLatLng(
                L.point(e.clientX - rect.left, e.clientY - rect.top)
            );

            const currentZoom = map.getZoom();
            const newZoom = Math.max(
                map.getMinZoom(),
                Math.min(map.getMaxZoom(), currentZoom + zoomChange)
            );

            // Anında uygula — animasyon yok, her event'te doğrudan güncelle
            map.setZoomAround(latlng, newZoom, { animate: false });
        };

        const container = map.getContainer();
        container.addEventListener('wheel', onWheel, { passive: false, capture: true });

        return () => {
            container.removeEventListener('wheel', onWheel, { capture: true });
            map.scrollWheelZoom.enable();
        };
    }, [map, sensitivity]);

    return null;
}
