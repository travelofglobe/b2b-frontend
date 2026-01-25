const API_URL = 'http://37.148.213.4:8000/auth/v1/agency-token/access';

export const authService = {
    login: async (emailAddress, password) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept-Language': 'en-us',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emailAddress, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Store tokens in localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify({
                email: emailAddress,
                tokenType: data.tokenType,
                expireDate: data.expireDate
            }));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    isAuthenticated: () => {
        const token = localStorage.getItem('accessToken');
        const expireDate = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).expireDate : null;

        if (!token) return false;

        // Simple expiry check
        if (expireDate && new Date(expireDate) < new Date()) {
            authService.logout();
            return false;
        }

        return true;
    },

    getToken: () => localStorage.getItem('accessToken'),

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};
