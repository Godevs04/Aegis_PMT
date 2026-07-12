import { Team, ITeam } from './team.model';
import Task from '../tasks/task.model';
import AppError from '../../shared/utils/appError';
import { WorkspaceMember } from '../members/workspace-member.model';
import ActivityService from '../activities/activity.service';
import { auditLogService } from '../audit-logs/audit-log.service';

const activityService = new ActivityService();

export class TeamService {
  /**
   * Create a new team.
   */
  async create(
    data: { name: string; description?: string; workspaceId: string; color?: string; memberIds?: string[] },
    userId: string
  ): Promise<ITeam> {
    await this.verifyMembership(data.workspaceId, userId);

    // Include creator in members
    const members = new Set(data.memberIds || []);
    members.add(userId);

    const team = await Team.create({
      name: data.name,
      description: data.description || '',
      workspaceId: data.workspaceId,
      leadId: userId,
      members: Array.from(members),
      color: data.color || '#6366F1',
      createdBy: userId,
    });

    auditLogService.log({
      workspaceId: data.workspaceId,
      entityType: 'Team',
      entityId: team.id,
      action: 'CREATE',
      performedBy: userId,
      newValues: { name: team.name, memberCount: team.members.length },
      metadata: { name: team.name },
    });

    await activityService.logActivity({
      workspaceId: data.workspaceId as any,
      userId: userId as any,
      action: 'team.created',
      details: { name: team.name },
    });

    return team;
  }

  /**
   * Get all teams in a workspace.
   */
  async getByWorkspace(workspaceId: string, userId: string): Promise<ITeam[]> {
    await this.verifyMembership(workspaceId, userId);

    return Team.find({ workspaceId })
      .sort({ name: 1 })
      .populate('leadId', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl');
  }

  /**
   * Get a single team by ID.
   */
  async getById(teamId: string, userId: string): Promise<ITeam> {
    const team = await Team.findById(teamId)
      .populate('leadId', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl');

    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);
    return team;
  }

  /**
   * Update team details.
   */
  async update(
    teamId: string,
    data: { name?: string; description?: string; color?: string },
    userId: string
  ): Promise<ITeam> {
    const team = await Team.findById(teamId);
    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);

    if (data.name !== undefined) team.name = data.name;
    if (data.description !== undefined) team.description = data.description;
    if (data.color !== undefined) team.color = data.color;
    team.updatedBy = userId as any;

    await team.save();

    return Team.findById(team.id)
      .populate('leadId', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl') as unknown as ITeam;
  }

  /**
   * Delete a team (soft delete).
   */
  async delete(teamId: string, userId: string): Promise<void> {
    const team = await Team.findById(teamId);
    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);

    auditLogService.log({
      workspaceId: team.workspaceId.toString(),
      entityType: 'Team',
      entityId: team.id,
      action: 'DELETE',
      performedBy: userId,
      previousValues: { name: team.name },
      metadata: { name: team.name },
    });

    await team.softDelete(userId);
  }

  /**
   * Add a member to a team.
   */
  async addMember(teamId: string, targetUserId: string, userId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);
    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);

    // Verify target is a workspace member
    const targetMember = await WorkspaceMember.findOne({
      userId: targetUserId,
      workspaceId: team.workspaceId,
      status: 'active',
    });
    if (!targetMember) {
      throw new AppError('User must be a workspace member to join a team.', 400);
    }

    // Check if already a member
    if (team.members.some((m: any) => m.toString() === targetUserId)) {
      throw new AppError('User is already a member of this team.', 400);
    }

    team.members.push(targetUserId as any);
    team.updatedBy = userId as any;
    await team.save();

    await activityService.logActivity({
      workspaceId: team.workspaceId.toString() as any,
      userId: userId as any,
      action: 'team.member_added',
      details: { teamName: team.name, targetUserId },
    });

    return Team.findById(team.id)
      .populate('leadId', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl') as unknown as ITeam;
  }

  /**
   * Remove a member from a team.
   */
  async removeMember(teamId: string, targetUserId: string, userId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);
    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);

    const memberIndex = team.members.findIndex((m: any) => m.toString() === targetUserId);
    if (memberIndex === -1) {
      throw new AppError('User is not a member of this team.', 404);
    }

    team.members.splice(memberIndex, 1);

    // If removing the lead, unset leadId
    if (team.leadId && team.leadId.toString() === targetUserId) {
      team.leadId = undefined;
    }

    team.updatedBy = userId as any;
    await team.save();

    await activityService.logActivity({
      workspaceId: team.workspaceId.toString() as any,
      userId: userId as any,
      action: 'team.member_removed',
      details: { teamName: team.name, targetUserId },
    });

    return Team.findById(team.id)
      .populate('leadId', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl') as unknown as ITeam;
  }

  /**
   * Change team lead.
   */
  async changeLead(teamId: string, newLeadId: string, userId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);
    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);

    // New lead must be a team member
    if (!team.members.some((m: any) => m.toString() === newLeadId)) {
      throw new AppError('New lead must be a member of the team.', 400);
    }

    team.leadId = newLeadId as any;
    team.updatedBy = userId as any;
    await team.save();

    await activityService.logActivity({
      workspaceId: team.workspaceId.toString() as any,
      userId: userId as any,
      action: 'team.lead_changed',
      details: { teamName: team.name, newLeadId },
    });

    return Team.findById(team.id)
      .populate('leadId', 'name email avatarUrl')
      .populate('members', 'name email avatarUrl') as unknown as ITeam;
  }

  /**
   * Get team statistics (tasks per member, completion rates).
   */
  async getStats(teamId: string, userId: string): Promise<any> {
    const team = await Team.findById(teamId);
    if (!team) throw new AppError('Team not found.', 404);

    await this.verifyMembership(team.workspaceId.toString(), userId);

    const memberIds = team.members.map((m: any) => m.toString());

    // Get all tasks assigned to team members in this workspace
    const tasks = await Task.find({
      workspaceId: team.workspaceId,
      assignees: { $in: memberIds },
      deletedAt: null,
    }).select('assignees status completedAt');

    let totalTasks = 0;
    let completedTasks = 0;
    const perMember: Record<string, { total: number; completed: number }> = {};

    // Initialize per-member stats
    for (const memberId of memberIds) {
      perMember[memberId] = { total: 0, completed: 0 };
    }

    for (const task of tasks) {
      totalTasks++;
      const isDone = task.status === 'done' || task.completedAt;
      if (isDone) completedTasks++;

      for (const assignee of task.assignees) {
        const assigneeId = assignee.toString();
        if (perMember[assigneeId]) {
          perMember[assigneeId].total++;
          if (isDone) perMember[assigneeId].completed++;
        }
      }
    }

    return {
      teamId: team.id,
      teamName: team.name,
      memberCount: memberIds.length,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      perMember,
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async verifyMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
    if (!member) {
      throw new AppError('Access denied. You are not a member of this workspace.', 403);
    }
  }
}

export const teamService = new TeamService();
export default TeamService;
