import ProjectRepository from './project.repository';
import Workspace from '../workspaces/workspace.model';
import AppError from '../../shared/utils/appError';
import { IProject, ProjectStatus } from './project.model';
import { Project } from './project.model';
import Task from '../tasks/task.model';
import ActivityService from '../activities/activity.service';
import { WorkspaceMember } from '../members/workspace-member.model';
import { ProjectMember } from '../members/project-member.model';
import { Role } from '../roles/role.model';
import { SystemRole } from '../../config/permissions';
import { auditLogService } from '../audit-logs/audit-log.service';
import { snapshot } from '../../shared/utils/diff';

const PROJECT_AUDIT_FIELDS = ['name', 'prefix', 'description', 'status', 'startDate', 'endDate', 'tags'];

export class ProjectService {
  private repository: ProjectRepository;
  private activityService: ActivityService;

  constructor() {
    this.repository = new ProjectRepository();
    this.activityService = new ActivityService();
  }

  /**
   * Helper to verify workspace membership
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
   * Create a new project
   */
  async createProject(
    data: {
      name: string;
      prefix: string;
      description?: string;
      workspaceId: string;
      startDate?: string;
      endDate?: string;
      tags?: string[];
    },
    userId: string
  ): Promise<IProject> {
    await this.checkWorkspaceMembership(data.workspaceId, userId);

    // Verify prefix is unique in workspace
    const existing = await Project.findOne({
      workspaceId: data.workspaceId,
      prefix: data.prefix.toUpperCase(),
    });
    if (existing) {
      throw new AppError(`Project prefix "${data.prefix}" is already in use in this workspace.`, 400);
    }

    const project = await this.repository.createProject({
      name: data.name,
      prefix: data.prefix.toUpperCase(),
      description: data.description,
      workspaceId: data.workspaceId as any,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      tags: data.tags || [],
      createdBy: userId as any,
    });

    // Add creator as ProjectMember with Project Manager role
    const pmRole = await Role.findOne({ slug: SystemRole.PROJECT_MANAGER, isSystem: true });
    if (pmRole) {
      await ProjectMember.create({
        userId,
        projectId: project.id,
        roleId: pmRole.id,
        status: 'active',
        joinedAt: new Date(),
        addedBy: userId,
        createdBy: userId,
      });
    }

    // Audit log
    auditLogService.log({
      workspaceId: data.workspaceId,
      projectId: project.id,
      entityType: 'Project',
      entityId: project.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: project.name, prefix: project.prefix, status: project.status },
      metadata: { name: project.name },
    });

    await this.activityService.logActivity({
      workspaceId: data.workspaceId as any,
      projectId: project.id as any,
      userId: userId as any,
      action: 'project.created',
      details: { name: project.name, prefix: project.prefix },
    });

