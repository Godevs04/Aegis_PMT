import apiClient from './api-client';

export interface ChecklistItem {
  _id?: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskComment {
  _id?: string;
  userId: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  projectId: {
    _id: string;
    name: string;
  };
  workspaceId: string;
  assigneeId?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  checklist: ChecklistItem[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  createdAt: string;
}

export const taskService = {
  /**
   * Fetch all tasks in a workspace
   */
  async getWorkspaceTasks(workspaceId: string): Promise<Task[]> {
    const response = await apiClient.get(`/tasks?workspaceId=${workspaceId}`);
    return response.data.data;
  },

  /**
   * Create a new task
   */
  async createTask(taskData: {
    title: string;
    description?: string;
    projectId: string;
    workspaceId: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }): Promise<Task> {
    const response = await apiClient.post('/tasks', taskData);
    return response.data.data;
  },

  /**
   * Update task details (e.g. status, assignee, priority)
   */
  async updateTask(
    taskId: string,
    updateData: Partial<
      Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'checklist'>
    > & { assigneeId?: string | null; projectId?: string }
  ): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${taskId}`, updateData);
    return response.data.data;
  },

  /**
   * Add a comment to a task
   */
  async addTaskComment(taskId: string, content: string): Promise<Task> {
    const response = await apiClient.post(`/tasks/${taskId}/comments`, { content });
    return response.data.data;
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};

export default taskService;
