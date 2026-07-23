// backend/middleware.js - Fixed version
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import config from './config.js';
import { getRedis } from './db.js';

// ==================== AUTHENTICATION ====================

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, config.jwtSecret || 'secret');
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ==================== AUTHORIZATION ====================

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// ==================== RATE LIMITING ====================

export const rateLimitUser = (maxRequests = 100, windowMs = 60000) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.ip;
      const key = `rate:${userId}`;
      const redis = getRedis();
      
      if (redis) {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, windowMs / 1000);
        }
        
        if (current > maxRequests) {
          return res.status(429).json({ 
            error: 'Too many requests. Please try again later.' 
          });
        }
      }
      
      next();
    } catch (error) {
      // If Redis fails, allow the request
      console.warn('Rate limiting error:', error.message);
      next();
    }
  };
};

// ==================== REQUEST LOGGING ====================

export const logger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

// ==================== ERROR HANDLER ====================

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ==================== 404 HANDLER ====================

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found' });
};

// ==================== FILE UPLOAD ====================

// Get max file size from config or use default
const getMaxFileSize = () => {
  try {
    return config.limits?.maxFileSize || 100 * 1024 * 1024; // 100MB default
  } catch (error) {
    return 100 * 1024 * 1024;
  }
};

const getMaxImageSize = () => {
  try {
    return config.limits?.maxImageSize || 5 * 1024 * 1024; // 5MB default
  } catch (error) {
    return 5 * 1024 * 1024;
  }
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/zip',
    'application/x-zip-compressed',
    'application/javascript',
    'text/javascript',
    'text/css',
    'text/html',
    'application/json',
    'text/plain',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

export const upload = multer({
  storage,
  limits: { 
    fileSize: getMaxFileSize()
  },
  fileFilter,
});

export const uploadMultiple = upload.array('files', 10);
export const uploadSingle = upload.single('file');

// ==================== VALIDATION ====================

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message) 
      });
    }
    next();
  };
};

// ==================== CACHE ====================

export const cache = (duration = 60) => {
  return async (req, res, next) => {
    try {
      const key = `cache:${req.originalUrl}`;
      const redis = getRedis();
      
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
        
        // Store original send
        const originalSend = res.json;
        res.json = function(data) {
          redis.setex(key, duration, JSON.stringify(data));
          originalSend.call(this, data);
        };
      }
      
      next();
    } catch (error) {
      console.warn('Cache error:', error.message);
      next();
    }
  };
};

// ==================== CORS ====================

export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://alpha-af1q.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// ==================== SECURITY HEADERS ====================

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// ==================== EXPORTS ====================

export default {
  authenticate,
  authorize,
  rateLimitUser,
  logger,
  errorHandler,
  notFound,
  upload,
  uploadMultiple,
  uploadSingle,
  validate,
  cache,
  corsOptions,
  securityHeaders,
};
