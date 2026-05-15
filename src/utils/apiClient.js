/**
 * Shared API client utility for centralizing fetch requests, 
 * token injection, and error handling (specifically 401 Unauthorized).
 */

let isRefreshing = false;
let refreshPromise = null;

const apiClient = {
    /**
     * Core fetch wrapper
     */
    request: async (url, options = {}) => {
        let token = localStorage.getItem('accessToken');

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
            let response = await fetch(url, fetchOptions);

            // Handle 401 Unauthorized globally
            if (response.status === 401) {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    apiClient.handleLogout();
                    throw new Error('Your session has expired. Please sign in again.');
                }

                // If a refresh is already in progress, wait for it
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshPromise = (async () => {
                        try {
                            // Use dynamic import to avoid circular dependency with authService
                            const { authService } = await import('../services/authService');
                            return await authService.refreshToken();
                        } finally {
                            isRefreshing = false;
                            refreshPromise = null;
                        }
                    })();
                }

                try {
                    const newToken = await refreshPromise;

                    // Retry original request with new token
                    const retryHeaders = {
                        ...headers,
                        'Authorization': `Bearer ${newToken}`
                    };

                    response = await fetch(url, { ...fetchOptions, headers: retryHeaders });

                    // If still 401, the refresh token was likely invalid or expired too
                    if (response.status === 401) {
                        apiClient.handleLogout();
                        throw new Error('Your session has expired. Please sign in again.');
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    apiClient.handleLogout();
                    throw refreshError;
                }
            }

            // Handle other non-ok responses
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`API Error: ${response.status}`);
                }
                const err = new Error(errorData.message || `API Error: ${response.status}`);
                err.response = errorData;
                throw err;
            }

            // Return parsed JSON
            return await response.json();

        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error('API Client Error:', error);
            throw error;
        }
    },

    handleLogout: () => {
        console.warn('Session expired. Redirecting to login...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page to avoid loops
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
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
