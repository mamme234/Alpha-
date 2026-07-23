// frontend/api.js - Complete API Client
import config from './config.js';

class API {
  constructor() {
    this.baseUrl = config.apiUrl || 'https://alpha-af1q.onrender.com/api';
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  setRefreshToken(token) {
    this.refreshToken = token;
    localStorage.setItem('refreshToken', token);
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const configOptions = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, configOptions);
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

  // ==================== AUTH APIS ====================
  auth = {
    register: (userData) => {
      return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    login: async (credentials) => {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.token) {
        this.setToken(result.token);
        this.setRefreshToken(result.refreshToken);
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
      }
      return result;
    },

    logout: () => {
      this.clearTokens();
    },

    me: () => {
      return this.request('/auth/me');
    },

    changePassword: (data) => {
      return this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    toggle2FA: () => {
      return this.request('/auth/toggle-2fa', {
        method: 'POST',
      });
    },

    getSessions: () => {
      return this.request('/auth/sessions');
    },

    revokeSession: (sessionId) => {
      return this.request(`/auth/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    },

    deleteAccount: (data) => {
      return this.request('/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify(data),
      });
    },
  };

  // ==================== USER APIS ====================
  user = {
    getDashboard: () => {
      return this.request('/users/dashboard');
    },

    getFavorites: () => {
      return this.request('/users/favorites');
    },

    getDownloads: () => {
      return this.request('/users/downloads');
    },

    downloadApp: (appId) => {
      return this.request(`/users/apps/${appId}/download`, {
        method: 'POST',
      });
    },

    favoriteApp: (appId) => {
      return this.request(`/users/apps/${appId}/favorite`, {
        method: 'POST',
      });
    },

    writeReview: (appId, data) => {
      return this.request(`/users/apps/${appId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getReviews: (appId) => {
      return this.request(`/users/apps/${appId}/reviews`);
    },

    getNotifications: () => {
      return this.request('/users/notifications');
    },

    markNotificationRead: (notificationId) => {
      return this.request(`/users/notifications/${notificationId}`, {
        method: 'PUT',
      });
    },

    markAllNotificationsRead: () => {
      return this.request('/users/notifications/mark-all-read', {
        method: 'PUT',
      });
    },

    clearAllNotifications: () => {
      return this.request('/users/notifications/clear-all', {
        method: 'DELETE',
      });
    },

    updateProfile: (data) => {
      return this.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    updateAvatar: (formData) => {
      return this.request('/users/avatar', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });
    },

    updateNotificationSettings: (settings) => {
      return this.request('/users/notification-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    updatePrivacySettings: (settings) => {
      return this.request('/users/privacy-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    exportData: () => {
      return this.request('/users/export-data');
    },
  };

  // ==================== DEVELOPER APIS ====================
  developer = {
    getDashboard: () => {
      return this.request('/developers/dashboard');
    },

    getProjects: () => {
      return this.request('/developers/projects');
    },

    createProject: (data) => {
      return this.request('/developers/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getProject: (projectId) => {
      return this.request(`/developers/projects/${projectId}`);
    },

    updateProject: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    deleteProject: (projectId) => {
      return this.request(`/developers/projects/${projectId}`, {
        method: 'DELETE',
      });
    },

    getProjectFiles: (projectId, path = '') => {
      return this.request(`/developers/projects/${projectId}/files?path=${encodeURIComponent(path)}`);
    },

    getProjectFile: (projectId, filePath) => {
      return this.request(`/developers/projects/${projectId}/files?path=${encodeURIComponent(filePath)}`);
    },

    saveProjectFile: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    createFile: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}/files/create`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    createFolder: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}/folders`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    deploy: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}/deploy`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getDeploymentStatus: (deploymentId) => {
      return this.request(`/developers/deployments/${deploymentId}`);
    },

    getDeploymentLogs: (deploymentId) => {
      return this.request(`/developers/deployments/${deploymentId}/logs`);
    },

    getDeployments: (projectId) => {
      return this.request(`/developers/projects/${projectId}/deployments`);
    },

    rollback: (deploymentId) => {
      return this.request(`/developers/deployments/${deploymentId}/rollback`, {
        method: 'POST',
      });
    },

    publishApp: (formData) => {
      return this.request('/developers/publish', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });
    },

    updateApp: (appId, data) => {
      return this.request(`/developers/apps/${appId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getPublishedApps: () => {
      return this.request('/developers/apps');
    },

    getAnalytics: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/developers/analytics?${query}`);
    },

    gitCommit: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}/git/commit`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    inviteTeamMember: (projectId, data) => {
      return this.request(`/developers/projects/${projectId}/team/invite`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getTeam: (projectId) => {
      return this.request(`/developers/projects/${projectId}/team`);
    },
  };

  // ==================== PUBLIC APIS ====================
  public = {
    getApps: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/apps?${query}`);
    },

    getApp: (appId) => {
      return this.request(`/apps/${appId}`);
    },

    getCategories: () => {
      return this.request('/categories');
    },

    search: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/apps/search?${query}`);
    },

    getAppReviews: (appId) => {
      return this.request(`/apps/${appId}/reviews`);
    },
  };

  // ==================== ADMIN APIS ====================
  admin = {
    getDashboard: () => {
      return this.request('/admin/dashboard');
    },

    getUsers: () => {
      return this.request('/admin/users');
    },

    updateUser: (userId, data) => {
      return this.request(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getApps: () => {
      return this.request('/admin/apps');
    },

    approveApp: (appId) => {
      return this.request(`/admin/apps/${appId}/approve`, {
        method: 'PUT',
      });
    },

    featureApp: (appId) => {
      return this.request(`/admin/apps/${appId}/feature`, {
        method: 'PUT',
      });
    },

    getReports: () => {
      return this.request('/admin/reports');
    },

    manageCategories: (data) => {
      return this.request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getSystemStats: () => {
      return this.request('/admin/system/stats');
    },

    getSecurityLogs: () => {
      return this.request('/admin/security/logs');
    },

    createBackup: () => {
      return this.request('/admin/backup/create', {
        method: 'POST',
      });
    },
  };
}

// Create and export a single instance
const api = new API();
export default api;
