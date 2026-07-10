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
import { useWorkspaceStore } from '@/store/workspace-store';
import { useProjectsQuery } from '@/hooks/use-projects';
import { useCreateTaskMutation } from '@/hooks/use-tasks';

const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(2, 'Task title must be at least 2 characters')
    .max(150, 'Task title cannot exceed 150 characters'),
  description: z.string().max(1000).optional(),
  projectId: z.string().min(1, 'Please select a project'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  dueDate: z.string().optional(),
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data: projects } = useProjectsQuery(currentWorkspaceId);
  const createTaskMutation = useCreateTaskMutation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      priority: 'medium',
      status: 'todo',
      dueDate: '',
    },
  });

  const onSubmit = (data: CreateTaskValues) => {
    if (!currentWorkspaceId) {
      setError('Please select a workspace before creating a task.');
      return;
    }

    setError(null);
    createTaskMutation.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        projectId: data.projectId,
        workspaceId: currentWorkspaceId,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (err: any) => {
          setError(
            err.response?.data?.message ||
              'Failed to create task. Please try again.'
          );
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-border text-white">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Schedule a new task and associate it to a project.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Design Landing Page, Setup Databases"
              disabled={createTaskMutation.isPending}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="task-desc">Description (Optional)</Label>
            <Input
              id="task-desc"
              placeholder="Provide a description of the task requirements"
              disabled={createTaskMutation.isPending}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-0.5">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="project-select">Project</Label>
              <select
                id="project-select"
                className="w-full h-10 rounded-md border border-border bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none"
                disabled={createTaskMutation.isPending}
                {...register('projectId')}
              >
                <option value="">Select Project</option>
                {projects?.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-xs text-destructive mt-0.5">{errors.projectId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                disabled={createTaskMutation.isPending}
                {...register('dueDate')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="priority-select">Priority</Label>
              <select
                id="priority-select"
                className="w-full h-10 rounded-md border border-border bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none"
                disabled={createTaskMutation.isPending}
                {...register('priority')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status-select">Status</Label>
              <select
                id="status-select"
                className="w-full h-10 rounded-md border border-border bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none"
                disabled={createTaskMutation.isPending}
                {...register('status')}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTaskModal;
