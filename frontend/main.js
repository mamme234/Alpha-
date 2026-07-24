// Main JavaScript for Alpha Platform

// ========== AUTH FUNCTIONS ==========

// Handle Google Login
function handleGoogleLogin() {
    window.location.href = '/api/auth/google';
}

// Handle GitHub Login
function handleGitHubLogin() {
    window.location.href = '/api/auth/github';
}

// Handle Login Form
function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    // Simulate login
    if (email && password) {
        localStorage.setItem('user', JSON.stringify({ name: 'Muhammad', email }));
        window.location.href = '/dashboard';
    } else {
        alert('Please fill in all fields');
    }
}

// Handle Register Form
function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelectorAll('input[type="password"]')[0].value;
    const confirm = form.querySelectorAll('input[type="password"]')[1].value;
    
    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }
    
    if (name && email && password) {
        localStorage.setItem('user', JSON.stringify({ name, email }));
        window.location.href = '/dashboard';
    } else {
        alert('Please fill in all fields');
    }
}

// ========== UI FUNCTIONS ==========

// Toggle Menu Dropdown
function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    if (dropdown) {
        dropdown.classList.toggle('open');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menuIcon = document.querySelector('.menu-icon');
    const dropdown = document.getElementById('menuDropdown');
    if (menuIcon && !menuIcon.contains(event.target)) {
        if (dropdown) dropdown.classList.remove('open');
    }
});

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    }
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

// Load theme preference
function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// Open New Project Modal
function openNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.classList.add('open');
    }
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.classList.remove('open');
    }
}

// Handle New Project Submission
function handleNewProject(event) {
    event.preventDefault();
    const form = event.target;
    const projectName = form.querySelector('input[placeholder="Project name"]').value;
    const repoUrl = document.getElementById('repoUrl').value;
    
    if (projectName && repoUrl) {
        alert(`🚀 Deploying "${projectName}" from ${repoUrl}\nThis would trigger a build and deployment process.`);
        closeModal();
    } else {
        alert('Please enter a project name and repository URL');
    }
}

// ========== API FUNCTIONS ==========

// Fetch User Data
async function fetchUserData() {
    try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Fetch Projects
async function fetchProjects() {
    try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

// Fetch Services
async function fetchServices() {
    try {
        const response = await fetch('/api/services');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching services:', error);
        return [];
    }
}

// Fetch Deployments
async function fetchDeployments() {
    try {
        const response = await fetch('/api/deployments');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching deployments:', error);
        return [];
    }
}

// Fetch Metrics
async function fetchMetrics(serviceId) {
    try {
        const response = await fetch(`/api/metrics/${serviceId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return null;
    }
}

// Deploy Project
async function deployProject(projectId) {
    try {
        const response = await fetch(`/api/deployments/deploy/${projectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deploying project:', error);
        return null;
    }
}

// ========== UTILITY FUNCTIONS ==========

// Format Date
function formatDate(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate Random ID
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
        window.location.href = '/login';
    }
    return user ? JSON.parse(user) : null;
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// ========== INITIALIZATION ==========

// Load theme on page load
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    
    // Check authentication
    const user = checkAuth();
    
    // Update UI with user info
    if (user) {
        const avatar = document.querySelector('.avatar');
        if (avatar) {
            avatar.textContent = user.name.charAt(0).toUpperCase();
            avatar.title = user.name;
        }
    }
    
    // Close modal on outside click
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
});

console.log('🚀 Alpha Platform loaded successfully!');
