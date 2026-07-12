import { Task, ITask } from './task.model';
import { TaskStatus } from '../task-statuses/task-status.model';
import Workspace from '../workspaces/workspace.model';
import AppError from '../../shared/utils/appError';
import ActivityService from '../activities/activity.service';
import { WorkspaceMember } from '../members/workspace-member.model';
import { auditLogService } from '../audit-logs/audit-log.service';
import { snapshot } from '../../shared/utils/diff';

const TASK_AUDIT_FIELDS = ['title', 'statusId', 'priorityId', 'assignees', 'dueDate', 'order', 'parentTaskId', 'sprintId'];

export interface CreateTaskData {
  title: string;
  description?: any;
  projectId: string;
  workspaceId: string;
  assignees?: string[];
  reporter?: string;
  statusId?: string;
  priorityId?: string;
  labels?: string[];
  parentTaskId?: string;
  sprintId?: string;
  milestoneId?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface TaskFilters {
  projectId?: string;
  statusId?: string;
  priorityId?: string;
  assignee?: string;
  labels?: string[];
  sprintId?: string;
  parentTaskId?: string | null;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
}

export interface TaskPagination {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TaskService {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  /**
   * Verify workspace membership
   */
  private async checkWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError('Workspace not found.', 404);

    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) throw new AppError('Access denied. You are not a member of this workspace.', 403);
  }

  /**
   * Get next task number for a project (auto-increment)
   */
  private async getNextTaskNumber(projectId: string): Promise<number> {
    const lastTask = await Task.findOne({ projectId })
      .sort({ taskNumber: -1 })
      .select('taskNumber')
      .setOptions({ strictQuery: false });

    // Also check soft-deleted tasks for the highest number
    const lastDeletedTask = await Task.findOne({ projectId, deletedAt: { $ne: null } })
      .sort({ taskNumber: -1 })
      .select('taskNumber')
      .setOptions({ strictQuery: false });

    const maxActive = lastTask?.taskNumber || 0;
    const maxDeleted = lastDeletedTask?.taskNumber || 0;

    return Math.max(maxActive, maxDeleted) + 1;
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskData, userId: string): Promise<ITask> {
    await this.checkWorkspaceMembership(data.workspaceId, userId);

    // Get auto-increment task number
    const taskNumber = await this.getNextTaskNumber(data.projectId);

    // Get default status if not provided
    let statusId = data.statusId;
    if (!statusId) {
      const defaultStatus = await TaskStatus.findOne({ workspaceId: data.workspaceId, isDefault: true });
      if (defaultStatus) statusId = defaultStatus.id;
    }

    // Get next order for the status column
    const lastInColumn = await Task.findOne({ projectId: data.projectId, statusId })
      .sort({ order: -1 })
      .select('order');
    const order = lastInColumn ? lastInColumn.order + 1 : 0;

    const task = await Task.create({
      taskNumber,
      title: data.title,
      description: data.description || null,
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      assignees: data.assignees || [],
      reporter: data.reporter || userId,
      statusId: statusId || null,
      priorityId: data.priorityId || null,
      labels: data.labels || [],
      parentTaskId: data.parentTaskId || null,
      sprintId: data.sprintId || null,
      milestoneId: data.milestoneId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedHours: data.estimatedHours || null,
      tags: data.tags || [],
      order,
      createdBy: userId,
    });

    // Audit
    auditLogService.log({
      workspaceId: data.workspaceId,
      projectId: data.projectId,
      entityType: 'Task',
      entityId: task.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { title: task.title, taskNumber, statusId, assignees: data.assignees },
      metadata: { title: task.title, taskNumber },
    });

    // Activity
    await this.activityService.logActivity({
      workspaceId: data.workspaceId as any,
      projectId: data.projectId as any,
      taskId: task.id,
      userId: userId as any,
      action: 'task.created',
      details: { title: task.title, taskNumber },
    });

    return task;
  }

