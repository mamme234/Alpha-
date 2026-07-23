// config.js - Complete updated file
const config = {
    apiUrl: 'https://alpha-af1q.onrender.com/api',
    wsUrl: 'wss://alpha-af1q.onrender.com',
    appName: 'Alpha Platform',
    version: '3.0.0',
    domain: 'https://alpha-af1q.onrender.com',
    
    isDevelopment: window.location.hostname === 'localhost',
    isProduction: window.location.hostname === 'alpha-af1q.onrender.com',
    
    features: {
        enableMonetization: true,
        enableDocker: true,
        enableTeams: true,
        enableWebSockets: true,
        enableAnalytics: true,
        enableNotifications: true,
    },
    
    limits: {
        maxFileSize: 100 * 1024 * 1024,
        maxImageSize: 5 * 1024 * 1024,
        maxProjectFiles: 1000,
        maxDeployments: 50,
    },
    
    defaults: {
        language: 'en',
        theme: 'dark',
        itemsPerPage: 20,
        maxRetries: 3,
        timeout: 30000,
    },
};

Object.freeze(config);
export default config;
