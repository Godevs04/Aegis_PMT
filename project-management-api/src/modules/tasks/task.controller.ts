import { Request, Response, NextFunction } from 'express';
import TaskService from './task.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const taskService = new TaskService();

export class TaskController {
  /**
   * Create Task
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const task = await taskService.createTask(req.body, user.id);

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Task created successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Tasks belonging to a Workspace
   */
  async getWorkspaceTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const workspaceId = req.query.workspaceId as string;
      const tasks = await taskService.getTasksByWorkspace(workspaceId, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Tasks retrieved successfully.',
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Task Details
   */
  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { taskId } = req.params;
      const task = await taskService.updateTask(taskId, req.body, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task updated successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add Comment to Task
   */
  async addTaskComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { taskId } = req.params;
      const { content } = req.body;
      const task = await taskService.addTaskComment(taskId, content, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Comment added successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft Delete Task
   */
  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { taskId } = req.params;
      await taskService.deleteTask(taskId, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TaskController;
