import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Project name is required' })
      .min(2, 'Project name must be at least 2 characters')
      .max(100, 'Project name cannot exceed 100 characters'),
    description: z.string().max(500).optional(),
    workspaceId: z.string({ required_error: 'Workspace ID is required' }),
  }),
});

export const getProjectsSchema = z.object({
  query: z.object({
    workspaceId: z.string({ required_error: 'Workspace ID query parameter is required' }),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'archived']).optional(),
  }),
});

export const deleteProjectSchema = z.object({
  params: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }),
  }),
});
