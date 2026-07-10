import { Schema, model, Document } from 'mongoose';

export interface IActivity extends Document {
  workspaceId: Schema.Types.ObjectId;
  projectId?: Schema.Types.ObjectId;
  taskId?: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId; // The actor performing the action
  action: string; // e.g. TASK_CREATED, TASK_STATUS_UPDATED, etc.
  details?: Record<string, any>; // Extra meta details (like title, status diff)
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor User ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action description name is required'],
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt for activities
  }
);

// Indexes
activitySchema.index({ workspaceId: 1, createdAt: -1 });
activitySchema.index({ taskId: 1 });

export const Activity = model<IActivity>('Activity', activitySchema);
export default Activity;
