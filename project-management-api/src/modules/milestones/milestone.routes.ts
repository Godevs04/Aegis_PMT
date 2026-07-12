import { Router } from 'express';
import MilestoneController from './milestone.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new MilestoneController();

router.use(protect);

// CRUD
router.post('/', controller.create);
router.get('/', controller.getByProject);
router.get('/:milestoneId', controller.getById);
router.patch('/:milestoneId', controller.update);
router.delete('/:milestoneId', controller.delete);

// Lifecycle
router.post('/:milestoneId/complete', controller.complete);
router.post('/:milestoneId/reopen', controller.reopen);

// Tasks
router.get('/:milestoneId/tasks', controller.getTasks);

export default router;
