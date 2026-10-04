import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

export const markupService = {
    filterMarkups: async (params, signal) => {
        const { page = 0, size = 10, ...data } = params;
        return apiClient.post(`${API_BASE_URL}/markup/filter?page=${page}&size=${size}`, data, { signal });
    },

    updateStatus: async (id, status) => {
        return apiClient.put(`${API_BASE_URL}/markup/update-status/${id}`, { status });
    },

    deleteMarkup: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/markup/${id}`);
    },

    createMarkup: async (data) => {
        return apiClient.post(`${API_BASE_URL}/markup`, data);
    },

    updateMarkup: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/markup/update-by-id/${id}`, data);
    }
};
