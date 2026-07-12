import { Schema, model, Document } from 'mongoose';

/**
 * Status categories determine how a status is treated in board views,
 * analytics, and workflow logic.
 */
export type StatusCategory = 'backlog' | 'unstarted' | 'active' | 'done' | 'cancelled';

export interface ITaskStatus extends Document {
  workspaceId: Schema.Types.ObjectId;
  name: string;
  slug: string;
  color: string; // Hex color (e.g., "#F59E0B")
  icon?: string; // Lucide icon name (e.g., "circle", "loader", "check-circle")
  order: number; // Display order (lower = first)
  category: StatusCategory;
  isDefault: boolean; // If true, new tasks get this status automatically

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const taskStatusSchema = new Schema<ITaskStatus>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Status name is required'],
      trim: true,
      maxlength: [50, 'Status name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Status slug is required'],
      trim: true,
      lowercase: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)'],
    },
    icon: {
      type: String,
      trim: true,
      default: 'circle',
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
      enum: ['backlog', 'unstarted', 'active', 'done', 'cancelled'],
      required: [true, 'Status category is required'],
    },
    isDefault: {
      type: Boolean,
      default: false,
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
taskStatusSchema.index({ workspaceId: 1, order: 1 });
taskStatusSchema.index(
  { workspaceId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
taskStatusSchema.index({ workspaceId: 1, isDefault: 1 });
taskStatusSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
taskStatusSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Pre-save: Generate slug from name ───────────────────────────────────────
taskStatusSchema.pre<ITaskStatus>('save', function (next) {
  if (this.isNew || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_')
      .trim();
  }
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
taskStatusSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const TaskStatus = model<ITaskStatus>('TaskStatus', taskStatusSchema);
export default TaskStatus;
