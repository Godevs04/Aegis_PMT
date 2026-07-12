import Task from '../tasks/task.model';
import { Project } from '../projects/project.model';
import { Comment } from '../comments/comment.model';
import { Label } from '../labels/label.model';
import { WorkspaceMember } from '../members/workspace-member.model';
import AppError from '../../shared/utils/appError';

export interface SearchResult {
  type: 'task' | 'project' | 'member' | 'comment' | 'label';
  id: string;
  title: string;
  subtitle?: string;
  meta?: Record<string, any>;
}

export interface SearchResults {
  query: string;
  total: number;
  results: SearchResult[];
}

export class SearchService {
  /**
   * Global search across multiple entity types within a workspace.
   */
  async search(
    query: string,
    workspaceId: string,
    userId: string,
    options: { limit?: number; types?: string[] } = {}
  ): Promise<SearchResults> {
    // Verify membership
    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) throw new AppError('Access denied. You are not a member of this workspace.', 403);

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters.', 400);
    }

    const limit = options.limit || 20;
    const types = options.types || ['task', 'project', 'member', 'comment', 'label'];
    const regex = new RegExp(query, 'i');
    const results: SearchResult[] = [];

    // Run searches in parallel
    const searches: Promise<void>[] = [];

    // Tasks
    if (types.includes('task')) {
      searches.push(
        Task.find({ workspaceId, title: regex, deletedAt: null })
          .select('title taskNumber projectId statusId')
          .populate('projectId', 'name prefix')
          .limit(limit)
          .then((tasks) => {
            for (const task of tasks) {
              const proj = task.projectId as any;
              results.push({
                type: 'task',
                id: task.id,
                title: task.title,
                subtitle: proj?.prefix ? `${proj.prefix}-${task.taskNumber}` : `#${task.taskNumber}`,
                meta: { projectId: proj?._id, projectName: proj?.name, taskNumber: task.taskNumber },
              });
            }
          })
      );
    }

    // Projects
    if (types.includes('project')) {
      searches.push(
        Project.find({
          workspaceId,
          $or: [{ name: regex }, { prefix: regex }, { description: regex }],
          deletedAt: null,
        })
          .select('name prefix description status')
          .limit(limit)
          .then((projects) => {
            for (const project of projects) {
              results.push({
                type: 'project',
                id: project.id,
                title: project.name,
                subtitle: project.prefix,
                meta: { status: project.status },
              });
            }
          })
      );
    }

    // Members (users in the workspace)
    if (types.includes('member')) {
      searches.push(
        (async () => {
          const memberships = await WorkspaceMember.find({ workspaceId, status: 'active' })
            .select('userId')
            .populate('userId', 'name email avatarUrl');

          for (const m of memberships) {
            const user = m.userId as any;
            if (!user) continue;
            if (regex.test(user.name) || regex.test(user.email)) {
              results.push({
                type: 'member',
                id: user._id?.toString() || m.id,
                title: user.name,
                subtitle: user.email,
                meta: { avatarUrl: user.avatarUrl },
              });
            }
          }
        })()
      );
    }

    // Comments
    if (types.includes('comment')) {
      searches.push(
        Comment.find({ workspaceId, plainText: regex, deletedAt: null })
          .select('plainText taskId userId')
          .populate('userId', 'name')
          .populate('taskId', 'title taskNumber')
          .limit(limit)
          .then((comments) => {
            for (const comment of comments) {
              const task = comment.taskId as any;
              const user = comment.userId as any;
              results.push({
                type: 'comment',
                id: comment.id,
                title: (comment.plainText || '').slice(0, 100),
                subtitle: task?.title ? `On: ${task.title}` : undefined,
                meta: { taskId: task?._id, authorName: user?.name },
              });
            }
          })
      );
    }

    // Labels
    if (types.includes('label')) {
      searches.push(
        Label.find({ workspaceId, name: regex, deletedAt: null })
          .select('name color')
          .limit(limit)
          .then((labels) => {
            for (const label of labels) {
              results.push({
                type: 'label',
                id: label.id,
                title: label.name,
                meta: { color: label.color },
              });
            }
          })
      );
    }

    await Promise.all(searches);

    // Sort: prioritize tasks and projects over other types
    const typeOrder: Record<string, number> = { task: 0, project: 1, member: 2, comment: 3, label: 4 };
    results.sort((a, b) => (typeOrder[a.type] || 9) - (typeOrder[b.type] || 9));

    // Cap total results
    const capped = results.slice(0, limit);

    return {
      query,
      total: capped.length,
      results: capped,
    };
  }
}

export const searchService = new SearchService();
export default SearchService;
