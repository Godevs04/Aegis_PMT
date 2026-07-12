import User from '../users/user.model';
import { Organization } from '../organizations/organization.model';
import { Workspace } from '../workspaces/workspace.model';
import { Project } from '../projects/project.model';
import Task from '../tasks/task.model';
import { Team } from '../teams/team.model';
import { Activity } from '../activities/activity.model';
import { AuditLog } from '../audit-logs/audit-log.model';
import AppError from '../../shared/utils/appError';

export class AdminService {
  /**
   * Get system health overview (counts, uptime)
   */
  async getSystemHealth(): Promise<any> {
    const [
      userCount,
      orgCount,
      workspaceCount,
      projectCount,
      taskCount,
      teamCount,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      Organization.countDocuments({ deletedAt: null }),
      Workspace.countDocuments({ deletedAt: null }),
      Project.countDocuments({ deletedAt: null }),
      Task.countDocuments({ deletedAt: null }),
      Team.countDocuments({ deletedAt: null }),
    ]);

    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        organizations: orgCount,
        workspaces: workspaceCount,
        projects: projectCount,
        tasks: taskCount,
        teams: teamCount,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  /**
   * Get platform analytics (growth, activity)
   */
  async getPlatformAnalytics(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast30d,
      newUsersLast7d,
      totalTasks,
      tasksCreatedLast7d,
      tasksCompletedLast7d,
      activitiesLast7d,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, deletedAt: null }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, deletedAt: null }),
      Task.countDocuments({ deletedAt: null }),
      Task.countDocuments({ createdAt: { $gte: sevenDaysAgo }, deletedAt: null }),
      Task.countDocuments({ completedAt: { $gte: sevenDaysAgo }, deletedAt: null }),
      Activity.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return {
      users: { total: totalUsers, newLast30d: newUsersLast30d, newLast7d: newUsersLast7d },
      tasks: { total: totalTasks, createdLast7d: tasksCreatedLast7d, completedLast7d: tasksCompletedLast7d },
      activityLast7d: activitiesLast7d,
    };
  }

  /**
   * List all users (paginated, with search)
   */
  async getUsers(
    page = 1,
    limit = 20,
    search?: string
  ): Promise<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const skip = (page - 1) * limit;
    const filter: any = { deletedAt: null };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [data, total] = await Promise.all([
      User.find(filter)
        .select('name email avatarUrl isVerified isOnboardingComplete createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Suspend a user (soft-delete)
   */
  async suspendUser(userId: string, performedBy: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);
    if (user.id === performedBy) throw new AppError('Cannot suspend yourself.', 400);

    await user.softDelete(performedBy);
  }

  /**
   * Get recent audit logs (platform-wide)
   */
  async getRecentAuditLogs(page = 1, limit = 50): Promise<any> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      AuditLog.find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email'),
      AuditLog.countDocuments({}),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const adminService = new AdminService();
export default AdminService;
