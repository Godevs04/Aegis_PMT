export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ORG_OWNER = 'Organization Owner',
  ADMIN = 'Admin',
  PROJECT_MANAGER = 'Project Manager',
  TEAM_LEAD = 'Team Lead',
  DEVELOPER = 'Developer',
  QA = 'QA',
  CLIENT = 'Client',
  VIEWER = 'Viewer',
}

export type Permission =
  | 'org:read'
  | 'org:update'
  | 'org:delete'
  | 'workspace:create'
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'workspace:invite'
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'comment:create'
  | 'comment:delete'
  | 'settings:read'
  | 'settings:update'
  | 'users:manage';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'org:read', 'org:update', 'org:delete',
    'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete', 'workspace:invite',
    'project:create', 'project:read', 'project:update', 'project:delete',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'comment:create', 'comment:delete',
    'settings:read', 'settings:update',
    'users:manage',
  ],
  [UserRole.ORG_OWNER]: [
    'org:read', 'org:update', 'org:delete',
    'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete', 'workspace:invite',
    'project:create', 'project:read', 'project:update', 'project:delete',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'comment:create', 'comment:delete',
    'settings:read', 'settings:update',
  ],
  [UserRole.ADMIN]: [
    'org:read',
    'workspace:read', 'workspace:update', 'workspace:invite',
    'project:create', 'project:read', 'project:update', 'project:delete',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'comment:create', 'comment:delete',
    'settings:read', 'settings:update',
  ],
  [UserRole.PROJECT_MANAGER]: [
    'workspace:read',
    'project:create', 'project:read', 'project:update',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'comment:create', 'comment:delete',
  ],
  [UserRole.TEAM_LEAD]: [
    'workspace:read',
    'project:read',
    'task:create', 'task:read', 'task:update',
    'comment:create', 'comment:delete',
  ],
  [UserRole.DEVELOPER]: [
    'workspace:read',
    'project:read',
    'task:read', 'task:update',
    'comment:create',
  ],
  [UserRole.QA]: [
    'workspace:read',
    'project:read',
    'task:create', 'task:read', 'task:update',
    'comment:create',
  ],
  [UserRole.CLIENT]: [
    'workspace:read',
    'project:read',
    'task:read',
    'comment:create',
  ],
  [UserRole.VIEWER]: [
    'workspace:read',
    'project:read',
    'task:read',
  ],
};
