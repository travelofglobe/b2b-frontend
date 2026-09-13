/**
 * Parses the guests parameter from the URL into a structured array of room objects.
 * Format: JSON String
 * Example: [{"a":2,"c":0},{"a":1,"c":2,"ca":[5,8]}]
 * 
 * @param {string} paramString - The 'guests' query parameter
 * @returns {Array} Array of room objects
 */
export const parseGuestsParam = (paramString) => {
    if (!paramString) {
        return [{ adults: 2, children: 0, childAges: [] }]; // Default
    }

    try {
        // Try parsing as JSON first
        const parsed = JSON.parse(paramString);

        if (Array.isArray(parsed)) {
            return parsed.map(room => ({
                adults: room.a || 2,
                children: room.c || 0,
                // Ensure childAges is an array
                childAges: Array.isArray(room.ca) ? room.ca : []
            }));
        }
    } catch (e) {
        // Fallback or silence error (could be old format)
        // console.log("JSON parse failed, trying legacy or returning default");
    }

    // Fallback: Check if it's the underscore separated string (from previous step)
    // or pipe separated (very old) if we want to support transition, 
    // but for now, if JSON fails, we default or could try to parse the "2-0_..." format.
    // Let's add a quick fallback for the string format just in case the user has a lingering link.
    if (paramString.includes('_') || paramString.includes('|')) {
        const separator = paramString.includes('|') ? '|' : '_';
        return paramString.split(separator).map(roomStr => {
            const parts = roomStr.split('-').map(Number);
            if (parts.length < 2) return { adults: parts[0] || 2, children: 0, childAges: [] };
            const adults = parts[0] || 1;
            const children = parts[1] || 0;
            const childAges = parts.slice(2);
            return { adults, children, childAges };
        });
    }

    return [{ adults: 2, children: 0, childAges: [] }];
};

/**
 * Serializes the room state into a URL-friendly JSON string.
 * Format: JSON Array with short keys to save space.
 * a: adults, c: children, ca: childAges
 * 
 * @param {Array} rooms - Array of room objects
 * @returns {string} JSON String representation
 */
export const serializeGuestsParam = (rooms) => {
    if (!rooms || rooms.length === 0) return '';

    const minimized = rooms.map(room => {
        // Ensure accurate child ages array based on count
        const safeAges = (room.childAges || []).slice(0, room.children);
        // Fill missing ages with 0 if necessary
        while (safeAges.length < room.children) safeAges.push(0);

        const obj = {
            a: room.adults,
            c: room.children
        };

        // Only add child ages if there are children
        if (room.children > 0) {
            obj.ca = safeAges;
        }

        return obj;
    });

    return JSON.stringify(minimized);
};

/**
 * Transforms old individual params (backup) to new structure
 */
export const convertOldParamsToRooms = (adults, children, childAgesStr) => {
    let ages = [];
    if (childAgesStr) {
        ages = childAgesStr.split(',').map(Number);
    } else if (children > 0) {
        ages = Array(parseInt(children)).fill(0);
    }

    return [{
        adults: parseInt(adults) || 2,
        children: parseInt(children) || 0,
        childAges: ages
    }];
};

/**
 * Parses a date string (supporting yyyy-MM-dd and dd-MM-yyyy).
 */
export const parseDateParam = (param) => {
    if (!param) return null;
    const isNewFormat = /^\d{4}-\d{2}-\d{2}$/.test(param.trim());
    const parts = param.split('-').map(Number);
    let year, month, day;
    if (isNewFormat) {
        [year, month, day] = parts;
    } else {
        [day, month, year] = parts;
    }
    if (day && month && year) {
        const date = new Date(year, month - 1, day);
        if (date instanceof Date && !isNaN(date.getTime())) {
            return date;
        }
    }
    return null;
};

/**
 * Validates and sanitizes check-in and check-out date parameters.
 * Guarantees check-in is not in the past (< today) and check-out is at least 1 day after check-in.
 */
