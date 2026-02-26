const API = {
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
        register: (data) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        changePassword: (newPassword) => API.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ newPassword }) })
    },

    offices: {
        getAll: () => API.request('/offices'),
        getById: (id) => API.request(`/offices/${id}`),
        create: (data) => API.request('/offices', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => API.request(`/offices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id) => API.request(`/offices/${id}`, { method: 'DELETE' })
    },

    users: {
        getAll: () => API.request('/users'),
        getById: (id) => API.request(`/users/${id}`),
        create: (data) => API.request('/users', { method: 'POST', body: JSON.stringify(data) }),
        update: (id, data) => API.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        toggleStatus: (id, isActive) => API.request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
    },

    locations: {
        getRecent: () => API.request('/locations'),
        create: (data) => API.request('/locations', { method: 'POST', body: JSON.stringify(data) })
    },

    // Generic helpers for flexibility
    get: (endpoint) => API.request(endpoint, { method: 'GET' }),
    post: (endpoint, data) => API.request(endpoint, { method: 'POST', body: JSON.stringify(data) })
};
