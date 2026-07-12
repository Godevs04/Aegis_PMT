import apiClient from './api-client';

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface Sprint {
  _id: string;
  name: string;
  goal?: string;
  projectId: string;
  workspaceId: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SprintAnalytics {
  sprintId: string;
  sprintName: string;
  status: SprintStatus;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionRate: number;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  startDate: string;
  endDate?: string;
}

export const sprintService = {
  async getByProject(projectId: string, workspaceId: string): Promise<Sprint[]> {
    const response = await apiClient.get(`/sprints?projectId=${projectId}&workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async getById(sprintId: string): Promise<Sprint> {
    const response = await apiClient.get(`/sprints/${sprintId}`);
    return response.data.data;
  },

  async create(data: { name: string; goal?: string; projectId: string; workspaceId: string; startDate?: string; endDate?: string }): Promise<Sprint> {
    const response = await apiClient.post('/sprints', data);
    return response.data.data;
  },

  async update(sprintId: string, data: { name?: string; goal?: string; startDate?: string; endDate?: string }): Promise<Sprint> {
    const response = await apiClient.patch(`/sprints/${sprintId}`, data);
    return response.data.data;
  },

  async start(sprintId: string): Promise<Sprint> {
    const response = await apiClient.post(`/sprints/${sprintId}/start`);
    return response.data.data;
  },

  async complete(sprintId: string): Promise<Sprint> {
    const response = await apiClient.post(`/sprints/${sprintId}/complete`);
    return response.data.data;
  },

  async delete(sprintId: string): Promise<void> {
    await apiClient.delete(`/sprints/${sprintId}`);
  },

  async addTasks(sprintId: string, taskIds: string[]): Promise<{ updatedCount: number }> {
    const response = await apiClient.post(`/sprints/${sprintId}/tasks`, { taskIds });
    return response.data.data;
  },

  async removeTasks(sprintId: string, taskIds: string[]): Promise<{ updatedCount: number }> {
    const response = await apiClient.delete(`/sprints/${sprintId}/tasks`, { data: { taskIds } });
    return response.data.data;
  },

  async getAnalytics(sprintId: string): Promise<SprintAnalytics> {
    const response = await apiClient.get(`/sprints/${sprintId}/analytics`);
    return response.data.data;
  },

  async getBacklog(projectId: string, workspaceId: string): Promise<any[]> {
    const response = await apiClient.get(`/sprints/backlog?projectId=${projectId}&workspaceId=${workspaceId}`);
    return response.data.data;
  },
};

export default sprintService;
