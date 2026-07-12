import { Activity, IActivity } from './activity.model';

export interface ActivityFilters {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  sprintId?: string;
  userId?: string;
  action?: string;
  actionPrefix?: string; // e.g., 'task.' to get all task-related activities
  fromDate?: Date;
  toDate?: Date;
}

export interface ActivityPagination {
  page: number;
  limit: number;
}

export interface PaginatedActivities {
  data: IActivity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ActivityRepository {
  /**
   * Log a new activity
   */
  async log(activityData: Partial<IActivity>): Promise<IActivity> {
    return Activity.create(activityData);
  }

  /**
   * Generic paginated query with filters
   */
  async query(
    filters: ActivityFilters,
    pagination: ActivityPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedActivities> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const mongoFilter: Record<string, any> = {};

    if (filters.workspaceId) mongoFilter.workspaceId = filters.workspaceId;
    if (filters.projectId) mongoFilter.projectId = filters.projectId;
    if (filters.taskId) mongoFilter.taskId = filters.taskId;
    if (filters.sprintId) mongoFilter.sprintId = filters.sprintId;
    if (filters.userId) mongoFilter.userId = filters.userId;
    if (filters.action) mongoFilter.action = filters.action;
    if (filters.actionPrefix) mongoFilter.action = { $regex: `^${filters.actionPrefix}` };

    if (filters.fromDate || filters.toDate) {
      mongoFilter.createdAt = {};
      if (filters.fromDate) mongoFilter.createdAt.$gte = filters.fromDate;
      if (filters.toDate) mongoFilter.createdAt.$lte = filters.toDate;
    }

    const [data, total] = await Promise.all([
      Activity.find(mongoFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email avatarUrl')
        .populate('projectId', 'name')
        .populate('taskId', 'title'),
      Activity.countDocuments(mongoFilter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find workspace activity timeline (paginated)
   */
  async findByWorkspace(
    workspaceId: string,
    pagination: ActivityPagination = { page: 1, limit: 30 },
    filters: Omit<ActivityFilters, 'workspaceId'> = {}
  ): Promise<PaginatedActivities> {
    return this.query({ ...filters, workspaceId }, pagination);
  }

  /**
   * Find project activity timeline (paginated)
   */
  async findByProject(
    projectId: string,
    pagination: ActivityPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedActivities> {
    return this.query({ projectId }, pagination);
  }

  /**
   * Find task-specific activity history
   */
  async findByTask(
    taskId: string,
    pagination: ActivityPagination = { page: 1, limit: 50 }
  ): Promise<PaginatedActivities> {
    return this.query({ taskId }, pagination);
  }

  /**
   * Find activities by a specific user
   */
  async findByUser(
    userId: string,
    pagination: ActivityPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedActivities> {
    return this.query({ userId }, pagination);
  }
}

export default ActivityRepository;
