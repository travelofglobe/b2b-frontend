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
};
