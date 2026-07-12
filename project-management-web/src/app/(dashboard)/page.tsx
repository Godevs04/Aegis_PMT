'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentWorkspaceId } = useWorkspaceStore();

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

      {/* Placeholder cards — will be replaced with real dashboard widgets in Task 30 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned to Me', value: '—', color: 'text-primary' },
          { label: 'In Progress', value: '—', color: 'text-amber-400' },
          { label: 'Completed Today', value: '—', color: 'text-green-400' },
          { label: 'Overdue', value: '—', color: 'text-red-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border border-border bg-card/50"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!currentWorkspaceId && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No workspace selected
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Select a workspace from the sidebar to view your dashboard, or create a new one to get started.
          </p>
        </div>
      )}
    </div>
  );
}
