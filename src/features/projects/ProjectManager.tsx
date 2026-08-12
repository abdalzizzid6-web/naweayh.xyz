import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, DollarSign, Layers } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { NewProjectModal } from './NewProjectModal';
import { ProjectDetailModal } from './ProjectDetailModal';
import { projectService } from '../../services/projectService';
import { Project, ProjectPriority, ProjectStatus, UserRole } from '../../types';

interface ProjectManagerProps {
  currentUser: { name: string; role: UserRole };
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ currentUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [statusFilter, priorityFilter, searchQuery, page]);

  const loadProjects = () => {
    const result = projectService.getProjects(
      statusFilter,
      priorityFilter,
      searchQuery,
      page,
      8
    );
    setProjects(result.data);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
  };

  const getPriorityBadgeVariant = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'Critical':
        return 'rose';
      case 'High':
        return 'amber';
      case 'Medium':
        return 'indigo';
      default:
        return 'neutral';
    }
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Completed':
        return 'emerald';
      case 'In Progress':
        return 'sky';
      case 'Under Review':
        return 'amber';
      default:
        return 'neutral';
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'code',
      header: 'Code / Name',
      render: (project) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-500">{project.code}</span>
            <span className="font-semibold text-slate-900">{project.name}</span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 max-w-sm">{project.description}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project) => (
        <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (project) => (
        <Badge variant={getPriorityBadgeVariant(project.priority)}>{project.priority}</Badge>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (project) => (
        <span className="font-medium text-slate-800">${project.budget.toLocaleString()}</span>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (project) => (
        <div className="w-28 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>{project.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (project) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedProject(project)}
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Initiatives & Project Repository
          </h2>
          <p className="text-sm text-slate-500">
            Centralized registry for all active sprints, budget allocations, and functional deliverables.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4" />
          New Initiative
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, name, or tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <DataTable
        columns={columns}
        data={projects}
        keyExtractor={(p) => p.id}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage="No initiatives matched your active filters."
      />

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onProjectCreated={loadProjects}
        currentUser={currentUser}
      />

      <ProjectDetailModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onProjectUpdated={loadProjects}
        currentUser={currentUser}
      />
    </div>
  );
};
