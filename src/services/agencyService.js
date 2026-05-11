import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const agencyService = {
    getMe: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/agency/me`, { signal });
    },

    updateAgency: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/agency/update-by-id/${id}`, data);
    },

    getAgencies: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/agency/find-all-by-parent-id`, { signal });
    },

    filterAgencies: async (params, signal) => {
        const { page = 0, size = 20, ...data } = params;
        return apiClient.post(`${API_BASE_URL}/agency/filter?page=${page}&size=${size}`, data, { signal });
    },

    getSummary: async () => {
        return apiClient.get(`${API_BASE_URL}/agency/get-summary`);
    },

    createAgency: async (data) => {
        return apiClient.post(`${API_BASE_URL}/agency`, data);
    },

    deleteAgency: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/agency/${id}`);
    },

    filterSubAgencyUsers: async (params, signal) => {
        const { page = 0, size = 10, ...data } = params;
        return apiClient.post(`${API_BASE_URL}/sub-agency-user/filter?page=${page}&size=${size}`, data, { signal });
    },

    updateSubAgencyUser: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/sub-agency-user/update-by-id/${id}`, data);
    },

    deleteSubAgencyUser: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/sub-agency-user/${id}`);
    },

    assignSubAgencyRole: async (data) => {
        return apiClient.post(`${API_BASE_URL}/sub-agency-user/assign-role`, data);
    }
};
