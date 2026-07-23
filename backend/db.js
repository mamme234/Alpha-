// db.js
import mongoose from 'mongoose';
import { Pool } from 'pg';
import Redis from 'ioredis';
import config from './config.js';

let pgPool = null;
let redisClient = null;

export const connectDB = async () => {
  try {
    // MongoDB
    if (config.mongodb && config.mongodb !== 'mongodb://localhost:27017/alpha_platform') {
      await mongoose.connect(config.mongodb, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ MongoDB connected');
    } else {
      console.log('⚠️ MongoDB not configured, skipping...');
    }

    // PostgreSQL
    if (config.postgres) {
      const pgConfig = {
        host: config.postgres.host,
        port: config.postgres.port || 5432,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password,
        ssl: {
          rejectUnauthorized: false  // Important for Render
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

      console.log('📊 Connecting to PostgreSQL:', {
        host: pgConfig.host,
        port: pgConfig.port,
        database: pgConfig.database,
        user: pgConfig.user,
        ssl: 'enabled'
      });

      pgPool = new Pool(pgConfig);
      
      // Test connection
      const client = await pgPool.connect();
      console.log('✅ PostgreSQL connected successfully');
      client.release();

      await initPostgresTables();
    }

    // Redis (optional)
    if (config.redis && config.redis.host !== 'localhost') {
      const redisConfig = {
        host: config.redis.host,
        port: config.redis.port || 6379,
        password: config.redis.password || '',
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('⚠️ Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      };

      redisClient = new Redis(redisConfig);
      redisClient.on('connect', () => console.log('✅ Redis connected'));
      redisClient.on('error', (err) => console.warn('⚠️ Redis error:', err.message));
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    // Don't exit - allow app to start with limited functionality
  }
};

const initPostgresTables = async () => {
  try {
    const client = await pgPool.connect();
    try {
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          is_verified BOOLEAN DEFAULT false,
          is_developer BOOLEAN DEFAULT false,
          two_factor_enabled BOOLEAN DEFAULT false,
          two_factor_secret TEXT,
          avatar_url TEXT,
          bio TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS team_members (
          team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'developer',
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (team_id, user_id)
        );
        
        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      `);
      console.log('✅ PostgreSQL tables initialized');
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('⚠️ Table init warning:', error.message);
  }
};

export const getPgPool = () => pgPool;
export const getRedis = () => redisClient;

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    await pgPool?.end();
    await redisClient?.quit();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};
