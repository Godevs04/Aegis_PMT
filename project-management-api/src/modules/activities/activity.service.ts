import ActivityRepository from './activity.repository';
import NotificationRepository from '../notifications/notification.repository';
import { IActivity } from './activity.model';
import Workspace from '../workspaces/workspace.model';
import Task from '../tasks/task.model';
import AppError from '../../shared/utils/appError';

export class ActivityService {
  private activityRepository: ActivityRepository;
  private notificationRepository: NotificationRepository;

  constructor() {
    this.activityRepository = new ActivityRepository();
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Log an activity and dispatch notifications
   */
  async logActivity(
    activityData: Partial<IActivity> & {
      workspaceId: string;
      userId: string;
      action: string;
    }
  ): Promise<IActivity> {
    const activity = await this.activityRepository.log(activityData);

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
   * Get workspace activity log timeline
   */
  async getWorkspaceTimeline(workspaceId: string, userId: string): Promise<IActivity[]> {
    // Verify user membership in workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    const isMember = workspace.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new AppError('Access denied. You are not a member of this workspace.', 403);
    }

    return this.activityRepository.findByWorkspace(workspaceId);
  }

  /**
   * Notification Dispatch Rules engine
   */
  private async dispatchNotifications(activity: IActivity): Promise<void> {
    const actorId = activity.userId.toString();

    // 1. Task Assigned
    if (activity.action === 'TASK_ASSIGNED') {
      const task = await Task.findById(activity.taskId);
      if (task && task.assigneeId && task.assigneeId.toString() !== actorId) {
        await this.notificationRepository.create({
          recipientId: task.assigneeId,
          actorId: activity.userId,
          workspaceId: activity.workspaceId,
          type: 'TASK_ASSIGNED',
          entityId: task.id,
          entityType: 'Task',
        });
      }
    }

    // 2. Task Comment Added
    if (activity.action === 'TASK_COMMENT_ADDED') {
      const task = await Task.findById(activity.taskId);
      if (task) {
        // Notify task assignee if it's not the comment author
        if (task.assigneeId && task.assigneeId.toString() !== actorId) {
          await this.notificationRepository.create({
            recipientId: task.assigneeId,
            actorId: activity.userId,
            workspaceId: activity.workspaceId,
            type: 'COMMENT_ADDED',
            entityId: task.id,
            entityType: 'Task',
          });
        }
      }
    }

    // 3. Project Member Added or Project Created (Notify Org/Workspace members if needed)
    // Custom dispatch rules can be added here for future scales
  }
}

export default ActivityService;