  /**
   * Get tasks with filters and pagination
   */
  async getTasks(
    workspaceId: string,
    userId: string,
    filters: TaskFilters = {},
    pagination: TaskPagination = { page: 1, limit: 50 }
  ): Promise<{ data: ITask[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    await this.checkWorkspaceMembership(workspaceId, userId);

    const { page, limit, sortBy = 'order', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { workspaceId };

    if (filters.projectId) query.projectId = filters.projectId;
    if (filters.statusId) query.statusId = filters.statusId;
    if (filters.priorityId) query.priorityId = filters.priorityId;
    if (filters.assignee) query.assignees = filters.assignee;
    if (filters.labels && filters.labels.length > 0) query.labels = { $in: filters.labels };
    if (filters.sprintId) query.sprintId = filters.sprintId;
    if (filters.parentTaskId === null) query.parentTaskId = null; // Top-level only
    else if (filters.parentTaskId) query.parentTaskId = filters.parentTaskId;
    if (filters.search) query.title = { $regex: filters.search, $options: 'i' };
    if (filters.dueBefore || filters.dueAfter) {
      query.dueDate = {};
      if (filters.dueBefore) query.dueDate.$lte = new Date(filters.dueBefore);
      if (filters.dueAfter) query.dueDate.$gte = new Date(filters.dueAfter);
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, total] = await Promise.all([
      Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignees', 'name email avatarUrl')
        .populate('statusId', 'name slug color icon category')
        .populate('priorityId', 'name slug color icon')
        .populate('labels', 'name color')
        .populate('reporter', 'name email avatarUrl')
        .populate('createdBy', 'name'),
      Task.countDocuments(query),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single task by ID
   */
  async getTaskById(taskId: string, userId: string): Promise<ITask> {
    const task = await Task.findById(taskId)
      .populate('assignees', 'name email avatarUrl')
      .populate('statusId', 'name slug color icon category')
      .populate('priorityId', 'name slug color icon')
      .populate('labels', 'name color')
      .populate('reporter', 'name email avatarUrl')
      .populate('watchers', 'name email avatarUrl')
      .populate('createdBy', 'name');

    if (!task) throw new AppError('Task not found.', 404);

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);
    return task;
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, updateData: Partial<ITask>, userId: string): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found.', 404);

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    const previousValues = snapshot(task.toObject(), TASK_AUDIT_FIELDS);

    // Apply updates
    const allowedFields = [
      'title', 'description', 'statusId', 'priorityId', 'assignees',
      'reporter', 'watchers', 'labels', 'tags', 'parentTaskId',
      'sprintId', 'milestoneId', 'startDate', 'dueDate', 'estimatedHours', 'order',
    ];

    for (const field of allowedFields) {
      if ((updateData as any)[field] !== undefined) {
        (task as any)[field] = (updateData as any)[field];
      }
    }

    // Track completion
    if (updateData.statusId) {
      const newStatus = await TaskStatus.findById(updateData.statusId);
      if (newStatus && newStatus.category === 'done' && !task.completedAt) {
        task.completedAt = new Date();
      } else if (newStatus && newStatus.category !== 'done') {
        task.completedAt = undefined;
      }
    }

    task.updatedBy = userId as any;
    const updatedTask = await task.save();

    const newValues = snapshot(updatedTask.toObject(), TASK_AUDIT_FIELDS);

    // Audit
    auditLogService.log({
      workspaceId: updatedTask.workspaceId.toString(),
      projectId: updatedTask.projectId?.toString(),
      entityType: 'Task',
      entityId: updatedTask.id,
      action: 'UPDATE',
      performedBy: userId,
      previousValues,
      newValues,
      metadata: { title: updatedTask.title, taskNumber: updatedTask.taskNumber },
    });

    // Activity for status change
    if (updateData.statusId && updateData.statusId.toString() !== previousValues.statusId) {
      await this.activityService.logActivity({
        workspaceId: updatedTask.workspaceId.toString() as any,
        projectId: updatedTask.projectId?.toString() as any,
        taskId: updatedTask.id,
        userId: userId as any,
        action: 'task.status_changed',
        details: { title: updatedTask.title, taskNumber: updatedTask.taskNumber },
      });
    }

    return updatedTask;
  }

  /**
   * Log time on a task
   */
  async logTime(
    taskId: string,
    userId: string,
    hours: number,
    description?: string
  ): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found.', 404);

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    task.timeLogs.push({
      userId: userId as any,
      hours,
      description: description || '',
      loggedAt: new Date(),
    });

    task.updatedBy = userId as any;
    const updated = await task.save();

    await this.activityService.logActivity({
      workspaceId: task.workspaceId.toString() as any,
      projectId: task.projectId?.toString() as any,
      taskId: task.id,
      userId: userId as any,
      action: 'task.time_logged',
      details: { title: task.title, hours, taskNumber: task.taskNumber },
    });

    return updated;
  }

  /**
   * Get subtasks for a parent task
   */
  async getSubtasks(parentTaskId: string, userId: string): Promise<ITask[]> {
    const parent = await Task.findById(parentTaskId);
    if (!parent) throw new AppError('Parent task not found.', 404);

    await this.checkWorkspaceMembership(parent.workspaceId.toString(), userId);

    return Task.find({ parentTaskId })
      .sort({ order: 1 })
      .populate('assignees', 'name email avatarUrl')
      .populate('statusId', 'name slug color icon')
      .populate('priorityId', 'name slug color icon');
  }

  /**
   * Bulk update tasks (change status, priority, or assignees for multiple)
   */
  async bulkUpdate(
    taskIds: string[],
    updateData: { statusId?: string; priorityId?: string; assignees?: string[]; sprintId?: string },
    userId: string
  ): Promise<{ updatedCount: number }> {
    if (taskIds.length === 0) throw new AppError('No task IDs provided.', 400);
    if (taskIds.length > 50) throw new AppError('Cannot bulk update more than 50 tasks at once.', 400);

    // Verify user has access to at least one task's workspace
    const firstTask = await Task.findById(taskIds[0]);
    if (!firstTask) throw new AppError('Task not found.', 404);
    await this.checkWorkspaceMembership(firstTask.workspaceId.toString(), userId);

    const setData: Record<string, any> = { updatedBy: userId };
    if (updateData.statusId) setData.statusId = updateData.statusId;
    if (updateData.priorityId) setData.priorityId = updateData.priorityId;
    if (updateData.assignees) setData.assignees = updateData.assignees;
    if (updateData.sprintId) setData.sprintId = updateData.sprintId;

    const result = await Task.updateMany(
      { _id: { $in: taskIds }, workspaceId: firstTask.workspaceId },
      { $set: setData }
    );

    // Activity for bulk update
    await this.activityService.logActivity({
      workspaceId: firstTask.workspaceId.toString() as any,
      userId: userId as any,
      action: 'task.updated',
      details: { bulkUpdate: true, count: result.modifiedCount, fields: Object.keys(updateData) },
    });

    return { updatedCount: result.modifiedCount };
  }

  /**
   * Move task (reorder within column or between columns)
   */
  async moveTask(
    taskId: string,
    userId: string,
    data: { statusId?: string; order: number }
  ): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found.', 404);

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    if (data.statusId) task.statusId = data.statusId as any;
    task.order = data.order;
    task.updatedBy = userId as any;

    // Check for completion tracking
    if (data.statusId) {
      const newStatus = await TaskStatus.findById(data.statusId);
      if (newStatus && newStatus.category === 'done' && !task.completedAt) {
        task.completedAt = new Date();
      } else if (newStatus && newStatus.category !== 'done') {
        task.completedAt = undefined;
      }
    }

    const updated = await task.save();
    return updated;
  }

  /**
   * Soft delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found.', 404);

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    auditLogService.log({
      workspaceId: task.workspaceId.toString(),
      projectId: task.projectId?.toString(),
      entityType: 'Task',
      entityId: task.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { title: task.title, taskNumber: task.taskNumber },
      metadata: { title: task.title, taskNumber: task.taskNumber },
    });

    await task.softDelete(userId);
  }
}

export default TaskService;
