// server.js - Complete server file
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import backend modules
import { connectDB, getPgPool, getRedis } from './backend/db.js';
import routes from './backend/routes.js';
import { errorHandler, notFound } from './backend/middleware.js';
import { startScheduler } from './backend/scheduler.js';
import { setupSockets } from './backend/socket.js';
import config from './backend/config.js';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'https://alpha-af1q.onrender.com',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
});

const PORT = process.env.PORT || 5000;

// ==================== REQUEST LOGGING ====================
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    if (req.path === '/api/auth/register') {
        console.log('📝 Register request body:', { ...req.body, password: '***' });
    }
    next();
});

// ==================== SECURITY & PERFORMANCE ====================

// Helmet security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// CORS configuration
const allowedOrigins = [
    'https://alpha-af1q.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn('⚠️ CORS blocked:', origin);
            callback(null, true); // Allow all in development
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// ==================== STATIC FILES ====================

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== HEALTH CHECK ENDPOINTS ====================

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Alpha Platform',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

app.get('/health/detailed', async (req, res) => {
    const status = {
        service: 'Alpha Platform',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        databases: {
            postgres: false,
            mongodb: false,
            redis: false
        },
        memory: {
            used: process.memoryUsage().heapUsed / 1024 / 1024,
            total: process.memoryUsage().heapTotal / 1024 / 1024
        }
    };

    try {
        const pool = getPgPool();
        if (pool) {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            status.databases.postgres = true;
        }
    } catch (error) {
        status.databases.postgres = false;
    }

    res.status(200).json(status);
});

app.get('/debug/env', (req, res) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (!isDevelopment) {
        return res.status(403).json({ error: 'Forbidden in production' });
    }

    res.json({
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
        DB_NAME: process.env.DB_NAME ? 'set' : 'not set',
        DB_USER: process.env.DB_USER ? 'set' : 'not set',
        FRONTEND_URL: process.env.FRONTEND_URL,
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
    });
});

// ==================== API ROUTES ====================

app.use('/api', routes);

// ==================== FRONTEND ROUTES ====================

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ==================== ERROR HANDLING ====================

app.use(notFound);
app.use(errorHandler);

// Unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📴 Received SIGTERM. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// ==================== START SERVER ====================

const startServer = async () => {
    try {
        console.log('🚀 Starting server...');
        
        await connectDB();
        startScheduler();
        setupSockets(io);
        
        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`📱 Frontend: ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}`);
            console.log(`🔌 API: ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}/api`);
            console.log(`❤️ Health: ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}/health`);
            console.log(`🧪 Test: ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}/api/test`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export { app, server, io };
