/**
 * Activity Action Constants
 *
 * Every significant user action in the system generates an activity record.
 * Actions follow the format: `entity.verb` (lowercase, dot-separated).
 *
 * These are used by the ActivityService and displayed in activity feeds.
 */

// ─── Task Actions ────────────────────────────────────────────────────────────
export const TASK_ACTIONS = {
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  DELETED: 'task.deleted',
  ARCHIVED: 'task.archived',
  RESTORED: 'task.restored',
  ASSIGNED: 'task.assigned',
  UNASSIGNED: 'task.unassigned',
  STATUS_CHANGED: 'task.status_changed',
  PRIORITY_CHANGED: 'task.priority_changed',
  MOVED: 'task.moved',
  DUPLICATED: 'task.duplicated',
  TIME_LOGGED: 'task.time_logged',
  DUE_DATE_CHANGED: 'task.due_date_changed',
  LABEL_ADDED: 'task.label_added',
  LABEL_REMOVED: 'task.label_removed',
  DEPENDENCY_ADDED: 'task.dependency_added',
  DEPENDENCY_REMOVED: 'task.dependency_removed',
} as const;

// ─── Comment Actions ─────────────────────────────────────────────────────────
export const COMMENT_ACTIONS = {
  ADDED: 'comment.added',
  UPDATED: 'comment.updated',
  DELETED: 'comment.deleted',
  PINNED: 'comment.pinned',
  UNPINNED: 'comment.unpinned',
  REACTION_ADDED: 'comment.reaction_added',
  REACTION_REMOVED: 'comment.reaction_removed',
} as const;

// ─── Project Actions ─────────────────────────────────────────────────────────
export const PROJECT_ACTIONS = {
  CREATED: 'project.created',
  UPDATED: 'project.updated',
  DELETED: 'project.deleted',
  ARCHIVED: 'project.archived',
  RESTORED: 'project.restored',
  MEMBER_ADDED: 'project.member_added',
  MEMBER_REMOVED: 'project.member_removed',
  MEMBER_ROLE_CHANGED: 'project.member_role_changed',
  SETTINGS_UPDATED: 'project.settings_updated',
} as const;

// ─── Sprint Actions ──────────────────────────────────────────────────────────
export const SPRINT_ACTIONS = {
  CREATED: 'sprint.created',
  UPDATED: 'sprint.updated',
  DELETED: 'sprint.deleted',
  STARTED: 'sprint.started',
  COMPLETED: 'sprint.completed',
  TASK_ADDED: 'sprint.task_added',
  TASK_REMOVED: 'sprint.task_removed',
} as const;

// ─── Milestone Actions ───────────────────────────────────────────────────────
export const MILESTONE_ACTIONS = {
  CREATED: 'milestone.created',
  UPDATED: 'milestone.updated',
  DELETED: 'milestone.deleted',
  COMPLETED: 'milestone.completed',
  REOPENED: 'milestone.reopened',
} as const;

// ─── Workspace Actions ───────────────────────────────────────────────────────
export const WORKSPACE_ACTIONS = {
  CREATED: 'workspace.created',
  UPDATED: 'workspace.updated',
  DELETED: 'workspace.deleted',
  SETTINGS_UPDATED: 'workspace.settings_updated',
} as const;

// ─── Member Actions ──────────────────────────────────────────────────────────
export const MEMBER_ACTIONS = {
  INVITED: 'member.invited',
  JOINED: 'member.joined',
  REMOVED: 'member.removed',
  LEFT: 'member.left',
  ROLE_CHANGED: 'member.role_changed',
  SUSPENDED: 'member.suspended',
  REACTIVATED: 'member.reactivated',
} as const;

// ─── Team Actions ────────────────────────────────────────────────────────────
export const TEAM_ACTIONS = {
  CREATED: 'team.created',
  UPDATED: 'team.updated',
  DELETED: 'team.deleted',
  MEMBER_ADDED: 'team.member_added',
  MEMBER_REMOVED: 'team.member_removed',
  LEAD_CHANGED: 'team.lead_changed',
} as const;

// ─── Attachment Actions ──────────────────────────────────────────────────────
export const ATTACHMENT_ACTIONS = {
  UPLOADED: 'attachment.uploaded',
  DELETED: 'attachment.deleted',
} as const;

// ─── Organization Actions ────────────────────────────────────────────────────
export const ORGANIZATION_ACTIONS = {
  CREATED: 'organization.created',
  UPDATED: 'organization.updated',
  DELETED: 'organization.deleted',
  MEMBER_INVITED: 'organization.member_invited',
  MEMBER_JOINED: 'organization.member_joined',
  MEMBER_REMOVED: 'organization.member_removed',
  OWNERSHIP_TRANSFERRED: 'organization.ownership_transferred',
} as const;

