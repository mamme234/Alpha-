// config.js
import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://alpha-platform.onrender.com',
  
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-this',
  jwtExpiresIn: '7d',
  refreshTokenExpiresIn: '30d',

  // PostgreSQL - Use your Render connection string
  postgres: {
    host: process.env.DB_HOST || 'dpg-d9gsn2vlk1mc738ifbn0-a',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'muhammad123',
    user: process.env.DB_USER || 'muhammad123',
    password: process.env.DB_PASSWORD || 'JJtHe4ZLlyE65EeGv2RCGNzMTRCxAIqe',
    ssl: true,
  },
  
  mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha_platform',
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // ... rest of config
};
