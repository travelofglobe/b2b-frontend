const BOOKING_API_URL = 'http://37.148.213.4:8000/b2b-backend/v1/bookings';

export const bookingService = {
    findLastFive: async (signal) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${BOOKING_API_URL}/find-last-five`, {
                method: 'GET',
                headers: {
                    'Accept-Language': 'en-us',
                    'Authorization': `Bearer ${token}`,
                },
                signal
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch bookings');
            }

            return data;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Fetch bookings error:', error);
                throw error;
            }
        }
    },

    searchBookings: async (filters = {}, page = 0, size = 10, signal) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${BOOKING_API_URL}/search?page=${page}&size=${size}`, {
                method: 'POST',
                headers: {
                    'Accept-Language': 'en-us',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters),
                signal
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to search bookings');
            }

            return data;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Search bookings error:', error);
                throw error;
            }
        }
    },

    getBookingDetail: async (bookingId, signal) => {
        try {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${BOOKING_API_URL}/detail/${bookingId}`, {
                method: 'GET',
                headers: {
                    'Accept-Language': 'en-us',
                    'Authorization': `Bearer ${token}`,
                },
                signal
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch booking detail');
            }

            return data;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Fetch booking detail error:', error);
                throw error;
            }
        }
    }
};
