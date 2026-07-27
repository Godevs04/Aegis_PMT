'use client';

import React, { useState } from 'react';
import { Users, Plus, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useTeamsQuery, useCreateTeamMutation, useDeleteTeamMutation } from '@/hooks/use-teams';
import { Team, TeamUser } from '@/services/team-service';

const TEAM_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function TeamsPage() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { data: teams, isLoading } = useTeamsQuery(currentWorkspaceId);
  const createMutation = useCreateTeamMutation();
  const deleteMutation = useDeleteTeamMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspaceId || !name.trim()) {
      setError('Team name is required.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        workspaceId: currentWorkspaceId,
        color,
      });
      setCreateOpen(false);
      setName('');
      setDescription('');
      setColor(TEAM_COLORS[0]);
      setError(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to create team.');
    }
  };

  if (!currentWorkspaceId) {
    return (
      <EmptyState
        icon={Users}
        title="No workspace selected"
        description="Select a workspace from the sidebar to manage teams."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teams</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize people into teams for clearer ownership and collaboration.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Team
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create your first team to group members and track ownership."
          action={{ label: 'Create Team', onClick: () => setCreateOpen(true), icon: Plus }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const members = (team.members || []) as TeamUser[];
            const lead = typeof team.leadId === 'object' ? team.leadId : null;
            return (
              <button
                key={team._id}
                type="button"
                onClick={() => setSelectedTeam(team)}
                className="text-left p-5 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-card transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm shrink-0"
                    style={{ backgroundColor: team.color || '#6366F1' }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary truncate transition-colors">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map((m) => (
                      <Avatar key={m._id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={m.avatarUrl} />
                        <AvatarFallback className="text-[8px]">{m.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {members.length === 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> No members
                      </span>
                    )}
                    {members.length > 4 && (
                      <span className="h-6 w-6 rounded-full bg-secondary border-2 border-card text-[9px] flex items-center justify-center">
                        +{members.length - 4}
                      </span>
                    )}
                  </div>
                  {lead && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                      Lead: {lead.name}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>Add a new team to this workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="team-name">Name</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team-desc">Description</Label>
              <Textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selectedTeam} onOpenChange={(o) => !o && setSelectedTeam(null)}>
        <DialogContent>
          {selectedTeam && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span
                    className="h-7 w-7 rounded-md inline-flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: selectedTeam.color || '#6366F1' }}
                  >
                    {selectedTeam.name.charAt(0)}
                  </span>
                  {selectedTeam.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedTeam.description || 'No description'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Members</Label>
                {((selectedTeam.members || []) as TeamUser[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No members yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {((selectedTeam.members || []) as TeamUser[]).map((m) => (
                      <li key={m._id} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.avatarUrl} />
                          <AvatarFallback className="text-[9px]">{m.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          {m.email && (
                            <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive"
                  onClick={async () => {
                    if (!window.confirm('Delete this team?')) return;
                    await deleteMutation.mutateAsync(selectedTeam._id);
                    setSelectedTeam(null);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Delete team
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
