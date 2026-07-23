// config.js - Frontend Configuration for Render
const config = {
  // API URLs - Use Render URL (no /api needed since it's served from same domain)
  apiUrl: window.location.origin + '/api',
  wsUrl: window.location.origin.replace('http', 'ws'),
  
  // App Info
  appName: 'Alpha Platform',
  version: '1.0.0',
  domain: window.location.origin,
  
  // Environment
  isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  isProduction: window.location.hostname !== 'localhost',
  
  // Feature Flags
  features: {
    enableMonetization: true,
    enableDocker: true,
    enableTeams: true,
    enableWebSockets: true,
    enableAnalytics: true,
    enableNotifications: true,
  },
  
  // Limits
  limits: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxProjectFiles: 1000,
    maxDeployments: 50,
  },
  
  // Defaults
  defaults: {
    language: 'en',
    theme: 'light',
    itemsPerPage: 20,
    maxRetries: 3,
    timeout: 30000,
  },
};

// Freeze config to prevent modifications
Object.freeze(config);

export default config;
