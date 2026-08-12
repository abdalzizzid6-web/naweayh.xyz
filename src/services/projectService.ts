import { projectsRepository } from '../repositories/projectsRepository';
import { auditRepository } from '../repositories/auditRepository';
import { Project, ProjectPriority, ProjectStatus, UserRole } from '../types';

export class ProjectService {
  public getProjects(
    status?: ProjectStatus | 'All',
    priority?: ProjectPriority | 'All',
    search?: string,
    page: number = 1,
    limit: number = 10
  ) {
    return projectsRepository.getFilteredProjects(status, priority, search, { page, limit });
  }

  public createProject(
    projectData: Omit<Project, 'id' | 'code' | 'progress' | 'spent' | 'tasks'>,
    currentUser: { name: string; role: UserRole }
  ): Project {
    const codeNumber = Math.floor(Math.random() * 90 + 10);
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      code: `SAF-PRJ-${codeNumber}`,
      progress: 0,
      spent: 0,
      tasks: [
        {
          id: `t-${Date.now()}-1`,
          title: 'Initial architecture & requirements verification',
          assignedTo: currentUser.name,
          completed: false,
          dueDate: projectData.startDate,
        },
      ],
    };

    const created = projectsRepository.add(newProject);

    auditRepository.logAction(
      currentUser.name,
      currentUser.role,
      'CREATE_PROJECT',
      created.code,
      `Created project "${created.name}" with budget $${created.budget.toLocaleString()}`
    );

    return created;
  }

  public toggleProjectTask(
    projectId: string,
    taskId: string,
    currentUser: { name: string; role: UserRole }
  ) {
    const updated = projectsRepository.toggleTask(projectId, taskId);
    if (updated) {
      auditRepository.logAction(
        currentUser.name,
        currentUser.role,
        'TOGGLE_TASK',
        updated.code,
        `Toggled task status in project "${updated.name}"`
      );
    }
    return updated;
  }

  public updateProjectStatus(
    projectId: string,
    newStatus: ProjectStatus,
    currentUser: { name: string; role: UserRole }
  ) {
    const updated = projectsRepository.update(projectId, { status: newStatus });
    if (updated) {
      auditRepository.logAction(
        currentUser.name,
        currentUser.role,
        'UPDATE_STATUS',
        updated.code,
        `Updated status of "${updated.name}" to ${newStatus}`
      );
    }
    return updated;
  }

  public getSummaryStats() {
    const all = projectsRepository.getAll();
    const totalProjects = all.length;
    const activeProjects = all.filter((p) => p.status === 'In Progress').length;
    const totalBudget = all.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = all.reduce((sum, p) => sum + p.spent, 0);
    const avgProgress = totalProjects > 0 ? Math.round(all.reduce((sum, p) => sum + p.progress, 0) / totalProjects) : 0;

    return {
      totalProjects,
      activeProjects,
      totalBudget,
      totalSpent,
      avgProgress,
    };
  }
}

export const projectService = new ProjectService();
