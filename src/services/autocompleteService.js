const AUTOCOMPLETE_API_URL = 'http://37.148.213.4:8000/b2b-backend/v1/autocomplete';

export const autocompleteService = {
    search: async (query, types = ['LOCATION', 'HOTEL'], signal) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                // Return empty structure instead of throwing for unauthorized, 
                // or handle gracefully in UI. For now, matching existing behavior.
                throw new Error('No access token found');
            }

            // DEBUG: Log payload
            // console.log('Autocomplete Request Payload:', JSON.stringify({ query, types }));

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
                try {
                    const errorJson = JSON.parse(errorText);
                    // Optional: handle specific error codes
                    throw new Error(errorJson.message || `API Error: ${response.status}`);
                } catch (e) {
                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();

            // -- ADAPTER FOR NEW RESPONSE FORMAT --
            // The backend now returns a single "content" array with mixed types.
            // We need to split them back into { hotels, regions } for the UI.

            const content = data.content || [];

            const regions = content.filter(item => item.type === 'LOCATION');
            const hotels = content.filter(item => item.type === 'HOTEL');

            return {
                data: {
                    regions,
                    hotels
                }
            };

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Autocomplete search error:', error);
                throw error;
            }
        }
    }
};
