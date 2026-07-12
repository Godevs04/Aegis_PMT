import { Schema, model, Document } from 'mongoose';

export type MilestoneStatus = 'open' | 'in_progress' | 'completed' | 'overdue';

export interface IMilestone extends Document {
  name: string;
  description?: string;
  projectId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  status: MilestoneStatus;
  dueDate?: Date;
  completedAt?: Date;
  completionPercentage: number; // 0-100 (auto-calculated from tasks)

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    name: {
      type: String,
      required: [true, 'Milestone name is required'],
      trim: true,
      maxlength: [150, 'Milestone name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'overdue'],
      default: 'open',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
milestoneSchema.index({ projectId: 1, status: 1 });
milestoneSchema.index({ workspaceId: 1, dueDate: 1 });
milestoneSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
milestoneSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
milestoneSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Milestone = model<IMilestone>('Milestone', milestoneSchema);
export default Milestone;
