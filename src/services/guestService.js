import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const guestService = {
    getSummary: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/agency-crm-guest/summary`, { signal });
    },
    filterGuests: async (data, page = 0, size = 10, signal) => {
        return apiClient.post(`${API_BASE_URL}/agency-crm-guest/filter?page=${page}&size=${size}`, data, { signal });
    },
    saveGuest: async (data) => {
        return apiClient.post(`${API_BASE_URL}/agency-crm-guest`, data);
    },
    updateGuest: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/agency-crm-guest/update-by-id/${id}`, data);
    },
    deleteGuest: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/agency-crm-guest/${id}`);
    }
};
