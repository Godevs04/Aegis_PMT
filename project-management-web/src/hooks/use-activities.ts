import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import activityService from '../services/activity-service';

export const ACTIVITIES_QUERY_KEY = 'activities';
export const NOTIFICATIONS_QUERY_KEY = 'notifications';

/**
 * Hook to retrieve workspace activities
 */
export function useWorkspaceActivitiesQuery(
  workspaceId: string | null,
  options?: { projectId?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY, workspaceId, options],
    queryFn: () =>
      activityService.getWorkspaceTimeline(workspaceId || '', {
        page: options?.page,
        limit: options?.limit,
        projectId: options?.projectId,
      }),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to retrieve user notifications
 */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: () => activityService.getMyNotifications(),
    refetchInterval: 15000, // Poll alerts every 15 seconds to simulate real-time feeds
  });
}

/**
 * Hook to mark a notification read
 */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => activityService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to mark all notifications read
 */
export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => activityService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}
