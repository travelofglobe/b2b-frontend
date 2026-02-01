const AUTOCOMPLETE_API_URL = 'http://37.148.213.4:8000/b2b-backend/v1/autocomplete';

export const autocompleteService = {
    search: async (query, types = ['LOCATION', 'HOTEL'], signal) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${AUTOCOMPLETE_API_URL}/search?page=0&size=10`, {
                method: 'POST',
                headers: {
                    'Accept-Language': 'en-us',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    types
                }),
                signal
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch autocomplete results');
            }

            return data;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Autocomplete search error:', error);
                throw error;
            }
        }
    }
};
