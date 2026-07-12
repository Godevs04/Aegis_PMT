'use client';

import React, { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import { Task, TaskStatus } from '@/services/task-service';
import { useTasksQuery, useStatusesQuery, useMoveTaskMutation } from '@/hooks/use-tasks';
import { useWorkspaceStore } from '@/store/workspace-store';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

interface KanbanBoardProps {
  projectId: string;
  projectPrefix?: string;
  onTaskClick?: (task: Task) => void;
  onQuickCreate?: (statusId: string) => void;
}

export function KanbanBoard({ projectId, projectPrefix, onTaskClick, onQuickCreate }: KanbanBoardProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const { data: statusesData, isLoading: isLoadingStatuses } = useStatusesQuery(currentWorkspaceId);
  const { data: tasksData, isLoading: isLoadingTasks } = useTasksQuery(
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId, projectId, limit: 200, sortBy: 'order', sortOrder: 'asc' }
      : null
  );

  const moveTaskMutation = useMoveTaskMutation();

  const statuses: TaskStatus[] = statusesData || [];
  const tasks: Task[] = tasksData?.data || [];

  // Group tasks by statusId
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
        // Fallback: put in first column
        const firstStatusId = statuses[0]._id;
        if (!grouped[firstStatusId]) grouped[firstStatusId] = [];
        grouped[firstStatusId].push(task);
      }
    }
    // Sort each column by order
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.order - b.order);
    }
    return grouped;
  }, [tasks, statuses]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overData = over.data.current;

    let targetStatusId: string | undefined;
    let targetOrder = 0;

    if (overData?.type === 'column') {
      // Dropped on empty column
      targetStatusId = over.id as string;
      targetOrder = 0;
    } else if (overData?.type === 'task') {
      // Dropped on another task — get its status and insert at its position
      const overTask = overData.task as Task;
      targetStatusId = typeof overTask.statusId === 'object' ? overTask.statusId?._id : overTask.statusId;
      targetOrder = overTask.order;
    } else {
      // Dropped on a column droppable area
      targetStatusId = over.id as string;
      const columnTasks = tasksByStatus[targetStatusId] || [];
      targetOrder = columnTasks.length;
    }

    if (!targetStatusId) return;

    // Execute the move
    moveTaskMutation.mutate({
      taskId: activeTaskId,
      statusId: targetStatusId,
      order: targetOrder,
    });
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Could be used for real-time visual feedback
  };

  // Loading state
  if (isLoadingStatuses || isLoadingTasks) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No statuses configured
  if (statuses.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <div>
          <p className="text-sm text-muted-foreground">No task statuses configured for this workspace.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Go to workspace settings to add statuses.</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {statuses.map((status) => (
          <KanbanColumn
            key={status._id}
            status={status}
            tasks={tasksByStatus[status._id] || []}
            projectPrefix={projectPrefix}
            onTaskClick={onTaskClick}
            onQuickCreate={onQuickCreate}
          />
        ))}
      </div>

      {/* Drag Overlay — shows a ghost card while dragging */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90">
            <KanbanCard task={activeTask} projectPrefix={projectPrefix} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
