import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { DataTable, Column } from '../../components/ui/DataTable';
import { adminService } from '../../services/adminService';
import { AuditLog, UserRole } from '../../types';
import { Shield, Key, Search, UserCheck, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  currentUser: { name: string; role: UserRole };
  onRoleChange: (newRole: UserRole) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onRoleChange }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'Success' | 'Warning' | 'Failed' | 'All'>('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadAuditLogs();
  }, [roleFilter, statusFilter, search, page]);

  const loadAuditLogs = () => {
    const result = adminService.getAuditLogs(roleFilter, statusFilter, search, page, 8);
    setLogs(result.data);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
  };

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Success':
        return 'emerald';
      case 'Warning':
        return 'amber';
      case 'Failed':
        return 'rose';
      default:
        return 'neutral';
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log) => <span className="font-mono text-xs text-slate-500">{log.timestamp}</span>,
    },
    {
      key: 'action',
      header: 'Action / Entity',
      render: (log) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{log.action}</span>
          <span className="text-[10px] text-indigo-600 font-mono">{log.entity}</span>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'User & Role',
      render: (log) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">{log.userName}</span>
          <Badge variant="indigo" className="text-[10px] px-1 py-0">
            {log.userRole}
          </Badge>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (log) => (
        <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">{log.details}</span>
      ),
    },
    {
      key: 'status',
      header: 'Result',
      render: (log) => <Badge variant={getStatusBadgeVariant(log.status)}>{log.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security & Administration Panel
          </h2>
          <p className="text-sm text-slate-500">
            Role-based authorization controls, audit log stream, and zero-trust security configuration.
          </p>
        </div>

        {/* Role Simulator Selector */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-xs">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700">Simulate Role:</span>
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none text-indigo-900"
          >
            <option value="Executive">Executive</option>
            <option value="Operations Lead">Operations Lead</option>
            <option value="Auditor">Auditor</option>
            <option value="System Admin">System Admin</option>
          </select>
        </div>
      </div>

      {/* Role Privileges Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { role: 'Executive', scope: 'Full read access across analytics, budgets & executive approvals.' },
          { role: 'Operations Lead', scope: 'Can manage project lifecycles, assign tasks, allocate budgets.' },
          { role: 'Auditor', scope: 'ReadOnly audit log inspection & ISO compliance verification.' },
          { role: 'System Admin', scope: 'Full system management, credential rotation & policy enforcement.' },
        ].map((r) => (
          <div
            key={r.role}
            className={`p-4 rounded-xl border transition-all ${
              currentUser.role === r.role
                ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-slate-900">{r.role}</span>
              {currentUser.role === r.role && <Badge variant="indigo">Active</Badge>}
            </div>
            <p className="text-xs text-slate-500">{r.scope}</p>
          </div>
        ))}
      </div>

      {/* Audit Log Controls & Table */}
      <Card
        title="Audit Stream & System Logs"
        subtitle="Filterable audit trail stored in local repository storage"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search action or details..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as any);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none text-xs"
              >
                <option value="All">All Roles</option>
                <option value="Executive">Executive</option>
                <option value="Operations Lead">Operations Lead</option>
                <option value="Auditor">Auditor</option>
                <option value="System Admin">System Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none text-xs"
              >
                <option value="All">All Results</option>
                <option value="Success">Success</option>
                <option value="Warning">Warning</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={logs}
            keyExtractor={(l) => l.id}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            emptyMessage="No audit logs matched search criteria."
          />
        </div>
      </Card>
    </div>
  );
};
