import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b/v1/pois`;

export const poiService = {
    /**
     * Search POI markers within a geographic bounding box.
     * @param {Object} params
     * @param {Object} params.geo - { topLeft: { lat, lon }, bottomRight: { lat, lon } }
     * @param {number} [params.zoom]
     * @param {number} [params.limit]
     * @param {string} [params.category]
     * @param {AbortSignal} [params.signal]
     */
    searchPoiMapMarkers: async ({ geo, zoom = 12, limit = 100, category = null, categories = null, signal = null }) => {
        if (!geo) return { pois: [], totalCount: 0 };
        const body = {
            geo,
            zoom,
            limit,
            category,
            categories
        };
        const res = await apiClient.post(`${API_BASE_URL}/map`, body, { signal });
        return res?.data || res || { pois: [], totalCount: 0 };
    }
};
