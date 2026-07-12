import { Schema, model, Document } from 'mongoose';

export interface IOrganizationSettings {
  defaultWorkspaceId?: Schema.Types.ObjectId;
  allowPublicJoin: boolean;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  ownerId: Schema.Types.ObjectId;
  settings: IOrganizationSettings;

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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9-]+$/,
        'Slug must contain only lowercase letters, numbers, and hyphens',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    settings: {
      defaultWorkspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        default: null,
      },
      allowPublicJoin: {
        type: Boolean,
        default: false,
      },
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
organizationSchema.index({ ownerId: 1 });
organizationSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
organizationSchema.index({ deletedAt: 1 });

// ─── Pre-save: Auto-generate slug from name ──────────────────────────────────
organizationSchema.pre<IOrganization>('save', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// ─── Query Middleware: Exclude soft-deleted records ───────────────────────────
organizationSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
organizationSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Organization = model<IOrganization>('Organization', organizationSchema);
export default Organization;
