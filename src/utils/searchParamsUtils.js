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

