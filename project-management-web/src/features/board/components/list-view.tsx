'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus } from '@/services/task-service';
import { useTasksQuery, useStatusesQuery, useBulkUpdateMutation, useDeleteTaskMutation } from '@/hooks/use-tasks';
import { useWorkspaceStore } from '@/store/workspace-store';
import { ListRow } from './list-row';

interface ListViewProps {
  projectId: string;
  projectPrefix?: string;
  onTaskClick?: (task: Task) => void;
}

export function ListView({ projectId, projectPrefix, onTaskClick }: ListViewProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const { data: statusesData, isLoading: isLoadingStatuses } = useStatusesQuery(currentWorkspaceId);
  const { data: tasksData, isLoading: isLoadingTasks } = useTasksQuery(
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId, projectId, limit: 200, sortBy: 'order', sortOrder: 'asc' }
      : null
  );

  const bulkUpdateMutation = useBulkUpdateMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const statuses: TaskStatus[] = statusesData || [];
  const tasks: Task[] = tasksData?.data || [];

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const status of statuses) {
      grouped[status._id] = [];
    }
    for (const task of tasks) {
      const statusId = typeof task.statusId === 'object' ? task.statusId?._id : task.statusId;
      if (statusId && grouped[statusId]) {
        grouped[statusId].push(task);
      } else if (statuses.length > 0) {
        const first = statuses[0]._id;
        if (!grouped[first]) grouped[first] = [];
        grouped[first].push(task);
      }
    }
    return grouped;
  }, [tasks, statuses]);

  const toggleSection = (statusId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t._id)));
    }
  };

  const handleBulkStatusChange = (statusId: string) => {
    if (selectedTasks.size === 0) return;
    bulkUpdateMutation.mutate(
      { taskIds: Array.from(selectedTasks), statusId },
      { onSuccess: () => setSelectedTasks(new Set()) }
    );
  };

  const handleBulkDelete = () => {
    if (selectedTasks.size === 0) return;
    // Delete one by one (bulk delete not in API, but could be added)
    const ids = Array.from(selectedTasks);
    Promise.all(ids.map((id) => deleteTaskMutation.mutateAsync(id))).then(() => {
      setSelectedTasks(new Set());
    });
  };

  if (isLoadingStatuses || isLoadingTasks) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Bulk Action Toolbar */}
      {selectedTasks.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg mb-3">
          <span className="text-xs font-medium text-foreground">
            {selectedTasks.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          {/* Move to status */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Move to:</span>
            {statuses.slice(0, 4).map((s) => (
              <button
                key={s._id}
                onClick={() => handleBulkStatusChange(s._id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title={s.name}
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedTasks(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        <input
          type="checkbox"
          checked={selectedTasks.size === tasks.length && tasks.length > 0}
          onChange={selectAll}
          className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-primary shrink-0"
        />
        <span className="w-16 shrink-0">ID</span>
        <span className="w-2.5 shrink-0" />
        <span className="flex-1">Title</span>
        <span className="w-16 text-right shrink-0">Priority</span>
        <span className="w-16 text-right shrink-0">Assignee</span>
        <span className="w-20 text-right shrink-0">Due</span>
      </div>

      {/* Status sections */}
      {statuses.map((status) => {
        const sectionTasks = tasksByStatus[status._id] || [];
        const isCollapsed = collapsedSections.has(status._id);

        return (
          <div key={status._id}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(status._id)}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary/30 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-xs font-semibold text-foreground">{status.name}</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                {sectionTasks.length}
              </span>
            </button>

            {/* Tasks in section */}
            {!isCollapsed && (
              <div>
                {sectionTasks.length === 0 ? (
                  <div className="px-10 py-3 text-[10px] text-muted-foreground/50">
                    No tasks in this status
                  </div>
                ) : (
                  sectionTasks.map((task) => (
                    <ListRow
                      key={task._id}
                      task={task}
                      projectPrefix={projectPrefix}
                      isSelected={selectedTasks.has(task._id)}
                      onSelect={toggleTaskSelection}
                      onClick={onTaskClick}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create a task to see it here.</p>
        </div>
      )}
    </div>
  );
}

export default ListView;
