import { Router } from 'express';
import TaskController from './task.controller';
import { protect } from '../../middlewares/auth';
import {
  authorize,
  requireWorkspaceMember,
  workspaceFromBody,
  workspaceFromQuery,
} from '../../middlewares/authorize';
import { TaskPermissions } from '../../config/permissions';
import validate from '../../middlewares/validate';
import {
  createTaskSchema,
  getTasksSchema,
  updateTaskSchema,
  commentTaskSchema,
  deleteTaskSchema,
} from './task.validation';

const router = Router();
const controller = new TaskController();

// All task routes require authentication
router.use(protect);

// Create task — requires task:create permission in the workspace
router.post(
  '/',
  validate(createTaskSchema),
  authorize(TaskPermissions.CREATE, workspaceFromBody),
  controller.createTask
);

// List tasks — requires workspace membership
router.get(
  '/',
  validate(getTasksSchema),
  requireWorkspaceMember(workspaceFromQuery),
  controller.getWorkspaceTasks
);

// Update task — service resolves workspaceId from task, checks membership
router.patch(
  '/:taskId',
  validate(updateTaskSchema),
  controller.updateTask
);

// Add comment — service resolves workspaceId from task, checks membership
router.post(
  '/:taskId/comments',
  validate(commentTaskSchema),
  controller.addTaskComment
);

// Delete task — service resolves workspaceId from task, checks membership
router.delete(
  '/:taskId',
  validate(deleteTaskSchema),
  controller.deleteTask
);

export default router;
