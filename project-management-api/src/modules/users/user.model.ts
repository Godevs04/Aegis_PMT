import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../config/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  theme?: 'dark' | 'light' | 'system';

  // Authentication
  isVerified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  tokenVersion: number;

  // Onboarding
  isOnboardingComplete: boolean;
  onboardingStep?: number;

  /**
   * @deprecated Use membership collections (OrganizationMember, WorkspaceMember, ProjectMember) instead.
   * Kept temporarily for backward compatibility during migration.
   */
  role?: UserRole;

  // Auditor fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  softDelete(userId: string): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Prevents password from leaking by default
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    timezone: {
      type: String,
      trim: true,
      default: 'UTC',
    },
    language: {
      type: String,
      trim: true,
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
    // Deprecated: kept for backward compatibility during migration
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.DEVELOPER,
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
userSchema.index({ email: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ deletedAt: 1 });

// ─── Document Middleware: Password Hashing ───────────────────────────────────
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ─── Query Middleware: Exclude soft-deleted records ───────────────────────────
userSchema.pre(/^find/, function (this: any, next) {
  this.where({ deletedAt: null });
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.softDelete = async function (userId: string): Promise<void> {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  await this.save();
};

export const User = model<IUser>('User', userSchema);
export default User;
