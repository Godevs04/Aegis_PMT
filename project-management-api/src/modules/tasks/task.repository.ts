import { Task, ITask } from './task.model';

export class TaskRepository {
  /**
   * Find task by ID
   */
  async findTaskById(id: string): Promise<ITask | null> {
    return Task.findById(id)
      .populate('projectId', 'name')
      .populate('assigneeId', 'name email avatarUrl');
  }

  /**
   * Find tasks inside a workspace
   */
  async findTasksByWorkspace(workspaceId: string): Promise<ITask[]> {
    return Task.find({ workspaceId })
      .populate('projectId', 'name')
      .populate('assigneeId', 'name email avatarUrl');
  }

  /**
   * Find tasks inside a project
   */
  async findTasksByProject(projectId: string): Promise<ITask[]> {
    return Task.find({ projectId })
      .populate('assigneeId', 'name email avatarUrl');
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<ITask>): Promise<ITask> {
    return Task.create(taskData);
  }

  /**
   * Save task document
   */
  async saveTask(task: ITask): Promise<ITask> {
    return task.save();
  }
}

export default TaskRepository;
