import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const FINANCE_API_BASE = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

export const financeService = {
    /**
     * Fetches paginated account transactions with optional filters.
     * @param {Object} filters  - e.g. { status: 'ACTIVE', startDate: '...', endDate: '...' }
     * @param {number} page     - 0-indexed page number
     * @param {number} size     - page size
     * @param {string} sort     - sort param, defaults to createDateTime,desc
     * @param {AbortSignal} signal
     */
    filterTransactions: async (filters = {}, page = 0, size = 10, sort = 'createDateTime,desc', signal) => {
        return apiClient.post(
            `${FINANCE_API_BASE}/account-transaction/filter?page=${page}&size=${size}&sort=${sort}`,
            filters,
            { signal }
        );
    },

    /**
     * Fetches paginated detail rows for a single account transaction.
     * @param {Object} filters  - { accountId, accountTransactionId, startDate, endDate, orderStatus, supplierId, transactionType }
     * @param {number} page
     * @param {number} size
     * @param {string} sort
     * @param {AbortSignal} signal
     */
    filterTransactionDetails: async (filters = {}, page = 0, size = 10, sort = 'createDateTime,desc', signal) => {
        return apiClient.post(
            `${FINANCE_API_BASE}/account-transaction/detail/filter?page=${page}&size=${size}&sort=${sort}`,
            filters,
            { signal }
        );
    },

    // ─── Limit Management ────────────────────────────────────────────────────

    /**
     * Fetch paginated agency limits with optional filters.
     * @param {Object} filters - { query, status, agencyType, currency }
     * @param {number} page
     * @param {number} size
     * @param {AbortSignal} signal
     */
    filterLimits: async (filters = {}, page = 0, size = 10, signal) => {
        return apiClient.post(
            `${FINANCE_API_BASE}/agency-limit/filter?page=${page}&size=${size}`,
            filters,
            { signal }
        );
    },

    /**
     * Create a new agency limit.
     * @param {{ agencyId: number, creditLimit: number, usedLimit: number }} data
     */
    createLimit: async (data) => {
        return apiClient.post(`${FINANCE_API_BASE}/agency-limit`, data);
    },

    /**
     * Update an existing agency limit (creditLimit and/or status).
     * @param {number} id
     * @param {{ creditLimit?: number, status?: string }} data
     */
    updateLimit: async (id, data) => {
        return apiClient.put(`${FINANCE_API_BASE}/agency-limit/${id}`, data);
    },

    /**
     * Fetch the limit summary for the logged-in user's hierarchy.
     */
    getLimitSummary: async (signal) => {
        return apiClient.post(
            `${FINANCE_API_BASE}/agency-limit/get-limit-summary`,
            {},
            { signal }
        );
    },

    /**
     * Fetch active currencies list for currency selector.
     */
    listActiveCurrencies: async (signal) => {
        return apiClient.get(`${FINANCE_API_BASE}/currency/list-active-currencies`, { signal });
    },

    /**
     * Fetch the credit limit record assigned to the logged-in user's agency.
     * Returns { agency, creditLimit, usedLimit, availableLimit, usageRate, currency, status, ... }
     */
    getMyLimit: async (signal) => {
        return apiClient.get(`${FINANCE_API_BASE}/agency-limit/get-my-limit`, { signal });
    },
};
