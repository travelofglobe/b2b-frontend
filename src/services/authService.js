import apiClient from '../utils/apiClient';

const AUTH_BASE_URL = 'http://72.62.17.189:8000/auth/v1/agency-token';
const API_URL = `${AUTH_BASE_URL}/access`;
const USER_ME_URL = `${AUTH_BASE_URL}/me`;
const REFRESH_URL = `${AUTH_BASE_URL}/refresh`;

export const authService = {
    fetchUserDetails: async (token) => {
        // We pass the token explicitly here because login has it before localStorage is guaranteed
        return apiClient.get(USER_ME_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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

    refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(REFRESH_URL, {
                method: 'POST',
                headers: {
                    'Accept-Language': 'en-us',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                authService.logout();
                throw new Error(data.message || 'Token refresh failed');
            }

            // Update localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            // Update user expireDate if provided
            const userJson = localStorage.getItem('user');
            if (userJson) {
                const user = JSON.parse(userJson);
                if (data.expireDate) {
                    user.expireDate = data.expireDate;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            }

            return data.accessToken;
        } catch (error) {
            console.error('Refresh token error:', error);
            authService.logout();
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
        const refreshToken = localStorage.getItem('refreshToken');

        // User is considered authenticated if they have either an access token 
        // or a refresh token that can be used to obtain a new access token.
        return !!(token || refreshToken);
    },

    getToken: () => localStorage.getItem('accessToken'),

    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};
