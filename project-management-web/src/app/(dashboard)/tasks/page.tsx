'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import {
  useTasksQuery,
  useStatusesQuery,
  usePrioritiesQuery,
} from '@/hooks/use-tasks';
import { Task } from '@/services/task-service';
import { TaskDetailSheet } from '@/features/tasks/components/task-detail-sheet';
import { CreateTaskDialog } from '@/features/tasks/components/create-task-dialog';

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageSkeleton />}>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-full max-w-md" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'me' | 'all'>('me');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createDismissed, setCreateDismissed] = useState(false);

  const createFromUrl = searchParams.get('create') === 'true' && !createDismissed;
  const [createManual, setCreateManual] = useState(false);
  const createOpen = createFromUrl || createManual;

  const setCreateOpen = (open: boolean) => {
    if (open) {
      setCreateManual(true);
      setCreateDismissed(false);
    } else {
      setCreateManual(false);
      setCreateDismissed(true);
    }
  };

  const filters = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return {
      workspaceId: currentWorkspaceId,
      search: search || undefined,
      statusId: statusFilter !== 'all' ? statusFilter : undefined,
      priorityId: priorityFilter !== 'all' ? priorityFilter : undefined,
      assignee: assigneeFilter === 'me' && user?.id ? user.id : undefined,
      limit: 100,
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
    };
  }, [currentWorkspaceId, search, statusFilter, priorityFilter, assigneeFilter, user?.id]);

  const { data, isLoading } = useTasksQuery(filters);
  const { data: statuses } = useStatusesQuery(currentWorkspaceId);
  const { data: priorities } = usePrioritiesQuery(currentWorkspaceId);

  const tasks = data?.data || [];

  if (!currentWorkspaceId) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No workspace selected"
        description="Select a workspace from the sidebar to view tasks."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage work across your workspace.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="pl-8 h-9"
          />
        </div>
        <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v as 'me' | 'all')}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="me">Assigned to me</SelectItem>
            <SelectItem value="all">All tasks</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(statuses || []).map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {(priorities || []).map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Create a task or adjust your filters to see work here."
          action={{ label: 'Create Task', onClick: () => setCreateOpen(true), icon: Plus }}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-card/40">
          {tasks.map((task) => (
            <TaskRow
              key={task._id}
              task={task}
              onClick={() => setSelectedTaskId(task._id)}
            />
          ))}
        </div>
      )}

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
      />
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => setSelectedTaskId(id)}
      />
    </div>
  );
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const status = typeof task.statusId === 'object' ? task.statusId : null;
  const priority = typeof task.priorityId === 'object' ? task.priorityId : null;
  const projectName =
    typeof task.projectId === 'object' ? task.projectId?.name : null;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    status?.category !== 'done' &&
    status?.category !== 'cancelled';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">
            #{task.taskNumber}
          </span>
          <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
        </div>
        {projectName && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{projectName}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status && (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.color }} />
            {status.name}
          </Badge>
        )}
        {priority && (
          <Badge variant="outline" className="text-[10px]" style={{ borderColor: priority.color, color: priority.color }}>
            {priority.name}
          </Badge>
        )}
        {task.dueDate && (
          <span
            className={`flex items-center gap-1 text-[10px] ${
              isOverdue ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  );
}
