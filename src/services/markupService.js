import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

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
    }
};
