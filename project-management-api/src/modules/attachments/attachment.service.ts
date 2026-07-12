import { Attachment, IAttachment, AttachmentEntityType } from './attachment.model';
import { uploadFileToCloudinary, deleteFromCloudinary } from '../../services/upload.service';
import AppError from '../../shared/utils/appError';
import { auditLogService } from '../audit-logs/audit-log.service';
import ActivityService from '../activities/activity.service';

const activityService = new ActivityService();

export interface UploadAttachmentParams {
  file: Express.Multer.File;
  entityType: AttachmentEntityType;
  entityId: string;
  workspaceId: string;
  organizationId?: string;
  uploadedBy: string;
}

export interface AttachmentPagination {
  page: number;
  limit: number;
}

export interface PaginatedAttachments {
  data: IAttachment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AttachmentService {
  /**
   * Upload a file and create an attachment record.
   */
  async upload(params: UploadAttachmentParams): Promise<IAttachment> {
    const { file, entityType, entityId, workspaceId, organizationId, uploadedBy } = params;

    // Upload to Cloudinary
    const folder = `aegis/${workspaceId}/attachments/${entityType.toLowerCase()}`;
    const { url, publicId, thumbnailUrl } = await uploadFileToCloudinary(
      file.buffer,
      folder,
      file.mimetype,
      file.originalname
    );

    // Create attachment record
    const attachment = await Attachment.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      publicId,
      thumbnailUrl,
      uploadedBy,
      entityType,
      entityId,
      workspaceId,
      organizationId: organizationId || null,
    });

    // Audit log
    auditLogService.log({
      workspaceId,
      entityType: 'Attachment',
      entityId: attachment.id,
      action: 'CREATE',
      performedBy: uploadedBy,
      newValues: { originalName: file.originalname, mimeType: file.mimetype, size: file.size, entityType, entityId },
      metadata: { originalName: file.originalname },
    });

    // Activity log (if attached to a task)
    if (entityType === 'Task') {
      activityService.logActivity({
        workspaceId: workspaceId as any,
        taskId: entityId as any,
        userId: uploadedBy as any,
        action: 'attachment.uploaded',
        details: { fileName: file.originalname, size: file.size },
      });
    }

    return attachment;
  }

  /**
   * Delete an attachment (soft delete + remove from Cloudinary).
   */
  async delete(attachmentId: string, userId: string): Promise<void> {
    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) {
      throw new AppError('Attachment not found.', 404);
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(attachment.publicId, attachment.mimeType);

    // Audit log before deletion
    auditLogService.log({
      workspaceId: attachment.workspaceId.toString(),
      entityType: 'Attachment',
      entityId: attachment.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { originalName: attachment.originalName, mimeType: attachment.mimeType, size: attachment.size },
      metadata: { originalName: attachment.originalName },
    });

    // Activity log (if attached to a task)
    if (attachment.entityType === 'Task') {
      activityService.logActivity({
        workspaceId: attachment.workspaceId.toString() as any,
        taskId: attachment.entityId as any,
        userId: userId as any,
        action: 'attachment.deleted',
        details: { fileName: attachment.originalName },
      });
    }

    // Soft delete
    await attachment.softDelete();
  }

  /**
   * List attachments for a specific entity (e.g., all files on a task).
   */
  async listByEntity(
    entityType: AttachmentEntityType,
    entityId: string,
    pagination: AttachmentPagination = { page: 1, limit: 20 }
  ): Promise<PaginatedAttachments> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const filter = { entityType, entityId };

    const [data, total] = await Promise.all([
      Attachment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email avatarUrl'),
      Attachment.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * List all attachments in a workspace.
   */
  async listByWorkspace(
    workspaceId: string,
    pagination: AttachmentPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedAttachments> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const filter = { workspaceId };

    const [data, total] = await Promise.all([
      Attachment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email avatarUrl'),
      Attachment.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get storage usage statistics for a workspace.
   */
  async getStorageUsage(workspaceId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  }> {
    const attachments = await Attachment.find({ workspaceId }).select('mimeType size');

    let totalSize = 0;
    const byType: Record<string, { count: number; size: number }> = {};

    for (const att of attachments) {
      totalSize += att.size;

      const category = this.getMimeCategory(att.mimeType);
      if (!byType[category]) {
        byType[category] = { count: 0, size: 0 };
      }
      byType[category].count++;
      byType[category].size += att.size;
    }

    return {
      totalFiles: attachments.length,
      totalSize,
      byType,
    };
  }

  /**
   * Get a single attachment by ID.
   */
  async getById(attachmentId: string): Promise<IAttachment> {
    const attachment = await Attachment.findById(attachmentId).populate('uploadedBy', 'name email avatarUrl');
    if (!attachment) {
      throw new AppError('Attachment not found.', 404);
    }
    return attachment;
  }

  /**
   * Categorize MIME type for storage stats.
   */
  private getMimeCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType === 'application/pdf') return 'pdfs';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'documents';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheets';
    if (mimeType.includes('zip')) return 'archives';
    return 'other';
  }
}

export const attachmentService = new AttachmentService();
export default AttachmentService;
