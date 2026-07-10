'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateWorkspaceMutation } from '@/hooks/use-workspaces';

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name cannot exceed 100 characters'),
  orgName: z.string().max(100).optional(),
});

type CreateWorkspaceValues = z.infer<typeof createWorkspaceSchema>;

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      orgName: '',
    },
  });

  const onSubmit = (data: CreateWorkspaceValues) => {
    setError(null);
    createWorkspaceMutation.mutate(
      { name: data.name, orgName: data.orgName || undefined },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err: any) => {
          setError(
            err.response?.data?.message ||
              'Failed to create workspace. Please try again.'
          );
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-border text-white">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a workspace to collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g. Engineering, Marketing"
              disabled={createWorkspaceMutation.isPending}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="org-name">Organization Name (Optional)</Label>
            <Input
              id="org-name"
              placeholder="Defaults to '[Workspace Name] Organization'"
              disabled={createWorkspaceMutation.isPending}
              {...register('orgName')}
            />
            {errors.orgName && (
              <p className="text-xs text-destructive mt-0.5">{errors.orgName.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createWorkspaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkspaceMutation.isPending}>
              {createWorkspaceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateWorkspaceModal;
