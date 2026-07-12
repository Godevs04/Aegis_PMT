import { Schema, model, Document } from 'mongoose';

export interface IProjectMember extends Document {
  userId: Schema.Types.ObjectId;
  projectId: Schema.Types.ObjectId;
  roleId: Schema.Types.ObjectId;
  status: 'active' | 'suspended';
  joinedAt: Date;
  addedBy?: Schema.Types.ObjectId;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
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
// A user can only be a member of a project once
projectMemberSchema.index(
  { userId: 1, projectId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
projectMemberSchema.index({ projectId: 1, status: 1 });
projectMemberSchema.index({ userId: 1 });
projectMemberSchema.index({ roleId: 1 });
projectMemberSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
projectMemberSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
projectMemberSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const ProjectMember = model<IProjectMember>(
  'ProjectMember',
  projectMemberSchema
);
export default ProjectMember;
