import TaskRepository from './task.repository';
import Workspace from '../workspaces/workspace.model';
import AppError from '../../shared/utils/appError';
import { ITask } from './task.model';

export class TaskService {
  private repository: TaskRepository;

  constructor() {
    this.repository = new TaskRepository();
  }

  /**
   * Helper to verify if user is member of the workspace
   */
  private async checkWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    const isMember = workspace.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
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

    return this.repository.createTask({
      ...taskData,
      createdBy: userId as any,
    });
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

    allowedKeys.forEach((key) => {
      if (updateData[key] !== undefined) {
        (task as any)[key] = updateData[key];
      }
    });

    task.updatedBy = userId as any;

    return this.repository.saveTask(task);
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

    return this.repository.saveTask(task);
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

    await task.softDelete(userId);
  }
}

export default TaskService;
