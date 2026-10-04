import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

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
