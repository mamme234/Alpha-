// frontend/all.js - Updated register function
import api from './api.js';
import config from './config.js';

// ==================== USER MANAGEMENT ====================

export const register = async (userData) => {
  try {
    console.log('📤 Sending registration request to:', config.apiUrl);
    console.log('📤 User data:', { ...userData, password: '***' });
    
    const response = await api.auth.register(userData);
    console.log('✅ Registration response:', response);
    
    showSuccess('Registration successful! Please check your email to verify your account.');
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigateTo('login');
    }, 2000);
    
    return response;
  } catch (error) {
    console.error('❌ Registration error:', error);
    showError(error.message || 'Registration failed. Please try again.');
    throw error;
  }
};

export const login = async (email, password, twoFactorCode) => {
  try {
    const response = await api.auth.login({ email, password, twoFactorCode });
    state.currentUser = response.user;
    updateUI();
    showSuccess('Login successful!');
    return response;
  } catch (error) {
    showError(error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.auth.logout();
    state.currentUser = null;
    updateUI();
    showSuccess('Logged out successfully');
    navigateTo('index');
  } catch (error) {
    showError('Logout failed');
  }
};

// ==================== NOTIFICATION FUNCTIONS ====================

export const showSuccess = (message) => {
  showNotification(message, 'success');
};

export const showError = (message) => {
  showNotification(message, 'error');
};

export const showInfo = (message) => {
  showNotification(message, 'info');
};

export const showWarning = (message) => {
  showNotification(message, 'warning');
};

const showNotification = (message, type = 'info') => {
  const container = document.getElementById('notification-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.id = 'notification-container';
    newContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      width: 100%;
    `;
    document.body.appendChild(newContainer);
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    background: ${type === 'success' ? '#2ecc71' : 
                type === 'error' ? '#e74c3c' : 
                type === 'warning' ? '#f39c12' : '#3498db'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    cursor: pointer;
  `;
  notification.textContent = message;
  
  const containerRef = document.getElementById('notification-container');
  containerRef.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
  
  notification.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  });
};

// ==================== NAVIGATION ====================

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

// ==================== UI UPDATES ====================

export const updateUI = () => {
  const navAuth = document.querySelectorAll('[data-auth]');
  const navGuest = document.querySelectorAll('[data-guest]');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (user) {
    navAuth.forEach(el => el.style.display = 'block');
    navGuest.forEach(el => el.style.display = 'none');
    
    const usernameEl = document.querySelector('[data-username]');
    if (usernameEl) usernameEl.textContent = user.username;
    
    const avatarEl = document.querySelector('[data-avatar]');
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;
  } else {
    navAuth.forEach(el => el.style.display = 'none');
    navGuest.forEach(el => el.style.display = 'block');
  }
};

// ==================== LOADING STATES ====================

export const showLoading = (element) => {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  if (element) {
    element.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  }
};

export const hideLoading = (element) => {
  if (typeof element === 'string') {
    element = document.querySelector(element);
  }
  if (element) {
    const loadingEl = element.querySelector('.loading-spinner');
    if (loadingEl) loadingEl.remove();
  }
};

// ==================== EXPORT ====================

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
  showLoading,
  hideLoading,
  updateUI,
};
