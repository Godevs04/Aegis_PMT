import apiClient from './api-client';

export interface TaskStatus {
  _id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  category: 'backlog' | 'unstarted' | 'active' | 'done' | 'cancelled';
  order: number;
}

export interface TaskPriority {
  _id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  order: number;
}

export interface TaskLabel {
  _id: string;
  name: string;
  color: string;
}

export interface TaskUser {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Task {
  _id: string;
  taskNumber: number;
  title: string;
  description?: any;
  projectId: string | { _id: string; name: string };
  workspaceId: string;
  parentTaskId?: string;
  sprintId?: string;
  milestoneId?: string;
  assignees: TaskUser[];
  reporter?: TaskUser;
  watchers?: TaskUser[];
  statusId?: TaskStatus | string;
  priorityId?: TaskPriority | string;
  labels: TaskLabel[];
  tags: string[];
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  spentHours?: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: { _id: string; name: string };
}

export interface CreateTaskData {
  title: string;
  description?: any;
  projectId: string;
  workspaceId: string;
  assignees?: string[];
  statusId?: string;
  priorityId?: string;
  labels?: string[];
  parentTaskId?: string;
  sprintId?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface TaskFilters {
  workspaceId: string;
  projectId?: string;
  statusId?: string;
  priorityId?: string;
  assignee?: string;
  labels?: string;
  sprintId?: string;
  parentTaskId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedTasks {
  data: Task[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const taskService = {
  /**
   * Fetch tasks with filters and pagination
   */
  async getTasks(filters: TaskFilters): Promise<PaginatedTasks> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const response = await apiClient.get(`/tasks?${params.toString()}`);
    return { data: response.data.data, meta: response.data.meta };
  },

  /**
   * Get single task by ID
   */
  async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data.data;
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await apiClient.post('/tasks', data);
    return response.data.data;
  },

  /**
   * Update task
   */
  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}`, data);
    return response.data.data;
  },

  /**
   * Move task (Kanban drag — change status and/or order)
   */
  async moveTask(taskId: string, data: { statusId?: string; order: number }): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}/move`, data);
    return response.data.data;
  },

  /**
   * Bulk update tasks
   */
  async bulkUpdate(data: {
    taskIds: string[];
    statusId?: string;
    priorityId?: string;
    assignees?: string[];
    sprintId?: string;
  }): Promise<{ updatedCount: number }> {
    const response = await apiClient.post('/tasks/bulk', data);
    return response.data.data;
  },

  /**
   * Log time on a task
   */
  async logTime(taskId: string, hours: number, description?: string): Promise<any> {
    const response = await apiClient.post(`/tasks/${taskId}/time`, { hours, description });
    return response.data.data;
  },

  /**
   * Get subtasks
   */
  async getSubtasks(taskId: string): Promise<Task[]> {
    const response = await apiClient.get(`/tasks/${taskId}/subtasks`);
    return response.data.data;
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  /**
   * Get workspace task statuses
   */
  async getStatuses(workspaceId: string): Promise<TaskStatus[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/statuses`);
    return response.data.data;
  },

  /**
   * Get workspace task priorities
   */
  async getPriorities(workspaceId: string): Promise<TaskPriority[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/priorities`);
    return response.data.data;
  },
};

export default taskService;
