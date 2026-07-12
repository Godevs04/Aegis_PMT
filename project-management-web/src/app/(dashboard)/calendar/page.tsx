'use client';

import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useTasksQuery } from '@/hooks/use-tasks';
import { useWorkspaceStore } from '@/store/workspace-store';
import { Task, TaskStatus, TaskPriority } from '@/services/task-service';

export default function CalendarPage() {
  const { currentWorkspaceId } = useWorkspaceStore();

  const { data: tasksData, isLoading } = useTasksQuery(
    currentWorkspaceId
      ? { workspaceId: currentWorkspaceId, limit: 200 }
      : null
  );

  const tasks: Task[] = tasksData?.data || [];

  // Convert tasks with due dates into FullCalendar events
  const events = useMemo(() => {
    const calendarEvents: any[] = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const statusObj = task.statusId as TaskStatus | undefined;
      const priorityObj = task.priorityId as TaskPriority | undefined;

      // Determine color based on priority or status
      let backgroundColor = '#6366F1'; // default primary
      if (priorityObj && typeof priorityObj === 'object') {
        backgroundColor = priorityObj.color;
      } else if (statusObj && typeof statusObj === 'object') {
        backgroundColor = statusObj.color;
      }

      // Check if overdue
      const isOverdue = !task.completedAt && new Date(task.dueDate) < new Date();
      if (isOverdue) backgroundColor = '#EF4444';

      // Check if completed
      if (task.completedAt) backgroundColor = '#10B981';

      calendarEvents.push({
        id: task._id,
        title: `${task.taskNumber ? `#${task.taskNumber} ` : ''}${task.title}`,
        date: task.dueDate.split('T')[0], // Date only for all-day events
        backgroundColor,
        borderColor: backgroundColor,
        textColor: '#ffffff',
        extendedProps: {
          task,
          isOverdue,
          isCompleted: !!task.completedAt,
        },
      });
    }

    return calendarEvents;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View task deadlines and milestones across your workspace.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#6366F1]" />
          <span className="text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#EF4444]" />
          <span className="text-muted-foreground">Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
          <span className="text-muted-foreground">Completed</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0 aegis-calendar">
        {events.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <CalendarIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No events to show</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Tasks with due dates will appear here. Set due dates on your tasks to see them on the calendar.
            </p>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="100%"
            eventDisplay="block"
            dayMaxEvents={3}
            eventTimeFormat={{ hour: undefined, minute: undefined }}
            eventClassNames="rounded-md text-[10px] font-medium px-1.5 py-0.5 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}
