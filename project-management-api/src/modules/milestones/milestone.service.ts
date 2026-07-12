import { Milestone, IMilestone } from './milestone.model';
import Task from '../tasks/task.model';
import AppError from '../../shared/utils/appError';
import { WorkspaceMember } from '../members/workspace-member.model';
import ActivityService from '../activities/activity.service';
import { auditLogService } from '../audit-logs/audit-log.service';

const activityService = new ActivityService();

export class MilestoneService {
  private async verifyMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) throw new AppError('Access denied. You are not a member of this workspace.', 403);
  }

  /**
   * Create a new milestone
   */
  async create(
    data: { name: string; description?: string; projectId: string; workspaceId: string; dueDate?: string },
    userId: string
  ): Promise<IMilestone> {
    await this.verifyMembership(data.workspaceId, userId);

    const milestone = await Milestone.create({
      name: data.name,
      description: data.description || '',
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: 'open',
      createdBy: userId,
    });

    auditLogService.log({
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      entityType: 'Milestone',
      entityId: milestone.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: milestone.name, dueDate: milestone.dueDate },
      metadata: { name: milestone.name },
    });

    await activityService.logActivity({
      workspaceId: data.workspaceId as any,
      projectId: data.projectId as any,
      userId: userId as any,
      action: 'milestone.created',
      details: { name: milestone.name },
    });

    return milestone;
  }

  /**
   * Get milestones for a project
   */
  async getByProject(projectId: string, workspaceId: string, userId: string): Promise<IMilestone[]> {
    await this.verifyMembership(workspaceId, userId);
    return Milestone.find({ projectId }).sort({ dueDate: 1, createdAt: -1 });
  }

  /**
   * Get single milestone
   */
  async getById(milestoneId: string, userId: string): Promise<IMilestone> {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) throw new AppError('Milestone not found.', 404);
    await this.verifyMembership(milestone.workspaceId.toString(), userId);
    return milestone;
  }

  /**
   * Update milestone
   */
  async update(
    milestoneId: string,
    data: { name?: string; description?: string; dueDate?: string; status?: string },
    userId: string
  ): Promise<IMilestone> {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) throw new AppError('Milestone not found.', 404);
    await this.verifyMembership(milestone.workspaceId.toString(), userId);

    if (data.name !== undefined) milestone.name = data.name;
    if (data.description !== undefined) milestone.description = data.description;
    if (data.dueDate !== undefined) milestone.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
    if (data.status !== undefined) milestone.status = data.status as any;
    milestone.updatedBy = userId as any;

    await milestone.save();
    return milestone;
  }

  /**
   * Complete a milestone
   */
  async complete(milestoneId: string, userId: string): Promise<IMilestone> {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) throw new AppError('Milestone not found.', 404);
    await this.verifyMembership(milestone.workspaceId.toString(), userId);

    milestone.status = 'completed';
    milestone.completedAt = new Date();
    milestone.completionPercentage = 100;
    milestone.updatedBy = userId as any;
    await milestone.save();

    await activityService.logActivity({
      workspaceId: milestone.workspaceId.toString() as any,
      projectId: milestone.projectId.toString() as any,
      userId: userId as any,
      action: 'milestone.completed',
      details: { name: milestone.name },
    });

    return milestone;
  }

  /**
   * Reopen a completed milestone
   */
  async reopen(milestoneId: string, userId: string): Promise<IMilestone> {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) throw new AppError('Milestone not found.', 404);
    await this.verifyMembership(milestone.workspaceId.toString(), userId);

    milestone.status = 'in_progress';
    milestone.completedAt = undefined;
    milestone.updatedBy = userId as any;
    await milestone.save();

    // Recalculate progress
    await this.recalculateProgress(milestoneId);

    return Milestone.findById(milestoneId) as unknown as IMilestone;
  }

  /**
   * Delete milestone (soft delete, unassigns tasks)
   */
  async delete(milestoneId: string, userId: string): Promise<void> {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) throw new AppError('Milestone not found.', 404);
    await this.verifyMembership(milestone.workspaceId.toString(), userId);

    // Unassign all tasks from this milestone
    await Task.updateMany({ milestoneId: milestone.id }, { $set: { milestoneId: null } });

    auditLogService.log({
      workspaceId: milestone.workspaceId.toString(),
      projectId: milestone.projectId.toString(),
      entityType: 'Milestone',
      entityId: milestone.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { name: milestone.name },
      metadata: { name: milestone.name },
    });

    await milestone.softDelete(userId);
  }

  /**
   * Recalculate milestone progress based on assigned tasks
   */
  async recalculateProgress(milestoneId: string): Promise<number> {
    const tasks = await Task.find({ milestoneId, deletedAt: null }).select('completedAt');
    const total = tasks.length;
    if (total === 0) {
      await Milestone.updateOne({ _id: milestoneId }, { completionPercentage: 0 });
      return 0;
    }

    const completed = tasks.filter((t) => t.completedAt).length;
    const percentage = Math.round((completed / total) * 100);

    await Milestone.updateOne({ _id: milestoneId }, { completionPercentage: percentage });
    return percentage;
  }

  /**
   * Get tasks assigned to a milestone
   */
  async getTasks(milestoneId: string, userId: string): Promise<any[]> {
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) throw new AppError('Milestone not found.', 404);
    await this.verifyMembership(milestone.workspaceId.toString(), userId);

    return Task.find({ milestoneId, deletedAt: null })
      .sort({ order: 1 })
      .populate('assignees', 'name email avatarUrl')
      .populate('statusId', 'name slug color')
      .populate('priorityId', 'name slug color');
  }
}

export const milestoneService = new MilestoneService();
export default MilestoneService;
