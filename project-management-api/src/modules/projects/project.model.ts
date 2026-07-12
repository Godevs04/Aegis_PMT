import { Schema, model, Document } from 'mongoose';

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';

export interface IProjectSettings {
  defaultStatusId?: Schema.Types.ObjectId;
  defaultPriorityId?: Schema.Types.ObjectId;
  enableSprints: boolean;
  enableMilestones: boolean;
}

export interface IProject extends Document {
  name: string;
  prefix: string; // e.g., "ENG" — used for task IDs like ENG-123
  description?: string;
  coverImage?: string;
  workspaceId: Schema.Types.ObjectId;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  progress: number; // 0-100 percentage (auto-calculated from tasks)
  tags: string[];
  settings: IProjectSettings;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    prefix: {
      type: String,
      required: [true, 'Project prefix is required'],
      trim: true,
      uppercase: true,
      maxlength: [6, 'Prefix cannot exceed 6 characters'],
      match: [/^[A-Z0-9]+$/, 'Prefix must contain only uppercase letters and numbers'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'paused', 'completed', 'archived'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: {
      type: [String],
      default: [],
    },
    settings: {
      defaultStatusId: {
        type: Schema.Types.ObjectId,
        ref: 'TaskStatus',
        default: null,
      },
      defaultPriorityId: {
        type: Schema.Types.ObjectId,
        ref: 'TaskPriority',
        default: null,
      },
      enableSprints: {
        type: Boolean,
        default: true,
      },
      enableMilestones: {
        type: Boolean,
        default: true,
      },
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
projectSchema.index({ workspaceId: 1, status: 1 });
projectSchema.index(
  { workspaceId: 1, prefix: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
projectSchema.index({ deletedAt: 1 });
projectSchema.index({ tags: 1 });

// ─── Query Middleware: Exclude soft-deleted records ───────────────────────────
projectSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
projectSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Project = model<IProject>('Project', projectSchema);
export default Project;
