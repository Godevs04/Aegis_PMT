import { Schema, model, Document } from 'mongoose';
import { UserRole } from '../../config/roles';

export interface IInvitation extends Document {
  email: string;
  workspaceId: Schema.Types.ObjectId;
  invitedBy: Schema.Types.ObjectId;
  role: UserRole;
  token: string;
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: Date;
  
  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: [true, 'Invitation email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviting User ID is required'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.DEVELOPER,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
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
invitationSchema.index({ token: 1 });
invitationSchema.index({ email: 1, workspaceId: 1 });
invitationSchema.index({ deletedAt: 1 });

// Query middleware: Exclude soft deleted records
invitationSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
export default Invitation;
