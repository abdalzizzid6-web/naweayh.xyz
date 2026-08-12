import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import {
  Activity,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Gauge,
  Database,
  Cpu,
  Wifi,
  Cloud,
  ShieldAlert,
  BarChart2,
  HardDrive,
  Download,
  Terminal,
  Radio,
} from 'lucide-react';

export interface ApiEndpointMetric {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  requestsPerMin: number;
  errorRatePercent: number;
  status: 'Healthy' | 'Degraded' | 'Critical';
}

export interface StatusCodeDistribution {
  code: string;
  label: string;
  count: number;
  percentage: number;
  category: '2xx' | '3xx' | '4xx' | '5xx';
}

export interface QuotaMetric {
  serviceName: string;
  resource: string;
  used: number;
  limit: number;
  unit: string;
  category: 'AI' | 'Database' | 'Notifications' | 'Cache' | 'CDN';
}

const INITIAL_ENDPOINTS: ApiEndpointMetric[] = [
  {
    id: 'ep-1',
    endpoint: '/api/v1/news/feed',
    method: 'GET',
    avgLatencyMs: 1.8,
    p95LatencyMs: 4.2,
    p99LatencyMs: 8.5,
    requestsPerMin: 14200,
    errorRatePercent: 0.01,
    status: 'Healthy',
  },
  {
    id: 'ep-2',
    endpoint: '/api/v1/ai/summarize',
    method: 'POST',
    avgLatencyMs: 142.5,
    p95LatencyMs: 280.0,
    p99LatencyMs: 450.0,
    requestsPerMin: 1850,
    errorRatePercent: 0.12,
    status: 'Healthy',
  },
  {
    id: 'ep-3',
    endpoint: '/api/v1/notifications/push',
    method: 'POST',
    avgLatencyMs: 28.4,
    p95LatencyMs: 62.1,
    p99LatencyMs: 110.0,
    requestsPerMin: 3400,
    errorRatePercent: 0.05,
    status: 'Healthy',
  },
  {
    id: 'ep-4',
    endpoint: '/api/v1/search/query',
    method: 'GET',
    avgLatencyMs: 3.2,
    p95LatencyMs: 8.1,
    p99LatencyMs: 14.0,
    requestsPerMin: 8900,
    errorRatePercent: 0.02,
    status: 'Healthy',
  },
  {
    id: 'ep-5',
    endpoint: '/api/v1/sources/sync',
    method: 'POST',
    avgLatencyMs: 88.0,
    p95LatencyMs: 190.0,
    p99LatencyMs: 310.0,
    requestsPerMin: 420,
    errorRatePercent: 0.25,
    status: 'Healthy',
  },
  {
    id: 'ep-6',
    endpoint: '/api/v1/auth/verify',
    method: 'POST',
    avgLatencyMs: 12.1,
    p95LatencyMs: 24.0,
    p99LatencyMs: 45.0,
    requestsPerMin: 6100,
    errorRatePercent: 0.03,
    status: 'Healthy',
  },
];

const INITIAL_STATUS_CODES: StatusCodeDistribution[] = [
  { code: '200 OK', label: 'استجابة ناجحة (Successful Request)', count: 4285000, percentage: 96.8, category: '2xx' },
  { code: '201 Created', label: 'تم الإنشاء بنجاح (Resource Created)', count: 92000, percentage: 2.1, category: '2xx' },
  { code: '304 Not Modified', label: 'المحتوى مخزن مؤقتاً (Cached response)', count: 26000, percentage: 0.6, category: '3xx' },
  { code: '400 Bad Request', label: 'طلب غير صالح (Bad Client Request)', count: 8800, percentage: 0.2, category: '4xx' },
  { code: '401 Unauthorized', label: 'غير مصرح (Auth Required)', count: 4400, percentage: 0.1, category: '4xx' },
  { code: '429 Rate Limited', label: 'تجاوز حد المعدل (Too Many Requests)', count: 4400, percentage: 0.1, category: '4xx' },
  { code: '500 Server Error', label: 'خطأ في السيرفر (Internal Error)', count: 4400, percentage: 0.1, category: '5xx' },
];

const INITIAL_QUOTAS: QuotaMetric[] = [
  { serviceName: 'Gemini 2.5 Flash AI', resource: 'طلبات الذكاء الاصطناعي اليومية', used: 84200, limit: 100000, unit: 'req/day', category: 'AI' },
  { serviceName: 'Firebase Firestore', resource: 'عميات القراءة اليومية (Reads)', used: 2150000, limit: 5000000, unit: 'ops/day', category: 'Database' },
  { serviceName: 'Firebase Firestore', resource: 'عميات الكتابة اليومية (Writes)', used: 340000, limit: 1000000, unit: 'ops/day', category: 'Database' },
  { serviceName: 'Firebase FCM & OneSignal', resource: 'الإشعارات الفورية اليومية', used: 4850000, limit: 10000000, unit: 'pushes/day', category: 'Notifications' },
  { serviceName: 'Redis Cluster Memory', resource: 'ذاكرة التخزين الموزعة', used: 1.84, limit: 4.0, unit: 'GB', category: 'Cache' },
  { serviceName: 'Edge CDN Bandwidth', resource: 'الباندويث الخارجي اليومي', used: 14.2, limit: 50.0, unit: 'TB', category: 'CDN' },
];

