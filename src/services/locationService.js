import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b/v1';

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
