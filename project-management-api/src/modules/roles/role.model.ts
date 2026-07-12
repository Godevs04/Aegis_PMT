import { Schema, model, Document } from 'mongoose';
import { Permission, ALL_PERMISSIONS } from '../../config/permissions';

export interface IRole extends Document {
  name: string;
  slug: string;
  description?: string;
  organizationId?: Schema.Types.ObjectId; // null for system-level roles
  isSystem: boolean; // true = cannot be modified or deleted
  permissions: Permission[];

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
  hasPermission(permission: Permission): boolean;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      maxlength: [80, 'Role name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9_]+$/,
        'Slug must contain only lowercase letters, numbers, and underscores',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: [String],
      validate: {
        validator: function (permissions: string[]) {
          return permissions.every((p) => ALL_PERMISSIONS.includes(p as Permission));
        },
        message: 'One or more permissions are invalid',
      },
      default: [],
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
// System roles have unique slugs globally; custom roles are unique per organization
roleSchema.index(
  { slug: 1, organizationId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
roleSchema.index({ organizationId: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
// Exclude soft-deleted records by default
roleSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
roleSchema.methods.softDelete = async function (userId: string): Promise<void> {
  if (this.isSystem) {
    throw new Error('System roles cannot be deleted');
  }
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

roleSchema.methods.hasPermission = function (permission: Permission): boolean {
  return this.permissions.includes(permission);
};

// ─── Pre-save Guard ──────────────────────────────────────────────────────────
roleSchema.pre<IRole>('save', function (next) {
  // Prevent modification of system role permissions after initial creation
  if (this.isSystem && !this.isNew && this.isModified('permissions')) {
    return next(new Error('System role permissions cannot be modified'));
  }
  next();
});

export const Role = model<IRole>('Role', roleSchema);
export default Role;
