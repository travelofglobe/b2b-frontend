import apiClient from '../utils/apiClient';

const BOOKING_API_URL = 'http://37.148.213.4:8000/b2b-backend/v1/bookings';

export const bookingService = {
    findLastFive: async (signal) => {
        return apiClient.get(`${BOOKING_API_URL}/find-last-five`, { signal });
    },

    searchBookings: async (filters = {}, page = 0, size = 10, signal) => {
        return apiClient.post(`${BOOKING_API_URL}/search?page=${page}&size=${size}`, filters, { signal });
    },

    getBookingDetail: async (bookingId, signal) => {
        return apiClient.get(`${BOOKING_API_URL}/detail/${bookingId}`, { signal });
    }
};
