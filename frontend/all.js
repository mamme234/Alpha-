// all.js - Add this function

// ============================================================
// DEVELOPER DASHBOARD
// ============================================================

export const loadDeveloperDashboard = async () => {
    try {
        const stats = await api.developer.getDashboard();
        
        // Update stats
        document.querySelectorAll('.stat-value').forEach((el, index) => {
            const values = [
                stats.projects || 0,
                stats.activeDeployments || 0,
                stats.publishedApps || 0,
                stats.totalDownloads || 0,
                stats.usage?.storage?.used || '0 MB',
                stats.usage?.cpu?.used || '0%'
            ];
            if (el) el.textContent = values[index] || '0';
        });

        // Load projects
        const projects = await api.developer.getProjects();
        renderProjects(projects);

        // Load deployments
        const deployments = await api.developer.getDeployments();
        renderDeployments(deployments);

        // Load published apps
        const apps = await api.developer.getPublishedApps();
        renderPublishedApps(apps);

    } catch (error) {
        console.error('Failed to load developer dashboard:', error);
        showError('Failed to load dashboard');
    }
};

export const renderProjects = (projects) => {
    const container = document.getElementById('dev-projects');
    if (!container) return;

    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Yet</h3>
                <p>Create your first project to start building</p>
                <button class="btn btn-primary" onclick="navigateTo('editor', { new: true })">
                    <i class="fas fa-plus"></i> Create Project
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-header">
                <h3>${project.name}</h3>
                <span class="project-status ${project.status || 'active'}">${project.status || 'Active'}</span>
            </div>
            <p class="project-description">${project.description || 'No description'}</p>
            <div class="project-meta">
                <span><i class="fas fa-code"></i> ${project.framework || 'Unknown'}</span>
                <span><i class="fas fa-file-code"></i> ${project.language || 'Unknown'}</span>
                <span><i class="fas fa-clock"></i> ${project.lastDeployed ? new Date(project.lastDeployed).toLocaleDateString() : 'Never'}</span>
            </div>
            <div class="project-actions">
                <button class="btn btn-primary btn-sm" onclick="navigateTo('editor', { project: '${project._id}' })">
                    <i class="fas fa-edit"></i> Open
                </button>
                <button class="btn btn-success btn-sm" onclick="navigateTo('deploy', { project: '${project._id}' })">
                    <i class="fas fa-rocket"></i> Deploy
                </button>
                <button class="btn btn-outline btn-sm" onclick="navigateTo('settings')">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
        </div>
    `).join('');
};

export const renderDeployments = (deployments) => {
    const tbody = document.getElementById('recent-deployments');
    if (!tbody) return;

    if (!deployments || deployments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">
                    <i class="fas fa-inbox"></i> No deployments yet
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = deployments.slice(0, 5).map(deployment => `
        <tr>
            <td><strong>${deployment.project?.name || 'Unknown'}</strong></td>
            <td>v${deployment.version || '1.0.0'}</td>
            <td>${deployment.branch || 'main'}</td>
            <td>
                <span class="status-badge ${deployment.status || 'pending'}">
                    ${deployment.status || 'Pending'}
                </span>
            </td>
            <td>${new Date(deployment.deployedAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewDeployment('${deployment._id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
};

export const renderPublishedApps = (apps) => {
    const container = document.getElementById('published-apps');
    if (!container) return;

    if (!apps || apps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-th-large"></i>
                <h3>No Published Apps</h3>
                <p>Publish your first app to the marketplace</p>
                <button class="btn btn-primary" onclick="navigateTo('publish')">
                    <i class="fas fa-upload"></i> Publish App
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = apps.map(app => `
        <div class="app-card" onclick="navigateTo('app', { id: '${app._id}' })">
            <img src="${app.icon || '/assets/default-app-icon.png'}" alt="${app.name}" class="app-card-image">
            <div class="app-card-content">
                <h3 class="app-card-title">${app.name}</h3>
                <p class="app-card-developer">${app.developerName || 'You'}</p>
                <div class="app-card-rating">
                    <i class="fas fa-star"></i> ${app.rating || 'N/A'}
                </div>
                <div class="app-card-stats">
                    <span><i class="fas fa-download"></i> ${app.downloads || 0}</span>
                    <span><i class="fas fa-users"></i> ${app.users || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
};

// Add to export
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
    initNavigation,
    loadDeveloperDashboard,
    renderProjects,
    renderDeployments,
    renderPublishedApps
};    if (logoLink) {
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
