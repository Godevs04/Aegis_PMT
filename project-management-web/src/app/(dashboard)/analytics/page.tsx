'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Zap,
  AlertTriangle,
  TrendingUp,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useWorkspaceDashboardQuery } from '@/hooks/use-dashboard';

export default function WorkspaceDashboardPage() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data, isLoading } = useWorkspaceDashboardQuery(currentWorkspaceId);

  if (!currentWorkspaceId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No workspace selected</h2>
        <p className="text-sm text-muted-foreground">Select a workspace to view analytics.</p>
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
  const projectHealth = data?.projectHealth || [];
  const activities = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Workspace Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of project health, workload, and progress across your workspace.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatMini label="Projects" value={stats?.totalProjects ?? 0} icon={FolderKanban} color="text-primary" />
        <StatMini label="Total Tasks" value={stats?.totalTasks ?? 0} icon={CheckSquare} color="text-foreground" />
        <StatMini label="Completed" value={stats?.completedTasks ?? 0} icon={TrendingUp} color="text-green-400" />
        <StatMini label="In Progress" value={stats?.inProgressTasks ?? 0} icon={Zap} color="text-amber-400" />
        <StatMini label="Overdue" value={stats?.overdueTasks ?? 0} icon={AlertTriangle} color="text-red-400" />
        <StatMini label="Members" value={stats?.totalMembers ?? 0} icon={Users} color="text-blue-400" />
        <StatMini label="Active Sprints" value={stats?.activeSprints ?? 0} icon={Zap} color="text-purple-400" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Health */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Project Health</h2>
            <Link href="/projects" className="text-[10px] text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border/50">
            {projectHealth.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-muted-foreground">No projects yet.</div>
            ) : (
              projectHealth.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/20 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{project.prefix}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{project.progress}%</span>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Workspace Activity</h2>
          </div>
          <div className="px-5 py-3 space-y-4 max-h-[450px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No recent activity.</div>
            ) : (
              activities.map((activity: any) => (
                <div key={activity._id} className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0 mt-0.5">
                    {activity.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      <span className="font-medium">{activity.userId?.name || 'Someone'}</span>{' '}
                      <span className="text-muted-foreground">
                        {activity.action?.replace(/\./g, ' ')}
                      </span>
                      {activity.details?.name && (
                        <span className="text-foreground"> &ldquo;{activity.details.name}&rdquo;</span>
                      )}
                      {activity.details?.title && !activity.details?.name && (
                        <span className="text-foreground"> &ldquo;{activity.details.title}&rdquo;</span>
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

// ─── Sub Components ──────────────────────────────────────────────────────────

function StatMini({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card/50 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    planning: { label: 'Planning', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-400/10' },
    paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    completed: { label: 'Done', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  };
  const c = config[status] || config.active;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${c.color} ${c.bg}`}>
      {c.label}
    </span>
  );
}
