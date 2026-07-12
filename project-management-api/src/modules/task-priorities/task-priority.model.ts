import { Schema, model, Document } from 'mongoose';

export interface ITaskPriority extends Document {
  workspaceId: Schema.Types.ObjectId;
  name: string;
  slug: string;
  color: string; // Hex color (e.g., "#EF4444")
  icon: string; // Lucide icon name (e.g., "alert-triangle", "arrow-up")
  order: number; // Display order (lower = higher priority)
  isDefault: boolean; // If true, new tasks get this priority automatically

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const taskPrioritySchema = new Schema<ITaskPriority>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Priority name is required'],
      trim: true,
      maxlength: [50, 'Priority name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Priority slug is required'],
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
      required: [true, 'Icon is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
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
taskPrioritySchema.index({ workspaceId: 1, order: 1 });
taskPrioritySchema.index(
  { workspaceId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
taskPrioritySchema.index({ workspaceId: 1, isDefault: 1 });
taskPrioritySchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
taskPrioritySchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Pre-save: Generate slug from name ───────────────────────────────────────
taskPrioritySchema.pre<ITaskPriority>('save', function (next) {
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
taskPrioritySchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const TaskPriority = model<ITaskPriority>('TaskPriority', taskPrioritySchema);
export default TaskPriority;
