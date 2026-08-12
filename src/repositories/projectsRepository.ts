import { BaseRepository, PaginationOptions, PaginatedResult } from './baseRepository';
import { Project, ProjectPriority, ProjectStatus } from '../types';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-101',
    name: 'Safara90 Neural Operations Engine',
    code: 'SAF-NOE-01',
    description: 'High-throughput real-time analytical pipeline and predictive metrics dashboard.',
    status: 'In Progress',
    priority: 'Critical',
    owner: 'Executive Team',
    budget: 450000,
    spent: 285000,
    progress: 68,
    startDate: '2026-05-10',
    targetCompletion: '2026-09-30',
    tags: ['Core Engine', 'Analytics', 'AI/ML'],
    tasks: [
      { id: 't1', title: 'Repository architecture setup', assignedTo: 'Lead Architect', completed: true, dueDate: '2026-05-20' },
      { id: 't2', title: 'Real-time metrics stream integration', assignedTo: 'Senior Engineer', completed: true, dueDate: '2026-06-15' },
      { id: 't3', title: 'Automated audit log service', assignedTo: 'DevOps Lead', completed: false, dueDate: '2026-08-15' },
      { id: 't4', title: 'Executive dashboard performance tuning', assignedTo: 'Frontend Architect', completed: false, dueDate: '2026-09-01' },
    ],
  },
  {
    id: 'proj-102',
    name: 'Global Compliance & Audit System',
    code: 'SAF-GCA-02',
    description: 'Immutable record keeping and strict role-based access control compliance suite.',
    status: 'In Progress',
    priority: 'High',
    owner: 'Risk & Compliance',
    budget: 280000,
    spent: 195000,
    progress: 75,
    startDate: '2026-04-01',
    targetCompletion: '2026-10-15',
    tags: ['Audit', 'Security', 'Compliance'],
    tasks: [
      { id: 't5', title: 'Role permission simulator', assignedTo: 'Security Specialist', completed: true, dueDate: '2026-05-01' },
      { id: 't6', title: 'Audit repository implementation', assignedTo: 'Backend Engineer', completed: true, dueDate: '2026-06-10' },
      { id: 't7', title: 'Export verification reports', assignedTo: 'QA Lead', completed: false, dueDate: '2026-09-10' },
    ],
  },
  {
    id: 'proj-103',
    name: 'Automated Resource Allocator',
    code: 'SAF-ARA-03',
    description: 'Dynamic team distribution and budget trajectory calculator across all active sprints.',
    status: 'Planning',
    priority: 'Medium',
    owner: 'Operations Lead',
    budget: 160000,
    spent: 25000,
    progress: 18,
    startDate: '2026-07-01',
    targetCompletion: '2026-11-20',
    tags: ['Resource', 'Operations'],
    tasks: [
      { id: 't8', title: 'Algorithm definition', assignedTo: 'Operations Lead', completed: true, dueDate: '2026-07-15' },
      { id: 't9', title: 'UI allocation grid', assignedTo: 'Frontend Lead', completed: false, dueDate: '2026-09-15' },
    ],
  },
  {
    id: 'proj-104',
    name: 'Zero-Trust Infrastructure Hardening',
    code: 'SAF-ZTI-04',
    description: 'Enforcing strict token lifecycle management, zero-trust network boundaries, and API gateways.',
    status: 'Under Review',
    priority: 'Critical',
    owner: 'System Admin',
    budget: 320000,
    spent: 310000,
    progress: 92,
    startDate: '2026-03-15',
    targetCompletion: '2026-08-30',
    tags: ['Infrastructure', 'Security'],
    tasks: [
      { id: 't10', title: 'Penetration testing and review', assignedTo: 'SecOps Team', completed: true, dueDate: '2026-08-01' },
      { id: 't11', title: 'Final executive report', assignedTo: 'CISO', completed: false, dueDate: '2026-08-25' },
    ],
  },
  {
    id: 'proj-105',
    name: 'Executive Mobile Sync Gateway',
    code: 'SAF-MSG-05',
    description: 'Low-latency mobile push sync for high-priority operational alerts and offline caching.',
    status: 'Completed',
    priority: 'Medium',
    owner: 'Mobile Operations',
    budget: 120000,
    spent: 118000,
    progress: 100,
    startDate: '2026-02-01',
    targetCompletion: '2026-06-30',
    tags: ['Mobile', 'Sync'],
    tasks: [
      { id: 't12', title: 'Offline sync engine', assignedTo: 'Mobile Lead', completed: true, dueDate: '2026-05-01' },
      { id: 't13', title: 'Production release', assignedTo: 'DevOps Lead', completed: true, dueDate: '2026-06-30' },
    ],
  },
];

export class ProjectsRepository extends BaseRepository<Project> {
  constructor() {
    super('safara90_projects_v1');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_PROJECTS);
    }
  }

  public getFilteredProjects(
    statusFilter?: ProjectStatus | 'All',
    priorityFilter?: ProjectPriority | 'All',
    searchQuery?: string,
    options?: PaginationOptions
  ): PaginatedResult<Project> {
    let projects = this.getStoredItems();

    if (statusFilter && statusFilter !== 'All') {
      projects = projects.filter((p) => p.status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== 'All') {
      projects = projects.filter((p) => p.priority === priorityFilter);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (!options) {
      return {
        data: projects,
        total: projects.length,
        page: 1,
        totalPages: 1,
      };
    }

    const limit = Math.max(1, options.limit);
    const page = Math.max(1, options.page);
    const start = (page - 1) * limit;
    const paginatedData = projects.slice(start, start + limit);
    const totalPages = Math.ceil(projects.length / limit) || 1;

    return {
      data: paginatedData,
      total: projects.length,
      page,
      totalPages,
    };
  }

  public toggleTask(projectId: string, taskId: string): Project | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;

    const updatedTasks = project.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const newProgress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : project.progress;

    return this.update(projectId, {
      tasks: updatedTasks,
      progress: newProgress,
      status: newProgress === 100 ? 'Completed' : project.status === 'Completed' ? 'In Progress' : project.status,
    });
  }
}

export const projectsRepository = new ProjectsRepository();