// ─── All Actions (flat) ──────────────────────────────────────────────────────
export const ALL_ACTIVITY_ACTIONS = {
  ...TASK_ACTIONS,
  ...COMMENT_ACTIONS,
  ...PROJECT_ACTIONS,
  ...SPRINT_ACTIONS,
  ...MILESTONE_ACTIONS,
  ...WORKSPACE_ACTIONS,
  ...MEMBER_ACTIONS,
  ...TEAM_ACTIONS,
  ...ATTACHMENT_ACTIONS,
  ...ORGANIZATION_ACTIONS,
} as const;

export type ActivityAction = (typeof ALL_ACTIVITY_ACTIONS)[keyof typeof ALL_ACTIVITY_ACTIONS];

// ─── Human-readable descriptions for display ─────────────────────────────────
export const ACTIVITY_DESCRIPTIONS: Record<string, string> = {
  // Task
  'task.created': 'created a task',
  'task.updated': 'updated a task',
  'task.deleted': 'deleted a task',
  'task.archived': 'archived a task',
  'task.restored': 'restored a task',
  'task.assigned': 'assigned a task',
  'task.unassigned': 'unassigned a task',
  'task.status_changed': 'changed task status',
  'task.priority_changed': 'changed task priority',
  'task.moved': 'moved a task',
  'task.duplicated': 'duplicated a task',
  'task.time_logged': 'logged time on a task',
  'task.due_date_changed': 'changed task due date',
  'task.label_added': 'added a label to a task',
  'task.label_removed': 'removed a label from a task',
  'task.dependency_added': 'added a task dependency',
  'task.dependency_removed': 'removed a task dependency',
  // Comment
  'comment.added': 'added a comment',
  'comment.updated': 'updated a comment',
  'comment.deleted': 'deleted a comment',
  'comment.pinned': 'pinned a comment',
  'comment.unpinned': 'unpinned a comment',
  'comment.reaction_added': 'reacted to a comment',
  'comment.reaction_removed': 'removed a reaction',
  // Project
  'project.created': 'created a project',
  'project.updated': 'updated a project',
  'project.deleted': 'deleted a project',
  'project.archived': 'archived a project',
  'project.restored': 'restored a project',
  'project.member_added': 'added a member to a project',
  'project.member_removed': 'removed a member from a project',
  'project.member_role_changed': 'changed a member role in a project',
  'project.settings_updated': 'updated project settings',
  // Sprint
  'sprint.created': 'created a sprint',
  'sprint.updated': 'updated a sprint',
  'sprint.deleted': 'deleted a sprint',
  'sprint.started': 'started a sprint',
  'sprint.completed': 'completed a sprint',
  'sprint.task_added': 'added a task to sprint',
  'sprint.task_removed': 'removed a task from sprint',
  // Milestone
  'milestone.created': 'created a milestone',
  'milestone.updated': 'updated a milestone',
  'milestone.deleted': 'deleted a milestone',
  'milestone.completed': 'completed a milestone',
  'milestone.reopened': 'reopened a milestone',
  // Workspace
  'workspace.created': 'created a workspace',
  'workspace.updated': 'updated a workspace',
  'workspace.deleted': 'deleted a workspace',
  'workspace.settings_updated': 'updated workspace settings',
  // Member
  'member.invited': 'invited a member',
  'member.joined': 'joined the workspace',
  'member.removed': 'removed a member',
  'member.left': 'left the workspace',
  'member.role_changed': 'changed a member role',
  'member.suspended': 'suspended a member',
  'member.reactivated': 'reactivated a member',
  // Team
  'team.created': 'created a team',
  'team.updated': 'updated a team',
  'team.deleted': 'deleted a team',
  'team.member_added': 'added a member to a team',
  'team.member_removed': 'removed a member from a team',
  'team.lead_changed': 'changed team lead',
  // Attachment
  'attachment.uploaded': 'uploaded an attachment',
  'attachment.deleted': 'deleted an attachment',
  // Organization
  'organization.created': 'created an organization',
  'organization.updated': 'updated an organization',
  'organization.deleted': 'deleted an organization',
  'organization.member_invited': 'invited a member to organization',
  'organization.member_joined': 'joined the organization',
  'organization.member_removed': 'removed a member from organization',
  'organization.ownership_transferred': 'transferred organization ownership',
};
