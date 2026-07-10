import apiClient from './api-client';

export interface WorkspaceMember {
  userId: string;
  role: string;
  joinedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  organizationId: {
    _id: string;
    name: string;
  };
  members: WorkspaceMember[];
  createdAt: string;
}

export const workspaceService = {
  /**
   * Fetch all workspaces the current user belongs to
   */
  async getMyWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get('/workspaces');
    return response.data.data;
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(name: string, orgName?: string): Promise<Workspace> {
    const response = await apiClient.post('/workspaces', { name, orgName });
    return response.data.data;
  },

  /**
   * Invite a member to a workspace
   */
  async inviteMember(workspaceId: string, email: string, role: string): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/invite`, { email, role });
  },

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(token: string): Promise<Workspace> {
    const response = await apiClient.post('/workspaces/accept-invite', { token });
    return response.data.data;
  },
};

export default workspaceService;
