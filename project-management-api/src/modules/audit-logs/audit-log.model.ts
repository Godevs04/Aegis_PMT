import { Schema, model, Document } from 'mongoose';

/**
 * Supported entity types for audit logging.
 */
export type AuditEntityType =
  | 'User'
  | 'Organization'
  | 'Workspace'
  | 'Project'
  | 'Task'
  | 'Sprint'
  | 'Milestone'
  | 'Team'
  | 'Comment'
  | 'Attachment'
  | 'Role'
  | 'WorkspaceMember'
  | 'ProjectMember'
  | 'OrganizationMember';

/**
 * Supported audit actions.
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'INVITE'
  | 'JOIN'
  | 'LEAVE'
  | 'ROLE_CHANGE'
  | 'STATUS_CHANGE'
  | 'TRANSFER';

export interface IAuditLog extends Document {
  organizationId?: Schema.Types.ObjectId;
  workspaceId?: Schema.Types.ObjectId;
  projectId?: Schema.Types.ObjectId;
  entityType: AuditEntityType;
  entityId: Schema.Types.ObjectId;
  action: AuditAction;
  performedBy: Schema.Types.ObjectId;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>; // Additional context (entity title, etc.)
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: [
        'User',
        'Organization',
        'Workspace',
        'Project',
        'Task',
        'Sprint',
        'Milestone',
        'Team',
        'Comment',
        'Attachment',
        'Role',
        'WorkspaceMember',
        'ProjectMember',
        'OrganizationMember',
      ],
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'ARCHIVE',
        'RESTORE',
        'ASSIGN',
        'UNASSIGN',
        'INVITE',
        'JOIN',
        'LEAVE',
        'ROLE_CHANGE',
        'STATUS_CHANGE',
        'TRANSFER',
      ],
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by user ID is required'],
    },
    previousValues: {
      type: Schema.Types.Mixed,
      default: null,
    },
    newValues: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No updatedAt — audit logs are immutable
    timestamps: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
auditLogSchema.index({ organizationId: 1, timestamp: -1 });
auditLogSchema.index({ workspaceId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// ─── Immutability Guard ──────────────────────────────────────────────────────
// Prevent updates to audit log documents
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});

auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});

auditLogSchema.pre('updateMany', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
