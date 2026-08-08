import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

let activeHotelIdsPromise = null;
let activeHotelIdsCacheTime = 0;
const FAVORITES_CACHE_TTL_MS = 60000; // 1 minute in-memory cache

const clearActiveHotelIdsCache = () => {
    activeHotelIdsPromise = null;
    activeHotelIdsCacheTime = 0;
};

export const favoriteService = {
    getFavorites: async (page = 0, size = 10, query = '', status = '', signal) => {
        const params = new URLSearchParams({ page, size });
        if (query) params.append('query', query);
        if (status) params.append('status', status);
        return apiClient.get(`${API_BASE_URL}/favorite-hotel?${params.toString()}`, { signal });
    },
    addFavorite: async (hotelData) => {
        clearActiveHotelIdsCache();
        return apiClient.post(`${API_BASE_URL}/favorite-hotel`, hotelData);
    },
    toggleStatus: async (id) => {
        clearActiveHotelIdsCache();
        return apiClient.put(`${API_BASE_URL}/favorite-hotel/${id}/status`);
    },
    deleteFavorite: async (id) => {
        clearActiveHotelIdsCache();
        return apiClient.delete(`${API_BASE_URL}/favorite-hotel/${id}`);
    },
    deleteByHotelId: async (hotelId) => {
        clearActiveHotelIdsCache();
        return apiClient.delete(`${API_BASE_URL}/favorite-hotel/by-hotel/${hotelId}`);
    },
    getActiveHotelIds: async (signal) => {
        const now = Date.now();
        if (activeHotelIdsPromise && (now - activeHotelIdsCacheTime < FAVORITES_CACHE_TTL_MS)) {
            return activeHotelIdsPromise;
        }
        activeHotelIdsCacheTime = now;
        activeHotelIdsPromise = apiClient.get(`${API_BASE_URL}/favorite-hotel/active-hotel-ids`, { signal });
        try {
            return await activeHotelIdsPromise;
        } catch (e) {
            clearActiveHotelIdsCache();
            throw e;
        }
    },
    clearActiveHotelIdsCache,
    searchHotelsForAdd: async (query, signal) => {
        return apiClient.get(`${API_BASE_URL}/favorite-hotel/search-hotels?query=${encodeURIComponent(query)}`, { signal });
    }
};
