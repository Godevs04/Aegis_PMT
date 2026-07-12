'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock } from 'lucide-react';
import { Task, TaskPriority } from '@/services/task-service';

interface KanbanCardProps {
  task: Task;
  projectPrefix?: string;
  onClick?: (task: Task) => void;
}

const PRIORITY_INDICATORS: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-red-500', label: 'Critical' },
  high: { color: 'bg-orange-500', label: 'High' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  low: { color: 'bg-blue-500', label: 'Low' },
  none: { color: 'bg-gray-400', label: 'None' },
};

export function KanbanCard({ task, projectPrefix, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Resolve priority info
  const priorityObj = task.priorityId as TaskPriority | undefined;
  const prioritySlug = priorityObj?.slug || 'none';
  const priorityIndicator = PRIORITY_INDICATORS[prioritySlug] || PRIORITY_INDICATORS.none;

  // Check if overdue
  const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      className={`
        group p-3 rounded-lg border border-border bg-card hover:border-primary/30
        cursor-grab active:cursor-grabbing transition-all duration-150
        ${isDragging ? 'opacity-50 shadow-xl scale-[1.02] ring-2 ring-primary/20' : 'hover:shadow-md'}
      `}
    >
      {/* Top: Task number + Priority dot */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">
          {projectPrefix ? `${projectPrefix}-${task.taskNumber}` : `#${task.taskNumber}`}
        </span>
        <div className={`h-2 w-2 rounded-full ${priorityIndicator.color}`} title={priorityIndicator.label} />
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label._id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ backgroundColor: `${label.color}20`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: Assignees + Due date */}
      <div className="flex items-center justify-between mt-auto">
        {/* Assignees */}
        <div className="flex -space-x-1.5">
          {task.assignees?.slice(0, 3).map((user) => (
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
          {task.assignees && task.assignees.length > 3 && (
            <div className="h-5 w-5 rounded-full bg-secondary border border-background flex items-center justify-center text-[8px] text-muted-foreground">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <span
            className={`flex items-center gap-0.5 text-[10px] ${
              isOverdue ? 'text-red-400' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-2.5 w-2.5" />
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* Time estimate */}
        {!task.dueDate && task.estimatedHours && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {task.estimatedHours}h
          </span>
        )}
      </div>
    </div>
  );
}

export default KanbanCard;
