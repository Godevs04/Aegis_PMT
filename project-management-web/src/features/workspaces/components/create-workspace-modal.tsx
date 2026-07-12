'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateWorkspaceMutation } from '@/hooks/use-workspaces';

interface CreateWorkspaceFormValues {
  name: string;
  description: string;
}

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateWorkspaceMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateWorkspaceFormValues) => {
    setError(null);
    try {
      await createMutation.mutateAsync({ name: data.name });
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace.');
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Create Workspace</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                A workspace is where your team collaborates on projects.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Engineering, Marketing, Design"
                autoFocus
                disabled={createMutation.isPending}
                {...register('name', {
                  required: 'Workspace name is required',
                  minLength: { value: 2, message: 'Must be at least 2 characters' },
                  maxLength: { value: 100, message: 'Cannot exceed 100 characters' },
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-description">Description (optional)</Label>
              <Input
                id="ws-description"
                placeholder="What is this workspace for?"
                disabled={createMutation.isPending}
                {...register('description', {
                  maxLength: { value: 500, message: 'Cannot exceed 500 characters' },
                })}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
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
        </div>
      </div>
    </>
  );
}

export default CreateWorkspaceModal;
