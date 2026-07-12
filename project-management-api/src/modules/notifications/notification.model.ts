import { Schema, model, Document } from 'mongoose';

/**
 * Notification types that map to user-facing events.
 */
export type NotificationType =
  | 'task.assigned'
  | 'task.completed'
  | 'task.due_tomorrow'
  | 'task.overdue'
  | 'task.status_changed'
  | 'comment.added'
  | 'comment.mentioned'
  | 'member.invited'
  | 'member.joined'
  | 'project.updated'
  | 'sprint.started'
  | 'sprint.completed'
  | 'milestone.completed';

export interface INotification extends Document {
  recipientId: Schema.Types.ObjectId;
  actorId: Schema.Types.ObjectId;
  organizationId?: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  entityId: Schema.Types.ObjectId;
  entityType: 'Task' | 'Project' | 'Workspace' | 'Invitation' | 'Comment' | 'Sprint' | 'Milestone';
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor User ID is required'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'task.assigned',
        'task.completed',
        'task.due_tomorrow',
        'task.overdue',
        'task.status_changed',
        'comment.added',
        'comment.mentioned',
        'member.invited',
        'member.joined',
        'project.updated',
        'sprint.started',
        'sprint.completed',
        'milestone.completed',
      ],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      trim: true,
      maxlength: [500, 'Body cannot exceed 500 characters'],
      default: '',
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity Reference ID is required'],
    },
    entityType: {
      type: String,
      enum: ['Task', 'Project', 'Workspace', 'Invitation', 'Comment', 'Sprint', 'Milestone'],
      required: [true, 'Entity Reference Type is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Primary query: user's unread notifications sorted by newest
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
// User's all notifications (paginated feed)
notificationSchema.index({ recipientId: 1, createdAt: -1 });
// Workspace-scoped notifications
notificationSchema.index({ recipientId: 1, workspaceId: 1, createdAt: -1 });
// For counting unread
notificationSchema.index({ recipientId: 1, isRead: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
export default Notification;
