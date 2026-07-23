// backend/routes.js - Complete updated file
import express from 'express';
import { authController, userController, developerController, adminController } from './controllers.js';
import { authenticate, authorize } from './middleware.js';

const router = express.Router();

// ==================== TEST ROUTE ====================
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/test'
    ]
  });
});

// ==================== AUTH ROUTES ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authenticate, authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/me', authenticate, authController.me);
router.post('/auth/change-password', authenticate, authController.changePassword);
router.post('/auth/toggle-2fa', authenticate, authController.toggle2FA);
router.get('/auth/sessions', authenticate, authController.getSessions);
router.delete('/auth/sessions/:sessionId', authenticate, authController.revokeSession);
router.delete('/auth/delete-account', authenticate, authController.deleteAccount);
router.post('/auth/verify-email', authController.verifyEmail);
router.post('/auth/request-password-reset', authController.requestPasswordReset);
router.post('/auth/reset-password', authController.resetPassword);

// ==================== USER ROUTES ====================
router.get('/users/dashboard', authenticate, userController.getDashboard);
router.get('/users/favorites', authenticate, userController.getFavorites);
router.get('/users/downloads', authenticate, userController.getDownloads);
router.post('/users/apps/:appId/download', authenticate, userController.downloadApp);
router.post('/users/apps/:appId/favorite', authenticate, userController.favoriteApp);
router.post('/users/apps/:appId/reviews', authenticate, userController.writeReview);
router.get('/users/apps/:appId/reviews', authenticate, userController.getReviews);
router.get('/users/notifications', authenticate, userController.getNotifications);
router.put('/users/notifications/:notificationId', authenticate, userController.markNotificationRead);
router.put('/users/notifications/mark-all-read', authenticate, userController.markAllNotificationsRead);
router.delete('/users/notifications/clear-all', authenticate, userController.clearAllNotifications);
router.put('/users/profile', authenticate, userController.updateProfile);
router.put('/users/notification-settings', authenticate, userController.updateNotificationSettings);
router.put('/users/privacy-settings', authenticate, userController.updatePrivacySettings);
router.get('/users/export-data', authenticate, userController.exportData);

// ==================== DEVELOPER ROUTES ====================
router.get('/developers/dashboard', authenticate, authorize('developer', 'admin'), developerController.getDashboard);
router.get('/developers/projects', authenticate, authorize('developer', 'admin'), developerController.getProjects);
router.post('/developers/projects', authenticate, authorize('developer', 'admin'), developerController.createProject);
router.get('/developers/projects/:projectId', authenticate, authorize('developer', 'admin'), developerController.getProject);
router.put('/developers/projects/:projectId', authenticate, authorize('developer', 'admin'), developerController.updateProject);
router.delete('/developers/projects/:projectId', authenticate, authorize('developer', 'admin'), developerController.deleteProject);
router.get('/developers/projects/:projectId/files', authenticate, authorize('developer', 'admin'), developerController.getProjectFiles);
router.post('/developers/projects/:projectId/files', authenticate, authorize('developer', 'admin'), developerController.saveProjectFile);
router.post('/developers/projects/:projectId/deploy', authenticate, authorize('developer', 'admin'), developerController.deploy);
router.get('/developers/deployments/:deploymentId', authenticate, authorize('developer', 'admin'), developerController.getDeploymentStatus);
router.get('/developers/deployments/:deploymentId/logs', authenticate, authorize('developer', 'admin'), developerController.getDeploymentLogs);
router.get('/developers/projects/:projectId/deployments', authenticate, authorize('developer', 'admin'), developerController.getDeployments);
router.post('/developers/deployments/:deploymentId/rollback', authenticate, authorize('developer', 'admin'), developerController.rollback);
router.post('/developers/publish', authenticate, authorize('developer', 'admin'), developerController.publishApp);
router.put('/developers/apps/:appId', authenticate, authorize('developer', 'admin'), developerController.updateApp);
router.get('/developers/apps', authenticate, authorize('developer', 'admin'), developerController.getPublishedApps);
router.get('/developers/analytics', authenticate, authorize('developer', 'admin'), developerController.getAnalytics);
router.post('/developers/projects/:projectId/git/commit', authenticate, authorize('developer', 'admin'), developerController.gitCommit);
router.post('/developers/projects/:projectId/team/invite', authenticate, authorize('developer', 'admin'), developerController.inviteTeamMember);
router.get('/developers/projects/:projectId/team', authenticate, authorize('developer', 'admin'), developerController.getTeam);

// ==================== ADMIN ROUTES ====================
router.get('/admin/dashboard', authenticate, authorize('admin'), adminController.getDashboard);
router.get('/admin/users', authenticate, authorize('admin'), adminController.getUsers);
router.put('/admin/users/:userId', authenticate, authorize('admin'), adminController.updateUser);
router.get('/admin/apps', authenticate, authorize('admin'), adminController.getApps);
router.put('/admin/apps/:appId/approve', authenticate, authorize('admin'), adminController.approveApp);
router.put('/admin/apps/:appId/feature', authenticate, authorize('admin'), adminController.featureApp);
router.get('/admin/reports', authenticate, authorize('admin'), adminController.getReports);
router.post('/admin/categories', authenticate, authorize('admin'), adminController.manageCategories);
router.get('/admin/system/stats', authenticate, authorize('admin'), adminController.getSystemStats);
router.get('/admin/security/logs', authenticate, authorize('admin'), adminController.getSecurityLogs);
router.post('/admin/backup/create', authenticate, authorize('admin'), adminController.createBackup);

// ==================== PUBLIC ROUTES ====================
router.get('/apps', (req, res) => {
  res.json({ data: [] });
});

router.get('/apps/:appId', (req, res) => {
  res.json({ id: req.params.appId });
});

router.get('/categories', (req, res) => {
  res.json([]);
});

router.get('/apps/search', (req, res) => {
  res.json({ data: [] });
});

router.get('/apps/:appId/reviews', (req, res) => {
  res.json([]);
});

export default router;
