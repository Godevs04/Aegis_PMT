import { Router } from 'express';
import ActivityController from './activity.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new ActivityController();

router.use(protect);

router.get('/', controller.getWorkspaceTimeline);

export default router;
