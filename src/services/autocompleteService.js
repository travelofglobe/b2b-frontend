import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

export const autocompleteService = {
    search: async (data, signal) => {
        return apiClient.post(`${API_BASE_URL}/autocomplete/search`, data, { signal });
    },
    getSearchHistory: async () => {
        return apiClient.get(`${API_BASE_URL}/autocomplete/history`);
    },
    saveSearchHistory: async (data) => {
        return apiClient.post(`${API_BASE_URL}/autocomplete/history`, data);
    },
    clearSearchHistory: async () => {
        return apiClient.delete(`${API_BASE_URL}/autocomplete/history`);
    },
    deleteSearchHistoryItem: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/autocomplete/history/${id}`);
    }
};
