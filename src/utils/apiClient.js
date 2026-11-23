/**
 * Shared API client utility for centralizing fetch requests, 
 * token injection, and error handling (specifically 401 Unauthorized).
 */

let isRefreshing = false;
let refreshPromise = null;

// In-flight GET request deduplication: cacheKey -> Promise
const inFlightRequests = new Map();
// Short-lived memory cache for GET requests: cacheKey -> { data, expiresAt }
const memoryCache = new Map();
const DEFAULT_GET_CACHE_TTL = 3000; // 3 seconds window to eliminate duplicate concurrent/rapid calls

const apiClient = {
    /**
     * Clear all cached GET responses
     */
    clearCache: () => {
        memoryCache.clear();
        inFlightRequests.clear();
    },

    /**
     * Core fetch wrapper
     */
    request: async (url, options = {}) => {
        const method = (options.method || 'GET').toUpperCase();
        const isGet = method === 'GET';

        // Mutating requests invalidate GET memory cache
        if (!isGet) {
            memoryCache.clear();
        }

        let token = localStorage.getItem('accessToken');
        const activeLang = localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'en';
        const cacheKey = isGet ? `${url}:${token || ''}:${activeLang}` : null;

        // Check memory cache for GET
        if (isGet && !options.noCache && cacheKey) {
            const cached = memoryCache.get(cacheKey);
            if (cached && Date.now() < cached.expiresAt) {
                return cached.data;
            }
            // Check in-flight duplicate GET request
            if (inFlightRequests.has(cacheKey)) {
                return inFlightRequests.get(cacheKey);
            }
        }

        const execute = async () => {
            // Merge headers
            const headers = {
                'Accept-Language': activeLang,
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

                // Handle 403 Forbidden globally
                if (response.status === 403) {
                    if (!window.location.pathname.includes('/forbidden') && !window.location.pathname.includes('/403')) {
                        window.location.href = '/forbidden';
                    }
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch {
                        errorData = null;
                    }
                    const err = new Error(errorData?.message || 'Access Forbidden (403)');
                    err.status = 403;
                    err.response = errorData;
                    throw err;
                }

                // Handle other non-ok responses
                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json();
                    } catch {
                        throw new Error(`API Error: ${response.status}`);
                    }
                    const err = new Error(errorData.message || `API Error: ${response.status}`);
                    err.response = errorData;
                    throw err;
                }

                // Return parsed JSON or null for empty body / 204 No Content
                if (response.status === 204) {
                    return null;
                }
                const text = await response.text();
                const data = text ? JSON.parse(text) : null;

                if (isGet && cacheKey && !options.noCache) {
                    const ttl = typeof options.cacheTtl === 'number' ? options.cacheTtl : DEFAULT_GET_CACHE_TTL;
                    memoryCache.set(cacheKey, { data, expiresAt: Date.now() + ttl });
                }

                return data;

            } catch (error) {
                if (error.name === 'AbortError') throw error;
                console.error('API Client Error:', error);
                throw error;
            } finally {
                if (cacheKey) {
                    inFlightRequests.delete(cacheKey);
                }
            }
        };

        if (isGet && cacheKey && !options.noCache) {
            const reqPromise = execute();
            inFlightRequests.set(cacheKey, reqPromise);
            return reqPromise;
        }

        return execute();
    },

    handleLogout: () => {
        console.warn('Session expired. Redirecting to login...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        const currentPath = window.location.pathname || '/';
        const currentSearch = window.location.search || '';
        const currentHash = window.location.hash || '';

        // Only redirect if not already on login page to avoid loops
        if (!currentPath.includes('/login')) {
            const fullTarget = `${currentPath}${currentSearch}${currentHash}`;
            const isDefaultEntry = currentPath === '/' || currentPath === '';

            if (!isDefaultEntry) {
                sessionStorage.setItem('b2b_post_login_redirect', fullTarget);
                window.location.href = `/login?expired=true&redirect=${encodeURIComponent(fullTarget)}`;
            } else {
                sessionStorage.removeItem('b2b_post_login_redirect');
                window.location.href = '/login?expired=true';
            }
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
