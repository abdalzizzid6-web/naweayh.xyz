import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Layers,
  Cpu,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface RealAiJob {
  id: number;
  article_id: number | null;
  job_type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING_RETRY';
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  payload: any;
  result: any;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  article_title: string;
}

interface IngestionJobLog {
  id: string;
  source: string;
  timestamp: string;
  durationMs: number | null;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  details: string;
}

interface IngestionAndAiJobsMonitorProps {
  onTriggerIngestion: () => Promise<void> | void;
  triggerToast: (msg: string) => void;
}

export const IngestionAndAiJobsMonitor: React.FC<IngestionAndAiJobsMonitorProps> = ({
  onTriggerIngestion,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'INGESTION' | 'AI_JOBS'>('INGESTION');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiJobs, setAiJobs] = useState<RealAiJob[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<IngestionJobLog[]>([]);
  const [isLoadingAiJobs, setIsLoadingAiJobs] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<number | null>(null);

  const fetchRealAiJobs = async () => {
    setIsLoadingAiJobs(true);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const res = await fetch('/api/v1/admin/ai-jobs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAiJobs(json.data);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingAiJobs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'AI_JOBS') {
      fetchRealAiJobs();
    }
  }, [activeTab]);

  const handleManualIngestionRun = async () => {
    setIsRefreshing(true);
    const startMs = Date.now();
    try {
      await onTriggerIngestion();
      const durationMs = Date.now() - startMs;
      const newLog: IngestionJobLog = {
        id: `sync-${Date.now().toString().slice(-4)}`,
        source: 'جلب شامل لجميع المصادر النشطة',
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        durationMs,
        status: 'SUCCESS',
        details: 'تم تنفيذ دورة المزامنة وجلب الأخبار بنجاح.',
      };
      setIngestionLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      triggerToast('تم تشغيل دورة المزامنة الحقيقية بنجاح.');
    } catch (err: any) {
      const durationMs = Date.now() - startMs;
      const errorLog: IngestionJobLog = {
        id: `sync-${Date.now().toString().slice(-4)}`,
        source: 'جلب شامل لجميع المصادر',
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        durationMs,
        status: 'FAILED',
        details: err?.message || 'فشلت عملية الجلب',
      };
      setIngestionLogs((prev) => [errorLog, ...prev.slice(0, 19)]);
      triggerToast('فشلت دورة المزامنة: ' + (err?.message || 'خطأ غير متوقع'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRetryAiJob = async (jobId: number) => {
    setRetryingJobId(jobId);
    try {
      const token = localStorage.getItem('adminToken') || '';
      const res = await fetch(`/api/v1/admin/ai-jobs/${jobId}/retry`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        triggerToast('تمت إعادة جدولة المهمة بنجاح.');
        await fetchRealAiJobs();
      } else {
        triggerToast('فشلت إعادة جدولة المهمة.');
      }
    } catch {
      triggerToast('خطأ في الاتصال بالخادم.');
    } finally {
      setRetryingJobId(null);
    }
  };

  // Compute real metrics
  const completedAiCount = aiJobs.filter((j) => j.status === 'COMPLETED').length;
  const failedAiCount = aiJobs.filter((j) => j.status === 'FAILED').length;
  const pendingAiCount = aiJobs.filter((j) => j.status === 'RUNNING' || j.status === 'PENDING_RETRY').length;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">مراقبة خط الجلب ومهام الذكاء الاصطناعي الحقيقية</h3>
          <p className="text-xs text-slate-500 mt-0.5">متابعة فعلية لتدفق الخلاصات وسجلات جدول ai_jobs بدون محاكاة أو بيانات وهمية</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('INGESTION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'INGESTION'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>وظائف الجلب الفعلي (Ingestion)</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_JOBS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'AI_JOBS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>مهام الذكاء الاصطناعي الحقيقية ({aiJobs.length})</span>
          </button>
        </div>
      </div>

      {/* INGESTION MONITOR */}
      {activeTab === 'INGESTION' && (
        <Card
          title="مراقبة خط الجلب التلقائي (Live News Ingestion)"
          subtitle="سجل العمليات الحقيقية المنفذة مع الخوادم الإخبارية"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                الجدولة التلقائية: <strong className="text-indigo-600">NewsSchedulerWorker نشط في الخلفية</strong>
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={isRefreshing}
                onClick={handleManualIngestionRun}
                className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>تشغيل دورة جلب فورية الآن</span>
              </Button>
            </div>

            {ingestionLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">لا توجد دورات جلب يدوية مسجلة في الجلسة الحالية</p>
                <p className="text-[11px] text-slate-500">
                  انقر على زر "تشغيل دورة جلب فورية الآن" لجلب المحتوى الفعلي من جميع الخلاصات النشطة.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">المعرف</th>
                      <th className="p-3">المصدر / النوع</th>
                      <th className="p-3">التوقيت</th>
                      <th className="p-3">زمن الاستجابة</th>
                      <th className="p-3">التفاصيل</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {ingestionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-indigo-600">{log.id}</td>
                        <td className="p-3 font-sans font-bold text-slate-900">{log.source}</td>
                        <td className="p-3 text-slate-600">{log.timestamp}</td>
                        <td className="p-3 text-slate-700">{log.durationMs ?? '—'} ms</td>
                        <td className="p-3 font-sans text-slate-700">{log.details}</td>
                        <td className="p-3 font-sans">
                          <Badge variant={log.status === 'SUCCESS' ? 'emerald' : 'rose'}>
                            {log.status === 'SUCCESS' ? 'نجحت' : 'فشلت'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* AI JOBS MONITOR */}
      {activeTab === 'AI_JOBS' && (
        <Card
          title="سجل مهام الذكاء الاصطناعي الفعلي (Real AI Jobs from Database)"
          subtitle="سجل حقيقي للمهام المنفذة بواسطة Gemini API ومخزنة في جدول ai_jobs"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block">المهام المكتملة بنجاح (COMPLETED)</span>
                <strong className="text-xl font-black text-emerald-900 font-mono">{completedAiCount}</strong>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-700 font-bold block">المهام المتعثرة (FAILED)</span>
                <strong className="text-xl font-black text-rose-900 font-mono">{failedAiCount}</strong>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-[10px] text-indigo-700 font-bold block">قيد المعالجة (RUNNING / QUEUED)</span>
                <strong className="text-xl font-black text-indigo-900 font-mono">{pendingAiCount}</strong>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRealAiJobs}
                disabled={isLoadingAiJobs}
                className="text-xs gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAiJobs ? 'animate-spin' : ''}`} />
                <span>تحديث السجل من قاعدة البيانات</span>
              </Button>
            </div>

            {aiJobs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">لا توجد مهام ذكاء اصطناعي مسجلة حتى الآن</p>
                <p className="text-[11px] text-slate-500">
                  يتم إنشاء المهام تلقائياً في قاعدة البيانات عند معالجة مقال بواسطة Gemini AI.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">المعرف</th>
                      <th className="p-3">عنوان المقال المعالج</th>
                      <th className="p-3">نوع المهمة</th>
                      <th className="p-3">المحاولات</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">الخطأ / النتيجة</th>
                      <th className="p-3">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {aiJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-indigo-600">#{job.id}</td>
                        <td className="p-3 font-sans font-bold text-slate-900 truncate max-w-xs">
                          {job.article_title}
                        </td>
                        <td className="p-3 font-sans text-slate-600 text-[11px]">{job.job_type}</td>
                        <td className="p-3 text-slate-700">
                          {job.attempts} / {job.max_attempts}
                        </td>
                        <td className="p-3 font-sans">
                          <Badge
                            variant={
                              job.status === 'COMPLETED'
                                ? 'emerald'
                                : job.status === 'FAILED'
                                ? 'rose'
                                : 'amber'
                            }
                          >
                            {job.status === 'COMPLETED'
                              ? 'مكتملة'
                              : job.status === 'FAILED'
                              ? 'فشلت'
                              : 'جارية'}
                          </Badge>
                        </td>
                        <td className="p-3 font-sans text-slate-500 text-[11px] max-w-xs truncate">
                          {job.last_error || (job.status === 'COMPLETED' ? 'تمت بنجاح' : '—')}
                        </td>
                        <td className="p-3 font-sans">
                          {job.status === 'FAILED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryAiJob(job.id)}
                              disabled={retryingJobId === job.id}
                              className="text-[10px] py-1 px-2 gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                            >
                              <RotateCcw className={`w-3 h-3 ${retryingJobId === job.id ? 'animate-spin' : ''}`} />
                              <span>إعادة المحاولة</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
