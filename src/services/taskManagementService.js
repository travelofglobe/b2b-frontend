import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1/task-management`;

export const taskManagementService = {
    // Dynamic Task Types per product (HOTEL, FLIGHT, TRANSFER, etc.)
    getActiveTaskTypes: async (productType) => {
        const query = productType ? `?productType=${encodeURIComponent(productType)}` : '';
        return apiClient.get(`${API_BASE_URL}/types${query}`);
    },

    // Create task
    createTask: async (taskData) => {
        return apiClient.post(`${API_BASE_URL}/create`, taskData);
    },

    // Search tasks
    searchTasks: async (searchParams) => {
        return apiClient.post(`${API_BASE_URL}/search`, searchParams);
    },

    // Get task detail
    getTaskDetail: async (id) => {
        return apiClient.get(`${API_BASE_URL}/find-by-id/${id}`);
    },

    // Add message
    addMessage: async (id, messageData) => {
        return apiClient.post(`${API_BASE_URL}/${id}/messages`, messageData);
    },

    // Upload attachment
    uploadAttachment: async (id, file, messageId = null, uploaderName = 'Acente Kullanıcısı') => {
        const formData = new FormData();
        formData.append('file', file);
        if (messageId) formData.append('messageId', messageId);
        formData.append('uploaderName', uploaderName);

        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE_URL}/${id}/attachments`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!res.ok) {
            throw new Error(`Upload failed: ${res.status}`);
        }
        return res.json();
    },

    // Download attachment URL
    getAttachmentDownloadUrl: (id) => {
        return `${API_BASE_URL}/attachments/${id}/download`;
    },

    // Process agency decision (CONFIRMED / REJECTED)
    processDecision: async (id, decision, note = '', agencyUserId = null, agencyUserName = '') => {
        let url = `${API_BASE_URL}/${id}/decision`;
        const params = [];
        if (agencyUserId) params.push(`agencyUserId=${encodeURIComponent(agencyUserId)}`);
        if (agencyUserName) params.push(`agencyUserName=${encodeURIComponent(agencyUserName)}`);
        if (params.length > 0) url += `?${params.join('&')}`;

        return apiClient.post(url, { decision, note });
    },

    // Respond price confirmation (alias for processDecision)
    respondPriceConfirmation: async (id, { approved, note = '' }) => {
        const decision = approved ? 'CONFIRMED' : 'REJECTED';
        return taskManagementService.processDecision(id, decision, note);
    }
};

export default taskManagementService;
