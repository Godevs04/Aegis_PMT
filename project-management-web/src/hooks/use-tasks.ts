import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import taskService, { Task } from '../services/task-service';

export const TASKS_QUERY_KEY = 'tasks';

/**
 * Hook to retrieve all tasks in a workspace
 */
export function useTasksQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, workspaceId],
    queryFn: () => taskService.getWorkspaceTasks(workspaceId || ''),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to create a task
 */
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: {
      title: string;
      description?: string;
      projectId: string;
      workspaceId: string;
      assigneeId?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
    }) => taskService.createTask(taskData),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({
        queryKey: [TASKS_QUERY_KEY, newTask.workspaceId],
      });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      updateData,
    }: {
      taskId: string;
      updateData: Partial<
        Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'checklist'>
      > & { assigneeId?: string | null; projectId?: string };
    }) => taskService.updateTask(taskId, updateData),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({
        queryKey: [TASKS_QUERY_KEY, updatedTask.workspaceId],
      });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTaskMutation(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: [TASKS_QUERY_KEY, workspaceId],
        });
      }
    },
  });
}

/**
 * Hook to add a task comment
 */
export function useAddCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      taskService.addTaskComment(taskId, content),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({
        queryKey: [TASKS_QUERY_KEY, updatedTask.workspaceId],
      });
    },
  });
}
