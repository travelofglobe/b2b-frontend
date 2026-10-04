import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

export const currencyService = {
    listActiveCurrencies: async (signal) => {
        return apiClient.get(`${API_BASE_URL}/currency/list-active-currencies`, { signal });
    }
};
