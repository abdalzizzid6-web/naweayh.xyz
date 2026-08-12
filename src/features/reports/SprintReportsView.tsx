import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { adminService } from '../../services/adminService';
import { CheckCircle2, ShieldCheck, FileCheck, Layers } from 'lucide-react';

export const SprintReportsView: React.FC = () => {
  const reports = adminService.getSprintReports();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Engineering & Sprint Reports
        </h2>
        <p className="text-sm text-slate-500">
          Formal Sprint documentation saved strictly in compliance with rule #9 and rule #13.
        </p>
      </div>

      <div className="space-y-6">
        {reports.map((report) => (
          <Card key={report.sprintId} className="border-l-4 border-l-indigo-600">
            <div className="space-y-4">
              {/* Top Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo">{report.sprintId}</Badge>
                  <h3 className="text-base font-bold text-slate-900">{report.title}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Completed: {report.completedDate}
                </span>
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {report.summary}
              </p>

              {/* Quality Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">Vite Build Passed</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">TypeScript Checked</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">ESLint Verified</span>
                </div>
              </div>

              {/* Sprint Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Features</span>
                  <span className="text-lg font-bold text-slate-900">{report.metrics.featuresDelivered}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bugs Fixed</span>
                  <span className="text-lg font-bold text-slate-900">{report.metrics.bugsFixed}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Quality Score</span>
                  <span className="text-lg font-bold text-indigo-600">{report.metrics.codeQualityScore}%</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Performance</span>
                  <span className="text-lg font-bold text-emerald-600">{report.metrics.performanceIndex}%</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
