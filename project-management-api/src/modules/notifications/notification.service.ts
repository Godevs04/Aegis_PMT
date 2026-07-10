import NotificationRepository from './notification.repository';
import { INotification } from './notification.model';
import AppError from '../../shared/utils/appError';

export class NotificationService {
  private repository: NotificationRepository;

  constructor() {
    this.repository = new NotificationRepository();
  }

  /**
   * Fetch user notifications list
   */
  async getMyNotifications(userId: string): Promise<INotification[]> {
    return this.repository.findByUser(userId);
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(id: string, userId: string): Promise<INotification> {
    const notification = await this.repository.findById(id);
    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.recipientId.toString() !== userId) {
      throw new AppError('Access denied.', 403);
    }

    notification.isRead = true;
    return this.repository.save(notification);
  }

  /**
   * Mark all user notifications as read
   */
  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.repository.markAllAsRead(userId);
  }
}

export default NotificationService;
