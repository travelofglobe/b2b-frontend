import apiClient from '../utils/apiClient';

const API_BASE_URL = 'http://72.62.17.189:8000/b2b-backend';

const holidayCache = new Map();

export const holidayService = {
    fetchHolidays: async (countryCode, year) => {
        if (!countryCode || !year) return [];

        const cacheKey = `${countryCode}_${year}`;
        
        if (holidayCache.has(cacheKey)) {
            return holidayCache.get(cacheKey);
        }

        const promise = apiClient.get(`${API_BASE_URL}/holidays`, {
            params: {
                countryCode,
                year
            }
        }).then(response => {
            // Assuming response data is an array of holidays or contains an array inside
            // Ensure we return an array
            const data = response?.data || response;
            return Array.isArray(data) ? data : (data?.holidays || []);
        });

        holidayCache.set(cacheKey, promise);

        try {
            return await promise;
        } catch (e) {
            holidayCache.delete(cacheKey);
            console.error('Error fetching holidays:', e);
            return []; // Return empty array on failure so UI doesn't break
        }
    }
};
