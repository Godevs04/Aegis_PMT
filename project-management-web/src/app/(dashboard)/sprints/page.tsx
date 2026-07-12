'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Zap,
  Plus,
  Loader2,
  Play,
  CheckCircle2,
  Clock,
  Target,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useProjectsQuery } from '@/hooks/use-projects';
import {
  useSprintsQuery,
  useSprintAnalyticsQuery,
  useCreateSprintMutation,
  useStartSprintMutation,
  useCompleteSprintMutation,
} from '@/hooks/use-sprints';
import { Sprint } from '@/services/sprint-service';

interface CreateSprintFormValues {
  name: string;
  goal: string;
}

export default function SprintsPage() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: projects, isLoading: isLoadingProjects } = useProjectsQuery(currentWorkspaceId);
  const { data: sprints, isLoading: isLoadingSprints } = useSprintsQuery(selectedProjectId, currentWorkspaceId);
  const { data: analytics } = useSprintAnalyticsQuery(activeSprintId);

  const createMutation = useCreateSprintMutation();
  const startMutation = useStartSprintMutation();
  const completeMutation = useCompleteSprintMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSprintFormValues>({
    defaultValues: { name: '', goal: '' },
  });

  // Auto-select first project
  React.useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [projects, selectedProjectId]);

  // Find active sprint
  React.useEffect(() => {
    if (sprints) {
      const active = sprints.find((s) => s.status === 'active');
      setActiveSprintId(active?._id || null);
    }
  }, [sprints]);

  const onCreateSprint = async (data: CreateSprintFormValues) => {
    if (!selectedProjectId || !currentWorkspaceId) return;
    await createMutation.mutateAsync({
      name: data.name,
      goal: data.goal || undefined,
      projectId: selectedProjectId,
      workspaceId: currentWorkspaceId,
    });
    reset();
    setShowCreateForm(false);
  };

  const activeSprints = sprints?.filter((s) => s.status === 'active') || [];
  const planningSprints = sprints?.filter((s) => s.status === 'planning') || [];
  const completedSprints = sprints?.filter((s) => s.status === 'completed') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan and manage sprint iterations.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(true)} disabled={!selectedProjectId}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Sprint
        </Button>
      </div>

      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Project:</span>
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          {isLoadingProjects ? (
            <span className="px-3 py-1.5 text-xs text-muted-foreground">Loading...</span>
          ) : (
            projects?.slice(0, 5).map((project) => (
              <button
                key={project._id}
                onClick={() => setSelectedProjectId(project._id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedProjectId === project._id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {project.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <div className="p-5 rounded-xl border border-border bg-card/50">
          <h3 className="text-sm font-semibold text-foreground mb-3">Create Sprint</h3>
          <form onSubmit={handleSubmit(onCreateSprint)} className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="sprint-name" className="text-xs">Name</Label>
              <Input
                id="sprint-name"
                placeholder="e.g. Sprint 1"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="sprint-goal" className="text-xs">Goal (optional)</Label>
              <Input id="sprint-goal" placeholder="What to accomplish" {...register('goal')} />
            </div>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </form>
        </div>
      )}

      {/* Loading */}
      {isLoadingSprints && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Active Sprint */}
      {activeSprints.map((sprint) => (
        <div key={sprint._id} className="p-5 rounded-xl border border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{sprint.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">Active</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => completeMutation.mutate(sprint._id)}
              disabled={completeMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Complete Sprint
            </Button>
          </div>
          {sprint.goal && <p className="text-xs text-muted-foreground mb-3">{sprint.goal}</p>}

          {/* Analytics */}
          {analytics && analytics.sprintId === sprint._id && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground">Total Tasks</p>
                <p className="text-lg font-bold text-foreground">{analytics.totalTasks}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-green-400">{analytics.completedTasks}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground">Completion</p>
                <p className="text-lg font-bold text-primary">{analytics.completionRate}%</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground">Days Left</p>
                <p className="text-lg font-bold text-foreground">{analytics.remainingDays}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Planning Sprints */}
      {planningSprints.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Planning</h3>
          {planningSprints.map((sprint) => (
            <SprintRow
              key={sprint._id}
              sprint={sprint}
              onStart={() => startMutation.mutate(sprint._id)}
              isStarting={startMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {showCompleted ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Completed ({completedSprints.length})
          </button>
          {showCompleted && completedSprints.map((sprint) => (
            <SprintRow key={sprint._id} sprint={sprint} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingSprints && (!sprints || sprints.length === 0) && selectedProjectId && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Zap className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No sprints yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Create your first sprint to start planning iterations for this project.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create First Sprint
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sprint Row Component ────────────────────────────────────────────────────

function SprintRow({
  sprint,
  onStart,
  isStarting,
}: {
  sprint: Sprint;
  onStart?: () => void;
  isStarting?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors">
      <div className="flex items-center gap-3">
        {sprint.status === 'completed' ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : sprint.status === 'planning' ? (
          <Target className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Clock className="h-4 w-4 text-yellow-400" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">{sprint.name}</p>
          {sprint.goal && <p className="text-[10px] text-muted-foreground mt-0.5">{sprint.goal}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {sprint.startDate && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(sprint.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
          </span>
        )}
        {sprint.status === 'planning' && onStart && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onStart} disabled={isStarting}>
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}
      </div>
    </div>
  );
}
