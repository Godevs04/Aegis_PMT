import { Notification, INotification, NotificationType } from './notification.model';
import {
  NotificationPreference,
  INotificationPreference,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notification-preference.model';
import AppError from '../../shared/utils/appError';
import { sendEmail } from '../../emails/mail.service';
import User from '../users/user.model';
import socketService from '../../services/socket.service';

export interface NotifyParams {
  recipientIds: string[];
  actorId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityId: string;
  entityType: 'Task' | 'Project' | 'Workspace' | 'Invitation' | 'Comment' | 'Sprint' | 'Milestone';
  workspaceId: string;
  organizationId?: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
}

export interface PaginatedNotifications {
  data: INotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * NotificationService
 *
 * Handles creating in-app notifications, respecting user preferences,
 * and dispatching email notifications asynchronously.
 */
export class NotificationService {
  /**
   * Send notification to one or more recipients.
   * Respects user preferences and deduplicates (actor won't notify themselves).
   */
  async notify(params: NotifyParams): Promise<void> {
    const { recipientIds, actorId, type, title, body, entityId, entityType, workspaceId, organizationId } = params;

    // Filter out the actor (don't notify yourself)
    const recipients = recipientIds.filter((id) => id !== actorId);
    if (recipients.length === 0) return;

    for (const recipientId of recipients) {
      try {
        // Check user preferences
        const prefs = await this.getUserPreferences(recipientId);

        // Check if globally muted
        if (prefs.muteAll) continue;

        const channelPrefs = prefs.preferences.get(type);
        const defaults = DEFAULT_NOTIFICATION_PREFERENCES[type];
        const inAppEnabled = channelPrefs?.inApp ?? defaults?.inApp ?? true;
        const emailEnabled = channelPrefs?.email ?? defaults?.email ?? false;

        // Create in-app notification if enabled
        if (inAppEnabled) {
          await Notification.create({
            recipientId,
            actorId,
            type,
            title,
            body: body || '',
            entityId,
            entityType,
            workspaceId,
            organizationId: organizationId || null,
            isRead: false,
            emailSent: false,
          });

          // Emit real-time notification via Socket.IO
          socketService.emitNotification(recipientId, {
            type,
            title,
            body: body || '',
            entityId,
            entityType,
            workspaceId,
            actorId,
            createdAt: new Date().toISOString(),
          });
        }

        // Queue email notification if enabled
        if (emailEnabled && prefs.emailEnabled) {
          this.sendEmailNotification(recipientId, title, body || '', type);
        }
      } catch (err) {
        // Don't let one recipient failure block others
        console.error(`[NotificationService] Failed to notify ${recipientId}:`, (err as Error).message);
      }
    }
  }

  /**
   * Get user's notifications (paginated).
   */
  async getUserNotifications(
    userId: string,
    pagination: NotificationPagination = { page: 1, limit: 20 },
    workspaceId?: string
  ): Promise<PaginatedNotifications> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { recipientId: userId };
    if (workspaceId) filter.workspaceId = workspaceId;

    const [data, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email avatarUrl')
        .populate('workspaceId', 'name'),
      Notification.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string, workspaceId?: string): Promise<number> {
    const filter: Record<string, any> = { recipientId: userId, isRead: false };
    if (workspaceId) filter.workspaceId = workspaceId;
    return Notification.countDocuments(filter);
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found.', 404);
    }

    if (notification.recipientId.toString() !== userId) {
      throw new AppError('Access denied.', 403);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllRead(userId: string, workspaceId?: string): Promise<number> {
    const filter: Record<string, any> = { recipientId: userId, isRead: false };
    if (workspaceId) filter.workspaceId = workspaceId;

    const result = await Notification.updateMany(filter, {
      isRead: true,
      readAt: new Date(),
    });

    return result.modifiedCount;
  }

  /**
   * Get or create user notification preferences.
   */
  async getUserPreferences(userId: string): Promise<INotificationPreference> {
    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId });
    }
    return prefs;
  }

  /**
   * Update user notification preferences.
   */
  async updatePreferences(
    userId: string,
    updates: {
      emailEnabled?: boolean;
      muteAll?: boolean;
      preferences?: Record<string, { inApp?: boolean; email?: boolean }>;
    }
  ): Promise<INotificationPreference> {
    let prefs = await this.getUserPreferences(userId);

    if (updates.emailEnabled !== undefined) {
      prefs.emailEnabled = updates.emailEnabled;
    }
    if (updates.muteAll !== undefined) {
      prefs.muteAll = updates.muteAll;
    }
    if (updates.preferences) {
      for (const [type, channels] of Object.entries(updates.preferences)) {
        const existing = prefs.preferences.get(type) || { inApp: true, email: false };
        prefs.preferences.set(type, {
          inApp: channels.inApp ?? existing.inApp,
          email: channels.email ?? existing.email,
        });
      }
    }

    await prefs.save();
    return prefs;
  }

  /**
   * Send email notification asynchronously (fire-and-forget).
   */
  private sendEmailNotification(
    recipientId: string,
    title: string,
    body: string,
    type: NotificationType
  ): void {
    // Non-blocking email dispatch
    setImmediate(async () => {
      try {
        const user = await User.findById(recipientId);
        if (!user || !user.email) return;

        await sendEmail({
          to: user.email,
          subject: `Aegis — ${title}`,
          text: body || title,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3 style="color: #0f172a; margin-bottom: 8px;">${title}</h3>
              ${body ? `<p style="color: #475569; font-size: 14px; line-height: 22px;">${body}</p>` : ''}
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
              <p style="color: #94a3b8; font-size: 12px;">You received this because of your notification settings for "${type}" events.</p>
            </div>
          `,
        });

        // Mark as email sent
        await Notification.updateOne(
          { recipientId, type, isRead: false },
          { emailSent: true, emailSentAt: new Date() }
        );
      } catch (err) {
        console.error(`[NotificationService] Email dispatch failed:`, (err as Error).message);
      }
    });
  }
}

// Export singleton
export const notificationService = new NotificationService();
export default NotificationService;
