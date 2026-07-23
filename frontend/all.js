// all.js - Complete updated file
import api from './api.js';

// ============================================================
// NAVIGATION FUNCTIONS
// ============================================================

export const initNavigation = () => {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('open');
        });

        document.querySelectorAll('.nav a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('open');
            });
        });
    }

    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScroll > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.92)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

// ============================================================
// USER MANAGEMENT
// ============================================================

export const register = async (userData) => {
    try {
        const response = await api.auth.register(userData);
        showNotification('Account created! Please login.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return response;
    } catch (error) {
        showNotification(error.message || 'Registration failed', 'error');
        throw error;
    }
};

export const login = async (email, password) => {
    try {
        const response = await api.auth.login({ email, password });
        if (response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            showNotification(`Welcome ${response.user.username}!`, 'success');
            setTimeout(() => {
                if (response.user.role === 'developer' || response.user.isDeveloper) {
                    window.location.href = 'developers.html';
                } else {
                    window.location.href = 'users.html';
                }
            }, 500);
        }
        return response;
    } catch (error) {
        showNotification(error.message || 'Login failed', 'error');
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// ============================================================
// NAVIGATION HELPER
// ============================================================

export const navigateTo = (page, params = {}) => {
    const url = new URL(window.location.href);
    url.pathname = `/${page}.html`;
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    window.location.href = url.toString();
};

export const getUrlParams = () => {
    return Object.fromEntries(new URLSearchParams(window.location.search));
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const showNotification = (message, type = 'info') => {
    const container = document.getElementById('notification-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'notification-container';
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(div);
    }
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        cursor: pointer;
    `;
    notification.textContent = message;
    
    document.getElementById('notification-container').appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
    
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
};

export const showSuccess = (message) => showNotification(message, 'success');
export const showError = (message) => showNotification(message, 'error');
export const showInfo = (message) => showNotification(message, 'info');
export const showWarning = (message) => showNotification(message, 'warning');

// ============================================================
// EXPORT
// ============================================================

export default {
    register,
    login,
    logout,
    navigateTo,
    getUrlParams,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    initNavigation
};
