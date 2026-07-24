const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import backend modules
const authModule = require('./backend/auth');
const workspaceModule = require('./backend/workspace');
const projectModule = require('./backend/project');
const serviceModule = require('./backend/service');
const deploymentModule = require('./backend/deployment');
const gitModule = require('./backend/git');
const dockerModule = require('./backend/docker');
const buildModule = require('./backend/build');
const environmentModule = require('./backend/environment');
const logModule = require('./backend/log');
const metricsModule = require('./backend/metrics');
const billingModule = require('./backend/billing');
const notificationModule = require('./backend/notification');
const roleModule = require('./backend/role');
const domainModule = require('./backend/domain');
const sslModule = require('./backend/ssl');
const apiModule = require('./backend/api');
const databaseModule = require('./backend/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://alpha-platform.onrender.com', 'http://localhost:3000']
    : '*',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/css', express.static(path.join(__dirname, 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js')));

// API Routes
app.use('/api/auth', authModule);
app.use('/api/workspace', workspaceModule);
app.use('/api/projects', projectModule);
app.use('/api/services', serviceModule);
app.use('/api/deployments', deploymentModule);
app.use('/api/git', gitModule);
app.use('/api/docker', dockerModule);
app.use('/api/build', buildModule);
app.use('/api/environment', environmentModule);
app.use('/api/logs', logModule);
app.use('/api/metrics', metricsModule);
app.use('/api/billing', billingModule);
app.use('/api/notifications', notificationModule);
app.use('/api/roles', roleModule);
app.use('/api/domains', domainModule);
app.use('/api/ssl', sslModule);
app.use('/api', apiModule);
app.use('/api/database', databaseModule);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'projects.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'services.html'));
});

app.get('/deployments', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'deployments.html'));
});

app.get('/logs', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'logs.html'));
});

app.get('/metrics', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'metrics.html'));
});

app.get('/domains', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'domains.html'));
});

app.get('/environment-variables', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'environment-variables.html'));
});

app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'billing.html'));
});

app.get('/team', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'team.html'));
});

app.get('/notifications', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'notifications.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'settings.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'profile.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize services
async function initializeServices() {
  try {
    console.log('🚀 Initializing Alpha Platform...');
    
    // Initialize database connection
    await databaseModule.connect();
    console.log('✅ Database connected');
    
    // Initialize other services
    await workspaceModule.initialize();
    await projectModule.initialize();
    await serviceModule.initialize();
    await deploymentModule.initialize();
    await gitModule.initialize();
    await dockerModule.initialize();
    await buildModule.initialize();
    await environmentModule.initialize();
    await logModule.initialize();
    await metricsModule.initialize();
    await billingModule.initialize();
    await notificationModule.initialize();
    await roleModule.initialize();
    await domainModule.initialize();
    await sslModule.initialize();
    await apiModule.initialize();
    
    console.log('✅ All services initialized');
    console.log(`🌟 Alpha Platform running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🔧 Server running on port ${PORT}`);
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  databaseModule.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  databaseModule.disconnect();
  process.exit(0);
});

module.exports = app;
