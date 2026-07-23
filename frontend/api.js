// api.js - API Client for Render
import config from './config.js';

class API {
  constructor() {
    this.baseUrl = config.apiUrl;
    this.wsUrl = config.wsUrl;
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }
  
  // ... rest of your API methods remain the same
}

export default new API();
