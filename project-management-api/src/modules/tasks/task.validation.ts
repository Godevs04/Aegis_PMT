import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Task title is required' })
      .min(1, 'Task title is required')
      .max(200, 'Task title cannot exceed 200 characters'),
    description: z.any().optional(),
    projectId: z.string({ required_error: 'Project ID is required' }),
    workspaceId: z.string({ required_error: 'Workspace ID is required' }),
    assignees: z.array(z.string()).optional(),
    reporter: z.string().optional(),
    statusId: z.string().optional(),
    priorityId: z.string().optional(),
    labels: z.array(z.string()).optional(),
    parentTaskId: z.string().optional(),
    sprintId: z.string().optional(),
    milestoneId: z.string().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    estimatedHours: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const getTasksSchema = z.object({
  query: z.object({
    workspaceId: z.string({ required_error: 'Workspace ID is required' }),
    projectId: z.string().optional(),
    statusId: z.string().optional(),
    priorityId: z.string().optional(),
    assignee: z.string().optional(),
    labels: z.string().optional(),
    sprintId: z.string().optional(),
    parentTaskId: z.string().optional(),
    search: z.string().optional(),
    dueBefore: z.string().optional(),
    dueAfter: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.any().optional(),
    statusId: z.string().nullable().optional(),
    priorityId: z.string().nullable().optional(),
    assignees: z.array(z.string()).optional(),
    reporter: z.string().nullable().optional(),
    watchers: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    parentTaskId: z.string().nullable().optional(),
    sprintId: z.string().nullable().optional(),
    milestoneId: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    estimatedHours: z.number().min(0).nullable().optional(),
    order: z.number().optional(),
  }),
});

export const logTimeSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
  body: z.object({
    hours: z
      .number({ required_error: 'Hours is required' })
      .min(0.01, 'Hours must be greater than 0'),
    description: z.string().max(500).optional(),
  }),
});

export const bulkUpdateSchema = z.object({
  body: z.object({
    taskIds: z
      .array(z.string())
      .min(1, 'At least one task ID is required')
      .max(50, 'Cannot bulk update more than 50 tasks'),
    statusId: z.string().optional(),
    priorityId: z.string().optional(),
    assignees: z.array(z.string()).optional(),
    sprintId: z.string().optional(),
  }),
});

export const moveTaskSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
  body: z.object({
    statusId: z.string().optional(),
    order: z.number({ required_error: 'Order is required' }),
  }),
});

export const deleteTaskSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
});
