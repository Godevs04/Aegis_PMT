import crypto from 'crypto';
import { Organization, IOrganization } from './organization.model';
import { OrganizationMember } from '../members/organization-member.model';
import { WorkspaceMember } from '../members/workspace-member.model';
import { Workspace } from '../workspaces/workspace.model';
import { Role } from '../roles/role.model';
import { SystemRole } from '../../config/permissions';
import { Invitation } from '../workspaces/invitation.model';
import User from '../users/user.model';
import AppError from '../../shared/utils/appError';
import { auditLogService } from '../audit-logs/audit-log.service';
import { sendEmail } from '../../emails/mail.service';
import { seedWorkspaceDefaults } from '../task-statuses/seed-defaults';

export class OrganizationService {
  /**
   * Create a new organization.
   * Also creates:
   * - OrganizationMember (creator as Owner)
   * - Default workspace
   * - WorkspaceMember (creator as Workspace Admin)
   * - Default task statuses/priorities for the workspace
   */
  async create(
    data: { name: string; description?: string },
    userId: string
  ): Promise<{ organization: IOrganization; workspaceId: string }> {
    // Create organization
    const organization = await Organization.create({
      name: data.name,
      description: data.description || '',
      ownerId: userId,
      createdBy: userId,
    });

    // Add creator as OrganizationMember with org_owner role
    const ownerRole = await Role.findOne({ slug: SystemRole.ORG_OWNER, isSystem: true });
    if (ownerRole) {
      await OrganizationMember.create({
        userId,
        organizationId: organization.id,
        roleId: ownerRole.id,
        status: 'active',
        joinedAt: new Date(),
        createdBy: userId,
      });
    }

    // Create default workspace
    const workspace = await Workspace.create({
      name: `${data.name}`,
      organizationId: organization.id,
      createdBy: userId,
    });

    // Add creator as WorkspaceMember with workspace_admin role
    const wsAdminRole = await Role.findOne({ slug: SystemRole.WORKSPACE_ADMIN, isSystem: true });
    if (wsAdminRole) {
      await WorkspaceMember.create({
        userId,
        workspaceId: workspace.id,
        roleId: wsAdminRole.id,
        status: 'active',
        joinedAt: new Date(),
        createdBy: userId,
      });
    }

    // Seed default statuses and priorities for the workspace
    await seedWorkspaceDefaults(workspace.id, userId);

    // Update org settings with default workspace
    organization.settings = {
      defaultWorkspaceId: workspace.id,
      allowPublicJoin: false,
    };
    await organization.save();

    // Audit log
    auditLogService.log({
      organizationId: organization.id,
      entityType: 'Organization',
      entityId: organization.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: organization.name, slug: organization.slug },
      metadata: { name: organization.name },
    });

