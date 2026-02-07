const API_BASE_URL = 'http://37.148.213.4:8000/b2b-backend/v1';

export const locationService = {
    /**
     * Fetch location breadcrumb data
     * @param {string|number} locationId - The location ID to fetch breadcrumbs for
     * @returns {Promise<Object>} Location breadcrumb data
     */
    fetchBreadcrumb: async (locationId) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_BASE_URL}/location/breadcrumb/${locationId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': 'en-us',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch breadcrumb: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Breadcrumb fetch error:', error);
            throw error;
        }
    }
};
