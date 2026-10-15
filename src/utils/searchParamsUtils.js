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

    const defaultCheckIn = new Date(today);
    defaultCheckIn.setDate(defaultCheckIn.getDate() + 2);

    const parsedCheckin = parseDateParam(checkinParam);
    let validCheckIn = defaultCheckIn;
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

/**
 * Resolves the appropriate search ID parameter and value for an autocomplete item:
 * - PROPERTY / HOTEL -> { param: 'togId', id: togId }
 * - GEOGRAPHY_REGION / LOCATION -> { param: 'regionId', id: regionId }
 * - POI -> { param: 'regionId', id: regionId } (uses POI's parent regionId)
 *
 * @param {Object} item
 * @returns {{ param: 'togId'|'regionId'|null, id: string|number|null }}
 */
export const resolveSearchTargetId = (item) => {
    if (!item) return { param: null, id: null };

    const type = String(item.type || item.searchType || '').toUpperCase();

    // 1. PROPERTY / HOTEL
    if (type === 'PROPERTY' || type === 'HOTEL') {
        const togId = item.togId || item.propertyId || item.hotelId ||
            (typeof item.id === 'string' ? item.id.replace('property_', '').replace('hotel_', '') : item.id);
        return { param: 'togId', id: togId || null };
    }

    // 2. POI
    if (type === 'POI' || item.poiId) {
        // For POI, send its regionId (parent region)
        let regionId = item.regionId;
        if (!regionId && Array.isArray(item.ancestors)) {
            const parent = item.ancestors.find(a => a.type === 'neighborhood' || a.type === 'city' || a.type === 'province_state' || a.type === 'country');
            if (parent) regionId = parent.regionId || parent.id;
        }
        return { param: 'regionId', id: regionId || null };
    }

    // 3. GEOGRAPHY_REGION / LOCATION
    const regionId = item.regionId || item.locationId ||
        (typeof item.id === 'string' ? item.id.replace('geography_region_', '').replace('region_', '').replace('location_', '') : item.id);
    return { param: 'regionId', id: regionId || null };
};

/**
 * Determines whether a given autocomplete item is a POI (Point of Interest).
 *
 * @param {Object} item
 * @returns {boolean}
 */
export const isPoiItem = (item) => {
    if (!item) return false;
    return item.type === 'POI' ||
        Boolean(item.poiId) ||
        (item.locationType && String(item.locationType).toLowerCase().includes('poi')) ||
        (item.locationType && String(item.locationType).toLowerCase().includes('point_of_interest'));
};

/**
 * Determines the appropriate icon and metadata for a location/region/POI item.
 *
 * @param {Object} region - The region or location item
 * @param {string} title - Resolved title
 * @param {string} subtitle - Resolved subtitle
 * @param {boolean} isChild - Whether this item is displayed as a child in a tree
 * @returns {{ icon: string, isPoi: boolean }}
 */
export const getLocationIconMeta = (region, title = '', subtitle = '', isChild = false) => {
    const isPoi = isPoiItem(region);

    const lower = `${title || ''} ${subtitle || ''}`.toLowerCase();

    if (lower.includes('airport') || lower.includes('havalimanı') || lower.includes('havaalanı')) {
        return { icon: 'flight', isPoi };
    }
    if (lower.includes('tren') || lower.includes('train') || lower.includes('istasyon') || lower.includes('station')) {
        return { icon: 'train', isPoi };
    }

    if (isPoi) {
        if (lower.includes('museum') || lower.includes('müze')) {
            return { icon: 'museum', isPoi: true };
        }
        if (lower.includes('park') || lower.includes('kanyon') || lower.includes('canyon')) {
            return { icon: 'park', isPoi: true };
        }
        if (lower.includes('beach') || lower.includes('plaj') || lower.includes('koy') || lower.includes('bay')) {
            return { icon: 'beach_access', isPoi: true };
        }
        return { icon: 'attractions', isPoi: true };
    }

    if (isChild) {
        return { icon: 'subdirectory_arrow_right', isPoi: false };
    }

    return { icon: 'location_on', isPoi: false };
};

/**
 * Organizes flat autocomplete regions/locations into a tree hierarchy where
 * ONLY POIs (Points of Interest) are nested as child menu items under their parent region.
 * All regions, cities, provinces and neighborhoods remain top-level items.
 *
 * @param {Array} items - Flat list of region/location/POI items
 * @returns {Array} Tree structured items where .children contains only POIs
 */
