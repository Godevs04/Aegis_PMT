import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Task title is required' })
      .min(2, 'Task title must be at least 2 characters')
      .max(150, 'Task title cannot exceed 150 characters'),
    description: z.string().max(1000).optional(),
    projectId: z.string({ required_error: 'Project ID is required' }),
    workspaceId: z.string({ required_error: 'Workspace ID is required' }),
    assigneeId: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().datetime({ precision: 3 }).optional().or(z.string().date()).optional(),
  }),
});

export const getTasksSchema = z.object({
  query: z.object({
    workspaceId: z.string({ required_error: 'Workspace ID query parameter is required' }),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
  body: z.object({
    title: z.string().min(2).max(150).optional(),
    description: z.string().max(1000).optional(),
    projectId: z.string().optional(),
    assigneeId: z.string().nullable().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    checklist: z
      .array(
        z.object({
          title: z.string(),
          isCompleted: z.boolean(),
        })
      )
      .optional(),
  }),
});

export const commentTaskSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
  body: z.object({
    content: z.string({ required_error: 'Comment content is required' }).min(1),
  }),
});

export const deleteTaskSchema = z.object({
  params: z.object({
    taskId: z.string({ required_error: 'Task ID is required' }),
  }),
});
