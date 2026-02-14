/**
 * Shared API client utility for centralizing fetch requests, 
 * token injection, and error handling (specifically 401 Unauthorized).
 */

const apiClient = {
    /**
     * Core fetch wrapper
     */
    request: async (url, options = {}) => {
        const token = localStorage.getItem('accessToken');

        // Merge headers
        const headers = {
            'Accept-Language': 'en-us',
            ...(options.headers || {})
        };

        // Add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fetchOptions = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, fetchOptions);

            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                console.warn('Session expired (401). Redirecting to login...');

                // Clear local storage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');

                // Absolute redirect to login
                window.location.href = '/login?expired=true';

                // Throw to stop execution
                throw new Error('Your session has expired. Please sign in again.');
            }

            // Handle other non-ok responses
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`API Error: ${response.status}`);
                }
                throw new Error(errorData.message || `API Error: ${response.status}`);
            }

            // Return parsed JSON
            return await response.json();

        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error('API Client Error:', error);
            throw error;
        }
    },

    get: (url, options = {}) => apiClient.request(url, { ...options, method: 'GET' }),
    post: (url, body, options = {}) => apiClient.request(url, {
        ...options,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: JSON.stringify(body)
    }),
    put: (url, body, options = {}) => apiClient.request(url, {
        ...options,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: JSON.stringify(body)
    }),
    delete: (url, options = {}) => apiClient.request(url, { ...options, method: 'DELETE' })
};

export default apiClient;
