import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService, { CreateProjectData, ProjectStatus } from '../services/project-service';

export const PROJECTS_QUERY_KEY = 'projects';

/**
 * Hook to retrieve all projects in a workspace (with optional filters)
 */
export function useProjectsQuery(
  workspaceId: string | null,
  filters?: { status?: ProjectStatus; search?: string }
) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, workspaceId, filters],
    queryFn: () => projectService.getWorkspaceProjects(workspaceId || '', filters),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to get single project
 */
export function useProjectQuery(projectId: string | null) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, 'detail', projectId],
    queryFn: () => projectService.getProject(projectId || ''),
    enabled: !!projectId,
  });
}

/**
 * Hook to get project analytics
 */
export function useProjectAnalyticsQuery(projectId: string | null) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, 'analytics', projectId],
    queryFn: () => projectService.getAnalytics(projectId || ''),
    enabled: !!projectId,
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectService.createProject(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, newProject.workspaceId],
      });
    },
  });
}

/**
 * Hook to update a project
 */
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<any> }) =>
      projectService.updateProject(projectId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to archive a project
 */
export function useArchiveProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.archiveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
    },
  });
}
