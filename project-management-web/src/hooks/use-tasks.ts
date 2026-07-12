import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import taskService, { TaskFilters, CreateTaskData, Task } from '../services/task-service';

export const TASKS_QUERY_KEY = 'tasks';
export const STATUSES_QUERY_KEY = 'task-statuses';
export const PRIORITIES_QUERY_KEY = 'task-priorities';

/**
 * Hook to fetch tasks with filters
 */
export function useTasksQuery(filters: TaskFilters | null) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, filters],
    queryFn: () => taskService.getTasks(filters!),
    enabled: !!filters?.workspaceId,
  });
}

/**
 * Hook to fetch a single task
 */
export function useTaskQuery(taskId: string | null) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'detail', taskId],
    queryFn: () => taskService.getTask(taskId!),
    enabled: !!taskId,
  });
}

/**
 * Hook to fetch subtasks
 */
export function useSubtasksQuery(parentTaskId: string | null) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'subtasks', parentTaskId],
    queryFn: () => taskService.getSubtasks(parentTaskId!),
    enabled: !!parentTaskId,
  });
}

/**
 * Hook to fetch workspace task statuses
 */
export function useStatusesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [STATUSES_QUERY_KEY, workspaceId],
    queryFn: () => taskService.getStatuses(workspaceId!),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to fetch workspace task priorities
 */
export function usePrioritiesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: [PRIORITIES_QUERY_KEY, workspaceId],
    queryFn: () => taskService.getPriorities(workspaceId!),
    enabled: !!workspaceId,
  });
}

/**
 * Hook to create a task
 */
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      taskService.updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to move a task (Kanban drag)
 */
export function useMoveTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, statusId, order }: { taskId: string; statusId?: string; order: number }) =>
      taskService.moveTask(taskId, { statusId, order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to bulk update tasks
 */
export function useBulkUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { taskIds: string[]; statusId?: string; priorityId?: string; assignees?: string[] }) =>
      taskService.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}
