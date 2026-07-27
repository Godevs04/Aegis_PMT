import apiClient from './api-client';

export interface DashboardActivity {
  _id: string;
  action?: string;
  createdAt: string;
  userId?: { name?: string };
  details?: { name?: string; title?: string };
}

export interface DashboardTask {
  _id: string;
  title: string;
  taskNumber?: number;
  dueDate?: string;
  completedAt?: string;
  statusId?: { color?: string; name?: string } | string;
  priorityId?: { color?: string; name?: string } | string;
  projectId?: { prefix?: string; name?: string } | string;
}

export interface PersonalDashboard {
  stats: {
    assignedCount: number;
    inProgressCount: number;
    completedTodayCount: number;
    overdueCount: number;
    dueTomorrowCount: number;
  };
  tasks: DashboardTask[];
  recentActivity: DashboardActivity[];
}

export interface ProjectHealthItem {
  id: string;
  name: string;
  prefix: string;
  progress: number;
  status: string;
}

export interface WorkspaceDashboard {
  stats?: {
    totalProjects?: number;
    totalTasks?: number;
    completedTasks?: number;
    inProgressTasks?: number;
    overdueTasks?: number;
    totalMembers?: number;
    activeSprints?: number;
  };
  projectHealth: ProjectHealthItem[];
  recentActivity: DashboardActivity[];
}

export interface ProjectDashboardSprint {
  id: string;
  name: string;
  status: string;
}

export interface ProjectDashboardMilestone {
  id: string;
  name: string;
  progress: number;
  status: string;
  dueDate?: string;
}

export interface ProjectDashboard {
  stats?: {
    totalTasks?: number;
    completedTasks?: number;
    overdueTasks?: number;
    completionRate?: number;
  };
  byStatus?: Record<string, number>;
  sprints?: ProjectDashboardSprint[];
  milestones?: ProjectDashboardMilestone[];
  recentActivity?: DashboardActivity[];
}

export const dashboardService = {
  async getPersonal(workspaceId: string): Promise<PersonalDashboard> {
    const response = await apiClient.get(`/dashboard/personal?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async getWorkspace(workspaceId: string): Promise<WorkspaceDashboard> {
    const response = await apiClient.get(`/dashboard/workspace?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  async getProject(projectId: string, workspaceId: string): Promise<ProjectDashboard> {
    const response = await apiClient.get(`/dashboard/project/${projectId}?workspaceId=${workspaceId}`);
    return response.data.data;
  },
};

export default dashboardService;
