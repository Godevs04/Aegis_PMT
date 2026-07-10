import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import workspaceService from '../services/workspace-service';
import useWorkspaceStore from '../store/workspace-store';

export const WORKSPACES_QUERY_KEY = ['workspaces'];

/**
 * Hook to retrieve all user workspaces
 */
export function useWorkspacesQuery() {
  return useQuery({
    queryKey: WORKSPACES_QUERY_KEY,
    queryFn: () => workspaceService.getMyWorkspaces(),
  });
}

/**
 * Hook to create a new workspace
 */
export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();
  const setCurrentWorkspaceId = useWorkspaceStore((state) => state.setCurrentWorkspaceId);

  return useMutation({
    mutationFn: ({ name, orgName }: { name: string; orgName?: string }) =>
      workspaceService.createWorkspace(name, orgName),
    onSuccess: (newWorkspace) => {
      // Invalidate query to refetch list
      queryClient.invalidateQueries({ queryKey: WORKSPACES_QUERY_KEY });
      // Set newly created workspace as active
      setCurrentWorkspaceId(newWorkspace._id);
    },
  });
}
