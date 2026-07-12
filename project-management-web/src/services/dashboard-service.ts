import apiClient from './api-client';

export interface PersonalDashboard {
  stats: {
    assignedCount: number;
    inProgressCount: number;
    completedTodayCount: number;
    overdueCount: number;
    dueTomorrowCount: number;
  };
  tasks: any[];
  recentActivity: any[];
}

export const dashboardService = {
  async getPersonal(workspaceId: string): Promise<PersonalDashboard> {
    const response = await apiClient.get(`/dashboard/personal?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async getWorkspace(workspaceId: string): Promise<any> {
    const response = await apiClient.get(`/dashboard/workspace?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async getProject(projectId: string, workspaceId: string): Promise<any> {
    const response = await apiClient.get(`/dashboard/project/${projectId}?workspaceId=${workspaceId}`);
    return response.data.data;
  },
};

export default dashboardService;
