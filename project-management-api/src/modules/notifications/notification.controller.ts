import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class NotificationController {
  /**
   * GET /api/notifications?page=&limit=&workspaceId=
   *
   * Get current user's notifications (paginated).
   */
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { page = '1', limit = '20', workspaceId } = req.query;

      const result = await notificationService.getUserNotifications(
        req.user.id,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 20, 100),
        },
        workspaceId as string | undefined
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Notifications retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count?workspaceId=
   *
   * Get unread notification count.
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.query;

      const count = await notificationService.getUnreadCount(
        req.user.id,
        workspaceId as string | undefined
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Unread count retrieved successfully.',
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:notificationId/read
   *
   * Mark a single notification as read.
   */
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { notificationId } = req.params;

      const notification = await notificationService.markAsRead(notificationId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Notification marked as read.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/read-all?workspaceId=
   *
   * Mark all notifications as read.
   */
  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.query;

      const count = await notificationService.markAllRead(
        req.user.id,
        workspaceId as string | undefined
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: `${count} notifications marked as read.`,
        data: { markedCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/preferences
   *
   * Get current user's notification preferences.
   */
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const prefs = await notificationService.getUserPreferences(req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Notification preferences retrieved successfully.',
        data: prefs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/preferences
   *
   * Update current user's notification preferences.
   * Body: { emailEnabled?, muteAll?, preferences?: { [type]: { inApp?, email? } } }
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { emailEnabled, muteAll, preferences } = req.body;

      const updatedPrefs = await notificationService.updatePreferences(req.user.id, {
        emailEnabled,
        muteAll,
        preferences,
      });

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Notification preferences updated successfully.',
        data: updatedPrefs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
