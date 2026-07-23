// api.js - Complete updated file
const API_URL = 'https://alpha-af1q.onrender.com/api';

class API {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    auth = {
        register: (data) => {
            return this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        login: async (data) => {
            const result = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (result.token) {
                this.token = result.token;
                localStorage.setItem('authToken', result.token);
            }
            
            return result;
        },

        logout: () => {
            this.token = null;
            localStorage.removeItem('authToken');
        },

        me: () => {
            return this.request('/auth/me');
        }
    };

    user = {
        getDashboard: () => this.request('/users/dashboard'),
        getFavorites: () => this.request('/users/favorites'),
        getDownloads: () => this.request('/users/downloads'),
        downloadApp: (id) => this.request(`/users/apps/${id}/download`, { method: 'POST' }),
        favoriteApp: (id) => this.request(`/users/apps/${id}/favorite`, { method: 'POST' }),
        writeReview: (id, data) => this.request(`/users/apps/${id}/reviews`, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        getReviews: (id) => this.request(`/users/apps/${id}/reviews`),
        getNotifications: () => this.request('/users/notifications'),
        updateProfile: (data) => this.request('/users/profile', { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        })
    };

    developer = {
        getDashboard: () => this.request('/developers/dashboard'),
        getProjects: () => this.request('/developers/projects'),
        createProject: (data) => this.request('/developers/projects', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        getProject: (id) => this.request(`/developers/projects/${id}`),
        getProjectFiles: (id) => this.request(`/developers/projects/${id}/files`),
        saveProjectFile: (id, data) => this.request(`/developers/projects/${id}/files`, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        deploy: (id, data) => this.request(`/developers/projects/${id}/deploy`, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        getDeploymentStatus: (id) => this.request(`/developers/deployments/${id}`),
        getDeployments: (id) => this.request(`/developers/projects/${id}/deployments`),
        publishApp: (data) => this.request('/developers/publish', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        }),
        getPublishedApps: () => this.request('/developers/apps'),
        getAnalytics: () => this.request('/developers/analytics')
    };

    public = {
        getApps: () => this.request('/apps'),
        getApp: (id) => this.request(`/apps/${id}`),
        getCategories: () => this.request('/categories')
    };

    admin = {
        getDashboard: () => this.request('/admin/dashboard'),
        getUsers: () => this.request('/admin/users'),
        getApps: () => this.request('/admin/apps')
    };
}

export default new API();
