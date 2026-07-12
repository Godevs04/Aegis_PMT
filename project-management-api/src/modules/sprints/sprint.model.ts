import { Schema, model, Document } from 'mongoose';

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface ISprint extends Document {
  name: string;
  goal?: string;
  projectId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  status: SprintStatus;
  startDate?: Date;
  endDate?: Date;
  completedAt?: Date;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const sprintSchema = new Schema<ISprint>(
  {
    name: {
      type: String,
      required: [true, 'Sprint name is required'],
      trim: true,
      maxlength: [100, 'Sprint name cannot exceed 100 characters'],
    },
    goal: {
      type: String,
      trim: true,
      maxlength: [500, 'Sprint goal cannot exceed 500 characters'],
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
      enum: ['planning', 'active', 'completed', 'cancelled'],
      default: 'planning',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
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
sprintSchema.index({ projectId: 1, status: 1 });
sprintSchema.index({ workspaceId: 1, status: 1, startDate: -1 });
sprintSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
sprintSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
sprintSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Sprint = model<ISprint>('Sprint', sprintSchema);
export default Sprint;
