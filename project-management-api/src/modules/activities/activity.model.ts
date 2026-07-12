import { Schema, model, Document } from 'mongoose';

export interface IActivity extends Document {
  organizationId?: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  projectId?: Schema.Types.ObjectId;
  taskId?: Schema.Types.ObjectId;
  sprintId?: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId; // The actor performing the action
  action: string; // e.g. 'task.created', 'project.updated', etc.
  details?: Record<string, any>; // Structured context (title, old/new values)
  metadata?: Record<string, any>; // Additional rich context (user names, entity titles for display)
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
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
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    sprintId: {
      type: Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor User ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action name is required'],
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Workspace timeline (most common query)
activitySchema.index({ workspaceId: 1, createdAt: -1 });
// Project timeline
activitySchema.index({ projectId: 1, createdAt: -1 });
// Task history
activitySchema.index({ taskId: 1, createdAt: -1 });
// User activity feed
activitySchema.index({ userId: 1, createdAt: -1 });
// Action type filtering
activitySchema.index({ workspaceId: 1, action: 1, createdAt: -1 });
// Sprint activity
activitySchema.index({ sprintId: 1, createdAt: -1 });

export const Activity = model<IActivity>('Activity', activitySchema);
export default Activity;
