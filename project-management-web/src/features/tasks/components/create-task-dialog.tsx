'use client';

import React, { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTaskMutation, useStatusesQuery, usePrioritiesQuery } from '@/hooks/use-tasks';
import { useProjectsQuery } from '@/hooks/use-projects';
import { useWorkspaceStore } from '@/store/workspace-store';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultStatusId?: string;
  onCreated?: (taskId: string) => void;
}

function CreateTaskForm({
  onOpenChange,
  defaultProjectId,
  defaultStatusId,
  onCreated,
}: Omit<CreateTaskDialogProps, 'open'>) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data: projects } = useProjectsQuery(currentWorkspaceId);
  const { data: statuses } = useStatusesQuery(currentWorkspaceId);
  const { data: priorities } = usePrioritiesQuery(currentWorkspaceId);
  const createMutation = useCreateTaskMutation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [statusId, setStatusId] = useState(defaultStatusId || '');
  const [priorityId, setPriorityId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspaceId) {
      setError('No workspace selected.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const resolvedProjectId = projectId || defaultProjectId;
    if (!resolvedProjectId) {
      setError('Please select a project.');
      return;
    }

    try {
      const task = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: resolvedProjectId,
        workspaceId: currentWorkspaceId,
        statusId: statusId || undefined,
        priorityId: priorityId || undefined,
        dueDate: dueDate || undefined,
      });
      onOpenChange(false);
      onCreated?.(task._id);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to create task.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details…"
          rows={3}
        />
      </div>

      {!defaultProjectId && (
        <div className="space-y-1.5">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {(projects || []).map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {(statuses || []).map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priorityId} onValueChange={setPriorityId}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {(priorities || []).map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="task-due">Due date</Label>
        <Input
          id="task-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
          ) : (
            <><Plus className="mr-2 h-4 w-4" />Create</>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  defaultProjectId,
  defaultStatusId,
  onCreated,
}: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Add a new task to your workspace.</DialogDescription>
        </DialogHeader>
        {open && (
          <CreateTaskForm
            key={`${defaultProjectId || ''}-${defaultStatusId || ''}`}
            onOpenChange={onOpenChange}
            defaultProjectId={defaultProjectId}
            defaultStatusId={defaultStatusId}
            onCreated={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CreateTaskDialog;
