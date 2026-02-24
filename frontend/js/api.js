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
                throw new Error(data.error || 'Request failed');
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
        login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
    }
};
