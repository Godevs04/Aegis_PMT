import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '../services/project-service';

export const PROJECTS_QUERY_KEY = 'projects';

/**
 * Hook to retrieve all projects in a workspace
 */
export function useProjectsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [PROJECTS_QUERY_KEY, workspaceId],
    queryFn: () => projectService.getWorkspaceProjects(workspaceId || ''),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to create a new project in a workspace
 */
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      workspaceId,
      description,
    }: {
      name: string;
      workspaceId: string;
      description?: string;
    }) => projectService.createProject(name, workspaceId, description),
    onSuccess: (newProject) => {
      // Invalidate project list query for this workspace
      queryClient.invalidateQueries({
        queryKey: [PROJECTS_QUERY_KEY, newProject.workspaceId],
      });
    },
  });
}