    return { organization, workspaceId: workspace.id };
  }

  /**
   * Get organizations the user belongs to.
   */
  async getMyOrganizations(userId: string): Promise<IOrganization[]> {
    const memberships = await OrganizationMember.find({
      userId,
      status: 'active',
    }).select('organizationId');

    const orgIds = memberships.map((m) => m.organizationId);
    return Organization.find({ _id: { $in: orgIds } });
  }

  /**
   * Get organization by ID (with membership check).
   */
  async getById(orgId: string, userId: string): Promise<IOrganization> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    const membership = await OrganizationMember.findOne({
      userId,
      organizationId: orgId,
      status: 'active',
    });
    if (!membership) {
      throw new AppError('Access denied. You are not a member of this organization.', 403);
    }

    return org;
  }

  /**
   * Update organization details.
   */
  async update(
    orgId: string,
    data: { name?: string; description?: string; logo?: string; settings?: { allowPublicJoin?: boolean } },
    userId: string
  ): Promise<IOrganization> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    // Verify membership
    await this.verifyMembership(orgId, userId);

    const previousName = org.name;

    if (data.name !== undefined) org.name = data.name;
    if (data.description !== undefined) org.description = data.description;
    if (data.logo !== undefined) org.logo = data.logo;
    if (data.settings?.allowPublicJoin !== undefined) {
      org.settings.allowPublicJoin = data.settings.allowPublicJoin;
    }

    org.updatedBy = userId as any;
    await org.save();

    // Audit log
    auditLogService.log({
      organizationId: org.id,
      entityType: 'Organization',
      entityId: org.id,
      action: 'UPDATE',
      performedBy: userId,
      previousValues: { name: previousName },
      newValues: { name: org.name, description: org.description },
      metadata: { name: org.name },
    });

    return org;
  }

  /**
   * Delete organization (soft delete). Only the owner can delete.
   */
  async delete(orgId: string, userId: string): Promise<void> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    if (org.ownerId.toString() !== userId) {
      throw new AppError('Only the organization owner can delete the organization.', 403);
    }

    // Audit log before deletion
    auditLogService.log({
      organizationId: org.id,
      entityType: 'Organization',
      entityId: org.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { name: org.name, slug: org.slug },
      metadata: { name: org.name },
    });

    await org.softDelete(userId);
  }

  /**
   * Get organization members list.
   */
  async getMembers(orgId: string, userId: string): Promise<any[]> {
    await this.verifyMembership(orgId, userId);

    const members = await OrganizationMember.find({
      organizationId: orgId,
      status: 'active',
    })
      .populate('userId', 'name email avatarUrl')
      .populate('roleId', 'name slug');

    return members;
  }

  /**
   * Invite a member to the organization by email.
   */
  async inviteMember(
    orgId: string,
    email: string,
    roleSlug: string,
    invitedByUserId: string
  ): Promise<void> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    await this.verifyMembership(orgId, invitedByUserId);

    // Check if target is already a member
    const targetUser = await User.findOne({ email });
    if (targetUser) {
      const existingMember = await OrganizationMember.findOne({
        userId: targetUser.id,
        organizationId: orgId,
        status: 'active',
      });
      if (existingMember) {
        throw new AppError('User is already a member of this organization.', 400);
      }
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Invitation.create({
      email,
      workspaceId: org.settings.defaultWorkspaceId || orgId, // Use default workspace or org ID
      invitedBy: invitedByUserId,
      role: roleSlug as any,
      token,
      status: 'pending',
      expiresAt,
      createdBy: invitedByUserId,
    });

    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/org?token=${token}`;
    const subject = `Join ${org.name} on Aegis`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Organization Invitation</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">You have been invited to join <strong>${org.name}</strong> on Aegis.</p>
        <div style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">This invitation expires in 7 days.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Or paste this link in your browser:<br/><a href="${inviteUrl}">${inviteUrl}</a></p>
      </div>
    `;

    await sendEmail({ to: email, subject, text: `Join ${org.name} on Aegis: ${inviteUrl}`, html });
  }

  /**
   * Join an organization via invitation token.
   */
  async joinByToken(token: string, userId: string): Promise<IOrganization> {
    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (!invitation) {
      throw new AppError('Invalid or expired invitation token.', 400);
    }

    // Verify user email matches invitation
    const user = await User.findById(userId);
    if (!user || user.email !== invitation.email) {
      throw new AppError('Authenticated email does not match invitation email.', 400);
    }

    // Find the organization from the workspace
    const workspace = await Workspace.findById(invitation.workspaceId);
    if (!workspace) {
      throw new AppError('Associated workspace no longer exists.', 404);
    }

    const org = await Organization.findById(workspace.organizationId);
    if (!org) {
      throw new AppError('Organization no longer exists.', 404);
    }

    // Add as OrganizationMember
    const existingOrgMember = await OrganizationMember.findOne({
      userId,
      organizationId: org.id,
      status: 'active',
    });

    if (!existingOrgMember) {
      const role = await Role.findOne({ slug: invitation.role, isSystem: true });
      const defaultRole = await Role.findOne({ slug: SystemRole.DEVELOPER, isSystem: true });
      const resolvedRole = role || defaultRole;

      if (resolvedRole) {
        await OrganizationMember.create({
          userId,
          organizationId: org.id,
          roleId: resolvedRole.id,
          status: 'active',
          joinedAt: new Date(),
          invitedBy: invitation.invitedBy,
          createdBy: userId,
        });
      }
    }

    // Also add as WorkspaceMember of the default workspace
    const existingWsMember = await WorkspaceMember.findOne({
      userId,
      workspaceId: workspace.id,
      status: 'active',
    });

    if (!existingWsMember) {
      const wsRole = await Role.findOne({ slug: SystemRole.DEVELOPER, isSystem: true });
      if (wsRole) {
        await WorkspaceMember.create({
          userId,
          workspaceId: workspace.id,
          roleId: wsRole.id,
          status: 'active',
          joinedAt: new Date(),
          invitedBy: invitation.invitedBy,
          createdBy: userId,
        });
      }
    }

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    return org;
  }

  /**
   * Remove a member from the organization.
   */
  async removeMember(orgId: string, targetUserId: string, performedBy: string): Promise<void> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    // Cannot remove the owner
    if (org.ownerId.toString() === targetUserId) {
      throw new AppError('Cannot remove the organization owner. Transfer ownership first.', 400);
    }

    await this.verifyMembership(orgId, performedBy);

    const membership = await OrganizationMember.findOne({
      userId: targetUserId,
      organizationId: orgId,
      status: 'active',
    });
    if (!membership) {
      throw new AppError('User is not a member of this organization.', 404);
    }

    await membership.softDelete(performedBy);

    // Audit log
    auditLogService.log({
      organizationId: orgId,
      entityType: 'OrganizationMember',
      entityId: membership.id,
      action: 'DELETE',
      performedBy,
      previousValues: { userId: targetUserId },
      metadata: { action: 'member_removed' },
    });
  }

  /**
   * Update a member's role in the organization.
   */
  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    roleSlug: string,
    performedBy: string
  ): Promise<void> {
    await this.verifyMembership(orgId, performedBy);

    const membership = await OrganizationMember.findOne({
      userId: targetUserId,
      organizationId: orgId,
      status: 'active',
    });
    if (!membership) {
      throw new AppError('User is not a member of this organization.', 404);
    }

    const newRole = await Role.findOne({ slug: roleSlug, isSystem: true });
    if (!newRole) {
      throw new AppError('Invalid role.', 400);
    }

    const previousRoleId = membership.roleId;
    membership.roleId = newRole.id;
    membership.updatedBy = performedBy as any;
    await membership.save();

    // Audit log
    auditLogService.log({
      organizationId: orgId,
      entityType: 'OrganizationMember',
      entityId: membership.id,
      action: 'ROLE_CHANGE',
      performedBy,
      previousValues: { roleId: previousRoleId },
      newValues: { roleId: newRole.id, roleSlug },
      metadata: { targetUserId },
    });
  }

  /**
   * Transfer organization ownership.
   */
  async transferOwnership(orgId: string, newOwnerId: string, currentOwnerId: string): Promise<void> {
    const org = await Organization.findById(orgId);
    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    if (org.ownerId.toString() !== currentOwnerId) {
      throw new AppError('Only the current owner can transfer ownership.', 403);
    }

    // Verify new owner is a member
    const newOwnerMembership = await OrganizationMember.findOne({
      userId: newOwnerId,
      organizationId: orgId,
      status: 'active',
    });
    if (!newOwnerMembership) {
      throw new AppError('New owner must be a member of the organization.', 400);
    }

    // Transfer
    org.ownerId = newOwnerId as any;
    org.updatedBy = currentOwnerId as any;
    await org.save();

    // Update new owner's role to org_owner
    const ownerRole = await Role.findOne({ slug: SystemRole.ORG_OWNER, isSystem: true });
    if (ownerRole) {
      newOwnerMembership.roleId = ownerRole.id;
      await newOwnerMembership.save();
    }

    // Audit log
    auditLogService.log({
      organizationId: orgId,
      entityType: 'Organization',
      entityId: orgId,
      action: 'TRANSFER',
      performedBy: currentOwnerId,
      previousValues: { ownerId: currentOwnerId },
      newValues: { ownerId: newOwnerId },
      metadata: { action: 'ownership_transferred' },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async verifyMembership(orgId: string, userId: string): Promise<void> {
    const membership = await OrganizationMember.findOne({
      userId,
      organizationId: orgId,
      status: 'active',
    });
    if (!membership) {
      throw new AppError('Access denied. You are not a member of this organization.', 403);
    }
  }
}

export const organizationService = new OrganizationService();
export default OrganizationService;
