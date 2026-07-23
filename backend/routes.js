// backend/routes.js - Complete working version
import express from 'express';
import { authController, userController, developerController, adminController } from './controllers.js';
import { authenticate, authorize } from './middleware.js';

const router = express.Router();

// ==================== TEST ====================
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    time: new Date().toISOString()
  });
});

// ==================== AUTH ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.me);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ==================== USERS ====================
router.get('/users/dashboard', authenticate, userController.getDashboard);
router.get('/users/favorites', authenticate, userController.getFavorites);
router.get('/users/downloads', authenticate, userController.getDownloads);
router.post('/users/apps/:appId/download', authenticate, userController.downloadApp);
router.post('/users/apps/:appId/favorite', authenticate, userController.favoriteApp);
router.post('/users/apps/:appId/reviews', authenticate, userController.writeReview);
router.get('/users/apps/:appId/reviews', authenticate, userController.getReviews);
router.get('/users/notifications', authenticate, userController.getNotifications);
router.put('/users/profile', authenticate, userController.updateProfile);

// ==================== DEVELOPERS ====================
router.get('/developers/dashboard', authenticate, authorize('developer', 'admin'), developerController.getDashboard);
router.get('/developers/projects', authenticate, authorize('developer', 'admin'), developerController.getProjects);
router.post('/developers/projects', authenticate, authorize('developer', 'admin'), developerController.createProject);
router.get('/developers/projects/:projectId', authenticate, authorize('developer', 'admin'), developerController.getProject);
router.get('/developers/projects/:projectId/files', authenticate, authorize('developer', 'admin'), developerController.getProjectFiles);
router.post('/developers/projects/:projectId/files', authenticate, authorize('developer', 'admin'), developerController.saveProjectFile);
router.post('/developers/projects/:projectId/deploy', authenticate, authorize('developer', 'admin'), developerController.deploy);
router.get('/developers/deployments/:deploymentId', authenticate, authorize('developer', 'admin'), developerController.getDeploymentStatus);
router.get('/developers/projects/:projectId/deployments', authenticate, authorize('developer', 'admin'), developerController.getDeployments);
router.post('/developers/publish', authenticate, authorize('developer', 'admin'), developerController.publishApp);
router.get('/developers/apps', authenticate, authorize('developer', 'admin'), developerController.getPublishedApps);
router.get('/developers/analytics', authenticate, authorize('developer', 'admin'), developerController.getAnalytics);

// ==================== PUBLIC ====================
router.get('/apps', (req, res) => {
  res.json({ data: [] });
});

router.get('/apps/:appId', (req, res) => {
  res.json({ id: req.params.appId });
});

router.get('/categories', (req, res) => {
  res.json([]);
});

// ==================== ADMIN ====================
router.get('/admin/dashboard', authenticate, authorize('admin'), adminController.getDashboard);
router.get('/admin/users', authenticate, authorize('admin'), adminController.getUsers);
router.get('/admin/apps', authenticate, authorize('admin'), adminController.getApps);

export default router;
