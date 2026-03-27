import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const locationService = {
    fetchBreadcrumb: async (locationId) => {
        return apiClient.get(`${API_BASE_URL}/location/breadcrumb/${locationId}`);
    },

    fetchLocationDetails: async (locationId) => {
        return apiClient.get(`${API_BASE_URL}/location/${locationId}`);
    }
};
