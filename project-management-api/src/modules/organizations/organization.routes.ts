import { Router } from 'express';
import OrganizationController from './organization.controller';
import { protect } from '../../middlewares/auth';
import { authorize, organizationFromParams } from '../../middlewares/authorize';
import { OrgPermissions } from '../../config/permissions';
import validate from '../../middlewares/validate';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
  joinByTokenSchema,
} from './organization.validation';

const router = Router();
const controller = new OrganizationController();

// All routes require authentication
router.use(protect);

// Create organization — any authenticated user
router.post('/', validate(createOrganizationSchema), controller.create);

// List user's organizations
router.get('/', controller.getMyOrganizations);

// Join organization via invitation token
router.post('/join/:token', validate(joinByTokenSchema), controller.joinByToken);

// Get organization details — requires org membership (checked in service)
router.get('/:organizationId', controller.getById);

// Update organization — requires org:update permission
router.put(
  '/:organizationId',
  validate(updateOrganizationSchema),
  authorize(OrgPermissions.UPDATE, organizationFromParams),
  controller.update
);

// Delete organization — owner only (checked in service)
router.delete('/:organizationId', controller.delete);

// Get members — requires org:read permission
router.get(
  '/:organizationId/members',
  authorize(OrgPermissions.READ, organizationFromParams),
  controller.getMembers
);

// Invite member — requires org:manage_members permission
router.post(
  '/:organizationId/invite',
  validate(inviteMemberSchema),
  authorize(OrgPermissions.MANAGE_MEMBERS, organizationFromParams),
  controller.inviteMember
);

// Remove member — requires org:manage_members permission
router.delete(
  '/:organizationId/members/:userId',
  authorize(OrgPermissions.MANAGE_MEMBERS, organizationFromParams),
  controller.removeMember
);

// Update member role — requires org:manage_members permission
router.patch(
  '/:organizationId/members/:userId/role',
  validate(updateMemberRoleSchema),
  authorize(OrgPermissions.MANAGE_MEMBERS, organizationFromParams),
  controller.updateMemberRole
);

// Transfer ownership — requires org:transfer_ownership permission
router.post(
  '/:organizationId/transfer',
  validate(transferOwnershipSchema),
  authorize(OrgPermissions.TRANSFER_OWNERSHIP, organizationFromParams),
  controller.transferOwnership
);

export default router;
