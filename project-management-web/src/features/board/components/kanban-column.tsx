'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/services/task-service';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  projectPrefix?: string;
  onTaskClick?: (task: Task) => void;
  onQuickCreate?: (statusId: string) => void;
}

export function KanbanColumn({ status, tasks, projectPrefix, onTaskClick, onQuickCreate }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status._id,
    data: {
      type: 'column',
      status,
    },
  });

  const taskIds = tasks.map((t) => t._id);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <h3 className="text-xs font-semibold text-foreground">{status.name}</h3>
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onQuickCreate?.(status._id)}
          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Add task"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Task List (droppable area) */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 space-y-2 p-1 rounded-lg min-h-[200px] transition-colors
          ${isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''}
        `}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task._id}
              task={task}
              projectPrefix={projectPrefix}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {/* Empty column placeholder */}
        {tasks.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 text-[10px] text-muted-foreground/50 border border-dashed border-border rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;
