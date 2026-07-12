import { Schema, model, Document } from 'mongoose';

export interface ITaskDependency {
  taskId: Schema.Types.ObjectId;
  type: 'blocks' | 'blocked_by' | 'relates_to';
}

export interface ITimeLog {
  userId: Schema.Types.ObjectId;
  hours: number;
  description?: string;
  loggedAt: Date;
}

export interface ITask extends Document {
  // Identity
  taskNumber: number; // Auto-increment per project (displayed as PREFIX-123)
  title: string;
  description?: any; // Tiptap JSON for rich text (stored as Mixed)

  // Relationships
  projectId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  parentTaskId?: Schema.Types.ObjectId; // For subtasks
  sprintId?: Schema.Types.ObjectId;
  milestoneId?: Schema.Types.ObjectId;

  // People
  assignees: Schema.Types.ObjectId[]; // Multiple assignees
  reporter?: Schema.Types.ObjectId;
  watchers: Schema.Types.ObjectId[];

  // Classification
  statusId?: Schema.Types.ObjectId; // Ref to TaskStatus
  priorityId?: Schema.Types.ObjectId; // Ref to TaskPriority
  labels: Schema.Types.ObjectId[]; // Ref to Label
  tags: string[]; // Freeform tags

  // Dates
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  // Time tracking
  estimatedHours?: number;
  timeLogs: ITimeLog[];

  // Dependencies
  dependencies: ITaskDependency[];

  // Ordering (for Kanban and list views)
  order: number;

  // Legacy fields (kept for backward compat during migration)
  status?: string;
  priority?: string;
  assigneeId?: Schema.Types.ObjectId;
  checklist?: { title: string; isCompleted: boolean }[];
  comments?: { userId: Schema.Types.ObjectId; content: string; createdAt: Date }[];
  attachments?: { name: string; url: string }[];

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;

  // Virtuals
  spentHours?: number;
}

const taskSchema = new Schema<ITask>(
  {
    taskNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: Schema.Types.Mixed, // Tiptap JSON
      default: null,
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
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    sprintId: {
      type: Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    milestoneId: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    assignees: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    watchers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    statusId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskStatus',
      default: null,
    },
    priorityId: {
      type: Schema.Types.ObjectId,
      ref: 'TaskPriority',
      default: null,
    },
    labels: [{
      type: Schema.Types.ObjectId,
      ref: 'Label',
    }],
    tags: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: null,
      min: 0,
    },
    timeLogs: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      hours: {
        type: Number,
        required: true,
        min: 0.01,
      },
      description: {
        type: String,
        trim: true,
        default: '',
      },
      loggedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    dependencies: [{
      taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
      },
      type: {
        type: String,
        enum: ['blocks', 'blocked_by', 'relates_to'],
        required: true,
      },
    }],
    order: {
      type: Number,
      default: 0,
    },
    // Legacy fields
    status: {
      type: String,
      default: null,
    },
    priority: {
      type: String,
      default: null,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    checklist: [{
      title: { type: String, required: true },
      isCompleted: { type: Boolean, default: false },
    }],
    comments: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    attachments: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
    }],
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ────────────────────────────────────────────────────────────────
taskSchema.virtual('spentHours').get(function (this: ITask) {
  if (!this.timeLogs || this.timeLogs.length === 0) return 0;
  return this.timeLogs.reduce((sum, log) => sum + log.hours, 0);
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
taskSchema.index({ workspaceId: 1, deletedAt: 1 });
taskSchema.index({ projectId: 1, statusId: 1, order: 1 });
taskSchema.index({ projectId: 1, taskNumber: 1 });
taskSchema.index(
  { projectId: 1, taskNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
taskSchema.index({ assignees: 1 });
taskSchema.index({ parentTaskId: 1 });
taskSchema.index({ sprintId: 1 });
taskSchema.index({ milestoneId: 1 });
taskSchema.index({ labels: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ deletedAt: 1 });

// ─── Query Middleware: Exclude soft-deleted ───────────────────────────────────
taskSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
taskSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Task = model<ITask>('Task', taskSchema);
export default Task;
