import { Workspace, IWorkspace } from './workspace.model';
import { Organization, IOrganization } from '../organizations/organization.model';
import { Invitation, IInvitation } from './invitation.model';

export class WorkspaceRepository {
  /**
   * Find workspace by ID.
   */
  async findWorkspaceById(id: string): Promise<IWorkspace | null> {
    return Workspace.findById(id).populate('organizationId', 'name');
  }

  /**
   * Find workspaces belonging to a specific user (where user is in members list).
   */
  async findWorkspacesByUser(userId: string): Promise<IWorkspace[]> {
    return Workspace.find({ 'members.userId': userId }).populate('organizationId', 'name');
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
