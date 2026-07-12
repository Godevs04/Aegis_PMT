import { Schema, model, Document } from 'mongoose';
import { NotificationType } from './notification.model';

export interface INotificationChannel {
  inApp: boolean;
  email: boolean;
}

export interface INotificationPreference extends Document {
  userId: Schema.Types.ObjectId;
  preferences: Map<string, INotificationChannel>;
  // Global toggles
  emailEnabled: boolean;
  muteAll: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default preferences — all enabled by default.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Record<NotificationType, INotificationChannel> = {
  'task.assigned': { inApp: true, email: true },
  'task.completed': { inApp: true, email: false },
  'task.due_tomorrow': { inApp: true, email: true },
  'task.overdue': { inApp: true, email: true },
  'task.status_changed': { inApp: true, email: false },
  'comment.added': { inApp: true, email: false },
  'comment.mentioned': { inApp: true, email: true },
  'member.invited': { inApp: true, email: true },
  'member.joined': { inApp: true, email: false },
  'project.updated': { inApp: true, email: false },
  'sprint.started': { inApp: true, email: false },
  'sprint.completed': { inApp: true, email: false },
  'milestone.completed': { inApp: true, email: true },
};

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    preferences: {
      type: Map,
      of: new Schema(
        {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => new Map(Object.entries(DEFAULT_NOTIFICATION_PREFERENCES)),
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    muteAll: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
notificationPreferenceSchema.index({ userId: 1 }, { unique: true });

export const NotificationPreference = model<INotificationPreference>(
  'NotificationPreference',
  notificationPreferenceSchema
);
export default NotificationPreference;
