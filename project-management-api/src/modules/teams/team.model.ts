import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  workspaceId: Schema.Types.ObjectId;
  leadId?: Schema.Types.ObjectId;
  members: Schema.Types.ObjectId[];
  color?: string; // Hex color for team badge
  avatar?: string;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  softDelete(userId: string): Promise<void>;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [80, 'Team name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    color: {
      type: String,
      trim: true,
      default: '#6366F1',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
    },
    avatar: {
      type: String,
      default: '',
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
teamSchema.index({ workspaceId: 1, deletedAt: 1 });
teamSchema.index(
  { workspaceId: 1, name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
teamSchema.index({ members: 1 });
teamSchema.index({ leadId: 1 });
teamSchema.index({ deletedAt: 1 });

// ─── Query Middleware ────────────────────────────────────────────────────────
teamSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
teamSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const Team = model<ITeam>('Team', teamSchema);
export default Team;
