'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProjectMutation } from '@/hooks/use-projects';
import { useWorkspaceStore } from '@/store/workspace-store';

interface CreateProjectFormValues {
  name: string;
  prefix: string;
  description: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { currentWorkspaceId } = useWorkspaceStore();
  const createMutation = useCreateProjectMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    defaultValues: { name: '', prefix: '', description: '' },
  });

  const nameValue = watch('name');

  // Auto-generate prefix from name
  React.useEffect(() => {
    if (nameValue && nameValue.length >= 2) {
      const autoPrefix = nameValue
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      setValue('prefix', autoPrefix);
    }
  }, [nameValue, setValue]);

  const onSubmit = async (data: CreateProjectFormValues) => {
    if (!currentWorkspaceId) {
      setError('No workspace selected.');
      return;
    }
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: data.name,
        prefix: data.prefix.toUpperCase(),
        description: data.description || undefined,
        workspaceId: currentWorkspaceId,
      });
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project.');
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create Project</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                A project groups related tasks and tracks progress.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Project Name</Label>
              <Input
                id="proj-name"
                placeholder="e.g. Payment Service, Mobile App"
                autoFocus
                disabled={createMutation.isPending}
                {...register('name', {
                  required: 'Project name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-prefix">Prefix</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="proj-prefix"
                  placeholder="ENG"
                  className="w-24 uppercase font-mono"
                  disabled={createMutation.isPending}
                  {...register('prefix', {
                    required: 'Prefix is required',
                    minLength: { value: 2, message: 'Min 2 chars' },
                    maxLength: { value: 6, message: 'Max 6 chars' },
                    pattern: { value: /^[A-Za-z0-9]+$/, message: 'Letters & numbers only' },
                  })}
                />
                <span className="text-xs text-muted-foreground">
                  Tasks will be numbered as <span className="font-mono text-foreground">{watch('prefix') || 'PRJ'}-1</span>
                </span>
              </div>
              {errors.prefix && <p className="text-xs text-destructive">{errors.prefix.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description (optional)</Label>
              <Input
                id="proj-desc"
                placeholder="What is this project about?"
                disabled={createMutation.isPending}
                {...register('description')}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateProjectModal;
