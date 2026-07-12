import TaskRepository from './task.repository';
import Workspace from '../workspaces/workspace.model';
import AppError from '../../shared/utils/appError';
import { ITask } from './task.model';
import ActivityService from '../activities/activity.service';
import { WorkspaceMember } from '../members/workspace-member.model';
import { auditLogService } from '../audit-logs/audit-log.service';
import { snapshot } from '../../shared/utils/diff';

const TASK_AUDIT_FIELDS = ['title', 'description', 'status', 'priority', 'assigneeId', 'dueDate', 'projectId'];

export class TaskService {
  private repository: TaskRepository;
  private activityService: ActivityService;

  constructor() {
    this.repository = new TaskRepository();
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
   * Create a new task
   */
  async createTask(
    taskData: Partial<ITask> & { workspaceId: string },
    userId: string
  ): Promise<ITask> {
    await this.checkWorkspaceMembership(taskData.workspaceId, userId);

    const task = await this.repository.createTask({
      ...taskData,
      createdBy: userId as any,
    });

    // Audit log
    auditLogService.log({
      workspaceId: taskData.workspaceId,
      projectId: task.projectId?.toString(),
      entityType: 'Task',
      entityId: task.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { title: task.title, status: task.status, priority: task.priority, assigneeId: task.assigneeId },
      metadata: { title: task.title },
    });

    await this.activityService.logActivity({
      workspaceId: taskData.workspaceId,
      projectId: task.projectId as any,
      taskId: task.id,
      userId: userId as any,
      action: 'TASK_CREATED',
      details: { title: task.title },
    });

    if (task.assigneeId) {
      await this.activityService.logActivity({
        workspaceId: taskData.workspaceId,
        projectId: task.projectId as any,
        taskId: task.id,
        userId: userId as any,
        action: 'TASK_ASSIGNED',
        details: { title: task.title, assigneeId: task.assigneeId },
      });
    }

    return task;
  }

  /**
   * Get all tasks in a workspace
   */
  async getTasksByWorkspace(workspaceId: string, userId: string): Promise<ITask[]> {
    await this.checkWorkspaceMembership(workspaceId, userId);

    return this.repository.findTasksByWorkspace(workspaceId);
  }

  /**
   * Update task details
   */
  async updateTask(
    taskId: string,
    updateData: Partial<ITask>,
    userId: string
  ): Promise<ITask> {
    const task = await this.repository.findTaskById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    // Capture previous values for audit
    const previousValues = snapshot(task.toObject(), TASK_AUDIT_FIELDS);

    // Filter editable attributes
    const allowedKeys: (keyof ITask)[] = [
      'title',
      'description',
      'projectId',
      'assigneeId',
      'status',
      'priority',
      'dueDate',
      'checklist',
    ];

    const prevStatus = task.status;
    const prevAssigneeId = task.assigneeId?.toString();

    allowedKeys.forEach((key) => {
      if (updateData[key] !== undefined) {
        (task as any)[key] = updateData[key];
      }
    });

    task.updatedBy = userId as any;
    const updatedTask = await this.repository.saveTask(task);

    // Capture new values for audit
    const newValues = snapshot(updatedTask.toObject(), TASK_AUDIT_FIELDS);

    // Audit log
    auditLogService.log({
      workspaceId: updatedTask.workspaceId.toString(),
      projectId: updatedTask.projectId?.toString(),
      entityType: 'Task',
      entityId: updatedTask.id,
      action: 'UPDATE',
      performedBy: userId,
      previousValues,
      newValues,
      metadata: { title: updatedTask.title },
    });

    if (updateData.status && updateData.status !== prevStatus) {
      await this.activityService.logActivity({
        workspaceId: updatedTask.workspaceId as any,
        projectId: updatedTask.projectId as any,
        taskId: updatedTask.id as any,
        userId: userId as any,
        action: 'TASK_STATUS_UPDATED',
        details: { title: updatedTask.title, prevStatus, nextStatus: updateData.status },
      });
    }

    if (updateData.assigneeId !== undefined && updateData.assigneeId?.toString() !== prevAssigneeId) {
      await this.activityService.logActivity({
        workspaceId: updatedTask.workspaceId as any,
        projectId: updatedTask.projectId as any,
        taskId: updatedTask.id as any,
        userId: userId as any,
        action: 'TASK_ASSIGNED',
        details: { title: updatedTask.title, assigneeId: updateData.assigneeId },
      });
    }

    return updatedTask;
  }

  /**
   * Add a comment to a task
   */
  async addTaskComment(taskId: string, content: string, userId: string): Promise<ITask> {
    const task = await this.repository.findTaskById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    task.comments.push({
      userId: userId as any,
      content,
      createdAt: new Date(),
    });

    const updatedTask = await this.repository.saveTask(task);

    await this.activityService.logActivity({
      workspaceId: updatedTask.workspaceId as any,
      projectId: updatedTask.projectId as any,
      taskId: updatedTask.id as any,
      userId: userId as any,
      action: 'TASK_COMMENT_ADDED',
      details: { title: updatedTask.title, contentSnippet: content.slice(0, 60) },
    });

    return updatedTask;
  }

  /**
   * Soft delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.repository.findTaskById(taskId);
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    await this.checkWorkspaceMembership(task.workspaceId.toString(), userId);

    // Audit log before deletion
    auditLogService.log({
      workspaceId: task.workspaceId.toString(),
      projectId: task.projectId?.toString(),
      entityType: 'Task',
      entityId: task.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { title: task.title, status: task.status, priority: task.priority },
      metadata: { title: task.title },
    });

    await task.softDelete(userId);
  }
}

export default TaskService;
