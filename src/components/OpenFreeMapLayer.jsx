import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@maplibre/maplibre-gl-leaflet';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDarkMode } from '../hooks/useDarkMode';

// Configure MapLibre worker for Vite
if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
    maplibregl.setWorkerUrl(maplibreWorkerUrl);
}

export const OPENFREEMAP_STYLES = {
    bright: 'https://tiles.openfreemap.org/styles/bright',
    dark: 'https://tiles.openfreemap.org/styles/dark',
    liberty: 'https://tiles.openfreemap.org/styles/liberty',
    positron: 'https://tiles.openfreemap.org/styles/positron',
    fiord: 'https://tiles.openfreemap.org/styles/fiord',
};

export const OpenFreeMapLayer = ({ style = 'auto' }) => {
    const map = useMap();
    const isDark = useDarkMode();
    const glLayerRef = useRef(null);
    const currentStyleUrlRef = useRef(null);

    // Resolve the exact style URL based on the mode and props
    let targetStyleUrl;
    if (style === 'auto' || !style) {
        targetStyleUrl = isDark ? OPENFREEMAP_STYLES.dark : OPENFREEMAP_STYLES.liberty;
    } else if (OPENFREEMAP_STYLES[style]) {
        targetStyleUrl = OPENFREEMAP_STYLES[style];
    } else {
        targetStyleUrl = style;
    }

    useEffect(() => {
        if (!map) return;

        // If layer already exists and is on the map, update style if possible
        if (glLayerRef.current) {
            if (currentStyleUrlRef.current === targetStyleUrl) {
                return;
            }
            try {
                const maplibreMap = glLayerRef.current.getMaplibreMap?.();
                if (maplibreMap && typeof maplibreMap.setStyle === 'function') {
                    currentStyleUrlRef.current = targetStyleUrl;
                    maplibreMap.setStyle(targetStyleUrl);
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

        currentStyleUrlRef.current = targetStyleUrl;

        try {
            const glLayer = L.maplibreGL({
                style: targetStyleUrl,
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
    }, [map, targetStyleUrl]);

    return null;
};

export default OpenFreeMapLayer;
