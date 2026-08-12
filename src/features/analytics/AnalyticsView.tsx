import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { analyticsService } from '../../services/analyticsService';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, ShieldAlert, RefreshCw } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const metrics = analyticsService.getMetrics(selectedCategory);
  const health = analyticsService.getSystemHealth();
  const performanceTrends = analyticsService.getPerformanceTrends();
  const resourceDist = analyticsService.getResourceDistribution();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Operational Intelligence & Performance
          </h2>
          <p className="text-sm text-slate-500">
            Real-time analytics calculations, financial velocity metrics, and system efficiency.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Financial', 'Operations', 'Resource', 'Security'].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <StatCard
            key={m.id}
            label={m.label}
            value={m.value}
            changePercent={m.changePercent}
            period={m.period}
            icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          />
        ))}
      </div>

      {/* Analytics Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend Bar Graph */}
        <div className="lg:col-span-2">
          <Card
            title="Monthly Velocity & Efficiency Trajectory"
            subtitle="Comparing throughput velocity against financial budget efficiency"
          >
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-end gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-indigo-600 rounded-xs" />
                  <span className="text-slate-600">Throughput Velocity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-xs" />
                  <span className="text-slate-600">Capital Efficiency</span>
                </div>
              </div>

              {/* Bar Chart Representation */}
              <div className="space-y-3 pt-2">
                {performanceTrends.map((pt) => (
                  <div key={pt.month} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>{pt.month}</span>
                      <span className="text-slate-500">Velocity: {pt.velocity} pts | Efficiency: {pt.budgetEfficiency}%</span>
                    </div>
                    <div className="flex h-3 gap-1 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${pt.velocity}%` }}
                      />
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${pt.budgetEfficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* System Health & Resource Distribution */}
        <div className="space-y-6">
          <Card title="System Telemetry & Health" subtitle="Container & API performance">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">CPU Load</span>
                <span className="font-bold text-slate-900">{health.cpuUsage}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Memory Utilization</span>
                <span className="font-bold text-slate-900">{health.memoryUsage}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">p99 Latency</span>
                <span className="font-bold text-emerald-600">{health.apiLatencyMs} ms</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-900">
                <span className="font-medium">Cluster Status</span>
                <Badge variant="emerald">{health.status}</Badge>
              </div>
            </div>
          </Card>

          <Card title="Resource Allocation" subtitle="Target team capacity distribution">
            <div className="space-y-3 pt-1">
              {resourceDist.map((res) => (
                <div key={res.name} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{res.name}</span>
                    <span>{res.allocation}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${res.allocation}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
