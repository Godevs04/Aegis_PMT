import { Schema, model, Document } from 'mongoose';

export type AttachmentEntityType = 'Task' | 'Project' | 'Comment' | 'Organization' | 'Workspace';

export interface IAttachment extends Document {
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string; // Cloudinary secure URL
  publicId: string; // Cloudinary public ID (for deletion)
  thumbnailUrl?: string; // Generated for images
  uploadedBy: Schema.Types.ObjectId;
  entityType: AttachmentEntityType;
  entityId: Schema.Types.ObjectId;
  workspaceId: Schema.Types.ObjectId;
  organizationId?: Schema.Types.ObjectId;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Instance methods
  softDelete(): Promise<void>;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be greater than 0'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user ID is required'],
    },
    entityType: {
      type: String,
      enum: ['Task', 'Project', 'Comment', 'Organization', 'Workspace'],
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
attachmentSchema.index({ entityType: 1, entityId: 1, deletedAt: 1 });
attachmentSchema.index({ workspaceId: 1, createdAt: -1 });
attachmentSchema.index({ uploadedBy: 1, createdAt: -1 });
attachmentSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
attachmentSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
attachmentSchema.methods.softDelete = async function (): Promise<void> {
  this.deletedAt = new Date();
  await this.save();
};

export const Attachment = model<IAttachment>('Attachment', attachmentSchema);
export default Attachment;
