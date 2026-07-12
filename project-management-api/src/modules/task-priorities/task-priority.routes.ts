import { Router } from 'express';
import TaskPriorityController from './task-priority.controller';
import { protect } from '../../middlewares/auth';
import {
  authorize,
  requireWorkspaceMember,
  workspaceFromParams,
} from '../../middlewares/authorize';
import { WorkspacePermissions } from '../../config/permissions';

const router = Router({ mergeParams: true }); // mergeParams to access :workspaceId from parent
const controller = new TaskPriorityController();

// All routes require authentication
router.use(protect);

// List priorities — any workspace member
router.get('/', requireWorkspaceMember(workspaceFromParams), controller.getPriorities);

// Create priority — requires workspace:manage_statuses permission (shared with statuses)
router.post(
  '/',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.createPriority
);

// Reorder priorities — must be before /:priorityId
router.put(
  '/reorder',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.reorderPriorities
);

// Update priority
router.put(
  '/:priorityId',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.updatePriority
);

// Delete priority
router.delete(
  '/:priorityId',
  authorize(WorkspacePermissions.MANAGE_STATUSES, workspaceFromParams),
  controller.deletePriority
);

export default router;
