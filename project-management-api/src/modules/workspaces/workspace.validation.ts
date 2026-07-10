import { z } from 'zod';
import { UserRole } from '../../config/roles';

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Workspace name is required' })
      .min(2, 'Workspace name must be at least 2 characters')
      .max(100, 'Workspace name cannot exceed 100 characters'),
    orgName: z.string().max(100).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Member email is required' })
      .email('Invalid email address'),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Invalid member role provided' }),
    }),
  }),
  params: z.object({
    workspaceId: z.string({ required_error: 'Workspace ID is required' }),
  }),
});

export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Invitation token is required' }),
  }),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
