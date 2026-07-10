import ProjectRepository from './project.repository';
import Workspace from '../workspaces/workspace.model';
import AppError from '../../shared/utils/appError';
import { IProject } from './project.model';

export class ProjectService {
  private repository: ProjectRepository;

  constructor() {
    this.repository = new ProjectRepository();
  }

  /**
   * Helper to verify if user is member of the workspace
   */
  private async checkWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    const isMember = workspace.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('Access denied. You are not a member of this workspace.', 403);
    }
  }

  /**
   * Create a new project in a workspace
   */
  async createProject(
    name: string,
    description: string | undefined,
    workspaceId: string,
    userId: string
  ): Promise<IProject> {
    await this.checkWorkspaceMembership(workspaceId, userId);

    return this.repository.createProject({
      name,
      description,
      workspaceId: workspaceId as any,
      createdBy: userId as any,
    });
  }

  /**
   * Get all projects in a workspace
   */
  async getProjectsByWorkspace(workspaceId: string, userId: string): Promise<IProject[]> {
    await this.checkWorkspaceMembership(workspaceId, userId);

    return this.repository.findProjectsByWorkspace(workspaceId);
  }

  /**
   * Update project details
   */
  async updateProject(
    projectId: string,
    updateData: Partial<Pick<IProject, 'name' | 'description' | 'status'>>,
    userId: string
  ): Promise<IProject> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    Object.assign(project, updateData);
    project.updatedBy = userId as any;

    return this.repository.saveProject(project);
  }

  /**
   * Soft delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    await project.softDelete(userId);
  }
}

export default ProjectService;
