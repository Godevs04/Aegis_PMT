import { Workspace, IWorkspace } from './workspace.model';
import { Organization, IOrganization } from '../organizations/organization.model';
import { Invitation, IInvitation } from './invitation.model';
import { WorkspaceMember } from '../members/workspace-member.model';

export class WorkspaceRepository {
  /**
   * Find workspace by ID.
   */
  async findWorkspaceById(id: string): Promise<IWorkspace | null> {
    return Workspace.findById(id).populate('organizationId', 'name');
  }

  /**
   * Find workspaces belonging to a specific user (via WorkspaceMember collection).
   */
  async findWorkspacesByUser(userId: string): Promise<IWorkspace[]> {
    // Get all workspace IDs where the user is an active member
    const memberships = await WorkspaceMember.find({
      userId,
      status: 'active',
    }).select('workspaceId');

    const workspaceIds = memberships.map((m) => m.workspaceId);

    return Workspace.find({ _id: { $in: workspaceIds } }).populate(
      'organizationId',
      'name'
    );
  }

  /**
   * Create a new organization.
   */
  async createOrganization(orgData: Partial<IOrganization>): Promise<IOrganization> {
    return Organization.create(orgData);
  }

  /**
   * Find organization by owner ID.
   */
  async findOrganizationByOwner(ownerId: string): Promise<IOrganization | null> {
    return Organization.findOne({ ownerId });
  }

  /**
   * Create a new workspace.
   */
  async createWorkspace(workspaceData: Partial<IWorkspace>): Promise<IWorkspace> {
    return Workspace.create(workspaceData);
  }

  /**
   * Save workspace document.
   */
  async saveWorkspace(workspace: IWorkspace): Promise<IWorkspace> {
    return workspace.save();
  }

  /**
   * Create an invitation.
   */
  async createInvitation(invData: Partial<IInvitation>): Promise<IInvitation> {
    return Invitation.create(invData);
  }

  /**
   * Find invitation by token.
   */
  async findInvitationByToken(token: string): Promise<IInvitation | null> {
    return Invitation.findOne({ token, status: 'pending', expiresAt: { $gt: new Date() } });
  }

  /**
   * Save invitation document.
   */
  async saveInvitation(invitation: IInvitation): Promise<IInvitation> {
    return invitation.save();
  }
}

export default WorkspaceRepository;
