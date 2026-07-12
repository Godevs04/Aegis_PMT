/**
 * Comprehensive Permission System for Aegis PMT
 *
 * Permissions follow the format: `resource:action`
 * They are grouped by domain and assigned to Roles via the Role model.
 */

// ─── Organization Permissions ────────────────────────────────────────────────
export const OrgPermissions = {
  READ: 'org:read',
  UPDATE: 'org:update',
  DELETE: 'org:delete',
  MANAGE_MEMBERS: 'org:manage_members',
  MANAGE_BILLING: 'org:manage_billing',
  MANAGE_SETTINGS: 'org:manage_settings',
  TRANSFER_OWNERSHIP: 'org:transfer_ownership',
} as const;

// ─── Workspace Permissions ───────────────────────────────────────────────────
export const WorkspacePermissions = {
  CREATE: 'workspace:create',
  READ: 'workspace:read',
  UPDATE: 'workspace:update',
  DELETE: 'workspace:delete',
  INVITE: 'workspace:invite',
  MANAGE_MEMBERS: 'workspace:manage_members',
  MANAGE_ROLES: 'workspace:manage_roles',
  MANAGE_SETTINGS: 'workspace:manage_settings',
  MANAGE_STATUSES: 'workspace:manage_statuses',
  MANAGE_LABELS: 'workspace:manage_labels',
} as const;

// ─── Project Permissions ─────────────────────────────────────────────────────
export const ProjectPermissions = {
  CREATE: 'project:create',
  READ: 'project:read',
  UPDATE: 'project:update',
  DELETE: 'project:delete',
  ARCHIVE: 'project:archive',
  MANAGE_MEMBERS: 'project:manage_members',
  MANAGE_SETTINGS: 'project:manage_settings',
} as const;

// ─── Task Permissions ────────────────────────────────────────────────────────
export const TaskPermissions = {
  CREATE: 'task:create',
  READ: 'task:read',
  UPDATE: 'task:update',
  DELETE: 'task:delete',
  ASSIGN: 'task:assign',
  MANAGE_STATUS: 'task:manage_status',
  MANAGE_TIME: 'task:manage_time',
  MANAGE_SUBTASKS: 'task:manage_subtasks',
  MANAGE_DEPENDENCIES: 'task:manage_dependencies',
  BULK_UPDATE: 'task:bulk_update',
} as const;

// ─── Sprint Permissions ──────────────────────────────────────────────────────
export const SprintPermissions = {
  CREATE: 'sprint:create',
  READ: 'sprint:read',
  UPDATE: 'sprint:update',
  DELETE: 'sprint:delete',
  MANAGE: 'sprint:manage', // Start, complete, modify scope
} as const;

// ─── Milestone Permissions ───────────────────────────────────────────────────
export const MilestonePermissions = {
  CREATE: 'milestone:create',
  READ: 'milestone:read',
  UPDATE: 'milestone:update',
  DELETE: 'milestone:delete',
} as const;

// ─── Team Permissions ────────────────────────────────────────────────────────
export const TeamPermissions = {
  CREATE: 'team:create',
  READ: 'team:read',
  UPDATE: 'team:update',
  DELETE: 'team:delete',
  MANAGE_MEMBERS: 'team:manage_members',
} as const;

// ─── Comment Permissions ─────────────────────────────────────────────────────
export const CommentPermissions = {
  CREATE: 'comment:create',
  READ: 'comment:read',
  UPDATE: 'comment:update',
  DELETE: 'comment:delete',
  PIN: 'comment:pin',
} as const;

// ─── Attachment Permissions ──────────────────────────────────────────────────
export const AttachmentPermissions = {
  UPLOAD: 'attachment:upload',
  READ: 'attachment:read',
  DELETE: 'attachment:delete',
} as const;

// ─── Admin Permissions ───────────────────────────────────────────────────────
export const AdminPermissions = {
  ACCESS: 'admin:access',
  MANAGE_USERS: 'admin:manage_users',
  MANAGE_ROLES: 'admin:manage_roles',
  VIEW_AUDIT: 'admin:view_audit',
  MANAGE_SYSTEM: 'admin:manage_system',
} as const;

