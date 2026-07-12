import { Router } from 'express';
import ActivityController from './activity.controller';
import { protect } from '../../middlewares/auth';
import { requireWorkspaceMember, workspaceFromQuery } from '../../middlewares/authorize';

const router = Router();
const controller = new ActivityController();

// All activity routes require authentication
router.use(protect);

// Workspace timeline — requires workspace membership
router.get('/', requireWorkspaceMember(workspaceFromQuery), controller.getWorkspaceTimeline);

// Project timeline — requires workspace membership (workspaceId in query)
router.get('/project/:projectId', requireWorkspaceMember(workspaceFromQuery), controller.getProjectTimeline);

// Task history — membership verified in service (resolves workspace from task)
router.get('/task/:taskId', controller.getTaskTimeline);

// Personal activity feed — only own activities
router.get('/me', controller.getMyActivity);

export default router;
