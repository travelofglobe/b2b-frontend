import { countries } from '../data/countries';

/**
 * Detects the user's country code based on user agent, browser language, and timezone settings.
 * @returns {string} 2-letter ISO country code (e.g. 'TR', 'US', 'DE')
 */
export const getUserCountryCode = () => {
    try {
        const navLang = navigator.language || (navigator.languages && navigator.languages[0]);
        if (navLang) {
            const parts = navLang.split('-');
            if (parts.length > 1 && parts[1].length === 2) {
                const country = parts[1].toUpperCase();
                if (countries.some(c => c.code === country)) {
                    return country;
                }
            }
            const langMap = {
                tr: 'TR',
                en: 'US',
                de: 'DE',
                fr: 'FR',
                es: 'ES',
                ru: 'RU',
                ar: 'SA',
                it: 'IT',
                ja: 'JP',
                zh: 'CN',
                fa: 'IR',
                el: 'GR',
                pt: 'PT'
            };
            const langCode = parts[0].toLowerCase();
            if (langMap[langCode] && countries.some(c => c.code === langMap[langCode])) {
                return langMap[langCode];
            }
        }

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone) {
            if (timeZone.includes('Istanbul')) return 'TR';
            if (timeZone.includes('London')) return 'GB';
            if (timeZone.includes('New_York') || timeZone.includes('Chicago') || timeZone.includes('Los_Angeles')) return 'US';
            if (timeZone.includes('Berlin')) return 'DE';
            if (timeZone.includes('Paris')) return 'FR';
            if (timeZone.includes('Moscow')) return 'RU';
            if (timeZone.includes('Riyadh')) return 'SA';
            if (timeZone.includes('Dubai')) return 'AE';
        }
    } catch {
        // Fallback gracefully
    }
    return 'TR';
};

/**
 * Maps country name (e.g. "Türkiye", "United Kingdom", "England") to 2-letter ISO country code.
 * @param {string} name
 * @returns {string|null} 2-letter country code
 */
export const getCountryCodeFromName = (name) => {
    if (!name) return null;
    const cleanName = String(name).trim().toLowerCase();
    
    if (cleanName === 'türkiye' || cleanName === 'turkey' || cleanName === 'turkiye') {
        return 'TR';
    }
    if (cleanName === 'united kingdom' || cleanName === 'uk' || cleanName === 'england' || cleanName === 'great britain') {
        return 'GB';
    }
    if (cleanName === 'united states' || cleanName === 'usa' || cleanName === 'us') {
        return 'US';
    }
    if (cleanName === 'germany' || cleanName === 'deutschland') {
        return 'DE';
    }
    if (cleanName === 'france') {
        return 'FR';
    }
    if (cleanName === 'spain' || cleanName === 'españa') {
        return 'ES';
    }
    if (cleanName === 'russia' || cleanName === 'russian federation') {
        return 'RU';
    }
    if (cleanName === 'saudi arabia') {
        return 'SA';
    }
    if (cleanName === 'united arab emirates' || cleanName === 'uae') {
        return 'AE';
    }

    const matched = countries.find(c => c.name.toLowerCase() === cleanName || c.code.toLowerCase() === cleanName);
    return matched ? matched.code : null;
};
