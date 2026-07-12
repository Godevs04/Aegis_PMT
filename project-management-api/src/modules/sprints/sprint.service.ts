import { Sprint, ISprint } from './sprint.model';
import Task from '../tasks/task.model';
import AppError from '../../shared/utils/appError';
import { WorkspaceMember } from '../members/workspace-member.model';
import ActivityService from '../activities/activity.service';
import { auditLogService } from '../audit-logs/audit-log.service';

const activityService = new ActivityService();

export class SprintService {
  private async verifyMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) throw new AppError('Access denied. You are not a member of this workspace.', 403);
  }

  /**
   * Create a new sprint
   */
  async create(
    data: { name: string; goal?: string; projectId: string; workspaceId: string; startDate?: string; endDate?: string },
    userId: string
  ): Promise<ISprint> {
    await this.verifyMembership(data.workspaceId, userId);

    const sprint = await Sprint.create({
      name: data.name,
      goal: data.goal || '',
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: 'planning',
      createdBy: userId,
    });

    auditLogService.log({
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      entityType: 'Sprint',
      entityId: sprint.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: sprint.name, goal: sprint.goal },
      metadata: { name: sprint.name },
    });

    await activityService.logActivity({
      workspaceId: data.workspaceId as any,
      projectId: data.projectId as any,
      userId: userId as any,
      action: 'sprint.created',
      details: { name: sprint.name },
    });

    return sprint;
  }

  /**
   * Get sprints for a project
   */
  async getByProject(projectId: string, workspaceId: string, userId: string): Promise<ISprint[]> {
    await this.verifyMembership(workspaceId, userId);
    return Sprint.find({ projectId }).sort({ createdAt: -1 });
  }

  /**
   * Get single sprint
   */
  async getById(sprintId: string, userId: string): Promise<ISprint> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);
    return sprint;
  }

  /**
   * Update sprint details
   */
  async update(
    sprintId: string,
    data: { name?: string; goal?: string; startDate?: string; endDate?: string },
    userId: string
  ): Promise<ISprint> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    if (data.name !== undefined) sprint.name = data.name;
    if (data.goal !== undefined) sprint.goal = data.goal;
    if (data.startDate !== undefined) sprint.startDate = data.startDate ? new Date(data.startDate) : undefined;
    if (data.endDate !== undefined) sprint.endDate = data.endDate ? new Date(data.endDate) : undefined;
    sprint.updatedBy = userId as any;

    await sprint.save();
    return sprint;
  }

  /**
   * Start a sprint (change status to active)
   */
  async start(sprintId: string, userId: string): Promise<ISprint> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    if (sprint.status !== 'planning') {
      throw new AppError('Only sprints in "planning" status can be started.', 400);
    }

    // Check if there's already an active sprint for this project
    const activeSprint = await Sprint.findOne({ projectId: sprint.projectId, status: 'active' });
    if (activeSprint) {
      throw new AppError(`Sprint "${activeSprint.name}" is already active. Complete it first.`, 400);
    }

    sprint.status = 'active';
    sprint.startDate = sprint.startDate || new Date();
    sprint.updatedBy = userId as any;
    await sprint.save();

    auditLogService.log({
      workspaceId: sprint.workspaceId.toString(),
      projectId: sprint.projectId.toString(),
      entityType: 'Sprint',
      entityId: sprint.id,
      action: 'UPDATE',
      performedBy: userId,
      newValues: { status: 'active' },
      metadata: { name: sprint.name, action: 'started' },
    });

    await activityService.logActivity({
      workspaceId: sprint.workspaceId.toString() as any,
      projectId: sprint.projectId.toString() as any,
      sprintId: sprint.id as any,
      userId: userId as any,
      action: 'sprint.started',
      details: { name: sprint.name },
    });

    return sprint;
  }

  /**
   * Complete a sprint
   */
  async complete(sprintId: string, userId: string): Promise<ISprint> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    if (sprint.status !== 'active') {
      throw new AppError('Only active sprints can be completed.', 400);
    }

    sprint.status = 'completed';
    sprint.completedAt = new Date();
    sprint.updatedBy = userId as any;
    await sprint.save();

    auditLogService.log({
      workspaceId: sprint.workspaceId.toString(),
      projectId: sprint.projectId.toString(),
      entityType: 'Sprint',
      entityId: sprint.id,
      action: 'UPDATE',
      performedBy: userId,
      newValues: { status: 'completed' },
      metadata: { name: sprint.name, action: 'completed' },
    });

    await activityService.logActivity({
      workspaceId: sprint.workspaceId.toString() as any,
      projectId: sprint.projectId.toString() as any,
      sprintId: sprint.id as any,
      userId: userId as any,
      action: 'sprint.completed',
      details: { name: sprint.name },
    });

    return sprint;
  }

  /**
   * Delete a sprint (soft delete)
   */
  async delete(sprintId: string, userId: string): Promise<void> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    // Unassign all tasks from this sprint
    await Task.updateMany({ sprintId: sprint.id }, { $set: { sprintId: null } });

    auditLogService.log({
      workspaceId: sprint.workspaceId.toString(),
      projectId: sprint.projectId.toString(),
      entityType: 'Sprint',
      entityId: sprint.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { name: sprint.name, status: sprint.status },
      metadata: { name: sprint.name },
    });

    await sprint.softDelete(userId);
  }

  /**
   * Add tasks to a sprint
   */
  async addTasks(sprintId: string, taskIds: string[], userId: string): Promise<{ updatedCount: number }> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, workspaceId: sprint.workspaceId },
      { $set: { sprintId: sprint.id } }
    );

    return { updatedCount: result.modifiedCount };
  }

  /**
   * Remove tasks from a sprint (move back to backlog)
   */
  async removeTasks(sprintId: string, taskIds: string[], userId: string): Promise<{ updatedCount: number }> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, sprintId: sprint.id },
      { $set: { sprintId: null } }
    );

    return { updatedCount: result.modifiedCount };
  }

  /**
   * Get sprint analytics (task breakdown, burndown data)
   */
  async getAnalytics(sprintId: string, userId: string): Promise<any> {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) throw new AppError('Sprint not found.', 404);
    await this.verifyMembership(sprint.workspaceId.toString(), userId);

    const tasks = await Task.find({ sprintId: sprint.id, deletedAt: null })
      .select('statusId completedAt createdAt');

    const totalTasks = tasks.length;
    let completedTasks = 0;

    for (const task of tasks) {
      if (task.completedAt) completedTasks++;
    }

    const remainingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Days calculation
    const startDate = sprint.startDate || sprint.createdAt;
    const endDate = sprint.endDate || new Date();
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      status: sprint.status,
      totalTasks,
      completedTasks,
      remainingTasks,
      completionRate,
      totalDays,
      elapsedDays,
      remainingDays,
      startDate,
      endDate: sprint.endDate,
    };
  }

  /**
   * Get backlog tasks (tasks in the project not assigned to any sprint)
   */
  async getBacklog(projectId: string, workspaceId: string, userId: string): Promise<any[]> {
    await this.verifyMembership(workspaceId, userId);

    return Task.find({
      projectId,
      workspaceId,
      sprintId: null,
      deletedAt: null,
    })
      .sort({ order: 1 })
      .populate('assignees', 'name email avatarUrl')
      .populate('statusId', 'name slug color')
      .populate('priorityId', 'name slug color');
  }
}

export const sprintService = new SprintService();
export default SprintService;
