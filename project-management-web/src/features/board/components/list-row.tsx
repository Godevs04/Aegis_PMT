'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@/services/task-service';

interface ListRowProps {
  task: Task;
  projectPrefix?: string;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
  none: 'text-gray-400',
};

export function ListRow({ task, projectPrefix, isSelected, onSelect, onClick }: ListRowProps) {
  const statusObj = task.statusId as TaskStatus | undefined;
  const priorityObj = task.priorityId as TaskPriority | undefined;
  const prioritySlug = priorityObj?.slug || 'none';
  const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date();

  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 border-b border-border/50 
        hover:bg-secondary/30 transition-colors cursor-pointer group
        ${isSelected ? 'bg-primary/5' : ''}
      `}
      onClick={() => onClick?.(task)}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect(task._id);
        }}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-primary focus:ring-offset-background shrink-0"
      />

      {/* Task number */}
      <span className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">
        {projectPrefix ? `${projectPrefix}-${task.taskNumber}` : `#${task.taskNumber}`}
      </span>

      {/* Status dot */}
      <div
        className="h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: statusObj?.color || '#6B7280' }}
        title={statusObj?.name || 'Unknown'}
      />

      {/* Title */}
      <span className="flex-1 text-sm text-foreground truncate group-hover:text-primary transition-colors">
        {task.title}
      </span>

      {/* Priority */}
      <span className={`text-[10px] font-medium w-16 text-right shrink-0 ${PRIORITY_COLORS[prioritySlug]}`}>
        {priorityObj?.name || '—'}
      </span>

      {/* Assignees */}
      <div className="flex -space-x-1 w-16 justify-end shrink-0">
        {task.assignees?.slice(0, 2).map((user) => (
          <div
            key={user._id}
            className="h-5 w-5 rounded-full bg-primary/10 border border-background flex items-center justify-center text-[8px] font-semibold text-primary"
            title={user.name}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        ))}
        {task.assignees && task.assignees.length > 2 && (
          <div className="h-5 w-5 rounded-full bg-secondary border border-background flex items-center justify-center text-[8px] text-muted-foreground">
            +{task.assignees.length - 2}
          </div>
        )}
      </div>

      {/* Due date */}
      <span
        className={`flex items-center gap-1 text-[10px] w-20 justify-end shrink-0 ${
          isOverdue ? 'text-red-400' : 'text-muted-foreground'
        }`}
      >
        {task.dueDate ? (
          <>
            <Calendar className="h-2.5 w-2.5" />
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </>
        ) : (
          '—'
        )}
      </span>
    </div>
  );
}

export default ListRow;
