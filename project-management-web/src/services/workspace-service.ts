import apiClient from './api-client';

export interface WorkspaceMember {
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
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

  /**
   * Fetch workspace members
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
    return response.data.data;
  },
};

export default workspaceService;