export const SystemHealthMonitor: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpointMetric[]>(INITIAL_ENDPOINTS);
  const [statusCodes] = useState<StatusCodeDistribution[]>(INITIAL_STATUS_CODES);
  const [quotas, setQuotas] = useState<QuotaMetric[]>(INITIAL_QUOTAS);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toLocaleTimeString('ar-SA'));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Metric Simulation Ping
  const handleRunHealthCheck = () => {
    setIsPinging(true);
    setTimeout(() => {
      setEndpoints((prev) =>
        prev.map((ep) => ({
          ...ep,
          avgLatencyMs: parseFloat((ep.avgLatencyMs * (0.95 + Math.random() * 0.1)).toFixed(1)),
          requestsPerMin: Math.floor(ep.requestsPerMin + (Math.random() * 200 - 100)),
        }))
      );
      setLastCheckTime(new Date().toLocaleTimeString('ar-SA'));
      setIsPinging(false);
      setToastMessage('تم إتمام فحص الاتصال بالبنية التحتية بنجاح! جميع الخدمات تعمل بكفاءة 100%');
      setTimeout(() => setToastMessage(null), 3500);
    }, 800);
  };

  const overallAvgLatency = (
    endpoints.reduce((sum, ep) => sum + ep.avgLatencyMs, 0) / endpoints.length
  ).toFixed(1);

  const totalRpm = endpoints.reduce((sum, ep) => sum + ep.requestsPerMin, 0);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/50 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Infrastructure Telemetry & Health v4.5
            </span>
            <Badge variant="emerald">الأنظمة متصلة ومستقرة 100%</Badge>
          </div>
          <h2 className="text-2xl font-black text-white">مراقب صحة النظام والبنية التحتية (System Health Monitor)</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            متابعة فورية ومباشرة لزمن استجابة الـ API Latency، توزيع أكواد الحالة HTTP Status Codes، ومستويات استهلاك الكوتا المتاحة (Gemini AI, Firestore, FCM & CDN).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleRunHealthCheck}
            disabled={isPinging}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>فحص الاتصال الفوري (Ping API)</span>
          </Button>
        </div>
      </div>

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="متوسط زمن استجابة API Latency"
          value={`${overallAvgLatency} ms`}
          changePercent={-12.4}
          period={`آخر تحديث: ${lastCheckTime}`}
          icon={<Zap className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          label="حجم الطلبات الكلي (Total RPM)"
          value={`${totalRpm.toLocaleString()} req/m`}
          changePercent={8.5}
          period="موزعة على 6 مسارات أساسية"
          icon={<Activity className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          label="معدل نجاح الطلبات (2xx Success Rate)"
          value="98.9%"
          changePercent={0.2}
          period="نسبة الأخطاء الكلية 0.05%"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          label="استهلاك كوتا الذكاء الاصطناعي (Gemini)"
          value="84.2%"
          changePercent={4.1}
          period="84,200 / 100,000 req/day"
          icon={<Gauge className="w-5 h-5 text-purple-500" />}
        />
      </div>

      {/* Grid: API Latency Table + Status Code Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Endpoints Latency & Performance (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="1. زمنيات استجابة الـ API (Real-time API Latency & Metrics)"
            subtitle="مراقبة حية للأداء والأخطاء لكل مسار بررمجي داخل البنية التحتية"
          >
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">المسار البرمجي (Endpoint)</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">متوسط Latency</th>
                    <th className="p-3">p95 / p99</th>
                    <th className="p-3">RPM</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {endpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{ep.endpoint}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ep.method === 'GET'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {ep.method}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600">{ep.avgLatencyMs} ms</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {ep.p95LatencyMs}ms / {ep.p99LatencyMs}ms
                      </td>
                      <td className="p-3 font-mono text-slate-700">{ep.requestsPerMin.toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant="emerald">{ep.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: HTTP Status Codes Distribution (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="2. توزيع أكواد الحالة (HTTP Status Codes Breakdown)"
            subtitle="مؤشرات أداء الاستجابة ونسبة أخطاء الخادم والعميل"
          >
            <div className="space-y-3.5">
              {statusCodes.map((sc) => {
                let barColor = 'bg-emerald-500';
                if (sc.category === '3xx') barColor = 'bg-sky-500';
                if (sc.category === '4xx') barColor = 'bg-amber-500';
                if (sc.category === '5xx') barColor = 'bg-rose-500';

                return (
                  <div key={sc.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{sc.code}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {sc.count.toLocaleString()} ({sc.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${sc.percentage}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{sc.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Quotas & Usage Limits Section */}
      <Card
        title="3. حصص الاستهلاك وسعة الخدمات (Usage Quotas & Limits)"
        subtitle="متابعة استخدام الموارد السحابية مقارنة بالحدود المسموحة لحماية البنية من الانقطاع"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotas.map((q) => {
            const usagePercent = parseFloat(((q.used / q.limit) * 100).toFixed(1));
            const isWarning = usagePercent >= 80;

            return (
              <div
                key={q.resource}
                className={`p-4 rounded-xl border space-y-3 transition-all ${
                  isWarning
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{q.serviceName}</span>
                  <Badge variant={isWarning ? 'amber' : 'indigo'}>{q.category}</Badge>
                </div>

                <div>
                  <span className="text-xs text-slate-600 font-bold block">{q.resource}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <strong className="text-lg font-bold text-slate-900">
                      {q.used.toLocaleString()} <span className="text-xs font-normal text-slate-500">{q.unit}</span>
                    </strong>
                    <span className={`text-xs font-bold ${isWarning ? 'text-amber-700' : 'text-slate-600'}`}>
                      {usagePercent}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>الحد الأقصى اليومي:</span>
                  <span className="font-mono text-slate-700 font-bold">
                    {q.limit.toLocaleString()} {q.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
