import apiClient from './api-client';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export const projectService = {
  /**
   * Fetch all projects belonging to a workspace
   */
  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    const response = await apiClient.get(`/projects?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  /**
   * Create a new project
   */
  async createProject(name: string, workspaceId: string, description?: string): Promise<Project> {
    const response = await apiClient.post('/projects', { name, workspaceId, description });
    return response.data.data;
  },

  /**
   * Update project details
   */
  async updateProject(projectId: string, updateData: Partial<Pick<Project, 'name' | 'description' | 'status'>>): Promise<Project> {
    const response = await apiClient.patch(`/projects/${projectId}`, updateData);
    return response.data.data;
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },
};

export default projectService;
