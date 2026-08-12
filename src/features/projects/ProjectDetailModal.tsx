import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CheckSquare, Square, Calendar, DollarSign, User } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { Project, UserRole } from '../../types';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  currentUser: { name: string; role: UserRole };
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onProjectUpdated,
  currentUser,
}) => {
  if (!project) return null;

  const handleToggleTask = (taskId: string) => {
    projectService.toggleProjectTask(project.id, taskId, currentUser);
    onProjectUpdated();
  };

  const handleStatusChange = (newStatus: any) => {
    projectService.updateProjectStatus(project.id, newStatus, currentUser);
    onProjectUpdated();
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project.name}
      subtitle={`Code: ${project.code}`}
      maxWidth="lg"
    >
      <div className="space-y-6 text-sm">
        {/* Header Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(project.status)}>
              Status: {project.status}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(project.priority)}>
              Priority: {project.priority}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Quick Status:</span>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Description & Overview */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Functional Overview
          </h4>
          <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
            {project.description}
          </p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Budget</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              ${project.budget.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Owner</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              {project.owner}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Start Date</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              {project.startDate}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Target</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              {project.targetCompletion}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Progress Breakdown</span>
            <span>{project.progress}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Tasks & Deliverables
          </h4>
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-emerald-50/40 border-emerald-200/60 text-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Assigned: {task.assignedTo}</span>
                  <span>•</span>
                  <span>Due: {task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium">Tags:</span>
          {project.tags.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
