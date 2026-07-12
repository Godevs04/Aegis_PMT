import crypto from 'crypto';
import WorkspaceRepository from './workspace.repository';
import AppError from '../../shared/utils/appError';
import { IWorkspace } from './workspace.model';
import { IInvitation } from './invitation.model';
import { sendEmail } from '../../emails/mail.service';
import User from '../users/user.model';
import ActivityService from '../activities/activity.service';
import { WorkspaceMember } from '../members/workspace-member.model';
import { Role } from '../roles/role.model';
import { SystemRole } from '../../config/permissions';
import { auditLogService } from '../audit-logs/audit-log.service';
import { seedWorkspaceDefaults } from '../task-statuses/seed-defaults';

export class WorkspaceService {
  private repository: WorkspaceRepository;
  private activityService: ActivityService;

  constructor() {
    this.repository = new WorkspaceRepository();
    this.activityService = new ActivityService();
  }

  /**
   * Helper: Check if user is a member of the workspace
   */
  private async checkMembership(workspaceId: string, userId: string): Promise<boolean> {
    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId,
      status: 'active',
    });
    return !!member;
  }

  /**
   * Create a new workspace (and organization if not already existing)
   */
  async createWorkspace(
    name: string,
    userId: string,
    orgName?: string
  ): Promise<IWorkspace> {
    // 1. Check if user already owns an organization, or create a default one
    let organization = await this.repository.findOrganizationByOwner(userId);
    if (!organization) {
      organization = await this.repository.createOrganization({
        name: orgName || `${name} Organization`,
        ownerId: userId as any,
        createdBy: userId as any,
      });
    }

    // 2. Create workspace belonging to organization
    const workspace = await this.repository.createWorkspace({
      name,
      organizationId: organization.id,
      createdBy: userId as any,
    });

    // 3. Add creator as WorkspaceMember with Workspace Admin role
    const adminRole = await Role.findOne({ slug: SystemRole.WORKSPACE_ADMIN, isSystem: true });
    if (adminRole) {
      await WorkspaceMember.create({
        userId,
        workspaceId: workspace.id,
        roleId: adminRole.id,
        status: 'active',
        joinedAt: new Date(),
        createdBy: userId,
      });
    }

    // 4. Seed default task statuses and priorities
    await seedWorkspaceDefaults(workspace.id, userId);

    await this.activityService.logActivity({
      workspaceId: workspace.id,
      userId: userId as any,
      action: 'WORKSPACE_CREATED',
      details: { name: workspace.name },
    });

    // Audit log
    auditLogService.log({
      workspaceId: workspace.id,
      entityType: 'Workspace',
      entityId: workspace.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: workspace.name },
      metadata: { name: workspace.name, organizationId: organization.id },
    });

    return workspace;
  }

  /**
   * Get all workspaces belonging to user
   */
  async getMyWorkspaces(userId: string): Promise<IWorkspace[]> {
    return this.repository.findWorkspacesByUser(userId);
  }

  /**
   * Invite a member to the workspace
   */
  async inviteMember(
    workspaceId: string,
    invitedByUserId: string,
    email: string,
    roleSlug: string
  ): Promise<IInvitation> {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    // Check if the inviter is a member
    const isMember = await this.checkMembership(workspaceId, invitedByUserId);
    if (!isMember) {
      throw new AppError('You must be a member of this workspace to invite others.', 403);
    }

    // Check if target email is already a member of workspace
    const targetUser = await User.findOne({ email });
    if (targetUser) {
      const isAlreadyIn = await this.checkMembership(workspaceId, targetUser.id);
      if (isAlreadyIn) {
        throw new AppError('User is already a member of this workspace.', 400);
      }
    }

    // Generate unique verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.repository.createInvitation({
      email,
      workspaceId: workspaceId as any,
      invitedBy: invitedByUserId as any,
      role: roleSlug as any,
      token,
      status: 'pending',
      expiresAt,
      createdBy: invitedByUserId as any,
    });

    // Send email with invitation link
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/accept?token=${token}`;
    const subject = `Join ${workspace.name} Workspace - Aegis`;
    const text = `You have been invited to join the ${workspace.name} workspace on Aegis as a ${roleSlug}. Click here: ${inviteUrl}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Workspace Invitation</h2>
        <p style="color: #475569; font-size: 16px; line-height: 24px;">You have been invited to join the <strong>${workspace.name}</strong> workspace on Aegis.</p>
        <div style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">This invitation link will expire in 7 days.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Or paste this link in your browser:<br/><a href="${inviteUrl}">${inviteUrl}</a></p>
      </div>
    `;

    await sendEmail({ to: email, subject, text, html });

    return invitation;
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<IWorkspace> {
    const invitation = await this.repository.findInvitationByToken(token);
    if (!invitation) {
      throw new AppError('Invalid or expired invitation token.', 400);
    }

    const workspace = await this.repository.findWorkspaceById(
      invitation.workspaceId.toString()
    );
    if (!workspace) {
      throw new AppError('Workspace no longer exists.', 404);
    }

    // Verify user email matches invitation email
    const user = await User.findById(userId);
    if (!user || user.email !== invitation.email) {
      throw new AppError('Authenticated email does not match invitation email.', 400);
    }

    // Add user as WorkspaceMember if not already a member
    const isAlreadyMember = await this.checkMembership(workspace.id, userId);
    if (!isAlreadyMember) {
      // Resolve the role from invitation (stored as slug)
      const role = await Role.findOne({ slug: invitation.role, isSystem: true });
      const defaultRole = await Role.findOne({ slug: SystemRole.DEVELOPER, isSystem: true });
      const resolvedRole = role || defaultRole;

      if (resolvedRole) {
        await WorkspaceMember.create({
          userId,
          workspaceId: workspace.id,
          roleId: resolvedRole.id,
          status: 'active',
          joinedAt: new Date(),
          invitedBy: invitation.invitedBy,
          createdBy: userId,
        });
      }
    }

    // Update invitation status
    invitation.status = 'accepted';
    await this.repository.saveInvitation(invitation);

    await this.activityService.logActivity({
      workspaceId: workspace.id,
      userId: userId as any,
      action: 'MEMBER_JOINED',
      details: { email: user.email, workspaceName: workspace.name },
    });

    return workspace;
  }

  /**
   * Get workspace members list
   */
  async getWorkspaceMembers(workspaceId: string, userId: string): Promise<any[]> {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    const isMember = await this.checkMembership(workspaceId, userId);
    if (!isMember) {
      throw new AppError('Access denied. You are not a member of this workspace.', 403);
    }

    // Get all members with populated user and role info
    const members = await WorkspaceMember.find({
      workspaceId,
      status: 'active',
    })
      .populate('userId', 'name email avatarUrl')
      .populate('roleId', 'name slug');

    return members;
  }
}

export default WorkspaceService;
