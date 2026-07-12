import { TaskStatus } from './task-status.model';
import { TaskPriority } from '../task-priorities/task-priority.model';
import { StatusCategory } from './task-status.model';

/**
 * Default task statuses seeded for every new workspace.
 * Inspired by Linear's workflow with additional stages for enterprise teams.
 */
const DEFAULT_STATUSES: {
  name: string;
  color: string;
  icon: string;
  order: number;
  category: StatusCategory;
  isDefault: boolean;
}[] = [
  { name: 'Backlog', color: '#6B7280', icon: 'circle-dashed', order: 0, category: 'backlog', isDefault: true },
  { name: 'Todo', color: '#8B5CF6', icon: 'circle', order: 1, category: 'unstarted', isDefault: false },
  { name: 'In Progress', color: '#F59E0B', icon: 'loader', order: 2, category: 'active', isDefault: false },
  { name: 'In Review', color: '#3B82F6', icon: 'eye', order: 3, category: 'active', isDefault: false },
  { name: 'Testing', color: '#06B6D4', icon: 'flask-conical', order: 4, category: 'active', isDefault: false },
  { name: 'Blocked', color: '#EF4444', icon: 'ban', order: 5, category: 'active', isDefault: false },
  { name: 'Done', color: '#10B981', icon: 'check-circle-2', order: 6, category: 'done', isDefault: false },
  { name: 'Cancelled', color: '#9CA3AF', icon: 'x-circle', order: 7, category: 'cancelled', isDefault: false },
];

/**
 * Default task priorities seeded for every new workspace.
 */
const DEFAULT_PRIORITIES: {
  name: string;
  color: string;
  icon: string;
  order: number;
  isDefault: boolean;
}[] = [
  { name: 'Critical', color: '#DC2626', icon: 'alert-octagon', order: 0, isDefault: false },
  { name: 'High', color: '#F97316', icon: 'arrow-up', order: 1, isDefault: false },
  { name: 'Medium', color: '#F59E0B', icon: 'minus', order: 2, isDefault: true },
  { name: 'Low', color: '#3B82F6', icon: 'arrow-down', order: 3, isDefault: false },
  { name: 'None', color: '#6B7280', icon: 'circle', order: 4, isDefault: false },
];

/**
 * Seeds default task statuses and priorities for a workspace.
 * Called automatically when a workspace is created.
 * Safe to call multiple times — skips if statuses already exist.
 */
export async function seedWorkspaceDefaults(workspaceId: string, createdBy?: string): Promise<void> {
  // Check if workspace already has statuses (idempotent)
  const existingStatuses = await TaskStatus.countDocuments({ workspaceId });
  if (existingStatuses > 0) return;

  // Seed statuses
  const statusDocs = DEFAULT_STATUSES.map((s) => ({
    workspaceId,
    name: s.name,
    slug: s.name.toLowerCase().replace(/\s+/g, '_'),
    color: s.color,
    icon: s.icon,
    order: s.order,
    category: s.category,
    isDefault: s.isDefault,
    createdBy: createdBy || null,
  }));

  await TaskStatus.insertMany(statusDocs);

  // Check if workspace already has priorities (idempotent)
  const existingPriorities = await TaskPriority.countDocuments({ workspaceId });
  if (existingPriorities > 0) return;

  // Seed priorities
  const priorityDocs = DEFAULT_PRIORITIES.map((p) => ({
    workspaceId,
    name: p.name,
    slug: p.name.toLowerCase().replace(/\s+/g, '_'),
    color: p.color,
    icon: p.icon,
    order: p.order,
    isDefault: p.isDefault,
    createdBy: createdBy || null,
  }));

  await TaskPriority.insertMany(priorityDocs);
}

export { DEFAULT_STATUSES, DEFAULT_PRIORITIES };
