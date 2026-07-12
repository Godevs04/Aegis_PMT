'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceStore } from '@/store/workspace-store';
import { apiClient } from '@/services/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { WORKSPACES_QUERY_KEY } from '@/hooks/use-workspaces';

interface WorkspaceFormValues {
  name: string;
  description: string;
}

export default function WorkspaceSettingsPage() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WorkspaceFormValues>();

  // Fetch workspace details
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!currentWorkspaceId) {
        setIsLoading(false);
        return;
      }
      try {
        // Use the workspaces list to find current
        const response = await apiClient.get('/workspaces');
        const workspaces = response.data.data;
        const current = workspaces.find((ws: any) => ws._id === currentWorkspaceId);
        if (current) {
          setWorkspace(current);
          reset({ name: current.name, description: current.description || '' });
        }
      } catch {
        setError('Failed to load workspace details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspace();
  }, [currentWorkspaceId, reset]);

  const onSubmit = async (data: WorkspaceFormValues) => {
    if (!currentWorkspaceId) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.patch(`/workspaces/${currentWorkspaceId}`, {
        name: data.name,
        description: data.description,
      });
      setSuccessMessage('Workspace settings saved successfully.');
      queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update workspace.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspaceId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/workspaces/${currentWorkspaceId}`);
      queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete workspace.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!currentWorkspaceId) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No workspace selected.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your workspace name, description, and other settings.
        </p>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {/* General Settings Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 rounded-xl border border-border bg-card/50">
        <h2 className="text-sm font-semibold text-foreground">General</h2>

        <div className="space-y-1.5">
          <Label htmlFor="ws-settings-name">Workspace Name</Label>
          <Input
            id="ws-settings-name"
            disabled={isSaving}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Must be at least 2 characters' },
            })}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ws-settings-desc">Description</Label>
          <Input
            id="ws-settings-desc"
            placeholder="What is this workspace for?"
            disabled={isSaving}
            {...register('description', {
              maxLength: { value: 500, message: 'Cannot exceed 500 characters' },
            })}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Deleting a workspace is permanent. All projects, tasks, and data within this workspace will be lost.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Workspace
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, delete permanently'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
