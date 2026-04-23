import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b/v1';

export const agencyService = {
    getMe: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/agency/me`, { signal });
    },

    updateAgency: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/agency/update-by-id/${id}`, data);
    }
};
