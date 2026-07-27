import { Router } from 'express';
import LabelController from './label.controller';
import { protect } from '../../middlewares/auth';
import {
  authorize,
  requireWorkspaceMember,
  workspaceFromBody,
  workspaceFromQuery,
} from '../../middlewares/authorize';
import { WorkspacePermissions } from '../../config/permissions';

const router = Router();
const controller = new LabelController();

router.use(protect);

router.get('/', requireWorkspaceMember(workspaceFromQuery), controller.list);

router.post(
  '/',
  authorize(WorkspacePermissions.MANAGE_LABELS, workspaceFromBody),
  controller.create
);

router.patch('/:labelId', protect, controller.update);
router.delete('/:labelId', protect, controller.delete);

export default router;
