import apiClient from '../utils/apiClient';

const AUTOCOMPLETE_API_URL = 'http://37.148.213.4:8000/b2b-backend/v1/autocomplete';

export const autocompleteService = {
    search: async (query, types = ['LOCATION', 'HOTEL'], signal) => {
        const data = await apiClient.post(`${AUTOCOMPLETE_API_URL}/search?page=0&size=10`, { query, types }, { signal });

        // -- ADAPTER FOR NEW RESPONSE FORMAT --
        const content = data.content || [];
        const regions = content.filter(item => item.type === 'LOCATION');
        const hotels = content.filter(item => item.type === 'HOTEL');

        return {
            data: {
                regions,
                hotels
            }
        };
    }
};
