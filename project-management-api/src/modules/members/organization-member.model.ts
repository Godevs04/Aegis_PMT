import { Schema, model, Document } from 'mongoose';

export interface IOrganizationMember extends Document {
  userId: Schema.Types.ObjectId;
  organizationId: Schema.Types.ObjectId;
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

const organizationMemberSchema = new Schema<IOrganizationMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
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
// A user can only be a member of an organization once
organizationMemberSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
organizationMemberSchema.index({ organizationId: 1, status: 1 });
organizationMemberSchema.index({ userId: 1 });
organizationMemberSchema.index({ roleId: 1 });
organizationMemberSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
organizationMemberSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
organizationMemberSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const OrganizationMember = model<IOrganizationMember>(
  'OrganizationMember',
  organizationMemberSchema
);
export default OrganizationMember;
