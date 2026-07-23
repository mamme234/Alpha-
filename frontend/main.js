// main.js - Complete updated file
import api from './api.js';
import config from './config.js';
import { initNavigation } from './all.js';

class App {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.loadEntryLogo();
        initNavigation();

        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                await this.loadUser();
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        }

        this.setupEventListeners();
        this.initPage();
    }

    loadEntryLogo() {
        const container = document.getElementById('entry-logo-container');
        if (!container) return;

        fetch('logo.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('logo.html not found');
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
            })
            .catch(error => {
                console.warn('Could not load logo.html:', error);
                container.innerHTML = `
                    <div class="fallback-logo" style="text-align:center;padding:40px 0;">
                        <div style="font-size:80px;color:#ff0000;">🚀</div>
                        <h2 style="font-family:'Black Ops One',cursive;font-size:48px;background:linear-gradient(135deg,#ff1a1a,#cc0000);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                            Alpha
                        </h2>
                        <p style="color:rgba(255,255,255,0.3);font-size:14px;letter-spacing:4px;text-transform:uppercase;">
                            developers choice
                        </p>
                    </div>
                `;
            });
    }

    async loadUser() {
        try {
            const user = await api.auth.me();
            this.currentUser = user;
            this.updateUI();
        } catch (error) {
            api.auth.logout();
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.logout-btn')) {
                this.logout();
            }
        });
        
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-nav]');
            if (link) {
                e.preventDefault();
                this.navigate(link.href);
            }
        });
    }

    async initPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        try {
            switch(page) {
                case 'index.html':
                case '':
                    break;
                case 'login.html':
                    break;
                case 'signup.html':
                    break;
                case 'choose.html':
                    break;
                case 'users.html':
                    await this.showUserDashboard();
                    break;
                case 'developers.html':
                    await this.showDeveloperDashboard();
                    break;
                case 'app.html':
                    await this.showAppDetails();
                    break;
                case 'search.html':
                    await this.showSearch();
                    break;
                default:
                    console.log('Page:', page);
            }
        } catch (error) {
            console.error('Page init error:', error);
        }
    }

    async showUserDashboard() {
        if (!this.currentUser || this.currentUser.role !== 'user') {
            window.location.href = '/login.html';
            return;
        }
    }

    async showDeveloperDashboard() {
        if (!this.currentUser || this.currentUser.role !== 'developer') {
            window.location.href = '/login.html';
            return;
        }
    }

    async showAppDetails() {}
    async showSearch() {}

    updateUI() {
        const isLoggedIn = !!this.currentUser;
        document.querySelectorAll('[data-auth]').forEach(el => {
            el.style.display = isLoggedIn ? 'block' : 'none';
        });
        document.querySelectorAll('[data-guest]').forEach(el => {
            el.style.display = isLoggedIn ? 'none' : 'block';
        });
        if (this.currentUser) {
            const usernameEl = document.querySelector('[data-username]');
            if (usernameEl) usernameEl.textContent = this.currentUser.username;
        }
    }

    logout() {
        api.auth.logout();
        this.currentUser = null;
        this.updateUI();
        window.location.href = '/index.html';
    }

    navigate(url) {
        window.location.href = url;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

export default App;
