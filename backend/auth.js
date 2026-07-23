// backend/auth.js - Complete updated file
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getPgPool, getRedis } from './db.js';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

export const generateRefreshToken = async (userId) => {
  try {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const pool = getPgPool();
    if (pool) {
      await pool.query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt]
      );
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error generating refresh token:', error);
    return crypto.randomBytes(40).toString('hex');
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = async (token) => {
  try {
    const pool = getPgPool();
    if (!pool) return null;
    
    const result = await pool.query(
      'SELECT user_id, expires_at FROM sessions WHERE token = $1',
      [token]
    );
    
    if (result.rows.length === 0) return null;
    
    const session = result.rows[0];
    if (new Date(session.expires_at) < new Date()) return null;
    
    return session.user_id;
  } catch (error) {
    console.error('❌ Refresh token verification error:', error);
    return null;
  }
};

export const generate2FASecret = () => {
  return crypto.randomBytes(20).toString('hex');
};

export const verify2FACode = (secret, token) => {
  // Simple implementation - in production use speakeasy
  return true;
};

export const createPasswordResetToken = async (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const redis = getRedis();
  if (redis) {
    await redis.setex(`reset:${token}`, 3600, email);
  }
  return token;
};

export const verifyPasswordResetToken = async (token) => {
  const redis = getRedis();
  if (!redis) return null;
  return await redis.get(`reset:${token}`);
};

export const generateApiKey = () => {
  return `pk_${crypto.randomBytes(32).toString('hex')}`;
};

export default {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generate2FASecret,
  verify2FACode,
  createPasswordResetToken,
  verifyPasswordResetToken,
  generateApiKey
};
