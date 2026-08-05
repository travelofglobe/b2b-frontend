import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const favoriteService = {
    getFavorites: async (page = 0, size = 10, query = '', status = '', signal) => {
        const params = new URLSearchParams({ page, size });
        if (query) params.append('query', query);
        if (status) params.append('status', status);
        return apiClient.get(`${API_BASE_URL}/favorite-hotel?${params.toString()}`, { signal });
    },
    addFavorite: async (hotelData) => {
        return apiClient.post(`${API_BASE_URL}/favorite-hotel`, hotelData);
    },
    toggleStatus: async (id) => {
        return apiClient.put(`${API_BASE_URL}/favorite-hotel/${id}/status`);
    },
    deleteFavorite: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/favorite-hotel/${id}`);
    },
    deleteByHotelId: async (hotelId) => {
        return apiClient.delete(`${API_BASE_URL}/favorite-hotel/by-hotel/${hotelId}`);
    },
    getActiveHotelIds: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/favorite-hotel/active-hotel-ids`, { signal });
    },
    searchHotelsForAdd: async (query, signal) => {
        return apiClient.get(`${API_BASE_URL}/favorite-hotel/search-hotels?query=${encodeURIComponent(query)}`, { signal });
    }
};
