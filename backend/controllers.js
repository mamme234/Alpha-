// backend/controllers.js - Simple working version
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPgPool } from './db.js';

// ==================== AUTH CONTROLLERS ====================

export const authController = {
  register: async (req, res) => {
    const { username, email, password, role = 'user' } = req.body;
    
    try {
      console.log('📝 Register:', { username, email });

      // Simple validation
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
      }

      const pool = getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Check if user exists
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, role, is_developer, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, username, email, role`,
        [username, email, hashedPassword, role, role === 'developer']
      );

      const user = result.rows[0];
      console.log('✅ User created:', user.username);

      // Create token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    
    try {
      console.log('📝 Login:', { email });

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const pool = getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Find user
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      console.log('✅ Login successful:', user.username);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isDeveloper: user.is_developer || false
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  me: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = getPgPool();
      const result = await pool.query(
        'SELECT id, username, email, role, is_developer FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  },

  logout: async (req, res) => {
    res.json({ success: true, message: 'Logged out' });
  }
};

// ==================== USER CONTROLLERS ====================

export const userController = {
  getDashboard: async (req, res) => {
    res.json({ 
      featured: [],
      trending: [],
      newReleases: []
    });
  },

  getFavorites: async (req, res) => {
    res.json([]);
  },

  getDownloads: async (req, res) => {
    res.json([]);
  },

  downloadApp: async (req, res) => {
    res.json({ success: true });
  },

  favoriteApp: async (req, res) => {
    res.json({ success: true });
  },

  writeReview: async (req, res) => {
    res.json({ success: true });
  },

  getReviews: async (req, res) => {
    res.json([]);
  },

  getNotifications: async (req, res) => {
    res.json([]);
  },

  updateProfile: async (req, res) => {
    res.json({ success: true });
  }
};

// ==================== DEVELOPER CONTROLLERS ====================

export const developerController = {
  getDashboard: async (req, res) => {
    res.json({
      projects: 0,
      activeDeployments: 0,
      publishedApps: 0,
      totalDownloads: 0,
      recentActivity: [],
      usage: {
        storage: { used: 0, total: 10 * 1024 * 1024 * 1024 },
        cpu: { used: 0, total: 100 },
        memory: { used: 0, total: 8 }
      }
    });
  },

  getProjects: async (req, res) => {
    res.json([]);
  },

  createProject: async (req, res) => {
    res.json({ success: true, project: { id: Date.now() } });
  },

  getProject: async (req, res) => {
    res.json({ id: req.params.projectId });
  },

  getProjectFiles: async (req, res) => {
    res.json([]);
  },

  saveProjectFile: async (req, res) => {
    res.json({ success: true });
  },

  deploy: async (req, res) => {
    res.json({ success: true, deploymentId: 'dep_' + Date.now() });
  },

  getDeploymentStatus: async (req, res) => {
    res.json({ status: 'success' });
  },

  getDeployments: async (req, res) => {
    res.json([]);
  },

  publishApp: async (req, res) => {
    res.json({ success: true, appId: 'app_' + Date.now() });
  },

  getPublishedApps: async (req, res) => {
    res.json([]);
  },

  getAnalytics: async (req, res) => {
    res.json({
      totalDownloads: 0,
      activeUsers: 0,
      downloadsData: [],
      usersData: [],
      locations: {},
      devices: {}
    });
  }
};

// ==================== ADMIN CONTROLLERS ====================

export const adminController = {
  getDashboard: async (req, res) => {
    res.json({
      totalUsers: 0,
      totalDevelopers: 0,
      totalApps: 0,
      totalDownloads: 0
    });
  },

  getUsers: async (req, res) => {
    res.json([]);
  },

  getApps: async (req, res) => {
    res.json([]);
  }
};

export default {
  authController,
  userController,
  developerController,
  adminController
};
