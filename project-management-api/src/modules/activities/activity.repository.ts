import { Activity, IActivity } from './activity.model';

export class ActivityRepository {
  /**
   * Log a new activity
   */
  async log(activityData: Partial<IActivity>): Promise<IActivity> {
    return Activity.create(activityData);
  }

  /**
   * Find activity log timeline in workspace
   */
  async findByWorkspace(workspaceId: string, limit = 20): Promise<IActivity[]> {
    return Activity.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email avatarUrl')
      .populate('projectId', 'name')
      .populate('taskId', 'title');
  }
}

export default ActivityRepository;