// ─── All Permissions (flat array for validation) ─────────────────────────────
export const ALL_PERMISSIONS = [
  ...Object.values(OrgPermissions),
  ...Object.values(WorkspacePermissions),
  ...Object.values(ProjectPermissions),
  ...Object.values(TaskPermissions),
  ...Object.values(SprintPermissions),
  ...Object.values(MilestonePermissions),
  ...Object.values(TeamPermissions),
  ...Object.values(CommentPermissions),
  ...Object.values(AttachmentPermissions),
  ...Object.values(AdminPermissions),
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// ─── System Role Slugs ───────────────────────────────────────────────────────
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ORG_OWNER = 'org_owner',
  ORG_ADMIN = 'org_admin',
  WORKSPACE_ADMIN = 'workspace_admin',
  PROJECT_MANAGER = 'project_manager',
  TEAM_LEAD = 'team_lead',
  DEVELOPER = 'developer',
  QA = 'qa',
  VIEWER = 'viewer',
}

// ─── System Role Permission Mappings ─────────────────────────────────────────
export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.SUPER_ADMIN]: [...ALL_PERMISSIONS],

  [SystemRole.ORG_OWNER]: [
    // Organization — full control
    OrgPermissions.READ,
    OrgPermissions.UPDATE,
    OrgPermissions.DELETE,
    OrgPermissions.MANAGE_MEMBERS,
    OrgPermissions.MANAGE_BILLING,
    OrgPermissions.MANAGE_SETTINGS,
    OrgPermissions.TRANSFER_OWNERSHIP,
    // Workspace — full control
    WorkspacePermissions.CREATE,
    WorkspacePermissions.READ,
    WorkspacePermissions.UPDATE,
    WorkspacePermissions.DELETE,
    WorkspacePermissions.INVITE,
    WorkspacePermissions.MANAGE_MEMBERS,
    WorkspacePermissions.MANAGE_ROLES,
    WorkspacePermissions.MANAGE_SETTINGS,
    WorkspacePermissions.MANAGE_STATUSES,
    WorkspacePermissions.MANAGE_LABELS,
    // Project — full control
    ProjectPermissions.CREATE,
    ProjectPermissions.READ,
    ProjectPermissions.UPDATE,
    ProjectPermissions.DELETE,
    ProjectPermissions.ARCHIVE,
    ProjectPermissions.MANAGE_MEMBERS,
    ProjectPermissions.MANAGE_SETTINGS,
    // Task — full control
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.DELETE,
    TaskPermissions.ASSIGN,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_TIME,
    TaskPermissions.MANAGE_SUBTASKS,
    TaskPermissions.MANAGE_DEPENDENCIES,
    TaskPermissions.BULK_UPDATE,
    // Sprint — full control
    SprintPermissions.CREATE,
    SprintPermissions.READ,
    SprintPermissions.UPDATE,
    SprintPermissions.DELETE,
    SprintPermissions.MANAGE,
    // Milestone — full control
    MilestonePermissions.CREATE,
    MilestonePermissions.READ,
    MilestonePermissions.UPDATE,
    MilestonePermissions.DELETE,
    // Team — full control
    TeamPermissions.CREATE,
    TeamPermissions.READ,
    TeamPermissions.UPDATE,
    TeamPermissions.DELETE,
    TeamPermissions.MANAGE_MEMBERS,
    // Comment — full control
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    CommentPermissions.DELETE,
    CommentPermissions.PIN,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
    AttachmentPermissions.DELETE,
    // Admin (view audit only, not full system admin)
    AdminPermissions.VIEW_AUDIT,
  ],

  [SystemRole.ORG_ADMIN]: [
    OrgPermissions.READ,
    OrgPermissions.UPDATE,
    OrgPermissions.MANAGE_MEMBERS,
    OrgPermissions.MANAGE_SETTINGS,
    // Workspace
    WorkspacePermissions.CREATE,
    WorkspacePermissions.READ,
    WorkspacePermissions.UPDATE,
    WorkspacePermissions.INVITE,
    WorkspacePermissions.MANAGE_MEMBERS,
    WorkspacePermissions.MANAGE_ROLES,
    WorkspacePermissions.MANAGE_SETTINGS,
    WorkspacePermissions.MANAGE_STATUSES,
    WorkspacePermissions.MANAGE_LABELS,
    // Project
    ProjectPermissions.CREATE,
    ProjectPermissions.READ,
    ProjectPermissions.UPDATE,
    ProjectPermissions.DELETE,
    ProjectPermissions.ARCHIVE,
    ProjectPermissions.MANAGE_MEMBERS,
    ProjectPermissions.MANAGE_SETTINGS,
    // Task
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.DELETE,
    TaskPermissions.ASSIGN,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_TIME,
    TaskPermissions.MANAGE_SUBTASKS,
    TaskPermissions.MANAGE_DEPENDENCIES,
    TaskPermissions.BULK_UPDATE,
    // Sprint
    SprintPermissions.CREATE,
    SprintPermissions.READ,
    SprintPermissions.UPDATE,
    SprintPermissions.DELETE,
    SprintPermissions.MANAGE,
    // Milestone
    MilestonePermissions.CREATE,
    MilestonePermissions.READ,
    MilestonePermissions.UPDATE,
    MilestonePermissions.DELETE,
    // Team
    TeamPermissions.CREATE,
    TeamPermissions.READ,
    TeamPermissions.UPDATE,
    TeamPermissions.DELETE,
    TeamPermissions.MANAGE_MEMBERS,
    // Comment
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    CommentPermissions.DELETE,
    CommentPermissions.PIN,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
    AttachmentPermissions.DELETE,
    // Admin
    AdminPermissions.VIEW_AUDIT,
  ],

  [SystemRole.WORKSPACE_ADMIN]: [
    OrgPermissions.READ,
    // Workspace — manage (not delete)
    WorkspacePermissions.READ,
    WorkspacePermissions.UPDATE,
    WorkspacePermissions.INVITE,
    WorkspacePermissions.MANAGE_MEMBERS,
    WorkspacePermissions.MANAGE_ROLES,
    WorkspacePermissions.MANAGE_SETTINGS,
    WorkspacePermissions.MANAGE_STATUSES,
    WorkspacePermissions.MANAGE_LABELS,
    // Project — full
    ProjectPermissions.CREATE,
    ProjectPermissions.READ,
    ProjectPermissions.UPDATE,
    ProjectPermissions.DELETE,
    ProjectPermissions.ARCHIVE,
    ProjectPermissions.MANAGE_MEMBERS,
    ProjectPermissions.MANAGE_SETTINGS,
    // Task — full
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.DELETE,
    TaskPermissions.ASSIGN,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_TIME,
    TaskPermissions.MANAGE_SUBTASKS,
    TaskPermissions.MANAGE_DEPENDENCIES,
    TaskPermissions.BULK_UPDATE,
    // Sprint — full
    SprintPermissions.CREATE,
    SprintPermissions.READ,
    SprintPermissions.UPDATE,
    SprintPermissions.DELETE,
    SprintPermissions.MANAGE,
    // Milestone
    MilestonePermissions.CREATE,
    MilestonePermissions.READ,
    MilestonePermissions.UPDATE,
    MilestonePermissions.DELETE,
    // Team — full
    TeamPermissions.CREATE,
    TeamPermissions.READ,
    TeamPermissions.UPDATE,
    TeamPermissions.DELETE,
    TeamPermissions.MANAGE_MEMBERS,
    // Comment
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    CommentPermissions.DELETE,
    CommentPermissions.PIN,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
    AttachmentPermissions.DELETE,
  ],

  [SystemRole.PROJECT_MANAGER]: [
    OrgPermissions.READ,
    WorkspacePermissions.READ,
    // Project — manage (not delete workspace-level)
    ProjectPermissions.CREATE,
    ProjectPermissions.READ,
    ProjectPermissions.UPDATE,
    ProjectPermissions.ARCHIVE,
    ProjectPermissions.MANAGE_MEMBERS,
    ProjectPermissions.MANAGE_SETTINGS,
    // Task — full
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.DELETE,
    TaskPermissions.ASSIGN,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_TIME,
    TaskPermissions.MANAGE_SUBTASKS,
    TaskPermissions.MANAGE_DEPENDENCIES,
    TaskPermissions.BULK_UPDATE,
    // Sprint — full
    SprintPermissions.CREATE,
    SprintPermissions.READ,
    SprintPermissions.UPDATE,
    SprintPermissions.DELETE,
    SprintPermissions.MANAGE,
    // Milestone
    MilestonePermissions.CREATE,
    MilestonePermissions.READ,
    MilestonePermissions.UPDATE,
    MilestonePermissions.DELETE,
    // Team — read
    TeamPermissions.READ,
    TeamPermissions.MANAGE_MEMBERS,
    // Comment
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    CommentPermissions.DELETE,
    CommentPermissions.PIN,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
    AttachmentPermissions.DELETE,
  ],

  [SystemRole.TEAM_LEAD]: [
    OrgPermissions.READ,
    WorkspacePermissions.READ,
    // Project — read + limited update
    ProjectPermissions.READ,
    ProjectPermissions.UPDATE,
    // Task — create/update/assign (no delete)
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.ASSIGN,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_TIME,
    TaskPermissions.MANAGE_SUBTASKS,
    TaskPermissions.MANAGE_DEPENDENCIES,
    // Sprint — read + manage scope
    SprintPermissions.READ,
    SprintPermissions.UPDATE,
    SprintPermissions.MANAGE,
    // Milestone
    MilestonePermissions.READ,
    MilestonePermissions.UPDATE,
    // Team — manage members
    TeamPermissions.READ,
    TeamPermissions.UPDATE,
    TeamPermissions.MANAGE_MEMBERS,
    // Comment
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    CommentPermissions.DELETE,
    CommentPermissions.PIN,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
    AttachmentPermissions.DELETE,
  ],

  [SystemRole.DEVELOPER]: [
    OrgPermissions.READ,
    WorkspacePermissions.READ,
    // Project — read only
    ProjectPermissions.READ,
    // Task — create/update own, manage status & time
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_TIME,
    TaskPermissions.MANAGE_SUBTASKS,
    // Sprint — read
    SprintPermissions.READ,
    // Milestone — read
    MilestonePermissions.READ,
    // Team — read
    TeamPermissions.READ,
    // Comment
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
  ],

  [SystemRole.QA]: [
    OrgPermissions.READ,
    WorkspacePermissions.READ,
    // Project — read
    ProjectPermissions.READ,
    // Task — create (bugs), read, update status
    TaskPermissions.CREATE,
    TaskPermissions.READ,
    TaskPermissions.UPDATE,
    TaskPermissions.MANAGE_STATUS,
    TaskPermissions.MANAGE_SUBTASKS,
    // Sprint — read
    SprintPermissions.READ,
    // Milestone — read
    MilestonePermissions.READ,
    // Team — read
    TeamPermissions.READ,
    // Comment
    CommentPermissions.CREATE,
    CommentPermissions.READ,
    CommentPermissions.UPDATE,
    // Attachment
    AttachmentPermissions.UPLOAD,
    AttachmentPermissions.READ,
  ],

  [SystemRole.VIEWER]: [
    OrgPermissions.READ,
    WorkspacePermissions.READ,
    ProjectPermissions.READ,
    TaskPermissions.READ,
    SprintPermissions.READ,
    MilestonePermissions.READ,
    TeamPermissions.READ,
    CommentPermissions.READ,
    AttachmentPermissions.READ,
  ],
};

