import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@maplibre/maplibre-gl-leaflet';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDarkMode } from '../hooks/useDarkMode';
import { getGoogleMapsStyle, GOOGLE_MAPS_PALETTE } from '../utils/googleMapsStyle';

// Configure MapLibre worker for Vite
if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
    maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

export const OPENFREEMAP_STYLES = {
    google: 'google',
    google_light: 'google_light',
    google_dark: 'google_dark',
    bright: 'https://tiles.openfreemap.org/styles/bright',
    dark: 'https://tiles.openfreemap.org/styles/dark',
    liberty: 'https://tiles.openfreemap.org/styles/liberty',
    positron: 'https://tiles.openfreemap.org/styles/positron',
    fiord: 'https://tiles.openfreemap.org/styles/fiord',
};

export { GOOGLE_MAPS_PALETTE };

export const OpenFreeMapLayer = ({ style = 'auto', colorOverrides }) => {
    const map = useMap();
    const isDark = useDarkMode();
    const glLayerRef = useRef(null);
    const currentStyleKeyRef = useRef(null);

    // Resolve the exact style and a unique key for change detection
    let targetStyle;
    let styleKey;

    if (style === 'auto' || !style || style === 'google') {
        targetStyle = getGoogleMapsStyle(isDark, colorOverrides);
        styleKey = `google_${isDark ? 'dark' : 'light'}_${JSON.stringify(colorOverrides || {})}`;
    } else if (style === 'google_light') {
        targetStyle = getGoogleMapsStyle(false, colorOverrides);
        styleKey = `google_light_${JSON.stringify(colorOverrides || {})}`;
    } else if (style === 'google_dark') {
        targetStyle = getGoogleMapsStyle(true, colorOverrides);
        styleKey = `google_dark_${JSON.stringify(colorOverrides || {})}`;
    } else if (OPENFREEMAP_STYLES[style] && style !== 'google') {
        targetStyle = OPENFREEMAP_STYLES[style];
        styleKey = targetStyle;
    } else {
        targetStyle = style;
        styleKey = typeof style === 'string' ? style : 'custom_style_obj';
    }

    useEffect(() => {
        if (!map) return;

        // If layer already exists and is on the map, update style if possible
        if (glLayerRef.current) {
            if (currentStyleKeyRef.current === styleKey) {
                return;
            }
            try {
                const maplibreMap = glLayerRef.current.getMaplibreMap?.();
                if (maplibreMap && typeof maplibreMap.setStyle === 'function') {
                    currentStyleKeyRef.current = styleKey;
                    maplibreMap.setStyle(targetStyle);
                    return;
                }
            } catch (e) {
                console.warn('MapLibre GL setStyle failed, recreating layer:', e);
            }

            // Remove existing layer before recreating
            try {
                map.removeLayer(glLayerRef.current);
            } catch (_) {}
            glLayerRef.current = null;
        }

        currentStyleKeyRef.current = styleKey;

        try {
            const glLayer = L.maplibreGL({
                style: targetStyle,
                attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
            });

            glLayer.addTo(map);
            glLayerRef.current = glLayer;
        } catch (err) {
            console.error('Failed to initialize OpenFreeMap MapLibre GL layer:', err);
        }

        return () => {
            if (map && glLayerRef.current) {
                try {
                    map.removeLayer(glLayerRef.current);
                } catch (_) {}
                glLayerRef.current = null;
            }
        };
    }, [map, targetStyle, styleKey]);

    return null;
};

export default OpenFreeMapLayer;