export const buildLocationTree = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const itemMap = new Map();
    items.forEach(item => {
        const id = String(item.regionId || item.poiId || item.locationId || item.id || '');
        if (id) itemMap.set(id, item);
        if (item.regionId) itemMap.set(String(item.regionId), item);
        if (item.id) itemMap.set(String(item.id), item);
        if (item.poiId) itemMap.set(String(item.poiId), item);
        if (item.locationId) itemMap.set(String(item.locationId), item);
    });

    const childrenMap = new Map();
    const rootItems = [];

    items.forEach(item => {
        const isPoi = isPoiItem(item);

        // ONLY POI items can be nested as child menu items
        if (!isPoi) {
            rootItems.push(item);
            return;
        }

        const itemId = String(item.regionId || item.poiId || item.locationId || item.id || '');
        let parentItem = null;

        if (Array.isArray(item.ancestors)) {
            for (const ancestor of item.ancestors) {
                const ancId = String(ancestor.regionId || ancestor.id || ancestor.locationId || '');
                if (ancId && ancId !== itemId && itemMap.has(ancId)) {
                    const candidate = itemMap.get(ancId);
                    if (candidate && !isPoiItem(candidate)) {
                        parentItem = candidate;
                        break;
                    }
                }
            }
        }

        if (!parentItem && Array.isArray(item.locationBreadcrumbs)) {
            for (const crumb of item.locationBreadcrumbs) {
                const cId = String(crumb.locationId || crumb.regionId || crumb.id || '');
                if (cId && cId !== itemId && itemMap.has(cId)) {
                    const candidate = itemMap.get(cId);
                    if (candidate && !isPoiItem(candidate)) {
                        parentItem = candidate;
                        break;
                    }
                }
            }
        }

        if (!parentItem && item.regionId && String(item.regionId) !== itemId && itemMap.has(String(item.regionId))) {
            const candidate = itemMap.get(String(item.regionId));
            if (candidate && !isPoiItem(candidate)) {
                parentItem = candidate;
            }
        }

        if (parentItem && parentItem !== item) {
            const parentKey = String(parentItem.regionId || parentItem.poiId || parentItem.locationId || parentItem.id);
            if (!childrenMap.has(parentKey)) {
                childrenMap.set(parentKey, []);
            }
            childrenMap.get(parentKey).push(item);
        } else {
            // If POI has no parent region in current results, display at root level
            rootItems.push(item);
        }
    });

    return rootItems.map(root => {
        const rootKey = String(root.regionId || root.poiId || root.locationId || root.id);
        const children = childrenMap.get(rootKey) || [];
        return {
            ...root,
            children
        };
    });
};

export const PROPERTY_CATEGORIES = {
    0: { id: 0, name: 'Property', icon: 'domain', tr: 'Tesis' },
    1: { id: 1, name: 'Hotel', icon: 'hotel', tr: 'Otel' },
    2: { id: 2, name: 'Motel', icon: 'hotel', tr: 'Motel' },
    3: { id: 3, name: 'Resort', icon: 'resort', tr: 'Tatil Köyü / Resort' },
    4: { id: 4, name: 'Inn', icon: 'night_shelter', tr: 'Han' },
    5: { id: 5, name: 'Bed & Breakfast', icon: 'bed', tr: 'Oda & Kahvaltı' },
    6: { id: 6, name: 'Guesthouse', icon: 'gite', tr: 'Konukevi' },
    7: { id: 7, name: 'Condo', icon: 'apartment', tr: 'Kat Mülkiyeti (Condo)' },
    8: { id: 8, name: 'All-Inclusive Property', icon: 'spa', tr: 'Her Şey Dahil' },
    9: { id: 9, name: 'Cabin', icon: 'cabin', tr: 'Dağ Evi / Kulübe' },
    10: { id: 10, name: 'Chalet', icon: 'chalet', tr: 'Şale' },
    11: { id: 11, name: 'Cottage', icon: 'cottage', tr: 'Kır Evi' },
    12: { id: 12, name: 'Hostel/Backpacker Accommodation', icon: 'backpack', tr: 'Hostel' },
    13: { id: 13, name: 'Ranch', icon: 'agriculture', tr: 'Çiftlik Evi' },
    14: { id: 14, name: 'Villa', icon: 'villa', tr: 'Villa' },
    15: { id: 15, name: 'Lodge', icon: 'cabin', tr: 'Lodge / Orman Evi' },
    16: { id: 16, name: 'Apartment', icon: 'apartment', tr: 'Apart / Daire' },
    17: { id: 17, name: 'Private Vacation Home', icon: 'house', tr: 'Müstakil Tatil Evi' },
    18: { id: 18, name: 'Houseboat', icon: 'houseboat', tr: 'Yüzen Ev' },
    20: { id: 20, name: 'Ryokan', icon: 'temple_buddhist', tr: 'Ryokan' },
    21: { id: 21, name: 'Tree House Property', icon: 'forest', tr: 'Ağaç Ev' },
    22: { id: 22, name: 'Aparthotel', icon: 'corporate_fare', tr: 'Aparthotel' },
    23: { id: 23, name: 'Condominium Resort', icon: 'holiday_village', tr: 'Tatil Rezidansı' },
    24: { id: 24, name: 'Campsite', icon: 'camping', tr: 'Kamp Alanı' },
    25: { id: 25, name: 'Riad', icon: 'villa', tr: 'Riyad' },
    26: { id: 26, name: 'Hostal', icon: 'night_shelter', tr: 'Hostal' },
    29: { id: 29, name: 'Country House', icon: 'cottage', tr: 'Köy Evi' },
    30: { id: 30, name: 'Pension', icon: 'bed', tr: 'Pansiyon' },
    31: { id: 31, name: 'Pousada (Portugal)', icon: 'castle', tr: 'Pousada' },
    32: { id: 32, name: 'Pousada (Brazil)', icon: 'gite', tr: 'Pousada' },
    33: { id: 33, name: 'Residence', icon: 'domain', tr: 'Rezidans' },
    34: { id: 34, name: 'Affittacamere', icon: 'meeting_room', tr: 'Kiralık Oda' },
    36: { id: 36, name: 'Castle', icon: 'castle', tr: 'Şato / Kale' },
    37: { id: 37, name: 'Safari/Tentalow', icon: 'camping', tr: 'Safari Çadırı' },
    39: { id: 39, name: 'Palace', icon: 'castle', tr: 'Saray' },
    40: { id: 40, name: 'Agritourism Property', icon: 'agriculture', tr: 'Agroturizm' },
    41: { id: 41, name: 'Cruise', icon: 'directions_boat', tr: 'Kruvaziyer / Gemi' },
    42: { id: 42, name: 'Holiday Park', icon: 'holiday_village', tr: 'Tatil Parkı' },
    43: { id: 43, name: 'Capsule hotel', icon: 'meeting_room', tr: 'Kapsül Otel' },
    44: { id: 44, name: 'Mobile home', icon: 'rv_hookup', tr: 'Karavan / Mobil Ev' },
};

