import { Permission } from '../../config/permissions';
import { Role, IRole } from './role.model';
import { OrganizationMember } from '../members/organization-member.model';
import { WorkspaceMember } from '../members/workspace-member.model';
import { ProjectMember } from '../members/project-member.model';

export interface PermissionContext {
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
}

export interface MembershipInfo {
  membership: any; // Populated document — roleId is resolved to IRole
  role: IRole;
}

/**
 * PermissionService
 *
 * Resolves effective permissions for a user based on their memberships.
 * Resolution priority: ProjectMember > WorkspaceMember > OrganizationMember
 *
 * If a user has a project-level role override, that takes precedence over
 * their workspace role for operations within that project.
 */
export class PermissionService {
  /**
   * Get user's organization membership with populated role
   */
  async getUserOrgMembership(
    userId: string,
    organizationId: string
  ): Promise<MembershipInfo | null> {
    const membership = await OrganizationMember.findOne({
      userId,
      organizationId,
      status: 'active',
    }).populate<{ roleId: IRole }>('roleId');

    if (!membership || !membership.roleId) return null;

    return {
      membership,
      role: membership.roleId as unknown as IRole,
    };
  }

  /**
   * Get user's workspace membership with populated role
   */
  async getUserWorkspaceMembership(
    userId: string,
    workspaceId: string
  ): Promise<MembershipInfo | null> {
    const membership = await WorkspaceMember.findOne({
      userId,
      workspaceId,
      status: 'active',
    }).populate<{ roleId: IRole }>('roleId');

    if (!membership || !membership.roleId) return null;

    return {
      membership,
      role: membership.roleId as unknown as IRole,
    };
  }

  /**
   * Get user's project membership with populated role (override)
   */
  async getUserProjectMembership(
    userId: string,
    projectId: string
  ): Promise<MembershipInfo | null> {
    const membership = await ProjectMember.findOne({
      userId,
      projectId,
      status: 'active',
    }).populate<{ roleId: IRole }>('roleId');

    if (!membership || !membership.roleId) return null;

    return {
      membership,
      role: membership.roleId as unknown as IRole,
    };
  }

  /**
   * Get effective permissions for a user in a given context.
   *
   * Resolution order:
   * 1. If projectId provided → check ProjectMember first (override)
   * 2. If no project override → fall back to WorkspaceMember
   * 3. If no workspace membership → check OrganizationMember (for org-level ops)
   *
   * Returns the permission array from the resolved role.
   */
  async getEffectivePermissions(
    userId: string,
    context: PermissionContext
  ): Promise<Permission[]> {
    // 1. Check project-level override first (highest priority)
    if (context.projectId) {
      const projectInfo = await this.getUserProjectMembership(userId, context.projectId);
      if (projectInfo) {
        return projectInfo.role.permissions as Permission[];
      }
    }

    // 2. Fall back to workspace-level role
    if (context.workspaceId) {
      const workspaceInfo = await this.getUserWorkspaceMembership(userId, context.workspaceId);
      if (workspaceInfo) {
        return workspaceInfo.role.permissions as Permission[];
      }
    }

    // 3. Fall back to organization-level role (for org-scoped operations)
    if (context.organizationId) {
      const orgInfo = await this.getUserOrgMembership(userId, context.organizationId);
      if (orgInfo) {
        return orgInfo.role.permissions as Permission[];
      }
    }

    // No membership found in any scope
    return [];
  }

  /**
   * Check if a user has a specific permission in the given context.
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    context: PermissionContext
  ): Promise<boolean> {
    // Super admin bypass: check if user holds super_admin role anywhere
    const superAdminRole = await Role.findOne({ slug: 'super_admin', isSystem: true });
    if (superAdminRole) {
      const isSuperAdmin = await OrganizationMember.findOne({
        userId,
        roleId: superAdminRole._id,
        status: 'active',
      });
      if (isSuperAdmin) return true;
    }

    const permissions = await this.getEffectivePermissions(userId, context);
    return permissions.includes(permission);
  }

  /**
   * Check if user has ANY of the specified permissions in context.
   */
  async hasAnyPermission(
    userId: string,
    permissions: Permission[],
    context: PermissionContext
  ): Promise<boolean> {
    const effectivePermissions = await this.getEffectivePermissions(userId, context);
    return permissions.some((p) => effectivePermissions.includes(p));
  }

  /**
   * Check if user has ALL of the specified permissions in context.
   */
  async hasAllPermissions(
    userId: string,
    permissions: Permission[],
    context: PermissionContext
  ): Promise<boolean> {
    const effectivePermissions = await this.getEffectivePermissions(userId, context);
    return permissions.every((p) => effectivePermissions.includes(p));
  }

  /**
   * Verify user is at least a member of the workspace (any role).
   * Throws nothing — returns boolean.
   */
  async isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
    const membership = await WorkspaceMember.findOne({
      userId,
      workspaceId,
      status: 'active',
    });
    return !!membership;
  }

  /**
   * Verify user is at least a member of the project (any role).
   * Falls back to workspace membership if no project-level record exists.
   */
  async isProjectMember(userId: string, projectId: string, workspaceId?: string): Promise<boolean> {
    // Direct project membership
    const projectMembership = await ProjectMember.findOne({
      userId,
      projectId,
      status: 'active',
    });
    if (projectMembership) return true;

    // Fall back: workspace member can access all projects in that workspace
    if (workspaceId) {
      return this.isWorkspaceMember(userId, workspaceId);
    }

    return false;
  }
}

// Export singleton instance for convenience
export const permissionService = new PermissionService();
export default PermissionService;
