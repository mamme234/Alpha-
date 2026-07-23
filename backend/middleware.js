// backend/middleware.js - Complete updated file
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { getRedis } from './db.js';

// ==================== AUTHENTICATION ====================

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
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
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
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
  limits: { fileSize: 100 * 1024 * 1024 },
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
  cache
};
