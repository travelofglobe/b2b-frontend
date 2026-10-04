import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

const breadcrumbCache = new Map();

export const locationService = {
    fetchBreadcrumb: async (locationId) => {
        if (breadcrumbCache.has(locationId)) {
            return breadcrumbCache.get(locationId);
        }
        const promise = apiClient.get(`${API_BASE_URL}/location/breadcrumb/${locationId}`);
        breadcrumbCache.set(locationId, promise);
        
        try {
            return await promise;
        } catch (e) {
            breadcrumbCache.delete(locationId);
            throw e;
        }
    },

    fetchLocationDetails: async (locationId) => {
        return apiClient.get(`${API_BASE_URL}/location/${locationId}`);
    },

    listCountries: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/location/list-countries`, { signal });
    },

    listSubRegions: async (locationId, signal) => {
        return apiClient.get(`${API_BASE_URL}/location/list-sub-regions/${locationId}`, { signal });
    }
};
