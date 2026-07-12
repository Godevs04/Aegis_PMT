'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  FolderKanban,
  ArrowLeft,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { useProjectQuery } from '@/hooks/use-projects';
import { useProjectDashboardQuery } from '@/hooks/use-dashboard';
import { useWorkspaceStore } from '@/store/workspace-store';

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { currentWorkspaceId } = useWorkspaceStore();

  const { data: project, isLoading: isLoadingProject } = useProjectQuery(projectId);
  const { data: dashboard, isLoading: isLoadingDashboard } = useProjectDashboardQuery(projectId, currentWorkspaceId);

  if (isLoadingProject || isLoadingDashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Project not found</h2>
        <Link href="/projects" className="text-sm text-primary hover:underline">Back to Projects</Link>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const byStatus = dashboard?.byStatus || {};
  const sprints = dashboard?.sprints || [];
  const milestones = dashboard?.milestones || [];
  const activities = dashboard?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">{project.name} — Dashboard</h1>
          <p className="text-xs font-mono text-muted-foreground">{project.prefix}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats?.totalTasks ?? 0} icon={CheckSquare} color="text-foreground" />
        <StatCard label="Completed" value={stats?.completedTasks ?? 0} icon={TrendingUp} color="text-green-400" />
        <StatCard label="Overdue" value={stats?.overdueTasks ?? 0} icon={AlertTriangle} color="text-red-400" />
        <StatCard label="Completion" value={`${stats?.completionRate ?? 0}%`} icon={Target} color="text-primary" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Breakdown by Status */}
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Tasks by Status</h2>
          </div>
          <div className="p-5 space-y-3">
            {Object.keys(byStatus).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No tasks yet.</p>
            ) : (
              Object.entries(byStatus).map(([statusName, count]) => (
                <div key={statusName} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{statusName}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${stats?.totalTasks ? ((count as number) / stats.totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-6 text-right">{count as number}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sprints */}
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Sprints</h2>
          </div>
          <div className="p-5 space-y-3">
            {sprints.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No sprints.</p>
            ) : (
              sprints.map((sprint: any) => (
                <div key={sprint.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-3.5 w-3.5 ${sprint.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs text-foreground">{sprint.name}</span>
                  </div>
                  <SprintBadge status={sprint.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Milestones</h2>
          </div>
          <div className="p-5 space-y-3">
            {milestones.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No milestones.</p>
            ) : (
              milestones.map((m: any) => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">{m.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${m.status === 'completed' ? 'bg-green-400' : 'bg-primary'}`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  {m.dueDate && (
                    <p className="text-[10px] text-muted-foreground">
                      Due {new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {activities.length > 0 && (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Project Activity</h2>
          </div>
          <div className="px-5 py-3 space-y-3 max-h-[250px] overflow-y-auto">
            {activities.map((activity: any) => (
              <div key={activity._id} className="flex items-center gap-2.5 text-xs">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                  {activity.userId?.name?.charAt(0) || '?'}
                </div>
                <span className="text-muted-foreground">
                  <span className="text-foreground font-medium">{activity.userId?.name}</span>{' '}
                  {activity.action?.replace(/\./g, ' ')}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0">
                  {new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function SprintBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    planning: { label: 'Planning', cls: 'text-blue-400 bg-blue-400/10' },
    active: { label: 'Active', cls: 'text-green-400 bg-green-400/10' },
    completed: { label: 'Done', cls: 'text-emerald-400 bg-emerald-400/10' },
    cancelled: { label: 'Cancelled', cls: 'text-gray-400 bg-gray-400/10' },
  };
  const c = config[status] || config.planning;
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${c.cls}`}>{c.label}</span>;
}
