import { Schema, model, Document } from 'mongoose';
import { UserRole } from '../../config/roles';

export interface IWorkspaceMember {
  userId: Schema.Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

export interface IWorkspace extends Document {
  name: string;
  organizationId: Schema.Types.ObjectId;
  members: IWorkspaceMember[];
  
  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: Object.values(UserRole),
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
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
workspaceSchema.index({ organizationId: 1 });
workspaceSchema.index({ 'members.userId': 1 });
workspaceSchema.index({ deletedAt: 1 });

// Query middleware: Exclude soft deleted records
workspaceSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// Soft Delete Instance Method
workspaceSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
export default Workspace;
