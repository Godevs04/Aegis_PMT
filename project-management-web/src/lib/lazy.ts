/**
 * Performance utilities for the Aegis frontend.
 *
 * This module provides helpers for:
 * - Dynamic imports with loading fallbacks
 * - Memoization patterns
 * - Debounce/throttle for search inputs
 */

/**
 * Debounce a function call.
 * Used for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function call.
 * Used for scroll handlers, drag events, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date relative to now (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Query key factory for consistent key generation.
 * Ensures proper cache invalidation patterns.
 */
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    list: (filters: Record<string, any>) => ['tasks', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    subtasks: (parentId: string) => ['tasks', 'subtasks', parentId] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (workspaceId: string, filters?: any) => ['projects', workspaceId, filters] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    analytics: (id: string) => ['projects', 'analytics', id] as const,
  },
  workspaces: {
    all: ['workspaces'] as const,
    members: (id: string) => ['workspace-members', id] as const,
  },
  sprints: {
    all: ['sprints'] as const,
    list: (projectId: string) => ['sprints', projectId] as const,
    analytics: (id: string) => ['sprints', 'analytics', id] as const,
    backlog: (projectId: string) => ['sprints', 'backlog', projectId] as const,
  },
  dashboard: {
    personal: (workspaceId: string) => ['dashboard', 'personal', workspaceId] as const,
    workspace: (workspaceId: string) => ['dashboard', 'workspace', workspaceId] as const,
    project: (projectId: string) => ['dashboard', 'project', projectId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: (workspaceId?: string) => ['notifications', 'unread-count', workspaceId] as const,
  },
  statuses: (workspaceId: string) => ['task-statuses', workspaceId] as const,
  priorities: (workspaceId: string) => ['task-priorities', workspaceId] as const,
} as const;
