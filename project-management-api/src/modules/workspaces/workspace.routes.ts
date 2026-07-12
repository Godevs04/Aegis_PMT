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

// Create workspace — any authenticated user can create (workspace:create checked at org level)
router.post('/', validate(createWorkspaceSchema), controller.createWorkspace);

// List user's workspaces — no permission check needed (returns only user's own)
router.get('/', controller.getMyWorkspaces);

// Invite a member — requires workspace:invite permission
router.post(
  '/:workspaceId/invite',
  authorize(WorkspacePermissions.INVITE, workspaceFromParams),
  validate(inviteMemberSchema),
  controller.inviteMember
);

// Accept invitation — any authenticated user (token validates itself)
router.post('/accept-invite', validate(acceptInvitationSchema), controller.acceptInvitation);

// Get workspace members — requires workspace membership
router.get(
  '/:workspaceId/members',
  requireWorkspaceMember(workspaceFromParams),
  controller.getWorkspaceMembers
);

export default router;
