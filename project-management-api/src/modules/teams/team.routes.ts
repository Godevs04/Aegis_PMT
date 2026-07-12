import { Router } from 'express';
import TeamController from './team.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new TeamController();

// All team routes require authentication
router.use(protect);

// CRUD
router.post('/', controller.create);
router.get('/', controller.getByWorkspace);
router.get('/:teamId', controller.getById);
router.patch('/:teamId', controller.update);
router.delete('/:teamId', controller.delete);

// Members
router.post('/:teamId/members', controller.addMember);
router.delete('/:teamId/members/:userId', controller.removeMember);

// Lead
router.patch('/:teamId/lead', controller.changeLead);

// Stats
router.get('/:teamId/stats', controller.getStats);

export default router;
