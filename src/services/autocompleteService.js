import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const autocompleteService = {
    search: async (data, signal) => {
        return apiClient.post(`${API_BASE_URL}/autocomplete/search`, data, { signal });
    }
};
