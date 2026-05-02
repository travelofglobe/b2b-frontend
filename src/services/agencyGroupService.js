import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const agencyGroupService = {
    filterGroups: async (params, signal) => {
        const { page = 0, size = 10, ...data } = params;
        return apiClient.post(`${API_BASE_URL}/agency-group/filter?page=${page}&size=${size}`, data, { signal });
    },

    getSummary: async () => {
        return apiClient.get(`${API_BASE_URL}/agency-group/summary`);
    },
    
    // Placeholder for upcoming services (create, update, delete will be added as user provides them)
    createGroup: async (data) => {
        return apiClient.post(`${API_BASE_URL}/agency-group`, data);
    },
    
    updateGroup: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/agency-group/update-by-id/${id}`, data);
    },
    
    deleteGroup: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/agency-group/${id}`);
    }
};
