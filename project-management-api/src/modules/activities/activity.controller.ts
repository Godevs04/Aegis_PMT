import { Request, Response, NextFunction } from 'express';
import ActivityService from './activity.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const activityService = new ActivityService();

export class ActivityController {
  /**
   * GET /api/activities?workspaceId=&page=&limit=&action=&actionPrefix=&from=&to=
   *
   * Fetch workspace activity timeline with pagination and filters.
   */
  async getWorkspaceTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication required.', 401);
      }

      const { workspaceId, page = '1', limit = '30', action, actionPrefix, from, to } = req.query;

      if (!workspaceId) {
        throw new AppError('workspaceId query parameter is required.', 400);
      }

      const filters: any = {};
      if (action) filters.action = action as string;
      if (actionPrefix) filters.actionPrefix = actionPrefix as string;
      if (from) filters.fromDate = new Date(from as string);
      if (to) filters.toDate = new Date(to as string);

      const result = await activityService.getWorkspaceTimeline(
        workspaceId as string,
        user.id,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 30, 100),
        },
        filters
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Workspace activities retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/activities/project/:projectId?workspaceId=&page=&limit=
   *
   * Fetch project-scoped activity timeline.
   */
  async getProjectTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication required.', 401);
      }

      const { projectId } = req.params;
      const { workspaceId, page = '1', limit = '30' } = req.query;

      if (!workspaceId) {
        throw new AppError('workspaceId query parameter is required.', 400);
      }

      const result = await activityService.getProjectTimeline(
        projectId,
        workspaceId as string,
        user.id,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 30, 100),
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project activities retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/activities/task/:taskId?page=&limit=
   *
   * Fetch task-specific activity history.
   */
  async getTaskTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication required.', 401);
      }

      const { taskId } = req.params;
      const { page = '1', limit = '50' } = req.query;

      const result = await activityService.getTaskTimeline(
        taskId,
        user.id,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 50, 100),
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Task activity history retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/activities/me?page=&limit=
   *
   * Fetch current user's personal activity feed.
   */
  async getMyActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication required.', 401);
      }

      const { page = '1', limit = '30' } = req.query;

      const result = await activityService.getMyActivity(
        user.id,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 30, 100),
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Your activity feed retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ActivityController;
