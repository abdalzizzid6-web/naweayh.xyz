import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Activity,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { projectService } from '../../services/projectService';
import { analyticsService } from '../../services/analyticsService';
import { adminService } from '../../services/adminService';
import { MetricItem, Project, AuditLog, UserRole } from '../../types';

interface ExecutiveDashboardProps {
  currentUser: { name: string; role: UserRole };
  onNavigateToProjects: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToAdmin: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  currentUser,
  onNavigateToProjects,
  onNavigateToAnalytics,
  onNavigateToAdmin,
}) => {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    avgProgress: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const fetchedMetrics = analyticsService.getMetrics('All');
    setMetrics(fetchedMetrics);

    const projData = projectService.getProjects('All', 'All', '', 1, 5);
    setRecentProjects(projData.data);

    const stats = projectService.getSummaryStats();
    setProjectStats(stats);

    const auditData = adminService.getAuditLogs('All', 'All', '', 1, 5);
    setRecentAudits(auditData.data);
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Badge variant="indigo" className="bg-indigo-500/20 text-indigo-200 border-indigo-400/30">
              {currentUser.role} Control
            </Badge>
            <span className="text-xs text-slate-400">Safara90 v2.4.0 Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Operational Intelligence & Control
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Real-time executive dashboard monitoring platform performance, resource allocation, audit verification, and active project lifecycles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button variant="secondary" onClick={onNavigateToProjects}>
            <Briefcase className="w-4 h-4" />
            Manage Projects
          </Button>
          <Button variant="outline" className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700" onClick={onNavigateToAnalytics}>
            <Activity className="w-4 h-4" />
            Deep Analytics
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={projectStats.activeProjects}
          changePercent={8.5}
          period={`Out of ${projectStats.totalProjects} total initiatives`}
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="Capital Deployed"
          value={`$${(projectStats.totalSpent / 1000).toFixed(0)}k`}
          changePercent={12.1}
          period={`Budget cap: $${(projectStats.totalBudget / 1000).toFixed(0)}k`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Avg Sprint Progress"
          value={`${projectStats.avgProgress}%`}
          changePercent={3.4}
          period="Across all active teams"
          icon={<TrendingUp className="w-5 h-5 text-sky-600" />}
        />
        <StatCard
          label="Audit Compliance"
          value="100%"
          changePercent={0}
          period="Zero critical security gaps"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Initiatives Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Active High-Priority Initiatives"
            subtitle="Top core projects tracked in Safara90 repository layer"
            action={
              <Button variant="ghost" size="sm" onClick={onNavigateToProjects}>
                View All ({projectStats.totalProjects})
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            }
          >
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-500">{project.code}</span>
                      <h4 className="text-sm font-semibold text-slate-900">{project.name}</h4>
                      <Badge variant={getPriorityBadgeVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-400">
                      <span>Owner: {project.owner}</span>
                      <span>•</span>
                      <span>Budget: ${project.budget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 min-w-[140px]">
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status}
                    </Badge>
                    <div className="w-full sm:w-28 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Core Metrics List */}
          <Card
            title="Key Financial & Operational Metrics"
            subtitle="Calculated in real time from repository repositories"
            action={
              <Button variant="ghost" size="sm" onClick={onNavigateToAnalytics}>
                Analytics Hub
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics.slice(0, 4).map((metric) => (
                <div key={metric.id} className="p-3.5 rounded-lg border border-slate-100 bg-white">
                  <span className="text-xs text-slate-500">{metric.label}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-slate-900">{metric.value}</span>
                    <span className="text-xs text-emerald-600 font-medium">
                      +{metric.changePercent}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{metric.period}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Stream: Audit & Admin Activity */}
        <div className="space-y-6">
          <Card
            title="Recent System Audits"
            subtitle="Immutable activity log stream"
            action={
              <Button variant="ghost" size="sm" onClick={onNavigateToAdmin}>
                Audit Panel
                <Sliders className="w-4 h-4" />
              </Button>
            }
          >
            <div className="space-y-3">
              {recentAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{audit.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {audit.timestamp.split(' ')[1]}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{audit.details}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="font-medium text-indigo-600">{audit.userName}</span>
                    <Badge
                      variant={audit.status === 'Success' ? 'emerald' : 'rose'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {audit.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Control Status */}
          <Card title="System Readiness">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Repository Service Layer</span>
                </div>
                <span className="font-semibold">Healthy</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-sky-50 text-sky-900 rounded-lg border border-sky-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span className="font-medium">Firestore Pagination Limits</span>
                </div>
                <span className="font-semibold">Enforced</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="font-medium">Current Role Session</span>
                </div>
                <span className="font-bold text-indigo-700">{currentUser.role}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
