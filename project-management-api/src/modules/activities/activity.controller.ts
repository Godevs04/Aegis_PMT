import { Request, Response, NextFunction } from 'express';
import ActivityService from './activity.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const activityService = new ActivityService();

export class ActivityController {
  /**
   * Fetch Workspace Activity Timeline Feed
   */
  async getWorkspaceTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { workspaceId } = req.query;
      if (!workspaceId) {
        throw new AppError('workspaceId query parameter is required.', 400);
      }

      const timeline = await activityService.getWorkspaceTimeline(workspaceId as string, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Workspace activities retrieved successfully.',
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ActivityController;
