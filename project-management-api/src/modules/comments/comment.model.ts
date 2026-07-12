import { Schema, model, Document } from 'mongoose';

export interface IReaction {
  emoji: string;
  userId: Schema.Types.ObjectId;
  createdAt: Date;
}

export interface IComment extends Document {
  taskId: Schema.Types.ObjectId;
  projectId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId; // Author

  // Content
  content: any; // Tiptap JSON for rich text
  plainText: string; // Extracted plain text (for search)

  // Features
  mentions: Schema.Types.ObjectId[]; // User IDs mentioned in content
  isPinned: boolean;
  reactions: IReaction[];
  parentCommentId?: Schema.Types.ObjectId; // For threading

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Instance methods
  softDelete(): Promise<void>;
}

const commentSchema = new Schema<IComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    content: {
      type: Schema.Types.Mixed,
      required: [true, 'Comment content is required'],
    },
    plainText: {
      type: String,
      default: '',
      maxlength: [10000, 'Comment is too long'],
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isPinned: {
      type: Boolean,
      default: false,
    },
    reactions: [{
      emoji: {
        type: String,
        required: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
commentSchema.index({ taskId: 1, deletedAt: 1, isPinned: -1, createdAt: -1 });
commentSchema.index({ taskId: 1, parentCommentId: 1, createdAt: 1 });
commentSchema.index({ workspaceId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
commentSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
commentSchema.methods.softDelete = async function (): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

export const Comment = model<IComment>('Comment', commentSchema);
export default Comment;
