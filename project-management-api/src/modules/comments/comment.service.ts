import { Comment, IComment } from './comment.model';
import Task from '../tasks/task.model';
import AppError from '../../shared/utils/appError';
import ActivityService from '../activities/activity.service';
import { WorkspaceMember } from '../members/workspace-member.model';
import { notificationService } from '../notifications/notification.service';

const activityService = new ActivityService();

export interface CreateCommentData {
  taskId: string;
  content: any; // Tiptap JSON
  plainText: string;
  mentions?: string[];
  parentCommentId?: string;
}

export interface CommentPagination {
  page: number;
  limit: number;
}

export interface PaginatedComments {
  data: IComment[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Extracts plain text from Tiptap JSON content (recursive).
 */
function extractPlainText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text || '';
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join('');
  }
  return '';
}

export class CommentService {
  /**
   * Create a comment on a task.
   */
  async create(data: CreateCommentData, userId: string): Promise<IComment> {
    const task = await Task.findById(data.taskId);
    if (!task) throw new AppError('Task not found.', 404);

    // Verify workspace membership
    await this.verifyMembership(task.workspaceId.toString(), userId);

    // Extract plain text from Tiptap JSON if not provided
    const plainText = data.plainText || extractPlainText(data.content);

    const comment = await Comment.create({
      taskId: data.taskId,
      projectId: task.projectId,
      workspaceId: task.workspaceId,
      userId,
      content: data.content,
      plainText,
      mentions: data.mentions || [],
      parentCommentId: data.parentCommentId || null,
    });

    // Activity log
    activityService.logActivity({
      workspaceId: task.workspaceId.toString() as any,
      projectId: task.projectId?.toString() as any,
      taskId: task.id,
      userId: userId as any,
      action: 'comment.added',
      details: { title: task.title, taskNumber: task.taskNumber, snippet: plainText.slice(0, 80) },
    });

    // Notify mentioned users
    if (data.mentions && data.mentions.length > 0) {
      notificationService.notify({
        recipientIds: data.mentions,
        actorId: userId,
        type: 'comment.mentioned',
        title: `You were mentioned in a comment on "${task.title}"`,
        body: plainText.slice(0, 200),
        entityId: comment.id,
        entityType: 'Comment',
        workspaceId: task.workspaceId.toString(),
      });
    }

    // Notify task watchers (excluding author and mentioned users)
    const watcherIds = (task.watchers || [])
      .map((w: any) => w.toString())
      .filter((id: string) => id !== userId && !(data.mentions || []).includes(id));

    if (watcherIds.length > 0) {
      notificationService.notify({
        recipientIds: watcherIds,
        actorId: userId,
        type: 'comment.added',
        title: `New comment on "${task.title}"`,
        body: plainText.slice(0, 200),
        entityId: task.id,
        entityType: 'Task',
        workspaceId: task.workspaceId.toString(),
      });
    }

    // Populate and return
    return Comment.findById(comment.id)
      .populate('userId', 'name email avatarUrl')
      .populate('mentions', 'name email avatarUrl') as unknown as IComment;
  }

  /**
   * Get comments for a task (paginated, pinned first).
   */
  async getByTask(
    taskId: string,
    userId: string,
    pagination: CommentPagination = { page: 1, limit: 30 }
  ): Promise<PaginatedComments> {
    const task = await Task.findById(taskId);
    if (!task) throw new AppError('Task not found.', 404);

    await this.verifyMembership(task.workspaceId.toString(), userId);

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get top-level comments only (not thread replies)
    const filter = { taskId, parentCommentId: null };

    const [data, total] = await Promise.all([
      Comment.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email avatarUrl')
        .populate('mentions', 'name email avatarUrl'),
      Comment.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get replies to a comment (thread).
   */
  async getReplies(parentCommentId: string, userId: string): Promise<IComment[]> {
    const parent = await Comment.findById(parentCommentId);
    if (!parent) throw new AppError('Comment not found.', 404);

    await this.verifyMembership(parent.workspaceId.toString(), userId);

    return Comment.find({ parentCommentId })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email avatarUrl')
      .populate('mentions', 'name email avatarUrl');
  }

  /**
   * Update a comment (only author can edit).
   */
  async update(
    commentId: string,
    data: { content: any; plainText?: string; mentions?: string[] },
    userId: string
  ): Promise<IComment> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found.', 404);

    if (comment.userId.toString() !== userId) {
      throw new AppError('Only the author can edit this comment.', 403);
    }

    comment.content = data.content;
    comment.plainText = data.plainText || extractPlainText(data.content);
    if (data.mentions) comment.mentions = data.mentions as any;

    await comment.save();

    return Comment.findById(comment.id)
      .populate('userId', 'name email avatarUrl')
      .populate('mentions', 'name email avatarUrl') as unknown as IComment;
  }

  /**
   * Soft delete a comment.
   */
  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found.', 404);

    // Author or workspace admin can delete
    if (comment.userId.toString() !== userId) {
      await this.verifyMembership(comment.workspaceId.toString(), userId);
    }

    await comment.softDelete();
  }

  /**
   * Pin or unpin a comment.
   */
  async togglePin(commentId: string, userId: string): Promise<IComment> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found.', 404);

    await this.verifyMembership(comment.workspaceId.toString(), userId);

    comment.isPinned = !comment.isPinned;
    await comment.save();

    return comment;
  }

  /**
   * Add a reaction to a comment (toggle: add if not present, remove if exists).
   */
  async toggleReaction(commentId: string, emoji: string, userId: string): Promise<IComment> {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError('Comment not found.', 404);

    await this.verifyMembership(comment.workspaceId.toString(), userId);

    const existingIndex = comment.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId.toString() === userId
    );

    if (existingIndex >= 0) {
      // Remove reaction
      comment.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      comment.reactions.push({
        emoji,
        userId: userId as any,
        createdAt: new Date(),
      });
    }

    await comment.save();
    return comment;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async verifyMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) {
      throw new AppError('Access denied. You are not a member of this workspace.', 403);
    }
  }
}

export const commentService = new CommentService();
export default CommentService;
