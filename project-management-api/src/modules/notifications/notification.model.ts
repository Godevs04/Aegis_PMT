import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: Schema.Types.ObjectId;
  actorId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  type: string; // e.g. TASK_ASSIGNED, COMMENT_ADDED, INVITATION_RECEIVED
  entityId: Schema.Types.ObjectId; // The ID of task, project, etc.
  entityType: 'Task' | 'Project' | 'Workspace' | 'Invitation';
  isRead: boolean;
  createdAt: Date;
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
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity Reference ID is required'],
    },
    entityType: {
      type: String,
      enum: ['Task', 'Project', 'Workspace', 'Invitation'],
      required: [true, 'Entity Reference Type is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
export default Notification;
