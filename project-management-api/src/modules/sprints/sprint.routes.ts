import { Router } from 'express';
import SprintController from './sprint.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new SprintController();

// All sprint routes require authentication
router.use(protect);

// CRUD
router.post('/', controller.create);
router.get('/', controller.getByProject);
router.get('/backlog', controller.getBacklog);
router.get('/:sprintId', controller.getById);
router.patch('/:sprintId', controller.update);
router.delete('/:sprintId', controller.delete);

// Sprint lifecycle
router.post('/:sprintId/start', controller.start);
router.post('/:sprintId/complete', controller.complete);

// Task management within sprint
router.post('/:sprintId/tasks', controller.addTasks);
router.delete('/:sprintId/tasks', controller.removeTasks);

// Analytics
router.get('/:sprintId/analytics', controller.getAnalytics);

export default router;