// ─── Human-readable Role Names ───────────────────────────────────────────────
export const SYSTEM_ROLE_NAMES: Record<SystemRole, string> = {
  [SystemRole.SUPER_ADMIN]: 'Super Admin',
  [SystemRole.ORG_OWNER]: 'Organization Owner',
  [SystemRole.ORG_ADMIN]: 'Organization Admin',
  [SystemRole.WORKSPACE_ADMIN]: 'Workspace Admin',
  [SystemRole.PROJECT_MANAGER]: 'Project Manager',
  [SystemRole.TEAM_LEAD]: 'Team Lead',
  [SystemRole.DEVELOPER]: 'Developer',
  [SystemRole.QA]: 'QA',
  [SystemRole.VIEWER]: 'Viewer',
};

// ─── Role Descriptions ───────────────────────────────────────────────────────
export const SYSTEM_ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  [SystemRole.SUPER_ADMIN]: 'Full system access. Can manage all organizations, users, and platform settings.',
  [SystemRole.ORG_OWNER]: 'Full control of the organization including billing, settings, and all workspaces.',
  [SystemRole.ORG_ADMIN]: 'Manage organization members, settings, and all workspace operations.',
  [SystemRole.WORKSPACE_ADMIN]: 'Full control of the workspace including members, projects, and settings.',
  [SystemRole.PROJECT_MANAGER]: 'Manage projects, tasks, sprints, and milestones. Can assign work and track progress.',
  [SystemRole.TEAM_LEAD]: 'Lead a team within projects. Can create and assign tasks, manage sprints.',
  [SystemRole.DEVELOPER]: 'Work on assigned tasks. Can create tasks, update status, and log time.',
  [SystemRole.QA]: 'Test and verify work. Can create bug reports, update task status, and comment.',
  [SystemRole.VIEWER]: 'Read-only access to projects, tasks, and team information.',
};