    return project;
  }

  /**
   * Get all projects in a workspace (with optional status filter)
   */
  async getProjectsByWorkspace(
    workspaceId: string,
    userId: string,
    filters?: { status?: ProjectStatus; search?: string }
  ): Promise<IProject[]> {
    await this.checkWorkspaceMembership(workspaceId, userId);

    const query: Record<string, any> = { workspaceId };
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { prefix: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return Project.find(query).sort({ updatedAt: -1 });
  }

  /**
   * Get single project by ID
   */
  async getProjectById(projectId: string, userId: string): Promise<IProject> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);
    return project;
  }

  /**
   * Update project details
   */
  async updateProject(
    projectId: string,
    updateData: Partial<Pick<IProject, 'name' | 'description' | 'status' | 'coverImage' | 'startDate' | 'endDate' | 'tags' | 'settings'>>,
    userId: string
  ): Promise<IProject> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    // Capture previous values for audit
    const previousValues = snapshot(project.toObject(), PROJECT_AUDIT_FIELDS);

    if (updateData.name !== undefined) project.name = updateData.name;
    if (updateData.description !== undefined) project.description = updateData.description;
    if (updateData.status !== undefined) project.status = updateData.status;
    if (updateData.coverImage !== undefined) project.coverImage = updateData.coverImage;
    if (updateData.startDate !== undefined) project.startDate = updateData.startDate;
    if (updateData.endDate !== undefined) project.endDate = updateData.endDate;
    if (updateData.tags !== undefined) project.tags = updateData.tags;
    if (updateData.settings !== undefined) {
      project.settings = { ...project.settings, ...updateData.settings };
    }

    project.updatedBy = userId as any;
    const updatedProject = await this.repository.saveProject(project);

    // Capture new values for audit
    const newValues = snapshot(updatedProject.toObject(), PROJECT_AUDIT_FIELDS);

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
   * Archive a project
   */
  async archiveProject(projectId: string, userId: string): Promise<IProject> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    project.status = 'archived';
    project.updatedBy = userId as any;
    const updated = await this.repository.saveProject(project);

    auditLogService.log({
      workspaceId: project.workspaceId.toString(),
      projectId: project.id,
      entityType: 'Project',
      entityId: project.id,
      action: 'ARCHIVE',
      performedBy: userId,
      metadata: { name: project.name },
    });

    await this.activityService.logActivity({
      workspaceId: project.workspaceId.toString() as any,
      projectId: project.id as any,
      userId: userId as any,
      action: 'project.archived',
      details: { name: project.name },
    });

    return updated;
  }

  /**
   * Restore an archived project
   */
  async restoreProject(projectId: string, userId: string): Promise<IProject> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    project.status = 'active';
    project.updatedBy = userId as any;
    const updated = await this.repository.saveProject(project);

    auditLogService.log({
      workspaceId: project.workspaceId.toString(),
      projectId: project.id,
      entityType: 'Project',
      entityId: project.id,
      action: 'RESTORE',
      performedBy: userId,
      metadata: { name: project.name },
    });

    return updated;
  }

  /**
   * Soft delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    auditLogService.log({
      workspaceId: project.workspaceId.toString(),
      projectId: project.id,
      entityType: 'Project',
      entityId: project.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { name: project.name, prefix: project.prefix, status: project.status },
      metadata: { name: project.name },
    });

    await project.softDelete(userId);
  }

  /**
   * Get project analytics (task counts by status, completion rate, overdue)
   */
  async getProjectAnalytics(projectId: string, userId: string): Promise<any> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    const tasks = await Task.find({ projectId, deletedAt: null });

    const totalTasks = tasks.length;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let completedCount = 0;
    let overdueCount = 0;

    const now = new Date();

    for (const task of tasks) {
      // Count by status
      const status = task.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Count by priority
      const priority = task.priority || 'unknown';
      byPriority[priority] = (byPriority[priority] || 0) + 1;

      // Completed
      if (status === 'done') completedCount++;

      // Overdue
      if (task.dueDate && new Date(task.dueDate) < now && status !== 'done') {
        overdueCount++;
      }
    }

    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Update project progress
    if (project.progress !== completionRate) {
      project.progress = completionRate;
      await this.repository.saveProject(project);
    }

    return {
      totalTasks,
      completedCount,
      overdueCount,
      completionRate,
      byStatus,
      byPriority,
      progress: completionRate,
    };
  }

  /**
   * Get project members (via ProjectMember collection)
   */
  async getProjectMembers(projectId: string, userId: string): Promise<any[]> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    await this.checkWorkspaceMembership(project.workspaceId.toString(), userId);

    const members = await ProjectMember.find({ projectId, status: 'active' })
      .populate('userId', 'name email avatarUrl')
      .populate('roleId', 'name slug');

    return members;
  }

  /**
   * Add a member to a project
   */
  async addProjectMember(
    projectId: string,
    targetUserId: string,
    roleSlug: string,
    addedBy: string
  ): Promise<void> {
    const project = await this.repository.findProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    await this.checkWorkspaceMembership(project.workspaceId.toString(), addedBy);

    // Verify target user is workspace member
    const targetWsMember = await WorkspaceMember.findOne({
      userId: targetUserId,
      workspaceId: project.workspaceId,
      status: 'active',
    });
    if (!targetWsMember) {
      throw new AppError('User must be a workspace member before being added to a project.', 400);
    }

    // Check if already a project member
    const existing = await ProjectMember.findOne({ userId: targetUserId, projectId, status: 'active' });
    if (existing) {
      throw new AppError('User is already a member of this project.', 400);
    }

    const role = await Role.findOne({ slug: roleSlug, isSystem: true });
    if (!role) throw new AppError('Invalid role.', 400);

    await ProjectMember.create({
      userId: targetUserId,
      projectId,
      roleId: role.id,
      status: 'active',
      joinedAt: new Date(),
      addedBy,
      createdBy: addedBy,
    });

    await this.activityService.logActivity({
      workspaceId: project.workspaceId.toString() as any,
      projectId: project.id as any,
      userId: addedBy as any,
      action: 'project.member_added',
      details: { targetUserId, role: roleSlug },
    });
  }

  /**
   * Remove a member from a project
   */
  async removeProjectMember(projectId: string, targetUserId: string, removedBy: string): Promise<void> {
    const membership = await ProjectMember.findOne({
      userId: targetUserId,
      projectId,
      status: 'active',
    });
    if (!membership) {
      throw new AppError('User is not a member of this project.', 404);
    }

    await membership.softDelete(removedBy);

    const project = await this.repository.findProjectById(projectId);
    if (project) {
      await this.activityService.logActivity({
        workspaceId: project.workspaceId.toString() as any,
        projectId: project.id as any,
        userId: removedBy as any,
        action: 'project.member_removed',
        details: { targetUserId },
      });
    }
  }
}

export default ProjectService;