/**
 * Returns icon and localized category name for a property based on its categoryId or category name.
 */
export const getPropertyCategoryMeta = (item, lang = 'tr') => {
    let rawId = item?.categoryId ?? item?.category;
    let numericId = null;

    if (typeof rawId === 'number') {
        numericId = rawId;
    } else if (typeof rawId === 'string' && /^\d+$/.test(rawId.trim())) {
        numericId = parseInt(rawId.trim(), 10);
    }

    if (numericId !== null && PROPERTY_CATEGORIES[numericId]) {
        const cat = PROPERTY_CATEGORIES[numericId];
        return {
            id: cat.id,
            name: lang === 'tr' ? cat.tr : cat.name,
            icon: cat.icon
        };
    }

    // Fallback search by string name
    const text = String(item?.category || item?.name?.searchName || item?.name || '').toLowerCase();
    for (const cat of Object.values(PROPERTY_CATEGORIES)) {
        if (text.includes(cat.name.toLowerCase())) {
            return {
                id: cat.id,
                name: lang === 'tr' ? cat.tr : cat.name,
                icon: cat.icon
            };
        }
    }

    return {
        id: 1,
        name: lang === 'tr' ? 'Otel' : 'Hotel',
        icon: 'hotel'
    };
};

/**
 * Resolves the primary localized display name of an item (region, hotel, POI).
 */
export const getItemPrimaryName = (item, currentLang = 'tr') => {
    if (!item) return '';
    const nameObj = item.names || item.name;
    if (typeof nameObj === 'string') return nameObj.trim();
    if (nameObj && typeof nameObj === 'object') {
        const val = nameObj.translations?.[currentLang] 
            || nameObj.translations?.tr
            || nameObj.translations?.en
            || nameObj[currentLang]
            || nameObj.tr
            || nameObj.en
            || nameObj.defaultName
            || Object.values(nameObj.translations || {})[0];
        if (typeof val === 'string' && val.trim()) return val.trim();
    }
    if (typeof item.defaultName === 'string') return item.defaultName.trim();
    return '';
};

/**
 * Normalizes text for comparison (handles Turkish characters like I/İ/ı/i)
 */
const normalizeTextForCompare = (txt) => {
    if (!txt) return '';
    return String(txt)
        .trim()
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .toLowerCase();
};

/**
 * Extracts and cleans the ancestor/breadcrumb parts for an item (region, hotel, POI).
 * Filters out synthetic areas like "(and vicinity)", continents, and deduplicates names.
 * Returns an array ordered from immediate parent -> higher parent -> country (leaf-to-root).
 */
