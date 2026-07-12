import { Request, Response, NextFunction } from 'express';
import TaskService from './task.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const taskService = new TaskService();

export class TaskController {
  /**
   * POST /api/tasks
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const task = await taskService.createTask(req.body, req.user.id);

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
   * GET /api/tasks?workspaceId=&projectId=&statusId=&priorityId=&assignee=&sprintId=&search=&page=&limit=&sortBy=&sortOrder=
   */
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const {
        workspaceId,
        projectId,
        statusId,
        priorityId,
        assignee,
        labels,
        sprintId,
        parentTaskId,
        search,
        dueBefore,
        dueAfter,
        page = '1',
        limit = '50',
        sortBy = 'order',
        sortOrder = 'asc',
      } = req.query;

      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const result = await taskService.getTasks(
        workspaceId as string,
        req.user.id,
        {
          projectId: projectId as string,
          statusId: statusId as string,
          priorityId: priorityId as string,
          assignee: assignee as string,
          labels: labels ? (labels as string).split(',') : undefined,
          sprintId: sprintId as string,
          parentTaskId: parentTaskId === 'null' ? null : (parentTaskId as string),
          search: search as string,
          dueBefore: dueBefore as string,
          dueAfter: dueAfter as string,
        },
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 50, 100),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Tasks retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:taskId
   */
  async getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const task = await taskService.getTaskById(taskId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task retrieved successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:taskId
   */
  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const task = await taskService.updateTask(taskId, req.body, req.user.id);

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
   * DELETE /api/tasks/:taskId
   */
  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      await taskService.deleteTask(taskId, req.user.id);

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

  /**
   * POST /api/tasks/:taskId/time
   * Log time on a task.
   */
  async logTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const { hours, description } = req.body;

      const task = await taskService.logTime(taskId, req.user.id, hours, description);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Time logged successfully.',
        data: { spentHours: task.spentHours, timeLogs: task.timeLogs },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:taskId/subtasks
   * Get subtasks for a parent task.
   */
  async getSubtasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const subtasks = await taskService.getSubtasks(taskId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Subtasks retrieved successfully.',
        data: subtasks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tasks/bulk
   * Bulk update multiple tasks.
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskIds, statusId, priorityId, assignees, sprintId } = req.body;

      if (!taskIds || !Array.isArray(taskIds)) {
        throw new AppError('taskIds must be an array.', 400);
      }

      const result = await taskService.bulkUpdate(
        taskIds,
        { statusId, priorityId, assignees, sprintId },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: `${result.updatedCount} task(s) updated successfully.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:taskId/move
   * Move task (reorder / change status for Kanban drag).
   */
  async moveTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const { statusId, order } = req.body;

      if (order === undefined) throw new AppError('order is required.', 400);

      const task = await taskService.moveTask(taskId, req.user.id, { statusId, order });

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task moved successfully.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TaskController;
