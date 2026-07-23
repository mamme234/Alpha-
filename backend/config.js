// backend/config.js - Make sure limits are defined
import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://alpha-af1q.onrender.com',
  
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  jwtExpiresIn: '7d',
  refreshTokenExpiresIn: '30d',

  // PostgreSQL
  postgres: {
    host: process.env.DB_HOST || 'dpg-d9gsn2vlk1mc738ifbn0-a',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'muhammad123',
    user: process.env.DB_USER || 'muhammad123',
    password: process.env.DB_PASSWORD || 'JJtHe4ZLlyE65EeGv2RCGNzMTRCxAIqe',
  },
  
  mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha_platform',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // ===== ADD THIS SECTION =====
  limits: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxProjectsPerUser: 100,
    maxTeamMembers: 50,
    maxAppsPerDeveloper: 50,
  },

  deployment: {
    baseDomain: process.env.BASE_DOMAIN || 'app.dev',
    buildTimeout: 600000,
    maxDeployments: 50,
  },

  features: {
    enableMonetization: process.env.ENABLE_MONETIZATION === 'true',
    enableDocker: process.env.ENABLE_DOCKER === 'true',
    enableTeam: process.env.ENABLE_TEAM === 'true',
  },

  // S3 (optional)
  s3: {
    accessKey: process.env.AWS_ACCESS_KEY_ID || '',
    secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucket: process.env.AWS_BUCKET || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },

  // Email (optional)
  email: {
    service: process.env.EMAIL_SERVICE || '',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
};
