import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Project name is required' })
      .min(2, 'Project name must be at least 2 characters')
      .max(100, 'Project name cannot exceed 100 characters'),
    prefix: z
      .string({ required_error: 'Project prefix is required' })
      .min(2, 'Prefix must be at least 2 characters')
      .max(6, 'Prefix cannot exceed 6 characters')
      .regex(/^[A-Za-z0-9]+$/, 'Prefix must contain only letters and numbers'),
    description: z.string().max(2000).optional(),
    workspaceId: z.string({ required_error: 'Workspace ID is required' }),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const getProjectsSchema = z.object({
  query: z.object({
    workspaceId: z.string({ required_error: 'Workspace ID query parameter is required' }),
    status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).optional(),
    search: z.string().optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).optional(),
    coverImage: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    settings: z.object({
      enableSprints: z.boolean().optional(),
      enableMilestones: z.boolean().optional(),
    }).optional(),
  }),
});

export const deleteProjectSchema = z.object({
  params: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }),
  }),
});

export const addProjectMemberSchema = z.object({
  params: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }),
  }),
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }),
    role: z.string({ required_error: 'Role slug is required' }),
  }),
});