export const getLocationHierarchyParts = (item, currentLang = 'tr') => {
    if (!item) return [];

    let nodes = [];
    if (Array.isArray(item.ancestors) && item.ancestors.length > 0) {
        nodes = item.ancestors;
    } else if (Array.isArray(item.locationBreadcrumbs) && item.locationBreadcrumbs.length > 0) {
        nodes = item.locationBreadcrumbs;
    }

    let rawParts = [];
    if (nodes.length > 0) {
        const firstType = (nodes[0]?.type || nodes[0]?.locationType || '').toLowerCase();
        const lastType = (nodes[nodes.length - 1]?.type || nodes[nodes.length - 1]?.locationType || '').toLowerCase();
        
        let orderedNodes = [...nodes];
        // If the first item is country, then it is root-to-leaf (Country -> Province -> City), so reverse it to leaf-to-root
        if (firstType === 'country' && lastType !== 'country') {
            orderedNodes.reverse();
        }

        for (const node of orderedNodes) {
            const nodeType = (node.type || node.locationType || '').toLowerCase();
            // Skip continents or high level world regions
            if (nodeType === 'continent' || nodeType === 'high_level_region') continue;

            let nameStr = typeof node.name === 'string' 
                ? node.name 
                : (node.name?.translations?.[currentLang] || node.name?.translations?.tr || node.name?.translations?.en || node.name?.defaultName || '');

            if (!nameStr) continue;

            // Clean noise like "(and vicinity)" or "(civarı)"
            nameStr = nameStr
                .replace(/\s*\([^)]*(?:vicinity|civarı|metropolitan|metro area)[^)]*\)/gi, '')
                .trim();

            if (nameStr) {
                rawParts.push(nameStr);
            }
        }
    } else if (item.locationPath && typeof item.locationPath === 'string') {
        rawParts = item.locationPath.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Deduplicate sequentially and case-insensitively while preserving original casing
    const primaryName = getItemPrimaryName(item, currentLang);
    const primaryNorm = normalizeTextForCompare(primaryName);
    const seen = new Set();
    if (primaryNorm) {
        seen.add(primaryNorm);
    }

    const cleanParts = [];
    for (const part of rawParts) {
        const norm = normalizeTextForCompare(part);
        if (norm && !seen.has(norm)) {
            seen.add(norm);
            cleanParts.push(part);
        }
    }

    return cleanParts;
};

/**
 * Returns formatted subtitle for dropdown items (e.g., "Istanbul, Türkiye").
 */
export const getRegionSubtitle = (item, currentLang = 'tr') => {
    if (!item) return '';
    const parts = getLocationHierarchyParts(item, currentLang);
    if (parts.length > 0) {
        return parts.join(', ');
    }
    if (item.countryCode) {
        return item.countryCode;
    }
    return '';
};

/**
 * Returns complete formatted display name for the search input textbox
 * (e.g. "Üsküdar, Istanbul, Türkiye" or "Olen Üsküdar Hotel, Istanbul, Türkiye").
 */
export const formatLocationFullName = (item, currentLang = 'tr') => {
    if (!item) return '';
    const primaryName = getItemPrimaryName(item, currentLang);
    const hierarchyParts = getLocationHierarchyParts(item, currentLang);

    if (!primaryName) {
        return hierarchyParts.join(', ');
    }
    if (hierarchyParts.length === 0) {
        if (item.countryCode && primaryName.toLowerCase() !== item.countryCode.toLowerCase()) {
            return `${primaryName}, ${item.countryCode}`;
        }
        return primaryName;
    }

    return [primaryName, ...hierarchyParts].join(', ');
};

/**
 * Builds URL-friendly hierarchical slug (e.g. "istanbul/uskudar")
 */
export const buildLocationSlug = (item, currentLang = 'tr') => {
    if (!item) return 'destination';
    const primary = getItemPrimaryName(item, currentLang);
    const hierarchy = getLocationHierarchyParts(item, currentLang);
    
    // Exclude country from slug if other parts exist
    const nonCountry = hierarchy.filter(h => {
        const lower = h.toLowerCase();
        const cCode = (item.countryCode || '').toLowerCase();
        return lower !== cCode && lower !== 'türkiye' && lower !== 'turkey';
    });

    const slugParts = [...nonCountry.reverse(), primary].filter(Boolean);
    if (slugParts.length > 0) {
        return slugParts
            .map(s => s.toLowerCase()
                .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
            )
            .filter(Boolean)
            .join('/');
    }
    return (primary || 'destination').toLowerCase();
};

