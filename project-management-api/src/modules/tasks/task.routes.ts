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
  logTimeSchema,
  bulkUpdateSchema,
  moveTaskSchema,
  deleteTaskSchema,
} from './task.validation';

const router = Router();
const controller = new TaskController();

// All task routes require authentication
router.use(protect);

// Create task — requires task:create permission in workspace
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
  controller.getTasks
);

// Bulk update — membership checked in service
router.post('/bulk', validate(bulkUpdateSchema), controller.bulkUpdate);

// Get single task — membership checked in service
router.get('/:taskId', controller.getTask);

// Update task — membership checked in service
router.patch('/:taskId', validate(updateTaskSchema), controller.updateTask);

// Move task (Kanban drag) — membership checked in service
router.patch('/:taskId/move', validate(moveTaskSchema), controller.moveTask);

// Log time — membership checked in service
router.post('/:taskId/time', validate(logTimeSchema), controller.logTime);

// Get subtasks — membership checked in service
router.get('/:taskId/subtasks', controller.getSubtasks);

// Delete task — membership checked in service
router.delete('/:taskId', validate(deleteTaskSchema), controller.deleteTask);

export default router;
