import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { useWorkspaceStore } from '@/store/workspace-store';

export const NOTIFICATIONS_QUERY_KEY = 'notifications';

/**
 * Get user notifications (paginated)
 */
export function useNotificationsQuery(page = 1, limit = 20) {
  const { currentWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'list', currentWorkspaceId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (currentWorkspaceId) params.append('workspaceId', currentWorkspaceId);
      const response = await apiClient.get(`/notifications?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });
}

/**
 * Get unread notification count (used by header bell)
 */
export function useUnreadCountQuery() {
  const { currentWorkspaceId } = useWorkspaceStore();

  return useQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, 'unread-count', currentWorkspaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentWorkspaceId) params.append('workspaceId', currentWorkspaceId);
      const response = await apiClient.get(`/notifications/unread-count?${params.toString()}`);
      return response.data.data.unreadCount as number;
    },
    refetchInterval: 30000, // Fallback polling every 30s (Socket handles real-time)
  });
}

/**
 * Mark a notification as read
 */
export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
    },
  });
}
