import googleMapsLightStyle from '../data/openfreemapGoogleLight.json';
import googleMapsDarkStyle from '../data/openfreemapGoogleDark.json';

/**
 * Default Google Maps Color Palettes
 * Optimized to match Google Maps modern aesthetic with OpenFreeMap vector tiles
 */
export const GOOGLE_MAPS_PALETTE = {
    light: {
        water: '#80daf0',
        waterLine: '#80daf0',
        waterLabel: '#2b6d85',
        background: '#f1f3f4',
        residential: '#f1f3f4',
        park: '#c8f2d8',
        parkOutline: '#b4ecc7',
        wood: '#c1eed3',
        grass: '#c8f2d8',
        pitch: '#c5eed4',
        motorway: '#80aed7',
        motorwayCasing: '#ffffff',
        trunkPrimary: '#ffffff',
        trunkPrimaryCasing: '#d0d7de',
        secondaryTertiary: '#ffffff',
        secondaryTertiaryCasing: '#dbe1e8',
        street: '#ffffff',
        streetCasing: '#e5eaef',
        building: '#e6ebef',
        buildingOutline: '#d8dee4',
        textCity: '#202124',
        textTown: '#3c4043',
        textVillage: '#5f6368',
        textHalo: '#ffffff'
    },
    dark: {
        water: '#17263c',
        waterLine: '#17263c',
        waterLabel: '#4e7694',
        background: '#242f3e',
        residential: '#212a37',
        park: '#263c3f',
        parkOutline: '#1e3033',
        wood: '#1e3538',
        grass: '#263c3f',
        pitch: '#263c3f',
        motorway: '#38414e',
        motorwayCasing: '#212a37',
        trunkPrimary: '#38414e',
        trunkPrimaryCasing: '#212a37',
        secondaryTertiary: '#2c3544',
        secondaryTertiaryCasing: '#1e2632',
        street: '#2c3544',
        streetCasing: '#1e2632',
        building: '#2a384b',
        buildingOutline: '#1f2835',
        textCity: '#e9e5dc',
        textTown: '#d5d0c7',
        textVillage: '#9ca5b3',
        textHalo: '#242f3e'
    }
};

/**
 * Returns a MapLibre GL style specification object with Google Maps styling.
 * Supports passing custom color overrides for ultimate flexibility.
 * 
 * @param {boolean} isDark - Whether to return the dark mode style
 * @param {Object} [colorOverrides] - Optional custom color overrides
 * @returns {Object} MapLibre style JSON specification object
 */
export const getGoogleMapsStyle = (isDark = false, colorOverrides = {}) => {
    const baseStyle = isDark ? googleMapsDarkStyle : googleMapsLightStyle;
    
    // If no custom overrides, return the pre-compiled style directly
    if (!colorOverrides || Object.keys(colorOverrides).length === 0) {
        return baseStyle;
    }

    // Clone style to avoid mutating original
    const customized = JSON.parse(JSON.stringify(baseStyle));
    const palette = {
        ...(isDark ? GOOGLE_MAPS_PALETTE.dark : GOOGLE_MAPS_PALETTE.light),
        ...colorOverrides
    };

    customized.layers.forEach(layer => {
        const p = layer.paint || {};
        const id = layer.id;

        if (palette.water && id === 'water' && layer.type === 'fill') p['fill-color'] = palette.water;
        if (palette.waterLine && id.startsWith('waterway_') && layer.type === 'line') p['line-color'] = palette.waterLine;
        if (palette.background && id === 'background') p['background-color'] = palette.background;
        if (palette.park && id === 'park') p['fill-color'] = palette.park;
        if (palette.wood && id === 'landcover_wood') p['fill-color'] = palette.wood;
        if (palette.grass && id === 'landcover_grass') p['fill-color'] = palette.grass;
        if (palette.building && id === 'building') p['fill-color'] = palette.building;
        if (palette.textCity && (id.startsWith('label_city') || id.startsWith('label_country'))) p['text-color'] = palette.textCity;
        if (palette.textHalo && layer.type === 'symbol' && p['text-halo-color']) p['text-halo-color'] = palette.textHalo;
    });

    return customized;
};

export { googleMapsLightStyle, googleMapsDarkStyle };
