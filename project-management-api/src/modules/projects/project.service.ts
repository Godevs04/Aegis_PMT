import ProjectRepository from './project.repository';
import Workspace from '../workspaces/workspace.model';
import AppError from '../../shared/utils/appError';
import { IProject } from './project.model';
import ActivityService from '../activities/activity.service';
import { WorkspaceMember } from '../members/workspace-member.model';
import { auditLogService } from '../audit-logs/audit-log.service';
import { snapshot } from '../../shared/utils/diff';

const PROJECT_AUDIT_FIELDS = ['name', 'description', 'status'];

export class ProjectService {
  private repository: ProjectRepository;
  private activityService: ActivityService;

  constructor() {
    this.repository = new ProjectRepository();
    this.activityService = new ActivityService();
  }

  /**
   * Helper to verify if user is member of the workspace
   */
  private async checkWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId,
      status: 'active',
    });
    if (!member) {
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

    const project = await this.repository.createProject({
      name,
      description,
      workspaceId: workspaceId as any,
      createdBy: userId as any,
    });

    // Audit log
    auditLogService.log({
      workspaceId,
      projectId: project.id,
      entityType: 'Project',
      entityId: project.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: project.name, description: project.description, status: project.status },
      metadata: { name: project.name },
    });

    await this.activityService.logActivity({
      workspaceId: workspaceId as any,
      projectId: project.id as any,
      userId: userId as any,
      action: 'PROJECT_CREATED',
      details: { name: project.name },
    });

    return project;
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

    // Capture previous values for audit
    const previousValues = snapshot(project.toObject(), PROJECT_AUDIT_FIELDS);

    Object.assign(project, updateData);
    project.updatedBy = userId as any;

    const updatedProject = await this.repository.saveProject(project);

    // Capture new values for audit
    const newValues = snapshot(updatedProject.toObject(), PROJECT_AUDIT_FIELDS);

    // Audit log
    auditLogService.log({
      workspaceId: updatedProject.workspaceId.toString(),
      projectId: updatedProject.id,
      entityType: 'Project',
      entityId: updatedProject.id,
      action: 'UPDATE',
      performedBy: userId,
      previousValues,
      newValues,
      metadata: { name: updatedProject.name },
    });

    return updatedProject;
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

    // Audit log before deletion
    auditLogService.log({
      workspaceId: project.workspaceId.toString(),
      projectId: project.id,
      entityType: 'Project',
      entityId: project.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { name: project.name, status: project.status },
      metadata: { name: project.name },
    });

    await project.softDelete(userId);
  }
}

export default ProjectService;
