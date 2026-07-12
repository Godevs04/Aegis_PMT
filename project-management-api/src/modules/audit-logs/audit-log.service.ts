import { AuditLog, IAuditLog, AuditEntityType, AuditAction } from './audit-log.model';

export interface AuditLogParams {
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  performedBy: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  performedBy?: string;
  action?: AuditAction;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedAuditLogs {
  data: IAuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * AuditLogService
 *
 * Provides methods to create and query immutable audit log records.
 * Designed as a lightweight singleton that can be called from any service layer.
 */
export class AuditLogService {
  /**
   * Create a new audit log entry.
   * This is fire-and-forget safe — failures are logged but don't throw.
   */
  async log(params: AuditLogParams): Promise<IAuditLog | null> {
    try {
      const entry = await AuditLog.create({
        organizationId: params.organizationId || null,
        workspaceId: params.workspaceId || null,
        projectId: params.projectId || null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedBy: params.performedBy,
        previousValues: params.previousValues || null,
        newValues: params.newValues || null,
        metadata: params.metadata || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        timestamp: new Date(),
      });
      return entry;
    } catch (error) {
      // Audit logging should never break business logic
      console.error('[AuditLog] Failed to create entry:', (error as Error).message);
      return null;
    }
  }

  /**
   * Query audit logs for a specific entity (e.g., full history of a task).
   */
  async getByEntity(
    entityType: AuditEntityType,
    entityId: string,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedAuditLogs> {
    return this.query({ entityType, entityId }, pagination);
  }

  /**
   * Query audit logs for a workspace.
   */
  async getByWorkspace(
    workspaceId: string,
    filters: Omit<AuditLogFilters, 'workspaceId'> = {},
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedAuditLogs> {
    return this.query({ ...filters, workspaceId }, pagination);
  }

  /**
   * Query audit logs performed by a specific user.
   */
  async getByUser(
    performedBy: string,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedAuditLogs> {
    return this.query({ performedBy }, pagination);
  }

  /**
   * Generic query with filters and pagination.
   */
  async query(
    filters: AuditLogFilters,
    pagination: PaginationOptions = { page: 1, limit: 50 }
  ): Promise<PaginatedAuditLogs> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build filter object
    const mongoFilter: Record<string, any> = {};

    if (filters.organizationId) mongoFilter.organizationId = filters.organizationId;
    if (filters.workspaceId) mongoFilter.workspaceId = filters.workspaceId;
    if (filters.projectId) mongoFilter.projectId = filters.projectId;
    if (filters.entityType) mongoFilter.entityType = filters.entityType;
    if (filters.entityId) mongoFilter.entityId = filters.entityId;
    if (filters.performedBy) mongoFilter.performedBy = filters.performedBy;
    if (filters.action) mongoFilter.action = filters.action;

    // Date range filter
    if (filters.fromDate || filters.toDate) {
      mongoFilter.timestamp = {};
      if (filters.fromDate) mongoFilter.timestamp.$gte = filters.fromDate;
      if (filters.toDate) mongoFilter.timestamp.$lte = filters.toDate;
    }

    const [data, total] = await Promise.all([
      AuditLog.find(mongoFilter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email avatarUrl')
        .lean(),
      AuditLog.countDocuments(mongoFilter),
    ]);

    return {
      data: data as unknown as IAuditLog[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// Export singleton
export const auditLogService = new AuditLogService();
export default AuditLogService;
