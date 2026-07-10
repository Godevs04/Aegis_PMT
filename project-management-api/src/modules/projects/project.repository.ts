import { Project, IProject } from './project.model';

export class ProjectRepository {
  /**
   * Find project by ID
   */
  async findProjectById(id: string): Promise<IProject | null> {
    return Project.findById(id).populate('workspaceId', 'name');
  }

  /**
   * List all projects belonging to a workspace
   */
  async findProjectsByWorkspace(workspaceId: string): Promise<IProject[]> {
    return Project.find({ workspaceId });
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Partial<IProject>): Promise<IProject> {
    return Project.create(projectData);
  }

  /**
   * Save project document
   */
  async saveProject(project: IProject): Promise<IProject> {
    return project.save();
  }
}

export default ProjectRepository;
