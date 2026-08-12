import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Bot,
  Zap,
} from 'lucide-react';

interface IngestionAndAiJobsMonitorProps {
  onTriggerIngestion: () => void;
  triggerToast: (msg: string) => void;
}

export const IngestionAndAiJobsMonitor: React.FC<IngestionAndAiJobsMonitorProps> = ({
  onTriggerIngestion,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'INGESTION' | 'AI_JOBS'>('INGESTION');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ingestion Jobs Mock Queue
  const [ingestionJobs, setIngestionJobs] = useState([
    {
      id: 'job-101',
      source: 'وكالة الأنباء الرسمية (SPA)',
      startedAt: '13:40:00',
      finishedAt: '13:40:02',
      durationMs: 240,
      fetchedItems: 14,
      newItems: 12,
      duplicateItems: 2,
      status: 'Completed',
    },
    {
      id: 'job-102',
      source: 'رويترز العالمية (Reuters)',
      startedAt: '13:42:00',
      finishedAt: '13:42:01',
      durationMs: 180,
      fetchedItems: 25,
      newItems: 20,
      duplicateItems: 5,
      status: 'Completed',
    },
    {
      id: 'job-103',
      source: 'جوجل نيوز (Google News)',
      startedAt: '13:44:00',
      finishedAt: '13:44:03',
      durationMs: 310,
      fetchedItems: 30,
      newItems: 25,
      duplicateItems: 5,
      status: 'Completed',
    },
    {
      id: 'job-104',
      source: 'شبكة GNews',
      startedAt: '13:45:10',
      finishedAt: '13:45:12',
      durationMs: 450,
      fetchedItems: 8,
      newItems: 8,
      duplicateItems: 0,
      status: 'Completed',
    },
  ]);

  // AI Processing Jobs Mock Queue
  const [aiJobs, setAiJobs] = useState([
    {
      id: 'ai-501',
      articleTitle: 'تغطية حصرية: قمة الذكاء الاصطناعي وتطوير البنية التحتية',
      model: 'Gemini 2.5 Flash',
      taskType: 'التلخيص واستخراج الكيانات وSEO',
      tokensUsed: 420,
      durationMs: 1100,
      status: 'Completed',
      error: null,
    },
    {
      id: 'ai-502',
      articleTitle: 'تقرير اقتصادي: مؤشرات النمو والابتكار في القطاع التقني',
      model: 'Gemini 2.5 Flash',
      taskType: 'التلخيص واقتراح العنوان الجذاب',
      tokensUsed: 380,
      durationMs: 950,
      status: 'Completed',
      error: null,
    },
    {
      id: 'ai-503',
      articleTitle: 'تحديثات قطاع الاتصالات والخدمات الرقمية بالمنطقة',
      model: 'Gemini 2.5 Flash',
      taskType: 'إعادة الصياغة الصحفية والوسوم',
      tokensUsed: 290,
      durationMs: 820,
      status: 'Completed',
      error: null,
    },
  ]);

  const handleManualIngestionRun = () => {
    setIsRefreshing(true);
    onTriggerIngestion();
    setTimeout(() => {
      setIsRefreshing(false);
      const newJob = {
        id: `job-${Date.now().toString().slice(-3)}`,
        source: 'جلب شامل لجميع المصادر النشطة',
        startedAt: new Date().toLocaleTimeString('ar-SA'),
        finishedAt: new Date().toLocaleTimeString('ar-SA'),
        durationMs: 650,
        fetchedItems: 42,
        newItems: 38,
        duplicateItems: 4,
        status: 'Completed',
      };
      setIngestionJobs([newJob, ...ingestionJobs]);
      triggerToast('تم تشغيل وظيفة الجلب الفوري واكتشاف 38 خبراً جديداً');
    }, 1200);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">مراقبة جلب الأخبار ومهام معالجة الذكاء الاصطناعي</h3>
          <p className="text-xs text-slate-500 mt-0.5">متابعة دقيقة لتدفق الخلاصات، سرعة معالجة Gemini AI، وسجلات الأخطاء</p>
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
            <span>وظائف جلب المحتوى (Ingestion Jobs)</span>
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
            <span>مهام Gemini AI ({aiJobs.length})</span>
          </button>
        </div>
      </div>

      {/* INGESTION MONITOR */}
      {activeTab === 'INGESTION' && (
        <Card
          title="مراقبة خط الجلب التلقائي (News Ingestion Monitor)"
          subtitle="سجل الوظائف المنفذة للتحقق من سرعة السحب، منع التكرار، والتحقق"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">تكرار الجلب المبرمج: <strong className="text-indigo-600">كل 3 دقائق</strong></span>
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

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم الوظيفة (Job ID)</th>
                    <th className="p-3">المصدر الإخباري</th>
                    <th className="p-3">التوقيت والمدة</th>
                    <th className="p-3">العناصر المجلوبة</th>
                    <th className="p-3">جديدة / مكررة</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ingestionJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-indigo-600">{job.id}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{job.source}</td>
                      <td className="p-3 text-slate-600">
                        {job.startedAt} ({job.durationMs}ms)
                      </td>
                      <td className="p-3 font-bold text-slate-900">{job.fetchedItems} عنصر</td>
                      <td className="p-3">
                        <span className="text-emerald-600 font-bold">+{job.newItems} جديد</span>
                        <span className="text-slate-400 text-[10px] block">({job.duplicateItems} مكرر)</span>
                      </td>
                      <td className="p-3 font-sans">
                        <Badge variant="emerald">مكتملة بنجاح</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* AI JOBS MONITOR */}
      {activeTab === 'AI_JOBS' && (
        <Card
          title="مراقبة وقياس أداء معالجة Gemini AI"
          subtitle="سجل استهلاك الرموز (Tokens)، الزمن المستغرق، وجودة النتائج"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-[10px] text-indigo-700 font-bold block">إجمالي الرموز المستهلكة اليوم</span>
                <strong className="text-xl font-black text-indigo-900 font-mono">1,090 Tokens</strong>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] text-emerald-700 font-bold block">متوسط سرعة التلخيص</span>
                <strong className="text-xl font-black text-emerald-900 font-mono">950ms</strong>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-[10px] text-sky-700 font-bold block">معدل الدقة والاعتماد</span>
                <strong className="text-xl font-black text-sky-900 font-mono">99.8%</strong>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم المهمة</th>
                    <th className="p-3">عنوان المقال المعالج</th>
                    <th className="p-3">النموذج المستخدم</th>
                    <th className="p-3">نوع العملية</th>
                    <th className="p-3">الرموز والزمن</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {aiJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-indigo-600">{job.id}</td>
                      <td className="p-3 font-sans font-bold text-slate-900 truncate max-w-xs">{job.articleTitle}</td>
                      <td className="p-3 font-sans font-bold text-slate-700">{job.model}</td>
                      <td className="p-3 font-sans text-slate-600">{job.taskType}</td>
                      <td className="p-3 text-slate-700">
                        {job.tokensUsed} Tokens ({job.durationMs}ms)
                      </td>
                      <td className="p-3 font-sans">
                        <Badge variant="emerald">مكتملة</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
