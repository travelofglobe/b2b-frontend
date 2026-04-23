import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const userService = {
    getSummary: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/agency-user/summary`, { signal });
    },
    filterUsers: async (data, page = 0, size = 10, signal) => {
        return apiClient.post(`${API_BASE_URL}/agency-user/filter?page=${page}&size=${size}`, data, { signal });
    },
    saveUser: async (data) => {
        return apiClient.post(`${API_BASE_URL}/agency-user`, data);
    },
    updateUser: async (id, data) => {
        return apiClient.put(`${API_BASE_URL}/agency-user/update-by-id/${id}`, data);
    },
    deleteUser: async (id) => {
        return apiClient.delete(`${API_BASE_URL}/agency-user/${id}`);
    },
    updatePassword: async (id, password) => {
        return apiClient.put(`${API_BASE_URL}/agency-user/update-password/${id}`, { password });
    },
    assignRoles: async (agencyUserId, roleIds) => {
        return apiClient.post(`${API_BASE_URL}/agency-user/assign-role`, { agencyUserId, roleIds });
    }
};

export const roleService = {
    filterRoles: async (page = 0, size = 100) => {
        return apiClient.post(`${API_BASE_URL}/role/filter?page=${page}&size=${size}`, { status: 'ACTIVE' });
    }
};
