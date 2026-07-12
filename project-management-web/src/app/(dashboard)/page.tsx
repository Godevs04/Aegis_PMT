'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  Loader2,
  LayoutDashboard,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { usePersonalDashboardQuery } from '@/hooks/use-dashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data, isLoading } = usePersonalDashboardQuery(currentWorkspaceId);

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No workspace selected</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Select a workspace from the sidebar to view your dashboard.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = data?.stats;
  const tasks = data?.tasks || [];
  const activities = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Assigned to Me"
          value={stats?.assignedCount ?? 0}
          icon={CheckSquare}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgressCount ?? 0}
          icon={Clock}
          color="text-amber-400"
          bgColor="bg-amber-400/10"
        />
        <StatCard
          label="Completed Today"
          value={stats?.completedTodayCount ?? 0}
          icon={TrendingUp}
          color="text-green-400"
          bgColor="bg-green-400/10"
        />
        <StatCard
          label="Overdue"
          value={stats?.overdueCount ?? 0}
          icon={AlertTriangle}
          color="text-red-400"
          bgColor="bg-red-400/10"
        />
        <StatCard
          label="Due Tomorrow"
          value={stats?.dueTomorrowCount ?? 0}
          icon={CalendarClock}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Tasks */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">My Tasks</h2>
            <Link href="/tasks" className="text-[10px] text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {tasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">
                No tasks assigned to you. Enjoy the break!
              </div>
            ) : (
              tasks.slice(0, 8).map((task: any) => {
                const status = task.statusId;
                const priority = task.priorityId;
                const project = task.projectId;
                const isOverdue = task.dueDate && !task.completedAt && new Date(task.dueDate) < new Date();

                return (
                  <div
                    key={task._id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: status?.color || '#6B7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {project?.prefix && `${project.prefix}-${task.taskNumber}`}
                        {project?.name && ` · ${project.name}`}
                      </p>
                    </div>
                    {priority && (
                      <span
                        className="text-[10px] font-medium shrink-0"
                        style={{ color: priority.color }}
                      >
                        {priority.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`text-[10px] shrink-0 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            <Link href="/activity" className="text-[10px] text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="px-5 py-3 space-y-4 max-h-[400px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent activity.
              </div>
            ) : (
              activities.map((activity: any) => (
                <div key={activity._id} className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0 mt-0.5">
                    {activity.userId?.name?.charAt(0) || <Activity className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-medium">{activity.action?.replace(/\./g, ' ').replace(/^\w/, (c: string) => c.toUpperCase())}</span>
                      {activity.details?.title && (
                        <span className="text-muted-foreground"> — {activity.details.title}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
        <div className={`h-7 w-7 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
