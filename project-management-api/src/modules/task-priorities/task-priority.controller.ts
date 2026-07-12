import { Request, Response, NextFunction } from 'express';
import { taskPriorityService } from './task-priority.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class TaskPriorityController {
  /**
   * GET /api/workspaces/:workspaceId/priorities
   */
  async getPriorities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const priorities = await taskPriorityService.getByWorkspace(workspaceId);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task priorities retrieved successfully.',
        data: priorities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/workspaces/:workspaceId/priorities
   */
  async createPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.params;
      const { name, color, icon, isDefault } = req.body;

      const priority = await taskPriorityService.create(
        workspaceId,
        { name, color, icon, isDefault },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Task priority created successfully.',
        data: priority,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/workspaces/:workspaceId/priorities/:priorityId
   */
  async updatePriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId, priorityId } = req.params;
      const { name, color, icon, isDefault } = req.body;

      const priority = await taskPriorityService.update(
        priorityId,
        workspaceId,
        { name, color, icon, isDefault },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task priority updated successfully.',
        data: priority,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/workspaces/:workspaceId/priorities/:priorityId
   */
  async deletePriority(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId, priorityId } = req.params;
      await taskPriorityService.delete(priorityId, workspaceId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task priority deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/workspaces/:workspaceId/priorities/reorder
   */
  async reorderPriorities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new AppError('orderedIds must be a non-empty array of priority IDs.', 400);
      }

      const priorities = await taskPriorityService.reorder(workspaceId, orderedIds);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task priorities reordered successfully.',
        data: priorities,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TaskPriorityController;
