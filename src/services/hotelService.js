import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/hotel-hub/v1/b2b/hotels';

export const hotelService = {
    /**
     * Search for hotels using content-search endpoint.
     * @param {Object} params 
     * @param {number|string} params.locationId - Location ID for filtering
     * @param {number} params.page - Page number (starting from 0)
     * @param {number} params.size - Items per page
     * @param {Object} [params.geo] - Geo bounding box (topLeft, bottomRight)
     */
    searchHotels: async ({ locationId, page = 0, size = 10, geo = null, zoom = null, filters = {} }) => {
        const body = {
            geo: geo || null,
            zoom: zoom,
            filters: {
                locationIds: locationId ? [parseInt(locationId)] : null,
                hotelName: null,
                citySlug: null,
                countryCode: null,
                facilityCategoryIds: null,
                hotelStarCategoryIds: filters.hotelStarCategoryIds || null,
                preferred: null,
                exclusive: null,
                direct: null,
                fireSafety: null,
                isNewProperty: null,
                isExpedia: null,
                hasFreeCancellation: filters.hasFreeCancellation ?? null,
                hasPrePayment: filters.hasPrePayment ?? null,
                isRecommended: null,
                builtYear: null,
                renovationYear: null,
                roomCount: null,
                rating: null,
                price: null,
                score: null,
                starList: null,
                locationPathNames: null
            },
            page: {
                page: page,
                size: size
            },
            sort: null
        };

        return apiClient.post(`${API_BASE_URL}/search`, body);
    }
};
