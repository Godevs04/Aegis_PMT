'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquare, Clock, Trash2, CheckSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task } from '@/services/task-service';
import commentService from '@/services/comment-service';
import {
  useTaskQuery,
  useStatusesQuery,
  usePrioritiesQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useSubtasksQuery,
} from '@/hooks/use-tasks';
import { useWorkspaceStore } from '@/store/workspace-store';

interface TaskDetailSheetProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TaskDetailBody({
  taskId,
  onOpenChange,
}: {
  taskId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data: task, isLoading } = useTaskQuery(taskId);
  const { data: statuses } = useStatusesQuery(currentWorkspaceId);
  const { data: priorities } = usePrioritiesQuery(currentWorkspaceId);
  const { data: subtasks } = useSubtasksQuery(taskId);
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [timeHours, setTimeHours] = useState('');

  const commentsQuery = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.getByTask(taskId),
    enabled: !!taskId,
  });

  const title = titleDraft ?? task?.title ?? '';
  const rawDescription = task?.description;
  const description =
    descriptionDraft ??
    (typeof rawDescription === 'string'
      ? rawDescription
      : rawDescription && typeof rawDescription === 'object'
        ? commentService.extractText(rawDescription as Record<string, unknown>)
        : '');

  const statusId =
    typeof task?.statusId === 'object' ? task.statusId?._id : task?.statusId;
  const priorityId =
    typeof task?.priorityId === 'object' ? task.priorityId?._id : task?.priorityId;

  const handleSaveTitle = () => {
    if (!title.trim() || title === task?.title) return;
    updateMutation.mutate({ taskId, data: { title: title.trim() } as Partial<Task> });
    setTitleDraft(null);
  };

  const handleStatusChange = (value: string) => {
    updateMutation.mutate({ taskId, data: { statusId: value } as Partial<Task> });
  };

  const handlePriorityChange = (value: string) => {
    updateMutation.mutate({ taskId, data: { priorityId: value } as Partial<Task> });
  };

  const handleDueDateChange = (value: string) => {
    updateMutation.mutate({
      taskId,
      data: { dueDate: value || undefined } as Partial<Task>,
    });
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPostingComment(true);
    try {
      await commentService.create(taskId, newComment.trim());
      setNewComment('');
      await commentsQuery.refetch();
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(taskId);
    onOpenChange(false);
  };

  const handleLogTime = async () => {
    if (!timeHours) return;
    const hours = parseFloat(timeHours);
    if (Number.isNaN(hours) || hours <= 0) return;
    const { default: taskService } = await import('@/services/task-service');
    await taskService.logTime(taskId, hours);
    setTimeHours('');
  };

  if (isLoading || !task) {
    return (
      <div className="space-y-4 pt-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const comments = commentsQuery.data || [];

  return (
    <>
      <SheetHeader>
        <SheetDescription className="text-[10px] font-mono uppercase tracking-wider">
          Task #{task.taskNumber}
        </SheetDescription>
        <SheetTitle className="sr-only">{task.title}</SheetTitle>
        <Input
          value={title}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
          className="text-lg font-semibold border-0 px-0 shadow-none focus-visible:ring-0 h-auto"
        />
      </SheetHeader>

      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusId || undefined} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {(statuses || []).map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select value={priorityId || undefined} onValueChange={handlePriorityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {(priorities || []).map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Due date</Label>
          <Input
            type="date"
            value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
            onChange={(e) => handleDueDateChange(e.target.value)}
          />
        </div>

        {task.assignees?.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Assignees</Label>
            <div className="flex flex-wrap gap-2">
              {task.assignees.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={a.avatarUrl} />
                    <AvatarFallback className="text-[9px]">{a.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.labels?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.labels.map((l) => (
              <Badge
                key={l._id}
                variant="outline"
                style={{ borderColor: l.color, color: l.color }}
              >
                {l.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            onBlur={() => {
              if (descriptionDraft === null) return;
              updateMutation.mutate({
                taskId,
                data: { description: descriptionDraft } as Partial<Task>,
              });
              setDescriptionDraft(null);
            }}
            placeholder="Add a description…"
            rows={4}
          />
        </div>

        {(subtasks?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckSquare className="h-3 w-3" /> Subtasks
            </Label>
            <ul className="space-y-1">
              {subtasks!.map((st) => (
                <li
                  key={st._id}
                  className="text-sm px-2 py-1.5 rounded-md bg-secondary/50 truncate"
                >
                  {st.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Log time
            {task.spentHours != null && (
              <span className="ml-auto text-muted-foreground">
                {task.spentHours}h spent
                {task.estimatedHours != null ? ` / ${task.estimatedHours}h est.` : ''}
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0.25"
              step="0.25"
              placeholder="Hours"
              value={timeHours}
              onChange={(e) => setTimeHours(e.target.value)}
              className="w-28"
            />
            <Button variant="secondary" size="sm" onClick={handleLogTime}>
              Log
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> Comments
          </Label>
          {commentsQuery.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={c.authorId?.avatarUrl} />
                    <AvatarFallback className="text-[9px]">
                      {c.authorId?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 rounded-lg bg-secondary/40 px-3 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium truncate">
                        {c.authorId?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 whitespace-pre-wrap">
                      {commentService.extractText(c.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handlePostComment}
              disabled={isPostingComment || !newComment.trim()}
              className="self-end"
            >
              {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
            </Button>
          </div>
        </div>

        <Separator />

        <Button
          variant="outline"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete task
        </Button>
      </div>
    </>
  );
}

export function TaskDetailSheet({ taskId, open, onOpenChange }: TaskDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {taskId && open && (
          <TaskDetailBody key={taskId} taskId={taskId} onOpenChange={onOpenChange} />
        )}
      </SheetContent>
    </Sheet>
  );
}

export default TaskDetailSheet;
