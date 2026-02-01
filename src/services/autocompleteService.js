const AUTOCOMPLETE_API_URL = 'http://37.148.213.4:8000/b2b-backend/v1/autocomplete';

export const autocompleteService = {
    search: async (query, types = ['LOCATION', 'HOTEL'], signal) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No access token found');
            }

            // DEBUG: Log payload
            console.log('Autocomplete Request Payload:', JSON.stringify({ query, types }));

            const response = await fetch(`${AUTOCOMPLETE_API_URL}/search?page=0&size=10`, {
                method: 'POST',
                headers: {
                    'Accept-Language': 'en-us',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, types }),
                signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Autocomplete API Error Status:', response.status);
                console.error('Autocomplete API Error Body:', errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `API Error: ${response.status}`);
                } catch (e) {
                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Autocomplete search error:', error);
                throw error;
            }
        }
    }
};
