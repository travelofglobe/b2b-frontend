import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://37.148.213.4:8000/b2b-backend/v1';

export const locationService = {
    fetchBreadcrumb: async (locationId) => {
        return apiClient.get(`${API_BASE_URL}/location/breadcrumb/${locationId}`);
    },

    fetchLocationDetails: async (locationId) => {
        return apiClient.get(`${API_BASE_URL}/location/${locationId}`);
    }
};
