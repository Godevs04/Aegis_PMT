import apiClient from './api-client';

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  _id: string;
  name: string;
  prefix: string;
  description?: string;
  coverImage?: string;
  workspaceId: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  progress: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: { _id: string; name: string };
}

export interface CreateProjectData {
  name: string;
  prefix: string;
  description?: string;
  workspaceId: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface ProjectAnalytics {
  totalTasks: number;
  completedCount: number;
  overdueCount: number;
  completionRate: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  progress: number;
}

export const projectService = {
  /**
   * Fetch all projects belonging to a workspace (with optional filters)
   */
  async getWorkspaceProjects(
    workspaceId: string,
    filters?: { status?: ProjectStatus; search?: string }
  ): Promise<Project[]> {
    const params = new URLSearchParams({ workspaceId });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get(`/projects?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data.data;
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await apiClient.post('/projects', data);
    return response.data.data;
  },

  /**
   * Update project details
   */
  async updateProject(projectId: string, updateData: Partial<Project>): Promise<Project> {
    const response = await apiClient.patch(`/projects/${projectId}`, updateData);
    return response.data.data;
  },

  /**
   * Archive a project
   */
  async archiveProject(projectId: string): Promise<Project> {
    const response = await apiClient.post(`/projects/${projectId}/archive`);
    return response.data.data;
  },

  /**
   * Restore a project
   */
  async restoreProject(projectId: string): Promise<Project> {
    const response = await apiClient.post(`/projects/${projectId}/restore`);
    return response.data.data;
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  /**
   * Get project analytics
   */
  async getAnalytics(projectId: string): Promise<ProjectAnalytics> {
    const response = await apiClient.get(`/projects/${projectId}/analytics`);
    return response.data.data;
  },
};

export default projectService;
