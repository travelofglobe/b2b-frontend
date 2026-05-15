/**
 * Utility for JWT token operations
 */

export const decodeJWT = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

export const getTokenExpiration = (token) => {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return null;
    // JWT exp is in seconds, JS Date expects milliseconds
    return new Date(payload.exp * 1000);
};

export const isTokenExpired = (token) => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    return expiration.getTime() < Date.now();
};
