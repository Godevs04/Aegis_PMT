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
import { useCreateProjectMutation } from '@/hooks/use-projects';
import { useWorkspaceStore } from '@/store/workspace-store';

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name cannot exceed 100 characters'),
  description: z.string().max(500).optional(),
});

type CreateProjectValues = z.infer<typeof createProjectSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const createProjectMutation = useCreateProjectMutation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = (data: CreateProjectValues) => {
    if (!currentWorkspaceId) {
      setError('Please select a workspace before creating a project.');
      return;
    }

    setError(null);
    createProjectMutation.mutate(
      {
        name: data.name,
        workspaceId: currentWorkspaceId,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err: any) => {
          setError(
            err.response?.data?.message ||
              'Failed to create project. Please try again.'
          );
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-border text-white">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new project inside your active workspace context.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Website Redesign, API Integration"
              disabled={createProjectMutation.isPending}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Short description of this project scope"
              disabled={createProjectMutation.isPending}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-0.5">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectModal;
