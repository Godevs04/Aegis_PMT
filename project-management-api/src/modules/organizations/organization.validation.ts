import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Organization name is required' })
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name cannot exceed 100 characters'),
    description: z.string().max(500).optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  params: z.object({
    organizationId: z.string({ required_error: 'Organization ID is required' }),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    logo: z.string().url().optional(),
    settings: z
      .object({
        allowPublicJoin: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    organizationId: z.string({ required_error: 'Organization ID is required' }),
  }),
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address'),
    role: z
      .string({ required_error: 'Role is required' })
      .min(1, 'Role slug is required'),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    organizationId: z.string({ required_error: 'Organization ID is required' }),
    userId: z.string({ required_error: 'User ID is required' }),
  }),
  body: z.object({
    role: z
      .string({ required_error: 'Role slug is required' })
      .min(1, 'Role slug is required'),
  }),
});

export const transferOwnershipSchema = z.object({
  params: z.object({
    organizationId: z.string({ required_error: 'Organization ID is required' }),
  }),
  body: z.object({
    newOwnerId: z.string({ required_error: 'New owner user ID is required' }),
  }),
});

export const joinByTokenSchema = z.object({
  params: z.object({
    token: z.string({ required_error: 'Invitation token is required' }),
  }),
});
