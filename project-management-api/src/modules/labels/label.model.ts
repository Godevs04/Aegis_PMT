import { Schema, model, Document } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color: string; // Hex color
  workspaceId: Schema.Types.ObjectId;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const labelSchema = new Schema<ILabel>(
  {
    name: {
      type: String,
      required: [true, 'Label name is required'],
      trim: true,
      maxlength: [50, 'Label name cannot exceed 50 characters'],
    },
    color: {
      type: String,
      required: [true, 'Label color is required'],
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
labelSchema.index(
  { workspaceId: 1, name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
labelSchema.index({ workspaceId: 1 });
labelSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
labelSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
labelSchema.methods.softDelete = async function (_userId: string): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

export const Label = model<ILabel>('Label', labelSchema);
export default Label;
