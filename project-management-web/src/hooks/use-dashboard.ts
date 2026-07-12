import { useQuery } from '@tanstack/react-query';
import dashboardService from '../services/dashboard-service';

export const DASHBOARD_QUERY_KEY = 'dashboard';

export function usePersonalDashboardQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'personal', workspaceId],
    queryFn: () => dashboardService.getPersonal(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

export function useWorkspaceDashboardQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'workspace', workspaceId],
    queryFn: () => dashboardService.getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useProjectDashboardQuery(projectId: string | null, workspaceId: string | null) {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'project', projectId],
    queryFn: () => dashboardService.getProject(projectId!, workspaceId!),
    enabled: !!projectId && !!workspaceId,
  });
}
