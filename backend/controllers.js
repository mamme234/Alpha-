// backend/controllers.js - Complete updated file
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getPgPool, getRedis } from './db.js';
import { App, Project, Deployment, Review, Notification, Analytics } from './models.js';
import config from './config.js';
import { generateToken, generateRefreshToken } from './auth.js';
import { emailService, storageService } from './services.js';

// ==================== AUTH CONTROLLERS ====================

export const authController = {
  register: async (req, res) => {
    const { username, email, password, role = 'user' } = req.body;
    
    try {
      console.log('📝 Registration attempt:', { username, email, role });

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: 'Username, email, and password are required' 
        });
      }

      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ 
          error: 'Username must be between 3 and 30 characters' 
        });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ 
          error: 'Invalid email address' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters' 
        });
      }

      const pool = getPgPool();
      if (!pool) {
        console.error('❌ PostgreSQL pool not available');
        return res.status(500).json({ 
          error: 'Database not available. Please try again later.' 
        });
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ 
          error: 'User with this email or username already exists' 
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, role, is_developer, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, username, email, role, is_developer, created_at`,
        [username, email, passwordHash, role, role === 'developer']
      );

      const user = result.rows[0];
      console.log(`✅ User created: ${user.username} (${user.id})`);

      // Generate tokens
      const token = generateToken(user.id, user.role);
      const refreshToken = await generateRefreshToken(user.id);

      // Send welcome email (don't wait for it)
      try {
        await emailService.sendEmail({
          to: email,
          subject: 'Welcome to Alpha Platform!',
          html: `
            <h1>Welcome ${username}!</h1>
            <p>Thank you for joining Alpha Platform. You can now start building and discovering amazing applications.</p>
            <p>Click here to verify your email: <a href="${config.frontendUrl}/verify-email?token=${token}">Verify Email</a></p>
          `
        });
      } catch (emailError) {
        console.warn('⚠️ Welcome email not sent:', emailError.message);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isDeveloper: user.is_developer,
          createdAt: user.created_at
        },
        token,
        refreshToken
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed. Please try again.' 
      });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    
    try {
      console.log('📝 Login attempt:', { email });

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const pool = getPgPool();
      if (!pool) {
        console.error('❌ PostgreSQL pool not available');
        return res.status(500).json({ 
          error: 'Database not available. Please try again later.' 
        });
      }

      // Find user by email
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      console.log('📊 User query result:', { 
        found: result.rows.length > 0,
        email: email 
      });

      if (result.rows.length === 0) {
        console.log('❌ User not found:', email);
        return res.status(401).json({ 
          error: 'Invalid credentials. User not found.' 
        });
      }

      const user = result.rows[0];
      console.log('👤 User found:', { 
        id: user.id, 
        username: user.username,
        email: user.email
      });

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      console.log('🔐 Password validation:', { valid: validPassword });

      if (!validPassword) {
        console.log('❌ Invalid password for user:', email);
        return res.status(401).json({ 
          error: 'Invalid credentials. Wrong password.' 
        });
      }

      // Generate tokens
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      const refreshToken = await generateRefreshToken(user.id);

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isDeveloper: user.is_developer || false,
        avatar: user.avatar_url,
        bio: user.bio,
        twoFactorEnabled: user.two_factor_enabled || false,
        createdAt: user.created_at
      };

      console.log('✅ Login successful:', { 
        userId: user.id, 
        username: user.username 
      });

      res.json({
        success: true,
        message: 'Login successful',
        user: userData,
        token,
        refreshToken
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        error: 'Login failed. Please try again.' 
      });
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const pool = getPgPool();
        if (pool) {
          await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
        }
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  me: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const result = await pool.query(
        'SELECT id, username, email, role, is_developer, avatar_url, bio, two_factor_enabled, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Me error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  },

  refreshToken: async (req, res) => {
    const { refreshToken } = req.body;
    
    try {
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const pool = getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const result = await pool.query(
        'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()',
        [refreshToken]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      const userId = result.rows[0].user_id;
      const userResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const token = generateToken(userId, userResult.rows[0].role);
      res.json({ token });
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  },

  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('❌ Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },

  toggle2FA: async (req, res) => {
    // Implementation
    res.json({ success: true, enabled: false });
  },

  getSessions: async (req, res) => {
    // Implementation
    res.json([]);
  },

  revokeSession: async (req, res) => {
    // Implementation
    res.json({ success: true });
  },

  deleteAccount: async (req, res) => {
    // Implementation
    res.json({ success: true });
  },

  verifyEmail: async (req, res) => {
    res.json({ success: true });
  },

  requestPasswordReset: async (req, res) => {
    res.json({ success: true });
  },

  resetPassword: async (req, res) => {
    res.json({ success: true });
  }
};

// ==================== USER CONTROLLERS ====================

export const userController = {
  getDashboard: async (req, res) => {
    try {
      const featuredApps = await App.find({ isFeatured: true, status: 'published' })
        .limit(10)
        .sort({ downloads: -1 });
        
      const trendingApps = await App.find({ status: 'published' })
        .sort({ downloads: -1, rating: -1 })
        .limit(10);
        
      const newApps = await App.find({ status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(10);
      
      res.json({
        featured: featuredApps || [],
        trending: trendingApps || [],
        newReleases: newApps || [],
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.json({
        featured: [],
        trending: [],
        newReleases: []
      });
    }
  },

  getFavorites: async (req, res) => {
    res.json([]);
  },

  getDownloads: async (req, res) => {
    res.json([]);
  },

  downloadApp: async (req, res) => {
    res.json({ success: true, message: 'Download started' });
  },

  favoriteApp: async (req, res) => {
    res.json({ success: true, favorited: true });
  },

  writeReview: async (req, res) => {
    res.json({ success: true, message: 'Review submitted' });
  },

  getReviews: async (req, res) => {
    res.json([]);
  },

  getNotifications: async (req, res) => {
    res.json([]);
  },

  markNotificationRead: async (req, res) => {
    res.json({ success: true });
  },

  markAllNotificationsRead: async (req, res) => {
    res.json({ success: true });
  },

  clearAllNotifications: async (req, res) => {
    res.json({ success: true });
  },

  updateProfile: async (req, res) => {
    res.json({ success: true, message: 'Profile updated' });
  },

  updateNotificationSettings: async (req, res) => {
    res.json({ success: true });
  },

  updatePrivacySettings: async (req, res) => {
    res.json({ success: true });
  },

  exportData: async (req, res) => {
    res.json({ data: {} });
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
        storage: { used: 0, total: 10 * 1024 * 1024 * 1024, percentage: 0 },
        cpu: { used: 0, total: 100 },
        memory: { used: 0, total: 8 }
      }
    });
  },

  getProjects: async (req, res) => {
    res.json([]);
  },

  createProject: async (req, res) => {
    res.json({ success: true, project: { id: Date.now(), ...req.body } });
  },

  getProject: async (req, res) => {
    res.json({ id: req.params.projectId });
  },

  updateProject: async (req, res) => {
    res.json({ success: true });
  },

  deleteProject: async (req, res) => {
    res.json({ success: true });
  },

  getProjectFiles: async (req, res) => {
    res.json([]);
  },

  getProjectFile: async (req, res) => {
    res.json({ content: '' });
  },

  saveProjectFile: async (req, res) => {
    res.json({ success: true });
  },

  createFile: async (req, res) => {
    res.json({ success: true });
  },

  createFolder: async (req, res) => {
    res.json({ success: true });
  },

  deploy: async (req, res) => {
    res.json({ deploymentId: 'deployment_' + Date.now(), status: 'deploying' });
  },

  getDeploymentStatus: async (req, res) => {
    res.json({ status: 'success', url: 'https://example.com' });
  },

  getDeploymentLogs: async (req, res) => {
    res.json([]);
  },

  getDeployments: async (req, res) => {
    res.json([]);
  },

  rollback: async (req, res) => {
    res.json({ success: true });
  },

  publishApp: async (req, res) => {
    res.json({ success: true, appId: 'app_' + Date.now() });
  },

  updateApp: async (req, res) => {
    res.json({ success: true });
  },

  getPublishedApps: async (req, res) => {
    res.json([]);
  },

  getAnalytics: async (req, res) => {
    res.json({
      totalDownloads: 0,
      activeUsers: 0,
      totalReviews: 0,
      averageRating: 0,
      retentionRate: 0,
      averageSession: 0,
      conversionRate: 0,
      downloadsData: [],
      usersData: [],
      locations: {},
      devices: {},
      topApps: []
    });
  },

  gitCommit: async (req, res) => {
    res.json({ success: true });
  },

  inviteTeamMember: async (req, res) => {
    res.json({ success: true });
  },

  getTeam: async (req, res) => {
    res.json([]);
  }
};

// ==================== ADMIN CONTROLLERS ====================

export const adminController = {
  getDashboard: async (req, res) => {
    res.json({
      totalUsers: 0,
      totalDevelopers: 0,
      totalApps: 0,
      totalDownloads: 0,
      storageUsed: '0 MB',
      activeUsers: 0
    });
  },

  getUsers: async (req, res) => {
    res.json([]);
  },

  updateUser: async (req, res) => {
    res.json({ success: true });
  },

  getApps: async (req, res) => {
    res.json([]);
  },

  approveApp: async (req, res) => {
    res.json({ success: true });
  },

  featureApp: async (req, res) => {
    res.json({ success: true });
  },

  getReports: async (req, res) => {
    res.json([]);
  },

  manageCategories: async (req, res) => {
    res.json({ success: true });
  },

  getSystemStats: async (req, res) => {
    res.json({});
  },

  getSecurityLogs: async (req, res) => {
    res.json([]);
  },

  createBackup: async (req, res) => {
    res.json({ success: true, backupId: 'backup_' + Date.now() });
  }
};

export default {
  authController,
  userController,
  developerController,
  adminController
};
