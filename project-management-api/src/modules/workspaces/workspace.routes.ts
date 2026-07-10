import { Router } from 'express';
import WorkspaceController from './workspace.controller';
import { protect } from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
} from './workspace.validation';

const router = Router();
const controller = new WorkspaceController();

// All routes are protected by JWT authentication
router.use(protect);

router.post('/', validate(createWorkspaceSchema), controller.createWorkspace);
router.get('/', controller.getMyWorkspaces);
router.post(
  '/:workspaceId/invite',
  validate(inviteMemberSchema),
  controller.inviteMember
);
router.post('/accept-invite', validate(acceptInvitationSchema), controller.acceptInvitation);
router.get('/:workspaceId/members', controller.getWorkspaceMembers);

export default router;
