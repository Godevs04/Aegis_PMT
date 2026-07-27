import { Router } from 'express';
import WorkspaceController from './workspace.controller';
import { protect } from '../../middlewares/auth';
import {
  authorize,
  requireWorkspaceMember,
  workspaceFromParams,
} from '../../middlewares/authorize';
import { WorkspacePermissions } from '../../config/permissions';
import validate from '../../middlewares/validate';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
} from './workspace.validation';

const router = Router();
const controller = new WorkspaceController();

// All routes require authentication
router.use(protect);

// Create workspace
router.post('/', validate(createWorkspaceSchema), controller.createWorkspace);

// List user's workspaces
router.get('/', controller.getMyWorkspaces);

// Accept invitation
router.post('/accept-invite', validate(acceptInvitationSchema), controller.acceptInvitation);

// Get / update / delete workspace
router.get(
  '/:workspaceId',
  requireWorkspaceMember(workspaceFromParams),
  controller.getWorkspace
);

router.patch(
  '/:workspaceId',
  authorize(WorkspacePermissions.MANAGE_SETTINGS, workspaceFromParams),
  controller.updateWorkspace
);

router.delete(
  '/:workspaceId',
  authorize(WorkspacePermissions.DELETE, workspaceFromParams),
  controller.deleteWorkspace
);

// Invite a member
router.post(
  '/:workspaceId/invite',
  authorize(WorkspacePermissions.INVITE, workspaceFromParams),
  validate(inviteMemberSchema),
  controller.inviteMember
);

// Get workspace members
router.get(
  '/:workspaceId/members',
  requireWorkspaceMember(workspaceFromParams),
  controller.getWorkspaceMembers
);

export default router;
