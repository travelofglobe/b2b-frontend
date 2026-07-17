import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend/v1';

export const agencyApplicationService = {
    submitApplication: async (data) => {
        // Submit endpoint does not use authorization token
        return apiClient.post(`${API_BASE_URL}/agency-application`, data);
    },

    checkDuplicateTax: async (taxNumber) => {
        return apiClient.get(`${API_BASE_URL}/agency-application/check-duplicate-tax?taxNumber=${encodeURIComponent(taxNumber)}`);
    },

    checkDuplicateEmail: async (email) => {
        return apiClient.get(`${API_BASE_URL}/agency-application/check-duplicate-email?email=${encodeURIComponent(email)}`);
    }
};
