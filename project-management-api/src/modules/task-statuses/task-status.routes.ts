import { Router } from 'express';
import TaskStatusController from './task-status.controller';
import { protect } from '../../middlewares/auth';
import {
  authorize,
  requireWorkspaceMember,
  workspaceFromParams,
} from '../../middlewares/authorize';
import { WorkspacePermissions } from '../../config/permissions';

const router = Router({ mergeParams: true }); // mergeParams to access :workspaceId from parent
const controller = new TaskStatusController();

// All routes require authentication
router.use(protect);

// List statuses — any workspace member
router.get('/', requireWorkspaceMember(workspaceFromParams), controller.getStatuses);

// Create status — requires workspace:manage_statuses permission
router.post(
  '/',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.createStatus
);

// Reorder statuses — requires workspace:manage_statuses permission
// NOTE: Must be before /:statusId to avoid route conflict
router.put(
  '/reorder',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.reorderStatuses
);

// Update status — requires workspace:manage_statuses permission
router.put(
  '/:statusId',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.updateStatus
);

// Delete status — requires workspace:manage_statuses permission
router.delete(
  '/:statusId',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.deleteStatus
);

export default router;
