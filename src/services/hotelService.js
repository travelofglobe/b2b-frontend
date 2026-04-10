import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/hotel-hub/v1/b2b/hotels';

// Persistent cache for facility names during the session
const facilityCache = {};

export const hotelService = {
    /**
     * Search for hotels using content-search endpoint.
     * @param {Object} params 
     * @param {number|string} params.locationId - Location ID for filtering
     * @param {number} params.page - Page number (starting from 0)
     * @param {number} params.size - Items per page
     * @param {Object} [params.geo] - Geo bounding box (topLeft, bottomRight)
     */
    searchHotels: async ({ locationId, page = 0, size = 10, geo = null, zoom = null, filters = {}, signal = null }) => {
        const body = {
            geo: geo || null,
            zoom: zoom,
            filters: {
                locationIds: filters.locationIds?.length > 0 ? filters.locationIds : (locationId ? [parseInt(locationId)] : null),
                hotelName: null,
                citySlug: null,
                countryCode: null,
                facilityCategoryIds: null,
                hotelStarCategoryIds: filters.stars || filters.hotelStarCategoryIds || null,
                preferred: null,
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
                isRecommended: null,
                builtYear: null,
                renovationYear: null,
                roomCount: null,
                rating: null,
                price: null,
                score: null,
                starList: null,
                locationPathNames: null,
                hotelFacilityIds: filters.facilities || null
            },
            page: {
                page: page,
                size: size
            },
            sort: null
        };

        return apiClient.post(`${API_BASE_URL}/search`, body, { signal });
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
                const response = await apiClient.post(`http://72.62.17.189:8000/hotel-hub/v1/b2b/hotel-facility/search`, body);
                
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
    }
};
