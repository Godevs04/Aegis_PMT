import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  workspaceId: Schema.Types.ObjectId;
  status: 'active' | 'archived';
  
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
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
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

// Indexes
projectSchema.index({ workspaceId: 1 });
projectSchema.index({ deletedAt: 1 });

// Query middleware: Exclude soft deleted records
projectSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// Soft Delete Instance Method
projectSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Project = model<IProject>('Project', projectSchema);
export default Project;
