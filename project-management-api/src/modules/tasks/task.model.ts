import { Schema, model, Document } from 'mongoose';

export interface IChecklistItem {
  title: string;
  isCompleted: boolean;
}

export interface ITaskComment {
  userId: Schema.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface ITaskAttachment {
  name: string;
  url: string;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  projectId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  assigneeId?: Schema.Types.ObjectId;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  checklist: IChecklistItem[];
  comments: ITaskComment[];
  attachments: ITaskAttachment[];

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
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
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    checklist: [
      {
        title: {
          type: String,
          required: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    comments: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
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

// Indexes
taskSchema.index({ workspaceId: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ deletedAt: 1 });

// Query middleware: Exclude soft deleted records
taskSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// Soft Delete Instance Method
taskSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Task = model<ITask>('Task', taskSchema);
export default Task;
