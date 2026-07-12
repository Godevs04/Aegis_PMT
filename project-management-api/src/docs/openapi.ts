/**
 * OpenAPI 3.1 Specification for Aegis PMT API
 * Used by Scalar to generate interactive API documentation.
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Aegis PMT — Enterprise Project Management API',
    version: '1.0.0',
    description: `
# Aegis PMT API

Enterprise-grade SaaS Project Management Platform API.

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Tokens are obtained via \`POST /api/auth/login\` and refreshed via \`POST /api/auth/refresh\`.

## Standard Response Format
\`\`\`json
{
  "success": true,
  "message": "Description",
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
\`\`\`
    `.trim(),
    contact: { name: 'Aegis Engineering', email: 'engineering@aegis.dev' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'http://localhost:5002', description: 'Local Development' },
    { url: 'https://api.aegis.dev', description: 'Production' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Users', description: 'User profile & onboarding' },
    { name: 'Organizations', description: 'Organization CRUD & members' },
    { name: 'Workspaces', description: 'Workspace CRUD & invitations' },
    { name: 'Projects', description: 'Project management & analytics' },
    { name: 'Tasks', description: 'Task CRUD, bulk ops, time tracking' },
    { name: 'Comments', description: 'Task comments with reactions & threading' },
    { name: 'Teams', description: 'Team management & statistics' },
    { name: 'Sprints', description: 'Sprint lifecycle & backlog' },
    { name: 'Milestones', description: 'Milestone tracking & progress' },
    { name: 'Activities', description: 'Activity timelines & feeds' },
    { name: 'Notifications', description: 'Notification inbox & preferences' },
    { name: 'Attachments', description: 'File uploads & management' },
    { name: 'Task Statuses', description: 'Configurable workflow statuses' },
    { name: 'Task Priorities', description: 'Configurable priority levels' },
    { name: 'Labels', description: 'Workspace-scoped task labels' },
    { name: 'Roles', description: 'System roles & permissions' },
    { name: 'Search', description: 'Global cross-entity search' },
    { name: 'Dashboard', description: 'Analytics & dashboard widgets' },
    { name: 'Audit Logs', description: 'Immutable audit trail' },
    { name: 'Admin', description: 'Platform administration' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token obtained from POST /api/auth/login',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HTTP-only refresh token cookie',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' },
          meta: { type: 'object', properties: { page: { type: 'number' }, limit: { type: 'number' }, total: { type: 'number' }, totalPages: { type: 'number' } } },
          errors: { type: 'object', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' },
          avatarUrl: { type: 'string' }, bio: { type: 'string' }, timezone: { type: 'string' },
          isOnboardingComplete: { type: 'boolean' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string' }, taskNumber: { type: 'number' }, title: { type: 'string' },
          description: { type: 'object' }, projectId: { type: 'string' }, workspaceId: { type: 'string' },
          assignees: { type: 'array', items: { type: 'object' } }, statusId: { type: 'object' },
          priorityId: { type: 'object' }, labels: { type: 'array' }, dueDate: { type: 'string' },
          order: { type: 'number' }, createdAt: { type: 'string' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string' }, name: { type: 'string' }, prefix: { type: 'string' },
          description: { type: 'string' }, status: { type: 'string', enum: ['planning','active','paused','completed','archived'] },
          progress: { type: 'number' }, tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ─── Auth ──────────────────────────────────────────────────────────────
    '/api/auth/register': { post: { tags: ['Auth'], summary: 'Register new user', security: [], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','email','password'], properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { '201': { description: 'Registration successful' } } } },
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login with email & password', security: [], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string' }, password: { type: 'string' }, rememberMe: { type: 'boolean' } } } } } }, responses: { '200': { description: 'Login successful with accessToken' } } } },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout (clear cookies)', responses: { '200': { description: 'Logged out' } } } },
    '/api/auth/refresh': { post: { tags: ['Auth'], summary: 'Refresh access token', security: [{ CookieAuth: [] }], responses: { '200': { description: 'New accessToken' } } } },
    '/api/auth/verify-email': { post: { tags: ['Auth'], summary: 'Verify email address', security: [], parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Email verified' } } } },
    '/api/auth/forgot-password': { post: { tags: ['Auth'], summary: 'Request password reset email', security: [], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } } }, responses: { '200': { description: 'Reset email sent' } } } },
    '/api/auth/reset-password': { post: { tags: ['Auth'], summary: 'Reset password with token', security: [], parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string' } } } } } }, responses: { '200': { description: 'Password reset' } } } },
    // ─── Users ─────────────────────────────────────────────────────────────
    '/api/users/me': { get: { tags: ['Users'], summary: 'Get current user profile', responses: { '200': { description: 'User profile' } } }, delete: { tags: ['Users'], summary: 'Delete own account', responses: { '200': { description: 'Account deleted' } } } },
    '/api/users/profile': { patch: { tags: ['Users'], summary: 'Update profile (name, avatar)', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, avatar: { type: 'string', format: 'binary' } } } } } }, responses: { '200': { description: 'Profile updated' } } } },
    '/api/users/password': { patch: { tags: ['Users'], summary: 'Change password', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['currentPassword','newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } } } } } }, responses: { '200': { description: 'Password changed' } } } },
    '/api/users/onboarding-status': { get: { tags: ['Users'], summary: 'Get onboarding status', responses: { '200': { description: 'Onboarding state' } } } },
    '/api/users/complete-profile': { post: { tags: ['Users'], summary: 'Complete profile (onboarding)', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { name: { type: 'string' }, bio: { type: 'string' }, timezone: { type: 'string' }, language: { type: 'string' }, avatar: { type: 'string', format: 'binary' } } } } } }, responses: { '200': { description: 'Profile completed' } } } },
    '/api/users/search': { get: { tags: ['Users'], summary: 'Search users by name/email', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User results' } } } },
    // ─── Organizations ──────────────────────────────────────────────────────
    '/api/organizations': { post: { tags: ['Organizations'], summary: 'Create organization', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' } } } } } }, responses: { '201': { description: 'Organization created with default workspace' } } }, get: { tags: ['Organizations'], summary: 'List my organizations', responses: { '200': { description: 'Organization list' } } } },
    '/api/organizations/{organizationId}': { get: { tags: ['Organizations'], summary: 'Get organization details', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Organization' } } }, put: { tags: ['Organizations'], summary: 'Update organization', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Organizations'], summary: 'Delete organization (owner only)', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/organizations/{organizationId}/members': { get: { tags: ['Organizations'], summary: 'List organization members', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Members list' } } } },
    '/api/organizations/{organizationId}/invite': { post: { tags: ['Organizations'], summary: 'Invite member by email', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email','role'], properties: { email: { type: 'string' }, role: { type: 'string' } } } } } }, responses: { '200': { description: 'Invitation sent' } } } },
    '/api/organizations/{organizationId}/members/{userId}': { delete: { tags: ['Organizations'], summary: 'Remove member', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Member removed' } } } },
    '/api/organizations/{organizationId}/members/{userId}/role': { patch: { tags: ['Organizations'], summary: 'Change member role', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { role: { type: 'string' } } } } } }, responses: { '200': { description: 'Role updated' } } } },
    '/api/organizations/{organizationId}/transfer': { post: { tags: ['Organizations'], summary: 'Transfer ownership', parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { newOwnerId: { type: 'string' } } } } } }, responses: { '200': { description: 'Ownership transferred' } } } },
    '/api/organizations/join/{token}': { post: { tags: ['Organizations'], summary: 'Join org via invitation token', parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Joined organization' } } } },
    // ─── Workspaces ─────────────────────────────────────────────────────────
    '/api/workspaces': { post: { tags: ['Workspaces'], summary: 'Create workspace', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, orgName: { type: 'string' } } } } } }, responses: { '201': { description: 'Workspace created' } } }, get: { tags: ['Workspaces'], summary: 'List my workspaces', responses: { '200': { description: 'Workspace list' } } } },
    '/api/workspaces/{workspaceId}/invite': { post: { tags: ['Workspaces'], summary: 'Invite member to workspace', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string' }, role: { type: 'string' } } } } } }, responses: { '200': { description: 'Invitation sent' } } } },
    '/api/workspaces/accept-invite': { post: { tags: ['Workspaces'], summary: 'Accept workspace invitation', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } } } }, responses: { '200': { description: 'Joined workspace' } } } },
    '/api/workspaces/{workspaceId}/members': { get: { tags: ['Workspaces'], summary: 'List workspace members', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Members list' } } } },
    // ─── Task Statuses ────────────────────────────────────────────────────────
    '/api/workspaces/{workspaceId}/statuses': { get: { tags: ['Task Statuses'], summary: 'List workspace statuses', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Status list' } } }, post: { tags: ['Task Statuses'], summary: 'Create status', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','color','category'], properties: { name: { type: 'string' }, color: { type: 'string' }, icon: { type: 'string' }, category: { type: 'string', enum: ['backlog','unstarted','active','done','cancelled'] } } } } } }, responses: { '201': { description: 'Status created' } } } },
    '/api/workspaces/{workspaceId}/statuses/reorder': { put: { tags: ['Task Statuses'], summary: 'Reorder statuses', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { orderedIds: { type: 'array', items: { type: 'string' } } } } } } }, responses: { '200': { description: 'Reordered' } } } },
    '/api/workspaces/{workspaceId}/statuses/{statusId}': { put: { tags: ['Task Statuses'], summary: 'Update status', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'statusId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Task Statuses'], summary: 'Delete status', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'statusId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    // ─── Task Priorities ──────────────────────────────────────────────────────
    '/api/workspaces/{workspaceId}/priorities': { get: { tags: ['Task Priorities'], summary: 'List workspace priorities', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Priority list' } } }, post: { tags: ['Task Priorities'], summary: 'Create priority', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '201': { description: 'Priority created' } } } },
    '/api/workspaces/{workspaceId}/priorities/reorder': { put: { tags: ['Task Priorities'], summary: 'Reorder priorities', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Reordered' } } } },
    '/api/workspaces/{workspaceId}/priorities/{priorityId}': { put: { tags: ['Task Priorities'], summary: 'Update priority', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'priorityId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Task Priorities'], summary: 'Delete priority', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'priorityId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    // ─── Projects ──────────────────────────────────────────────────────────
    '/api/projects': { post: { tags: ['Projects'], summary: 'Create project', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','prefix','workspaceId'], properties: { name: { type: 'string' }, prefix: { type: 'string' }, description: { type: 'string' }, workspaceId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } } } } } }, responses: { '201': { description: 'Project created' } } }, get: { tags: ['Projects'], summary: 'List projects', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Project list' } } } },
    '/api/projects/{projectId}': { get: { tags: ['Projects'], summary: 'Get project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Project details' } } }, patch: { tags: ['Projects'], summary: 'Update project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Projects'], summary: 'Delete project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/projects/{projectId}/archive': { post: { tags: ['Projects'], summary: 'Archive project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Archived' } } } },
    '/api/projects/{projectId}/restore': { post: { tags: ['Projects'], summary: 'Restore project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Restored' } } } },
    '/api/projects/{projectId}/analytics': { get: { tags: ['Projects'], summary: 'Get project analytics', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Analytics data' } } } },
    '/api/projects/{projectId}/members': { get: { tags: ['Projects'], summary: 'List project members', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Members' } } }, post: { tags: ['Projects'], summary: 'Add project member', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['userId','role'], properties: { userId: { type: 'string' }, role: { type: 'string' } } } } } }, responses: { '201': { description: 'Member added' } } } },
    '/api/projects/{projectId}/members/{userId}': { delete: { tags: ['Projects'], summary: 'Remove project member', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Removed' } } } },
    // ─── Tasks ─────────────────────────────────────────────────────────────
    '/api/tasks': { post: { tags: ['Tasks'], summary: 'Create task', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['title','projectId','workspaceId'], properties: { title: { type: 'string' }, description: { type: 'object' }, projectId: { type: 'string' }, workspaceId: { type: 'string' }, assignees: { type: 'array', items: { type: 'string' } }, statusId: { type: 'string' }, priorityId: { type: 'string' }, labels: { type: 'array', items: { type: 'string' } }, parentTaskId: { type: 'string' }, sprintId: { type: 'string' }, dueDate: { type: 'string' }, estimatedHours: { type: 'number' } } } } } }, responses: { '201': { description: 'Task created with auto-incremented number' } } }, get: { tags: ['Tasks'], summary: 'List tasks (paginated, filtered)', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'projectId', in: 'query', schema: { type: 'string' } }, { name: 'statusId', in: 'query', schema: { type: 'string' } }, { name: 'priorityId', in: 'query', schema: { type: 'string' } }, { name: 'assignee', in: 'query', schema: { type: 'string' } }, { name: 'sprintId', in: 'query', schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'number' } }, { name: 'limit', in: 'query', schema: { type: 'number' } }, { name: 'sortBy', in: 'query', schema: { type: 'string' } }, { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc','desc'] } }], responses: { '200': { description: 'Paginated task list' } } } },
    '/api/tasks/bulk': { post: { tags: ['Tasks'], summary: 'Bulk update tasks', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['taskIds'], properties: { taskIds: { type: 'array', items: { type: 'string' } }, statusId: { type: 'string' }, priorityId: { type: 'string' }, assignees: { type: 'array', items: { type: 'string' } } } } } } }, responses: { '200': { description: 'Bulk updated' } } } },
    '/api/tasks/{taskId}': { get: { tags: ['Tasks'], summary: 'Get task details', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Task with populated refs' } } }, patch: { tags: ['Tasks'], summary: 'Update task', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Tasks'], summary: 'Delete task', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/tasks/{taskId}/move': { patch: { tags: ['Tasks'], summary: 'Move task (Kanban drag)', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['order'], properties: { statusId: { type: 'string' }, order: { type: 'number' } } } } } }, responses: { '200': { description: 'Moved' } } } },
    '/api/tasks/{taskId}/time': { post: { tags: ['Tasks'], summary: 'Log time on task', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['hours'], properties: { hours: { type: 'number' }, description: { type: 'string' } } } } } }, responses: { '200': { description: 'Time logged' } } } },
    '/api/tasks/{taskId}/subtasks': { get: { tags: ['Tasks'], summary: 'Get subtasks', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Subtask list' } } } },
    // ─── Comments ──────────────────────────────────────────────────────────
    '/api/tasks/{taskId}/comments': { post: { tags: ['Comments'], summary: 'Create comment on task', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'object', description: 'Tiptap JSON' }, plainText: { type: 'string' }, mentions: { type: 'array', items: { type: 'string' } }, parentCommentId: { type: 'string' } } } } } }, responses: { '201': { description: 'Comment created' } } }, get: { tags: ['Comments'], summary: 'List task comments', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'number' } }], responses: { '200': { description: 'Comment list (pinned first)' } } } },
    '/api/comments/{commentId}': { patch: { tags: ['Comments'], summary: 'Edit comment', parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Comments'], summary: 'Delete comment', parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/comments/{commentId}/replies': { get: { tags: ['Comments'], summary: 'Get thread replies', parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Replies' } } } },
    '/api/comments/{commentId}/pin': { post: { tags: ['Comments'], summary: 'Toggle pin', parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Pinned/Unpinned' } } } },
    '/api/comments/{commentId}/reactions': { post: { tags: ['Comments'], summary: 'Toggle reaction', parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['emoji'], properties: { emoji: { type: 'string' } } } } } }, responses: { '200': { description: 'Reaction toggled' } } } },
    // ─── Teams ───────────────────────────────────────────────────────────────
    '/api/teams': { post: { tags: ['Teams'], summary: 'Create team', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','workspaceId'], properties: { name: { type: 'string' }, description: { type: 'string' }, workspaceId: { type: 'string' }, color: { type: 'string' }, memberIds: { type: 'array', items: { type: 'string' } } } } } } }, responses: { '201': { description: 'Team created' } } }, get: { tags: ['Teams'], summary: 'List workspace teams', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Team list' } } } },
    '/api/teams/{teamId}': { get: { tags: ['Teams'], summary: 'Get team', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Team details' } } }, patch: { tags: ['Teams'], summary: 'Update team', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Teams'], summary: 'Delete team', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/teams/{teamId}/members': { post: { tags: ['Teams'], summary: 'Add member to team', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' } } } } } }, responses: { '200': { description: 'Member added' } } } },
    '/api/teams/{teamId}/members/{userId}': { delete: { tags: ['Teams'], summary: 'Remove team member', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Removed' } } } },
    '/api/teams/{teamId}/lead': { patch: { tags: ['Teams'], summary: 'Change team lead', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' } } } } } }, responses: { '200': { description: 'Lead changed' } } } },
    '/api/teams/{teamId}/stats': { get: { tags: ['Teams'], summary: 'Get team statistics', parameters: [{ name: 'teamId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Team stats' } } } },
    // ─── Sprints ──────────────────────────────────────────────────────────
    '/api/sprints': { post: { tags: ['Sprints'], summary: 'Create sprint', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','projectId','workspaceId'], properties: { name: { type: 'string' }, goal: { type: 'string' }, projectId: { type: 'string' }, workspaceId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } } } } }, responses: { '201': { description: 'Sprint created' } } }, get: { tags: ['Sprints'], summary: 'List project sprints', parameters: [{ name: 'projectId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Sprint list' } } } },
    '/api/sprints/backlog': { get: { tags: ['Sprints'], summary: 'Get backlog (unassigned tasks)', parameters: [{ name: 'projectId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Backlog tasks' } } } },
    '/api/sprints/{sprintId}': { get: { tags: ['Sprints'], summary: 'Get sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Sprint details' } } }, patch: { tags: ['Sprints'], summary: 'Update sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Sprints'], summary: 'Delete sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/sprints/{sprintId}/start': { post: { tags: ['Sprints'], summary: 'Start sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Sprint started' } } } },
    '/api/sprints/{sprintId}/complete': { post: { tags: ['Sprints'], summary: 'Complete sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Sprint completed' } } } },
    '/api/sprints/{sprintId}/tasks': { post: { tags: ['Sprints'], summary: 'Add tasks to sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { taskIds: { type: 'array', items: { type: 'string' } } } } } } }, responses: { '200': { description: 'Tasks added' } } }, delete: { tags: ['Sprints'], summary: 'Remove tasks from sprint', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Tasks removed' } } } },
    '/api/sprints/{sprintId}/analytics': { get: { tags: ['Sprints'], summary: 'Sprint analytics', parameters: [{ name: 'sprintId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Analytics (completion, burndown)' } } } },
    // ─── Milestones ──────────────────────────────────────────────────────────
    '/api/milestones': { post: { tags: ['Milestones'], summary: 'Create milestone', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name','projectId','workspaceId'], properties: { name: { type: 'string' }, description: { type: 'string' }, projectId: { type: 'string' }, workspaceId: { type: 'string' }, dueDate: { type: 'string' } } } } } }, responses: { '201': { description: 'Milestone created' } } }, get: { tags: ['Milestones'], summary: 'List project milestones', parameters: [{ name: 'projectId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Milestone list' } } } },
    '/api/milestones/{milestoneId}': { get: { tags: ['Milestones'], summary: 'Get milestone', parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Details' } } }, patch: { tags: ['Milestones'], summary: 'Update milestone', parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } }, delete: { tags: ['Milestones'], summary: 'Delete milestone', parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/milestones/{milestoneId}/complete': { post: { tags: ['Milestones'], summary: 'Complete milestone', parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Completed' } } } },
    '/api/milestones/{milestoneId}/reopen': { post: { tags: ['Milestones'], summary: 'Reopen milestone', parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Reopened' } } } },
    '/api/milestones/{milestoneId}/tasks': { get: { tags: ['Milestones'], summary: 'Get milestone tasks', parameters: [{ name: 'milestoneId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Tasks' } } } },
    // ─── Activities ────────────────────────────────────────────────────────
    '/api/activities': { get: { tags: ['Activities'], summary: 'Workspace activity timeline', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'action', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'number' } }], responses: { '200': { description: 'Activity feed' } } } },
    '/api/activities/project/{projectId}': { get: { tags: ['Activities'], summary: 'Project activity timeline', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Project activities' } } } },
    '/api/activities/task/{taskId}': { get: { tags: ['Activities'], summary: 'Task activity history', parameters: [{ name: 'taskId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Task history' } } } },
    '/api/activities/me': { get: { tags: ['Activities'], summary: 'Personal activity feed', responses: { '200': { description: 'Your activities' } } } },
    // ─── Notifications ───────────────────────────────────────────────────────
    '/api/notifications': { get: { tags: ['Notifications'], summary: 'Get notifications (paginated)', parameters: [{ name: 'page', in: 'query', schema: { type: 'number' } }, { name: 'workspaceId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Notification list' } } } },
    '/api/notifications/unread-count': { get: { tags: ['Notifications'], summary: 'Get unread count', responses: { '200': { description: 'Unread count' } } } },
    '/api/notifications/{notificationId}/read': { patch: { tags: ['Notifications'], summary: 'Mark as read', parameters: [{ name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Marked read' } } } },
    '/api/notifications/read-all': { post: { tags: ['Notifications'], summary: 'Mark all as read', responses: { '200': { description: 'All marked read' } } } },
    '/api/notifications/preferences': { get: { tags: ['Notifications'], summary: 'Get notification preferences', responses: { '200': { description: 'Preferences' } } }, put: { tags: ['Notifications'], summary: 'Update notification preferences', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { emailEnabled: { type: 'boolean' }, muteAll: { type: 'boolean' }, preferences: { type: 'object' } } } } } }, responses: { '200': { description: 'Preferences updated' } } } },
    // ─── Attachments ─────────────────────────────────────────────────────────
    '/api/attachments': { post: { tags: ['Attachments'], summary: 'Upload file', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['file','entityType','entityId','workspaceId'], properties: { file: { type: 'string', format: 'binary' }, entityType: { type: 'string', enum: ['Task','Project','Comment'] }, entityId: { type: 'string' }, workspaceId: { type: 'string' } } } } } }, responses: { '201': { description: 'File uploaded' } } }, get: { tags: ['Attachments'], summary: 'List attachments by entity', parameters: [{ name: 'entityType', in: 'query', required: true, schema: { type: 'string' } }, { name: 'entityId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Attachment list' } } } },
    '/api/attachments/{attachmentId}': { get: { tags: ['Attachments'], summary: 'Get attachment', parameters: [{ name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Attachment details' } } }, delete: { tags: ['Attachments'], summary: 'Delete attachment', parameters: [{ name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } } },
    '/api/attachments/workspace/{workspaceId}': { get: { tags: ['Attachments'], summary: 'List workspace attachments', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'All workspace files' } } } },
    '/api/attachments/usage/{workspaceId}': { get: { tags: ['Attachments'], summary: 'Get storage usage', parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Storage stats' } } } },
    // ─── Roles ─────────────────────────────────────────────────────────────
    '/api/roles/system': { get: { tags: ['Roles'], summary: 'List system roles', responses: { '200': { description: 'All system roles with permissions' } } } },
    '/api/roles/{id}': { get: { tags: ['Roles'], summary: 'Get role by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Role details' } } } },
    // ─── Search ──────────────────────────────────────────────────────────────
    '/api/search': { get: { tags: ['Search'], summary: 'Global search', parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query (min 2 chars)' }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'types', in: 'query', schema: { type: 'string' }, description: 'Comma-separated: task,project,member,comment,label' }, { name: 'limit', in: 'query', schema: { type: 'number' } }], responses: { '200': { description: 'Search results by type' } } } },
    // ─── Dashboard ───────────────────────────────────────────────────────────
    '/api/dashboard/personal': { get: { tags: ['Dashboard'], summary: 'Personal dashboard', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Personal stats, tasks, activity' } } } },
    '/api/dashboard/workspace': { get: { tags: ['Dashboard'], summary: 'Workspace dashboard', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Workspace overview, project health' } } } },
    '/api/dashboard/project/{projectId}': { get: { tags: ['Dashboard'], summary: 'Project dashboard', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Project analytics, sprints, milestones' } } } },
    // ─── Audit Logs ──────────────────────────────────────────────────────────
    '/api/audit-logs': { get: { tags: ['Audit Logs'], summary: 'Query audit logs', parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'entityType', in: 'query', schema: { type: 'string' } }, { name: 'entityId', in: 'query', schema: { type: 'string' } }, { name: 'performedBy', in: 'query', schema: { type: 'string' } }, { name: 'from', in: 'query', schema: { type: 'string' } }, { name: 'to', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'number' } }], responses: { '200': { description: 'Paginated audit logs' } } } },
    '/api/audit-logs/entity/{entityType}/{entityId}': { get: { tags: ['Audit Logs'], summary: 'Entity audit history', parameters: [{ name: 'entityType', in: 'path', required: true, schema: { type: 'string' } }, { name: 'entityId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Entity history' } } } },
    // ─── Admin ───────────────────────────────────────────────────────────────
    '/api/admin/health': { get: { tags: ['Admin'], summary: 'System health (Super Admin)', responses: { '200': { description: 'Entity counts, memory, uptime' } } } },
    '/api/admin/analytics': { get: { tags: ['Admin'], summary: 'Platform analytics (Super Admin)', responses: { '200': { description: 'Growth metrics' } } } },
    '/api/admin/users': { get: { tags: ['Admin'], summary: 'List all users (Super Admin)', parameters: [{ name: 'page', in: 'query', schema: { type: 'number' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Paginated user list' } } } },
    '/api/admin/users/{userId}/suspend': { post: { tags: ['Admin'], summary: 'Suspend user (Super Admin)', parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User suspended' } } } },
    '/api/admin/audit-logs': { get: { tags: ['Admin'], summary: 'Platform-wide audit logs (Super Admin)', parameters: [{ name: 'page', in: 'query', schema: { type: 'number' } }], responses: { '200': { description: 'All audit logs' } } } },
    // ─── Health Check ────────────────────────────────────────────────────────
    '/health': { get: { tags: ['Admin'], summary: 'Health check', security: [], responses: { '200': { description: 'Server is healthy' } } } },
  },
};
