const API_URL = 'http://37.148.213.4:8000/auth/v1/agency-token/access';
const USER_ME_URL = 'http://37.148.213.4:8000/auth/v1/agency-token/me';

export const authService = {
    fetchUserDetails: async (token) => {
        try {
            const response = await fetch(USER_ME_URL, {
                method: 'GET',
                headers: {
                    'Accept-Language': 'en-us',
                    'Authorization': `Bearer ${token}`,
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user details');
            }

            return data;
        } catch (error) {
            console.error('Fetch user details error:', error);
            throw error;
        }
    },

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

            // Fetch user details
            const userDetails = await authService.fetchUserDetails(data.accessToken);

            // Store complete user data
            localStorage.setItem('user', JSON.stringify({
                email: userDetails.email,
                name: userDetails.name,
                surname: userDetails.surname,
                status: userDetails.status,
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
