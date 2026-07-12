import { Request, Response, NextFunction } from 'express';
import { taskStatusService } from './task-status.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class TaskStatusController {
  /**
   * GET /api/workspaces/:workspaceId/statuses
   */
  async getStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const statuses = await taskStatusService.getByWorkspace(workspaceId);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task statuses retrieved successfully.',
        data: statuses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/workspaces/:workspaceId/statuses
   */
  async createStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.params;
      const { name, color, icon, category, isDefault } = req.body;

      const status = await taskStatusService.create(
        workspaceId,
        { name, color, icon, category, isDefault },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Task status created successfully.',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/workspaces/:workspaceId/statuses/:statusId
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId, statusId } = req.params;
      const { name, color, icon, category, isDefault } = req.body;

      const status = await taskStatusService.update(
        statusId,
        workspaceId,
        { name, color, icon, category, isDefault },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task status updated successfully.',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/workspaces/:workspaceId/statuses/:statusId
   */
  async deleteStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId, statusId } = req.params;
      await taskStatusService.delete(statusId, workspaceId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task status deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/workspaces/:workspaceId/statuses/reorder
   */
  async reorderStatuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new AppError('orderedIds must be a non-empty array of status IDs.', 400);
      }

      const statuses = await taskStatusService.reorder(workspaceId, orderedIds);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task statuses reordered successfully.',
        data: statuses,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TaskStatusController;
