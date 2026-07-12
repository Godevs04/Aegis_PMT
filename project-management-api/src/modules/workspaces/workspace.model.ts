import { Schema, model, Document } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  organizationId: Schema.Types.ObjectId;

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
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
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
workspaceSchema.index({ organizationId: 1 });
workspaceSchema.index(
  { slug: 1, organizationId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
workspaceSchema.index({ deletedAt: 1 });

// ─── Pre-save: Auto-generate slug from name ──────────────────────────────────
workspaceSchema.pre<IWorkspace>('save', function (next) {
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
workspaceSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
workspaceSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
export default Workspace;
