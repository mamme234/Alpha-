// backend/config.js - Complete updated file
import dotenv from 'dotenv';
dotenv.config();

export default {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://alpha-af1q.onrender.com',
  baseDomain: process.env.BASE_DOMAIN || 'alpha-af1q.onrender.com',
  appName: 'Alpha Platform',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  // PostgreSQL
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'platform_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  // MongoDB (optional)
  mongodb: process.env.MONGODB_URI || '',
  
  // Redis (optional)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
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

  // Limits
  limits: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'),
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880'),
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
    enableGithub: process.env.ENABLE_GITHUB === 'true',
  },
};
