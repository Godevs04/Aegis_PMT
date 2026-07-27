import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import teamService, { CreateTeamData, Team } from '../services/team-service';

export const TEAMS_QUERY_KEY = 'teams';

export function useTeamsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [TEAMS_QUERY_KEY, workspaceId],
    queryFn: () => teamService.getByWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useTeamQuery(teamId: string | null) {
  return useQuery({
    queryKey: [TEAMS_QUERY_KEY, 'detail', teamId],
    queryFn: () => teamService.getById(teamId!),
    enabled: !!teamId,
  });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeamData) => teamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}

export function useUpdateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: Partial<Pick<Team, 'name' | 'description' | 'color'>>;
    }) => teamService.update(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamService.delete(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}
