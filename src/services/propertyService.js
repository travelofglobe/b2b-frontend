import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b/v1/properties`;

export const propertyService = {
    /**
     * Get property detail by internal canonical togId.
     * @param {number|string} togId
     * @param {AbortSignal} [signal]
     */
    getPropertyDetail: async (togId, signal = null) => {
        return apiClient.get(`${API_BASE_URL}/detail/${togId}`, { signal });
    },

    /**
     * Get lightweight property booking summary (hero image, star rating, address, images count)
     * optimized for booking detail screens.
     * @param {number|string} togId
     * @param {AbortSignal} [signal]
     */
    getPropertyBookingSummary: async (togId, signal = null) => {
        return apiClient.get(`${API_BASE_URL}/tog/${togId}/booking-summary`, { signal });
    }
};

export default propertyService;
