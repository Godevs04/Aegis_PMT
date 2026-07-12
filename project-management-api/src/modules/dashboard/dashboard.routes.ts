import { Router } from 'express';
import DashboardController from './dashboard.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new DashboardController();

router.use(protect);

router.get('/personal', controller.getPersonal);
router.get('/workspace', controller.getWorkspace);
router.get('/project/:projectId', controller.getProject);

export default router;
