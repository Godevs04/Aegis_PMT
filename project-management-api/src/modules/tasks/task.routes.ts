import { Router } from 'express';
import TaskController from './task.controller';
import { protect } from '../../middlewares/auth';
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

// Protect all task routes
router.use(protect);

router.post('/', validate(createTaskSchema), controller.createTask);
router.get('/', validate(getTasksSchema), controller.getWorkspaceTasks);
router.patch('/:taskId', validate(updateTaskSchema), controller.updateTask);
router.post('/:taskId/comments', validate(commentTaskSchema), controller.addTaskComment);
router.delete('/:taskId', validate(deleteTaskSchema), controller.deleteTask);

export default router;
