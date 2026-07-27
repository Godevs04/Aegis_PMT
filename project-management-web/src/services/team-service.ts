import apiClient from './api-client';

export interface TeamUser {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  leadId?: TeamUser | string;
  members: TeamUser[] | string[];
  color?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  workspaceId: string;
  color?: string;
  memberIds?: string[];
}

export interface TeamStats {
  memberCount: number;
  taskCounts?: Record<string, number>;
  [key: string]: unknown;
}

export const teamService = {
  async getByWorkspace(workspaceId: string): Promise<Team[]> {
    const response = await apiClient.get(`/teams?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async getById(teamId: string): Promise<Team> {
    const response = await apiClient.get(`/teams/${teamId}`);
    return response.data.data;
  },

  async create(data: CreateTeamData): Promise<Team> {
    const response = await apiClient.post('/teams', data);
    return response.data.data;
  },

  async update(teamId: string, data: Partial<Pick<Team, 'name' | 'description' | 'color'>>): Promise<Team> {
    const response = await apiClient.patch(`/teams/${teamId}`, data);
    return response.data.data;
  },

  async delete(teamId: string): Promise<void> {
    await apiClient.delete(`/teams/${teamId}`);
  },

  async addMember(teamId: string, userId: string): Promise<Team> {
    const response = await apiClient.post(`/teams/${teamId}/members`, { userId });
    return response.data.data;
  },

  async removeMember(teamId: string, userId: string): Promise<Team> {
    const response = await apiClient.delete(`/teams/${teamId}/members/${userId}`);
    return response.data.data;
  },

  async getStats(teamId: string): Promise<TeamStats> {
    const response = await apiClient.get(`/teams/${teamId}/stats`);
    return response.data.data;
  },
};

export default teamService;
