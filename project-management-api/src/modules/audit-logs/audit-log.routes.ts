import { Router } from 'express';
import AuditLogController from './audit-log.controller';
import { protect } from '../../middlewares/auth';
import { authorize, workspaceFromQuery } from '../../middlewares/authorize';
import { AdminPermissions } from '../../config/permissions';

const router = Router();
const controller = new AuditLogController();

// All audit log routes require authentication
router.use(protect);

// Query audit logs — requires admin:view_audit permission in workspace context
router.get(
  '/',
  authorize(AdminPermissions.VIEW_AUDIT, workspaceFromQuery),
  controller.getAuditLogs
);

// Get entity-specific audit history — requires admin:view_audit permission
router.get(
  '/entity/:entityType/:entityId',
  authorize(AdminPermissions.VIEW_AUDIT, workspaceFromQuery),
  controller.getEntityHistory
);

export default router;
