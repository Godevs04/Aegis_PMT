import Task from '../tasks/task.model';
import { Project } from '../projects/project.model';
import { Sprint } from '../sprints/sprint.model';
import { Milestone } from '../milestones/milestone.model';
import { Activity } from '../activities/activity.model';
import { WorkspaceMember } from '../members/workspace-member.model';
import AppError from '../../shared/utils/appError';

export class DashboardService {
  private async verifyMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) throw new AppError('Access denied.', 403);
  }

  /**
   * Personal dashboard — tasks assigned to the user, overdue, upcoming
   */
  async getPersonalDashboard(userId: string, workspaceId: string): Promise<any> {
    await this.verifyMembership(workspaceId, userId);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [assignedTasks, recentActivity] = await Promise.all([
      Task.find({ workspaceId, assignees: userId, deletedAt: null })
        .select('title taskNumber statusId priorityId dueDate completedAt projectId')
        .populate('statusId', 'name slug color category')
        .populate('priorityId', 'name slug color')
        .populate('projectId', 'name prefix')
        .sort({ dueDate: 1 })
        .limit(50),
      Activity.find({ workspaceId, userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('projectId', 'name')
        .populate('taskId', 'title taskNumber'),
    ]);

    let assignedCount = 0;
    let inProgressCount = 0;
    let completedTodayCount = 0;
    let overdueCount = 0;
    let dueTomorrowCount = 0;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    for (const task of assignedTasks) {
      assignedCount++;
      const status = task.statusId as any;
      const category = status?.category;

      if (category === 'active') inProgressCount++;
      if (task.completedAt && new Date(task.completedAt) >= todayStart && new Date(task.completedAt) < todayEnd) {
        completedTodayCount++;
      }
      if (task.dueDate && new Date(task.dueDate) < now && !task.completedAt && category !== 'done') {
        overdueCount++;
      }
      if (task.dueDate && new Date(task.dueDate) >= now && new Date(task.dueDate) < tomorrow && !task.completedAt) {
        dueTomorrowCount++;
      }
    }

    return {
      stats: {
        assignedCount,
        inProgressCount,
        completedTodayCount,
        overdueCount,
        dueTomorrowCount,
      },
      tasks: assignedTasks.slice(0, 20),
      recentActivity,
    };
  }

  /**
   * Workspace dashboard — project health overview, member workload, activity
   */
  async getWorkspaceDashboard(workspaceId: string, userId: string): Promise<any> {
    await this.verifyMembership(workspaceId, userId);

    const [projects, tasks, members, activeSprints, recentActivity] = await Promise.all([
      Project.find({ workspaceId, deletedAt: null }).select('name prefix status progress'),
      Task.find({ workspaceId, deletedAt: null }).select('statusId assignees completedAt dueDate'),
      WorkspaceMember.find({ workspaceId, status: 'active' })
        .populate('userId', 'name email avatarUrl'),
      Sprint.find({ workspaceId, status: 'active' }).select('name projectId'),
      Activity.find({ workspaceId })
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('userId', 'name avatarUrl')
        .populate('projectId', 'name'),
    ]);

    // Task stats
    const now = new Date();
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let inProgressTasks = 0;

    for (const task of tasks) {
      totalTasks++;
      if (task.completedAt) completedTasks++;
      else {
        const status = task.statusId as any;
        if (status?.category === 'active') inProgressTasks++;
        if (task.dueDate && new Date(task.dueDate) < now && !task.completedAt) overdueTasks++;
      }
    }

    // Workload per member (top 10)
    const workload: Record<string, number> = {};
    for (const task of tasks) {
      if (task.completedAt) continue;
      for (const assignee of task.assignees || []) {
        const id = assignee.toString();
        workload[id] = (workload[id] || 0) + 1;
      }
    }

    // Project health
    const projectHealth = projects.map((p) => ({
      id: p.id,
      name: p.name,
      prefix: p.prefix,
      status: p.status,
      progress: p.progress,
    }));

    return {
      stats: {
        totalProjects: projects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalMembers: members.length,
        activeSprints: activeSprints.length,
      },
      projectHealth,
      workload,
      recentActivity,
    };
  }

  /**
   * Project dashboard — task breakdown, sprint status, milestone progress
   */
  async getProjectDashboard(projectId: string, workspaceId: string, userId: string): Promise<any> {
    await this.verifyMembership(workspaceId, userId);

    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found.', 404);

    const [tasks, sprints, milestones, recentActivity] = await Promise.all([
      Task.find({ projectId, deletedAt: null })
        .select('statusId priorityId assignees completedAt dueDate estimatedHours')
        .populate('statusId', 'name slug color category'),
      Sprint.find({ projectId, deletedAt: null }).select('name status startDate endDate completedAt'),
      Milestone.find({ projectId, deletedAt: null }).select('name status dueDate completionPercentage'),
      Activity.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name avatarUrl'),
    ]);

    // Task stats by status category
    const now = new Date();
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let totalEstimated = 0;
    const byStatus: Record<string, number> = {};

    for (const task of tasks) {
      totalTasks++;
      const status = task.statusId as any;
      const statusName = status?.name || 'Unknown';
      byStatus[statusName] = (byStatus[statusName] || 0) + 1;

      if (task.completedAt || status?.category === 'done') completedTasks++;
      if (task.dueDate && new Date(task.dueDate) < now && !task.completedAt && status?.category !== 'done') {
        overdueTasks++;
      }
      if (task.estimatedHours) totalEstimated += task.estimatedHours;
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      project: { id: project.id, name: project.name, prefix: project.prefix, status: project.status },
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        totalEstimatedHours: totalEstimated,
      },
      byStatus,
      sprints: sprints.map((s) => ({ id: s.id, name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate })),
      milestones: milestones.map((m) => ({ id: m.id, name: m.name, status: m.status, dueDate: m.dueDate, progress: m.completionPercentage })),
      recentActivity,
    };
  }
}

export const dashboardService = new DashboardService();
export default DashboardService;
