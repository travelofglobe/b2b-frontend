import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

let agencyMePromise = null;
let agencyMeCacheTime = 0;
const ME_CACHE_TTL_MS = 60000; // 1 minute in-memory cache

export const agencyService = {
    getMe: async (signal) => {
        const now = Date.now();
        if (agencyMePromise && (now - agencyMeCacheTime < ME_CACHE_TTL_MS)) {
            return agencyMePromise;
        }
        agencyMeCacheTime = now;
        agencyMePromise = apiClient.get(`${API_BASE_URL}/agency/me`, { signal });
        try {
            return await agencyMePromise;
        } catch (e) {
            agencyMePromise = null;
            agencyMeCacheTime = 0;
            throw e;
        }
    },

    clearMeCache: () => {
        agencyMePromise = null;
        agencyMeCacheTime = 0;
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

    getDashboardSummary: async (period = 'TODAY', refresh = false) => {
        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (refresh) params.append('refresh', 'true');
        return apiClient.get(`${API_BASE_URL}/dashboard/gsa-summary?${params.toString()}`);
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

    createSubAgencyUser: async (data) => {
        return apiClient.post(`${API_BASE_URL}/sub-agency-user`, data);
    },

    assignSubAgencyRole: async (data) => {
        return apiClient.post(`${API_BASE_URL}/sub-agency-user/assign-role`, data);
    },

    getLogo: async (signal) => {
        const token = localStorage.getItem('accessToken');
        const lang = localStorage.getItem('language') || 'tr';
        const response = await fetch(`${API_BASE_URL}/agency/get-logo`, {
            method: 'GET',
            headers: {
                'Accept-Language': lang === 'tr' ? 'tr-TR' : 'en-US',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            signal
        });
        if (response.status === 404 || response.status === 204) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch logo (${response.status})`);
        }
        const blob = await response.blob();
        if (!blob || blob.size === 0) return null;
        return blob;
    },

    uploadLogo: async (file) => {
        const token = localStorage.getItem('accessToken');
        const lang = localStorage.getItem('language') || 'tr';
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/agency/upload-logo`, {
            method: 'PUT',
            headers: {
                'Accept-Language': lang === 'tr' ? 'tr-TR' : 'en-US',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            let errorMsg = `Upload failed (${response.status})`;
            try {
                const errData = await response.json();
                if (errData?.message) errorMsg = errData.message;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return true;
    },

    deleteLogo: async () => {
        const token = localStorage.getItem('accessToken');
        const lang = localStorage.getItem('language') || 'tr';
        const response = await fetch(`${API_BASE_URL}/agency/delete-logo`, {
            method: 'DELETE',
            headers: {
                'Accept-Language': lang === 'tr' ? 'tr-TR' : 'en-US',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok && response.status !== 204) {
            let errorMsg = `Delete failed (${response.status})`;
            try {
                const errData = await response.json();
                if (errData?.message) errorMsg = errData.message;
            } catch (_) {}
            throw new Error(errorMsg);
        }
        return true;
    }
};
