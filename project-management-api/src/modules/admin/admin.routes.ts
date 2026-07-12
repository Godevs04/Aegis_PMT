import { Router } from 'express';
import AdminController from './admin.controller';
import { protect } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { AdminPermissions } from '../../config/permissions';

const router = Router();
const controller = new AdminController();

// All admin routes require authentication + admin:access permission
router.use(protect);

// We use a custom context extractor that checks org-level admin permissions
// For super admin, the permission service has a bypass
const adminContext = () => ({ organizationId: undefined, workspaceId: undefined, projectId: undefined });

// System health
router.get('/health', authorize(AdminPermissions.ACCESS, adminContext), controller.getSystemHealth);

// Platform analytics
router.get('/analytics', authorize(AdminPermissions.ACCESS, adminContext), controller.getPlatformAnalytics);

// User management
router.get('/users', authorize(AdminPermissions.MANAGE_USERS, adminContext), controller.getUsers);
router.post('/users/:userId/suspend', authorize(AdminPermissions.MANAGE_USERS, adminContext), controller.suspendUser);

// Audit logs (platform-wide)
router.get('/audit-logs', authorize(AdminPermissions.VIEW_AUDIT, adminContext), controller.getAuditLogs);

export default router;
