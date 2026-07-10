import apiClient from './api-client';

export interface Activity {
  _id: string;
  workspaceId: string;
  projectId?: {
    _id: string;
    name: string;
  };
  taskId?: {
    _id: string;
    title: string;
  };
  userId: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  actorId: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  workspaceId: {
    _id: string;
    name: string;
  };
  type: string;
  entityId: string;
  entityType: 'Task' | 'Project' | 'Workspace' | 'Invitation';
  isRead: boolean;
  createdAt: string;
}

export const activityService = {
  /**
   * Fetch activity log timeline in active workspace
   */
  async getWorkspaceTimeline(workspaceId: string): Promise<Activity[]> {
    const response = await apiClient.get(`/activities?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  /**
   * Fetch all notifications for logged-in user
   */
  async getMyNotifications(): Promise<Notification[]> {
    const response = await apiClient.get('/notifications');
    return response.data.data;
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },
};

export default activityService;
