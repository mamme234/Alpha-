// server.js - Complete server file for Render deployment
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
        origin: 'https://alpha-af1q.onrender.com',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
});

const PORT = process.env.PORT || 5000;

// ==================== SECURITY & PERFORMANCE ====================

// Helmet security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Compression
app.use(compression());

// CORS configuration - Allow only your frontend
app.use(cors({
    origin: 'https://alpha-af1q.onrender.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// ==================== REQUEST LOGGING ====================

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// ==================== STATIC FILES ====================

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// ==================== HEALTH CHECK ENDPOINTS ====================

// Simple health check
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

// Detailed health check with database status
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

    // Check PostgreSQL
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

    // Check MongoDB
    try {
        const mongoose = await import('mongoose');
        status.databases.mongodb = mongoose.connection.readyState === 1;
    } catch (error) {
        status.databases.mongodb = false;
    }

    // Check Redis
    try {
        const redis = getRedis();
        if (redis) {
            const result = await redis.ping();
            status.databases.redis = result === 'PONG';
        }
    } catch (error) {
        status.databases.redis = false;
    }

    res.status(200).json(status);
});

// Debug endpoint for environment variables (remove in production)
app.get('/debug/env', (req, res) => {
    // Only show in development or with a secret key
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (!isDevelopment) {
        return res.status(403).json({ error: 'Forbidden in production' });
    }

    const safeEnv = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST ? 'set' : 'not set',
        DB_NAME: process.env.DB_NAME ? 'set' : 'not set',
        DB_USER: process.env.DB_USER ? 'set' : 'not set',
        DB_PORT: process.env.DB_PORT ? 'set' : 'not set',
        MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set',
        FRONTEND_URL: process.env.FRONTEND_URL,
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set',
    };
    res.json(safeEnv);
});

// ==================== API ROUTES ====================

// Mount API routes
app.use('/api', routes);

// ==================== FRONTEND ROUTES ====================

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
    // If it's an API route that wasn't caught, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Otherwise, serve index.html for frontend routes
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ==================== ERROR HANDLING ====================

// 404 handler for API
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Unhandled promise rejection handler
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // Don't crash the server
});

// Unhandled exception handler
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Don't crash the server
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
        // Connect to databases (don't fail if not available)
        try {
            await connectDB();
            startScheduler();
            console.log('✅ Database connections established');
        } catch (dbError) {
            console.warn('⚠️ Database connection failed:', dbError.message);
            console.log('💡 App will run with limited functionality until databases are configured');
        }

        // Setup WebSocket
        setupSockets(io);

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Frontend: https://alpha-af1q.onrender.com`);
            console.log(`🔌 API: https://alpha-af1q.onrender.com/api`);
            console.log(`❤️ Health: https://alpha-af1q.onrender.com/health`);
            console.log(`🔧 Debug: https://alpha-af1q.onrender.com/debug/env`);
            console.log(`✅ CORS allowed: https://alpha-af1q.onrender.com`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

export { app, server, io };
