import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b/v1/hotels`;

// Persistent cache for facility names during the session
const facilityCache = {};

/**
 * Normalise a date value to the yyyy-MM-dd string format expected by the backend.
 * Accepts a Date object, an ISO string, or any string already in yyyy-MM-dd format.
 * Returns null if the value is falsy or cannot be parsed.
 * @param {string|Date|null|undefined} value
 * @returns {string|null}
 */
const formatDate = (value, defaultValue = null) => {
    if (!value || value === 'null' || value === 'undefined') return defaultValue;
    try {
        // If it's already a yyyy-MM-dd string, return as-is
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
            return value.trim();
        }
        const d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) return defaultValue;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return defaultValue;
    }
};

const getDefaultRequestDates = () => {
    const checkin = new Date();
    checkin.setDate(checkin.getDate() + 2);
    const checkout = new Date(checkin);
    checkout.setDate(checkout.getDate() + 1);
    
    return {
        checkin: formatDate(checkin),
        checkout: formatDate(checkout)
    };
};

export const hotelService = {
    /**
     * Search for hotels using content-search endpoint.
     * @param {Object} params 
     * @param {number|string} params.locationId - Location ID for filtering
     * @param {number} params.page - Page number (starting from 0)
     * @param {number} params.size - Items per page
     * @param {Object} [params.geo] - Geo bounding box (topLeft, bottomRight)
     */
    searchHotels: async ({ locationId, regionId, regionIds, page = 0, size = 20, geo = null, zoom = null, filters = {}, searchCriteria = null, sort = null, signal = null }) => {
        const defaults = getDefaultRequestDates();
        const effectiveRegionId = regionId || filters.regionId || (locationId ? String(locationId) : null);
        const effectiveRegionIds = filters.regionIds?.length > 0
            ? filters.regionIds
            : (regionIds?.length > 0 ? regionIds : (filters.locationIds?.length > 0 ? filters.locationIds : (effectiveRegionId ? [effectiveRegionId] : null)));

        const body = {
            geo: geo || null,
            zoom: zoom,
            searchCriteria: searchCriteria
                ? {
                    ...searchCriteria,
                    checkin: formatDate(searchCriteria.checkin, defaults.checkin),
                    checkout: formatDate(searchCriteria.checkout, defaults.checkout),
                    nationality: searchCriteria.nationality || 'TR',
                    rooms: searchCriteria.rooms || [{ adults: 2, children: 0, childAges: [] }]
                }
                : {
                    checkin: defaults.checkin,
                    checkout: defaults.checkout,
                    nationality: 'TR',
                    rooms: [{ adults: 2, children: 0, childAges: [] }]
                },
            filters: {
                regionIds: effectiveRegionIds,
                togIds: filters.togIds || filters.hotelIds || null,
                hotelName: null,
                citySlug: null,
                countryCode: null,
                facilityCategoryIds: null,
                hotelStarCategoryIds: filters.stars || filters.hotelStarCategoryIds || null,
                preferred: filters.preferred ?? null,
                exclusive: null,
                direct: null,
                fireSafety: null,
                isNewProperty: null,
                isExpedia: null,
                hasFreeCancellation: filters.hasFreeCancellation ?? null,
                hasPrePayment: filters.hasPrePayment ?? null,
                roomTwin: filters.roomTwin ?? null,
                roomMaxAdultIds: filters.roomMaxAdult || null,
                roomMaxChildrenIds: filters.roomMaxChildren || null,
                roomMaxExtraBedIds: filters.roomMaxExtraBed || null,
                roomPaxCapacityIds: filters.roomPaxCapacity || null,
                isRecommended: filters.isRecommended ?? null,
                builtYear: null,
                renovationYear: null,
                roomCount: null,
                rating: null,
                price: null,
                score: null,
                starList: null,
                locationPathNames: null,
                hotelFacilityIds: filters.facilities || null,
                hotelIds: filters.hotelIds || null
            },
            page: {
                page: page,
                size: size
            },
            sort: sort
        };

        return apiClient.post(`${API_BASE_URL}/search`, body, { signal });
    },

    /**
     * Search for lightweight map markers and clusters.
     */
    searchHotelMapMarkers: async ({ locationId, regionId, regionIds, geo = null, zoom = 12, limit = 60, filters = {}, searchCriteria = null, forceMarkers = false, signal = null }) => {
        const defaults = getDefaultRequestDates();
        const effectiveRegionId = regionId || filters.regionId || (locationId ? String(locationId) : null);
        const effectiveRegionIds = filters.regionIds?.length > 0
            ? filters.regionIds
            : (regionIds?.length > 0 ? regionIds : (filters.locationIds?.length > 0 ? filters.locationIds : (effectiveRegionId ? [effectiveRegionId] : null)));

        const body = {
            geo: geo || null,
            zoom: zoom,
            limit: limit,
            forceMarkers: forceMarkers,
            searchCriteria: searchCriteria
                ? {
                    ...searchCriteria,
                    checkin: formatDate(searchCriteria.checkin, defaults.checkin),
                    checkout: formatDate(searchCriteria.checkout, defaults.checkout),
                    nationality: searchCriteria.nationality || 'TR',
                    rooms: searchCriteria.rooms || [{ adults: 2, children: 0, childAges: [] }]
                }
                : {
                    checkin: defaults.checkin,
                    checkout: defaults.checkout,
                    nationality: 'TR',
                    rooms: [{ adults: 2, children: 0, childAges: [] }]
                },
            filters: {
                regionIds: effectiveRegionIds,
                togIds: filters.togIds || filters.hotelIds || null,
                hotelStarCategoryIds: filters.stars || filters.hotelStarCategoryIds || null,
                preferred: filters.preferred ?? null,
                hasFreeCancellation: filters.hasFreeCancellation ?? null,
                hasPrePayment: filters.hasPrePayment ?? null,
                isRecommended: filters.isRecommended ?? null,
                hotelFacilityIds: filters.facilities || null,
                score: filters.score || null,
                rating: filters.rating || null
            }
        };

        return apiClient.post(`${API_BASE_URL}/map`, body, { signal });
    },

    /**
     * Fetch facility names by their IDs.
     * @param {number[]} facilityIds 
     */
    fetchFacilityNames: async (facilityIds) => {
        if (!facilityIds || facilityIds.length === 0) return [];

        // 1. Identify IDs not in cache
        const missingIds = facilityIds.filter(id => !facilityCache[id]);
        
        // 2. Fetch missing ones if any
        if (missingIds.length > 0) {
            try {
                const body = { facilityIds: missingIds };
                const response = await apiClient.post(`${API_BASE_URL}/facilities/search`, body);
                
                if (response && Array.isArray(response)) {
                    response.forEach(fac => {
                        facilityCache[fac.facilityId] = fac;
                    });
                }
            } catch (error) {
                console.error('Error fetching facility names:', error);
            }
        }

        // 3. Construct result from cache
        return facilityIds
                .map(id => facilityCache[id])
                .filter(Boolean); // Only return found ones
    },

    /**
     * Search for rooms/details for a specific hotel.
     * @param {Object} params
     * @param {number} params.hotelId
     * @param {Object} params.searchCriteria
     */
    searchRooms: async ({ hotelId, searchCriteria, signal = null }) => {
        const defaults = getDefaultRequestDates();
        const body = {
            filters: {
                hotelIds: [parseInt(hotelId)]
            },
            searchCriteria: {
                ...searchCriteria,
                checkin: formatDate(searchCriteria.checkin, defaults.checkin),
                checkout: formatDate(searchCriteria.checkout, defaults.checkout),
                nationality: searchCriteria.nationality || 'TR',
                rooms: searchCriteria.rooms || [{ adults: 2, children: 0, childAges: [] }]
            }
        };

        return apiClient.post(`${API_BASE_URL}/rooms/search`, body, { signal });
    },

    /**
     * Book a hotel reservation.
     * @param {Object} request - HubBookRequestModel
     */
    book: async (request) => {
        return apiClient.post(`${API_BASE_URL}/book`, request);
    },

    /**
     * Check rates for selected rooms.
     * @param {Object} request - HubCheckRatesRequestModel
     */
    checkRates: async (request) => {
        return apiClient.post(`${API_BASE_URL}/check-rates`, request);
    },

    /**
     * Save checkout session.
     * @param {string} sessionId
     * @param {Object} sessionData
     */
    saveCheckoutSession: async (sessionId, sessionData) => {
        return apiClient.post(`${API_BASE_URL}/checkout/session/${sessionId}`, sessionData);
    },

    /**
     * Get checkout session.
     * @param {string} sessionId
     */
    getCheckoutSession: async (sessionId) => {
        return apiClient.get(`${API_BASE_URL}/checkout/session/${sessionId}`);
    },

    /**
     * Delete checkout session.
     * @param {string} sessionId
     */
    deleteCheckoutSession: async (sessionId) => {
        return apiClient.delete(`${API_BASE_URL}/checkout/session/${sessionId}`);
    },

    /**
     * Get hotel detail.
     * @param {number|string} hotelId
     */
    getHotelDetail: async (hotelId, signal = null) => {
        return apiClient.get(`${API_BASE_URL}/detail/${hotelId}`, { signal });
    },

    /**
     * Cancel a hotel booking.
     * Call first with simulation: true to get penalty/refund preview,
     * then with simulation: false to execute the actual cancellation.
     * @param {Object} request
     * @param {string} request.voucher
     * @param {string[]} request.roomConfirmationCodes
     * @param {boolean} request.simulation
     * @param {string} request.cancelReason
     * @param {string} request.bookingUuid
     * @param {string} [request.cancelNote]
     */
    cancelBooking: async (request) => {
        return apiClient.post(
            `${ENV.API_GATEWAY_URL}/b2b-backend/v1/hotels/book/cancel`,
            request
        );
    }
};


