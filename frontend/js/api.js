const api = {
    // Config
    baseUrl: 'http://localhost:5000/api',

    // Helper for requests
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add Auth Token if exists
        const token = localStorage.getItem('sx_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message || data.error || 'Request failed';
                throw new Error(errorMsg);
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Specific endpoints
    auth: {
        register: (data) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        login: (credentials) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        changePassword: (newPassword) => api.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) })
    },

    offices: {
        getAll: () => api.request('/offices'),
        getById: (id) => api.request(`/offices/${id}`),
        create: (data) => api.request('/offices', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.request(`/offices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => api.request(`/offices/${id}`, { method: 'DELETE' })
    },

    users: {
        getAll: () => api.request('/users'),
        getById: (id) => api.request(`/users/${id}`),
        create: (data) => api.request('/users', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => api.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        toggleStatus: (id, isActive) => api.request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
    },

    locations: {
        getRecent: () => api.request('/locations'),
        create: (data) => api.request('/locations', { method: 'POST', body: JSON.stringify(data) })
    },

    // Public Intelligence Overview
    public: {
        getSignals: (params) => api.request('/public/signals?' + new URLSearchParams(params).toString()),
        getEvents: (params) => api.request('/public/events?' + new URLSearchParams(params).toString()),
    },

    // Generic helpers for flexibility
    get: (endpoint) => api.request(endpoint, { method: 'GET' }),
    post: (endpoint, data) => api.request(endpoint, { method: 'POST', body: JSON.stringify(data) })
};
