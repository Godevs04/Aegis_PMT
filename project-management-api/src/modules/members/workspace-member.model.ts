import { Schema, model, Document } from 'mongoose';

export interface IWorkspaceMember extends Document {
  userId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  roleId: Schema.Types.ObjectId;
  status: 'active' | 'suspended' | 'invited';
  joinedAt: Date;
  invitedBy?: Schema.Types.ObjectId;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
// A user can only be a member of a workspace once
workspaceMemberSchema.index(
  { userId: 1, workspaceId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
workspaceMemberSchema.index({ workspaceId: 1, status: 1 });
workspaceMemberSchema.index({ userId: 1 });
workspaceMemberSchema.index({ roleId: 1 });
workspaceMemberSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
workspaceMemberSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
workspaceMemberSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const WorkspaceMember = model<IWorkspaceMember>(
  'WorkspaceMember',
  workspaceMemberSchema
);
export default WorkspaceMember;