export const validateAndSanitizeDates = (checkinParam, checkoutParam) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const parsedCheckin = parseDateParam(checkinParam);
    let validCheckIn = today;
    if (parsedCheckin) {
        const checkinDay = new Date(parsedCheckin.getFullYear(), parsedCheckin.getMonth(), parsedCheckin.getDate());
        if (checkinDay >= today) {
            validCheckIn = checkinDay;
        }
    }

    const minCheckout = new Date(validCheckIn.getFullYear(), validCheckIn.getMonth(), validCheckIn.getDate() + 1);
    const parsedCheckout = parseDateParam(checkoutParam);
    let validCheckOut = minCheckout;
    if (parsedCheckout) {
        const checkoutDay = new Date(parsedCheckout.getFullYear(), parsedCheckout.getMonth(), parsedCheckout.getDate());
        if (checkoutDay >= minCheckout) {
            validCheckOut = checkoutDay;
        }
    }

    return { checkInDate: validCheckIn, checkOutDate: validCheckOut };
};

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
export const formatDateForUrl = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const KNOWN_DESTINATIONS = {
    istanbul: { lat: 41.0082, lng: 28.9784 },
    antalya: { lat: 36.8969, lng: 30.7133 },
    ankara: { lat: 39.9334, lng: 32.8597 },
    izmir: { lat: 38.4237, lng: 27.1428 },
    bodrum: { lat: 37.0344, lng: 27.4305 },
    mugla: { lat: 37.0344, lng: 27.4305 },
    fethiye: { lat: 36.6217, lng: 29.1164 },
    oludeniz: { lat: 36.5489, lng: 29.1245 },
    gocek: { lat: 36.7533, lng: 28.9392 },
    dalaman: { lat: 36.7667, lng: 28.8028 },
    marmaris: { lat: 36.8550, lng: 28.2742 },
    cesme: { lat: 38.3236, lng: 26.3040 },
    alacati: { lat: 38.2819, lng: 26.3742 },
    alanya: { lat: 36.5438, lng: 31.9998 },
    kemer: { lat: 36.6025, lng: 30.5600 },
    side: { lat: 36.7667, lng: 31.3889 },
    belek: { lat: 36.8625, lng: 31.0556 },
    kusadasi: { lat: 37.8579, lng: 27.2610 },
    kas: { lat: 36.2000, lng: 29.6389 },
    kalkan: { lat: 36.2644, lng: 29.4144 },
    ayvalik: { lat: 39.3193, lng: 26.6965 },
    cunda: { lat: 39.3333, lng: 26.6600 },
    bozcaada: { lat: 39.8333, lng: 26.0667 },
    didim: { lat: 37.3734, lng: 27.2564 },
    datca: { lat: 36.7262, lng: 27.6860 },
    trabzon: { lat: 41.0027, lng: 39.7168 },
    rize: { lat: 41.0201, lng: 40.5234 },
    bursa: { lat: 40.1885, lng: 29.0610 },
    uludag: { lat: 40.1264, lng: 29.1306 },
    kapadokya: { lat: 38.6431, lng: 34.8289 },
    cappadocia: { lat: 38.6431, lng: 34.8289 },
    goreme: { lat: 38.6431, lng: 34.8289 },
    urgup: { lat: 38.6319, lng: 34.9125 },
    nevsehir: { lat: 38.6244, lng: 34.7144 },
    eskisehir: { lat: 39.7667, lng: 30.5256 },
    adana: { lat: 37.0000, lng: 35.3213 },
    gaziantep: { lat: 37.0662, lng: 37.3833 },
    konya: { lat: 37.8714, lng: 32.4846 },
    denizli: { lat: 37.7765, lng: 29.0864 },
    pamukkale: { lat: 37.9137, lng: 29.1187 },
    bolu: { lat: 40.7358, lng: 31.6061 },
    sapanca: { lat: 40.6931, lng: 30.2644 },
    yalova: { lat: 40.6549, lng: 29.2842 },
    canakkale: { lat: 40.1553, lng: 26.4142 },
    girne: { lat: 35.3333, lng: 33.3167 },
    kibris: { lat: 35.1667, lng: 33.3667 },
    dubai: { lat: 25.2048, lng: 55.2708 },
    london: { lat: 51.5074, lng: -0.1278 },
    paris: { lat: 48.8566, lng: 2.3522 },
    rome: { lat: 41.9028, lng: 12.4964 },
    milan: { lat: 45.4642, lng: 9.1900 },
    barcelona: { lat: 41.3851, lng: 2.1734 },
    madrid: { lat: 40.4168, lng: -3.7038 },
    berlin: { lat: 52.5200, lng: 13.4050 },
    munich: { lat: 48.1351, lng: 11.5820 },
    amsterdam: { lat: 52.3676, lng: 4.9041 },
    vienna: { lat: 48.2082, lng: 16.3738 },
    prague: { lat: 50.0755, lng: 14.4378 },
    athens: { lat: 37.9838, lng: 23.7275 },
    newyork: { lat: 40.7128, lng: -74.0060 },
    tokyo: { lat: 35.6762, lng: 139.6503 }
};

export const resolveKnownCoordinates = (str) => {
    if (!str) return null;
    const clean = str.toLowerCase()
        .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
    if (!clean) return null;
    for (const [key, val] of Object.entries(KNOWN_DESTINATIONS)) {
        if (clean.includes(key) || key.includes(clean)) {
            return val;
        }
    }
    return null;
};

