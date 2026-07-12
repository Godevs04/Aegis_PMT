import ActivityRepository, {
  ActivityFilters,
  ActivityPagination,
  PaginatedActivities,
} from './activity.repository';
import NotificationRepository from '../notifications/notification.repository';
import { IActivity } from './activity.model';
import Workspace from '../workspaces/workspace.model';
import Task from '../tasks/task.model';
import AppError from '../../shared/utils/appError';
import { WorkspaceMember } from '../members/workspace-member.model';
import socketService from '../../services/socket.service';

export class ActivityService {
  private activityRepository: ActivityRepository;
  private notificationRepository: NotificationRepository;

  constructor() {
    this.activityRepository = new ActivityRepository();
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Log an activity and dispatch notifications.
   * This is the primary entry point for creating activity records.
   */
  async logActivity(
    activityData: Partial<IActivity> & {
      workspaceId: string;
      userId: string;
      action: string;
    }
  ): Promise<IActivity> {
    const activity = await this.activityRepository.log(activityData);

    // Emit real-time activity event to workspace room
    socketService.emitActivity(activityData.workspaceId, {
      id: activity.id,
      action: activity.action,
      userId: activity.userId,
      workspaceId: activity.workspaceId,
      projectId: activity.projectId,
      taskId: activity.taskId,
      details: activity.details,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    });

    // Trigger Notification Dispatch rules based on actions
    try {
      await this.dispatchNotifications(activity);
    } catch (err) {
      // Don't block activity logging if notification delivery encounters issues
      console.error('Failed to dispatch notification:', err);
    }

    return activity;
  }

  /**
   * Get workspace activity timeline (paginated, filterable)
   */
  async getWorkspaceTimeline(
    workspaceId: string,
    userId: string,
    pagination: ActivityPagination = { page: 1, limit: 30 },
    filters: Omit<ActivityFilters, 'workspaceId'> = {}
  ): Promise<PaginatedActivities> {
    // Verify user membership
    await this.verifyWorkspaceMembership(workspaceId, userId);

    return this.activityRepository.findByWorkspace(workspaceId, pagination, filters);
  }

  /**
   * Get project activity timeline (paginated)
   */
  async getProjectTimeline(
    projectId: string,
    workspaceId: string,
    userId: string,
    pagination: ActivityPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedActivities> {
    // Verify user membership in workspace
    await this.verifyWorkspaceMembership(workspaceId, userId);

    return this.activityRepository.findByProject(projectId, pagination);
  }

  /**
   * Get task activity history (all changes to a specific task)
   */
  async getTaskTimeline(
    taskId: string,
    userId: string,
    pagination: ActivityPagination = { page: 1, limit: 50 }
  ): Promise<PaginatedActivities> {
    // Verify user has access to this task's workspace
    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    await this.verifyWorkspaceMembership(task.workspaceId.toString(), userId);

    return this.activityRepository.findByTask(taskId, pagination);
  }

  /**
   * Get activity performed by the current user (personal activity feed)
   */
  async getMyActivity(
    userId: string,
    pagination: ActivityPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedActivities> {
    return this.activityRepository.findByUser(userId, pagination);
  }

  /**
   * Helper: Verify workspace membership
   */
  private async verifyWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
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
   * Notification Dispatch Rules engine
   */
  private async dispatchNotifications(activity: IActivity): Promise<void> {
    const actorId = activity.userId.toString();

    // 1. Task Assigned
    if (activity.action === 'task.assigned' || activity.action === 'TASK_ASSIGNED') {
      const task = await Task.findById(activity.taskId);
      if (task && task.assigneeId && task.assigneeId.toString() !== actorId) {
        await this.notificationRepository.create({
          recipientId: task.assigneeId,
          actorId: activity.userId,
          workspaceId: activity.workspaceId,
          type: 'task.assigned',
          title: `You were assigned to "${task.title}"`,
          entityId: task.id,
          entityType: 'Task',
        });
      }
    }

    // 2. Task Comment Added
    if (activity.action === 'comment.added' || activity.action === 'TASK_COMMENT_ADDED') {
      const task = await Task.findById(activity.taskId);
      if (task) {
        if (task.assigneeId && task.assigneeId.toString() !== actorId) {
          await this.notificationRepository.create({
            recipientId: task.assigneeId,
            actorId: activity.userId,
            workspaceId: activity.workspaceId,
            type: 'comment.added',
            title: `New comment on "${task.title}"`,
            entityId: task.id,
            entityType: 'Task',
          });
        }
      }
    }

    // Future: Add more dispatch rules for sprint.completed, milestone.completed, etc.
  }
}

export default ActivityService;
