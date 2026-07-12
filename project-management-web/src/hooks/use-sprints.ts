import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sprintService from '../services/sprint-service';

export const SPRINTS_QUERY_KEY = 'sprints';

export function useSprintsQuery(projectId: string | null, workspaceId: string | null) {
  return useQuery({
    queryKey: [SPRINTS_QUERY_KEY, projectId, workspaceId],
    queryFn: () => sprintService.getByProject(projectId!, workspaceId!),
    enabled: !!projectId && !!workspaceId,
  });
}

export function useSprintQuery(sprintId: string | null) {
  return useQuery({
    queryKey: [SPRINTS_QUERY_KEY, 'detail', sprintId],
    queryFn: () => sprintService.getById(sprintId!),
    enabled: !!sprintId,
  });
}

export function useSprintAnalyticsQuery(sprintId: string | null) {
  return useQuery({
    queryKey: [SPRINTS_QUERY_KEY, 'analytics', sprintId],
    queryFn: () => sprintService.getAnalytics(sprintId!),
    enabled: !!sprintId,
  });
}

export function useBacklogQuery(projectId: string | null, workspaceId: string | null) {
  return useQuery({
    queryKey: [SPRINTS_QUERY_KEY, 'backlog', projectId],
    queryFn: () => sprintService.getBacklog(projectId!, workspaceId!),
    enabled: !!projectId && !!workspaceId,
  });
}

export function useCreateSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; goal?: string; projectId: string; workspaceId: string; startDate?: string; endDate?: string }) =>
      sprintService.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [SPRINTS_QUERY_KEY] }); },
  });
}

export function useStartSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintService.start(sprintId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [SPRINTS_QUERY_KEY] }); },
  });
}

export function useCompleteSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintService.complete(sprintId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [SPRINTS_QUERY_KEY] }); },
  });
}

export function useDeleteSprintMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sprintId: string) => sprintService.delete(sprintId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [SPRINTS_QUERY_KEY] }); },
  });
}
