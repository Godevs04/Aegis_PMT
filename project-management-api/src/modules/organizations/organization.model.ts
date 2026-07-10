import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  ownerId: Schema.Types.ObjectId;
  
  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
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
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ deletedAt: 1 });

// Query middleware: Exclude soft deleted records
organizationSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// Soft Delete Instance Method
organizationSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Organization = model<IOrganization>('Organization', organizationSchema);
export default Organization;
