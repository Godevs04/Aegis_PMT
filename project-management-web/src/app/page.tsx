'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import WorkspaceSwitcher from '@/components/workspace/workspace-switcher';
import { useWorkspacesQuery } from '@/hooks/use-workspaces';
import CreateWorkspaceModal from '@/components/workspace/create-workspace-modal';
import { useProjectsQuery } from '@/hooks/use-projects';
import CreateProjectModal from '@/components/project/create-project-modal';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useTasksQuery, useUpdateTaskMutation } from '@/hooks/use-tasks';
import CreateTaskModal from '@/components/task/create-task-modal';
import NotificationBell from '@/components/notification/notification-bell';
import { useWorkspaceActivitiesQuery } from '@/hooks/use-activities';
import { TaskDetailModal } from '@/components/task/task-detail-modal';
import { Task } from '@/services/task-service';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useWorkspacesQuery();
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data: projects, isLoading: isLoadingProjects } = useProjectsQuery(currentWorkspaceId);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const { data: tasks, isLoading: isLoadingTasks } = useTasksQuery(currentWorkspaceId);
  const updateTaskMutation = useUpdateTaskMutation();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { data: activities, isLoading: isLoadingActivities } = useWorkspaceActivitiesQuery(currentWorkspaceId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      clearAuth();
      router.push('/login');
    } catch {
      clearAuth();
      router.push('/login');
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Render Premium Landing Page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 font-sans text-white">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center space-x-2 select-none">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Aegis</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign In
            </a>
            <a href="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90 transition-colors">
              Get Started
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center py-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-pulse">
            <span>✨ Welcome to Aegis Enterprise Project Management</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Manage projects with <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              speed and precision.
            </span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground mb-8 leading-8">
            An enterprise-grade SaaS project management platform built for modern development teams. Track tasks, view boards, plan calendars, and launch fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a href="/register" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-white shadow hover:bg-primary/90 transition-colors">
              Create Account
            </a>
            <a href="/login" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg border border-border bg-zinc-900/50 hover:bg-zinc-800/50 px-8 text-sm font-medium text-white transition-colors">
              Sign In to Aegis
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 border-t border-border bg-zinc-950/80 backdrop-blur-md text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Aegis Corp. All rights reserved.
        </footer>
      </div>
    );
  }

  // Render Dashboard Interface if authenticated
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-zinc-900/40 backdrop-blur-sm flex flex-col">
        <div className="flex items-center space-x-2 px-6 py-4 border-b border-border">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="text-sm font-bold tracking-tight">Aegis</span>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <WorkspaceSwitcher />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-md bg-zinc-800/50 text-white font-medium text-sm transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>Dashboard</span>
          </a>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-muted-foreground text-sm font-medium">
              <div className="flex items-center space-x-3">
                <FolderKanban className="h-4 w-4" />
                <span>Projects</span>
              </div>
              {currentWorkspaceId && (
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="p-0.5 rounded hover:bg-zinc-800 text-muted-foreground hover:text-white transition-colors"
                  title="Create Project"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {/* Dynamic Project List */}
            <div className="pl-7 pr-2 space-y-0.5 max-h-40 overflow-y-auto">
              {isLoadingProjects ? (
                <span className="text-[10px] text-muted-foreground block py-1">Loading...</span>
              ) : !projects || projects.length === 0 ? (
                <span className="text-[10px] text-muted-foreground block py-1">No projects</span>
              ) : (
                projects.map((project) => (
                  <button
                    key={project._id}
                    className="flex items-center space-x-2 w-full px-2 py-1 rounded text-xs text-muted-foreground hover:bg-zinc-800/40 hover:text-white transition-colors text-left truncate"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-zinc-800/30 hover:text-white text-sm transition-colors"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Tasks</span>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-zinc-800/30 hover:text-white text-sm transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
        </nav>

        {/* User Session Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
              {user?.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-white">
                {user?.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-muted-foreground hover:text-destructive transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Dashboard Screen */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-border px-8 flex items-center justify-between bg-zinc-900/20 backdrop-blur-sm">
          <div className="flex items-center max-w-xs w-full bg-zinc-900/60 border border-border rounded-md px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input
              placeholder="Search anything..."
              className="bg-transparent text-xs outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
          </div>
        </header>

        {/* Dashboard Shell Content */}
        {isLoadingWorkspaces ? (
          <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        ) : !workspaces || workspaces.length === 0 ? (
          <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-950">
            <div className="max-w-md p-8 border border-border bg-card/20 rounded-xl space-y-4">
              <h2 className="text-xl font-bold text-white">Welcome to Aegis</h2>
              <p className="text-xs text-muted-foreground leading-6">
                You do not have any workspaces yet. Workspaces let you organize your projects, tasks, and team members in one place.
              </p>
              <Button onClick={() => setIsWorkspaceModalOpen(true)} className="shadow-lg shadow-primary/10">
                <Plus className="h-4 w-4 mr-1.5" /> Create Your First Workspace
              </Button>
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Welcome back, {user?.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Here is a summary of your workspace activities today.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsProjectModalOpen(true)} className="shadow-lg shadow-primary/10">
                <Plus className="h-4 w-4 mr-1.5" /> New Project
              </Button>
            </div>

            {/* Metric Dashboard Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 border border-border bg-card/40 rounded-xl flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">
                    Tasks Assigned
                  </span>
                  <h3 className="text-2xl font-bold">
                    {tasks?.filter(t => t.assigneeId?._id === user?.id || t.assigneeId === user?.id).length || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="p-5 border border-border bg-card/40 rounded-xl flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">
                    In Progress
                  </span>
                  <h3 className="text-2xl font-bold">
                    {tasks?.filter(t => t.status === 'in_progress').length || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="p-5 border border-border bg-card/40 rounded-xl flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground font-medium">
                    Completed Tasks
                  </span>
                  <h3 className="text-2xl font-bold">
                    {tasks?.filter(t => t.status === 'done').length || 0}
                  </h3>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Today's Tasks Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Workspace Tasks */}
              <div className="lg:col-span-2 p-6 border border-border bg-card/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-white">
                    Workspace Tasks
                  </h2>
                  <Button size="sm" onClick={() => setIsTaskModalOpen(true)} variant="outline" className="h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoadingTasks ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">Loading tasks...</div>
                  ) : !tasks || tasks.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">No tasks found. Create a task to get started!</div>
                  ) : (
                    tasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => {
                          setSelectedTask(task);
                          setIsTaskDetailModalOpen(true);
                        }}
                        className="p-4 border border-border/60 bg-zinc-900/40 rounded-lg flex justify-between items-center hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              task.status === 'done'
                                ? 'bg-emerald-400'
                                : task.status === 'in_progress'
                                ? 'bg-blue-400'
                                : 'bg-zinc-400'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-white">
                              {task.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {task.projectId?.name || 'No Project'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${
                              task.priority === 'urgent' || task.priority === 'high'
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : task.priority === 'medium'
                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workspace Activity Feed */}
              <div className="p-6 border border-border bg-card/30 rounded-xl space-y-4">
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  Recent Activity
                </h2>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {isLoadingActivities ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">Loading activities...</div>
                  ) : !activities || activities.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-4 text-center">No activity logged yet.</div>
                  ) : (
                    activities.map((activity) => {
                      let actionText = '';
                      if (activity.action === 'TASK_CREATED') {
                        actionText = `created task "${activity.details?.title || 'Unknown Task'}"`;
                      } else if (activity.action === 'TASK_STATUS_UPDATED') {
                        actionText = `changed status of "${activity.details?.title}" to ${activity.details?.nextStatus}`;
                      } else if (activity.action === 'TASK_COMMENT_ADDED') {
                        actionText = `commented on "${activity.details?.title}"`;
                      } else if (activity.action === 'PROJECT_CREATED') {
                        actionText = `created project "${activity.details?.name}"`;
                      } else if (activity.action === 'WORKSPACE_CREATED') {
                        actionText = `initialized workspace context`;
                      } else if (activity.action === 'MEMBER_JOINED') {
                        actionText = `joined the workspace as ${activity.details?.role}`;
                      } else {
                        actionText = `triggered an action`;
                      }

                      return (
                        <div key={activity._id} className="flex items-start space-x-2.5 text-[11px] leading-relaxed">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center font-bold text-[9px] text-primary shrink-0">
                            {activity.userId?.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-300">
                              <strong className="text-white font-medium">{activity.userId?.name}</strong>{' '}
                              {actionText}
                            </p>
                            <span className="text-[9px] text-muted-foreground mt-0.5 block">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />

      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
        }}
        task={tasks?.find((t) => t._id === selectedTask?._id) || null}
        workspaceId={currentWorkspaceId}
      />
    </div>
  );
}
