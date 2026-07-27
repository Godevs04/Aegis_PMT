'use client';

import React, { useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useWorkspaceActivitiesQuery } from '@/hooks/use-activities';
import { useProjectsQuery } from '@/hooks/use-projects';
import { Activity } from '@/services/activity-service';

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityPage() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const { data: projects } = useProjectsQuery(currentWorkspaceId);
  const { data: activities, isLoading } = useWorkspaceActivitiesQuery(currentWorkspaceId, {
    projectId: projectFilter !== 'all' ? projectFilter : undefined,
    limit: 50,
  });

  if (!currentWorkspaceId) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No workspace selected"
        description="Select a workspace from the sidebar to view activity."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A live timeline of what&apos;s happening across your workspace.
          </p>
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(projects || []).map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity yet"
          description="Actions across projects and tasks will show up here."
        />
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          <ul className="space-y-1">
            {activities.map((activity) => (
              <ActivityItem key={activity._id} activity={activity} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const user = activity.userId;
  const projectName = activity.projectId?.name;
  const taskTitle = activity.taskId?.title;

  return (
    <li className="relative flex gap-3 pl-0 py-3">
      <Avatar className="h-8 w-8 shrink-0 z-10 border-2 border-background">
        <AvatarImage src={user?.avatarUrl} />
        <AvatarFallback className="text-[10px]">{user?.name?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-foreground">
          <span className="font-medium">{user?.name || 'Someone'}</span>{' '}
          <span className="text-muted-foreground">{formatAction(activity.action)}</span>
          {taskTitle && (
            <>
              {' '}
              <span className="font-medium text-foreground">{taskTitle}</span>
            </>
          )}
          {projectName && (
            <span className="text-muted-foreground"> in {projectName}</span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(activity.createdAt)}</p>
      </div>
    </li>
  );
}
