import { Notification, INotification } from './notification.model';

export class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    return Notification.create(notificationData);
  }

  /**
   * Fetch unread and read notifications for user
   */
  async findByUser(recipientId: string, limit = 20): Promise<INotification[]> {
    return Notification.find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actorId', 'name email avatarUrl')
      .populate('workspaceId', 'name');
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<INotification | null> {
    return Notification.findById(id);
  }

  /**
   * Save notification document
   */
  async save(notification: INotification): Promise<INotification> {
    return notification.save();
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(recipientId: string): Promise<void> {
    await Notification.updateMany({ recipientId, isRead: false }, { isRead: true });
  }
}

export default NotificationRepository;
