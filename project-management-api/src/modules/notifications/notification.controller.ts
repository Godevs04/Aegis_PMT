import { Request, Response, NextFunction } from 'express';
import NotificationService from './notification.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const notificationService = new NotificationService();

export class NotificationController {
  /**
   * Fetch User Alert Notifications
   */
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const notifications = await notificationService.getMyNotifications(user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Notifications retrieved successfully.',
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark Notification as Read
   */
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { notificationId } = req.params;
      const notification = await notificationService.markNotificationRead(notificationId, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Notification marked as read successfully.',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark All Notifications as Read
   */
  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      await notificationService.markAllNotificationsRead(user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'All notifications marked as read successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
