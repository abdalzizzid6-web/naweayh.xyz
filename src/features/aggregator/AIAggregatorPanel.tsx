import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { newsService } from '../../services/newsService';
import { aiEngineService, AIPipelineResult } from '../../services/aiEngineService';
import {
  aggregationQueue,
  aggregationScheduler,
  QueueTask,
  QueueMetrics,
} from '../../news-engine';
import { NewsSource, NewsSourceProtocol } from '../../core';
import { AddSourceModal } from './AddSourceModal';
import { DuplicateDetectionPanel } from './DuplicateDetectionPanel';
import { AIEntityExtractionModule } from './AIEntityExtractionModule';
import {  Cpu,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  Play,
  Pause,
  Zap,
  Database,
  Filter,
  Plus,
  Clock,
  Activity,
  Globe,
  Radio,
  Trash2,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  GitMerge,
} from 'lucide-react';

export const AIAggregatorPanel: React.FC = () => {
  const [activeMainMode, setActiveMainMode] = useState<'DEDUPLICATION_ENGINE' | 'SOURCES_QUEUE' | 'AI_ENTITY_EXTRACTION'>('AI_ENTITY_EXTRACTION');
  const [sources, setSources] = useState<NewsSource[]>(newsService.getSources());

  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics>(aggregationQueue.getMetrics());
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>(aggregationQueue.getTasks());
  const [schedulerInfo, setSchedulerInfo] = useState(aggregationScheduler.getStatus());

  const [filterProtocol, setFilterProtocol] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Playground state
  const [rawTitleInput, setRawTitleInput] = useState<string>(
    'مؤتمر الطاقة العالمي يعلن اتفاقية للتحول الأخضر بإنشاء محطات ضخمة'
  );
  const [rawTextInput, setRawTextInput] = useState<string>(
    'وقع وزراء الطاقة والتكنولوجيا اليوم اتفاقية إقليمية للتحول الأخضر بإنشاء محطات طاقة شمسية ومزارع رياح بقدرة 20 جيجاوات.'
  );
  const [sourceNameInput, setSourceNameInput] = useState<string>('رويترز العربية');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIPipelineResult | null>(null);

  useEffect(() => {
    // Subscribe to queue updates
    const unsubscribeQueue = aggregationQueue.subscribe(() => {
      setQueueMetrics(aggregationQueue.getMetrics());
      setQueueTasks(aggregationQueue.getTasks());
      setSources(newsService.getSources());
    });

    // Subscribe to scheduler updates
    const unsubscribeScheduler = aggregationScheduler.subscribe(() => {
      setSchedulerInfo(aggregationScheduler.getStatus());
    });

    return () => {
      unsubscribeQueue();
      unsubscribeScheduler();
    };
  }, []);

  const handleToggleSource = (id: string) => {
    const updated = newsService.toggleSourceStatus(id);
    if (updated) {
      setSources(newsService.getSources());
    }
  };

  const handleDeleteSource = (id: string) => {
    const success = newsService.deleteSource(id);
    if (success) {
      setSources(newsService.getSources());
    }
  };

  const handleAddSource = (newSource: NewsSource) => {
    newsService.addSource(newSource);
    setSources(newsService.getSources());
    aggregationQueue.enqueueSource(newSource);
  };

  const handleEnqueueSingle = (source: NewsSource) => {
    aggregationQueue.enqueueSource(source);
  };

  const handleEnqueueAllActive = () => {
    const active = sources.filter((s) => s.status === 'Active');
    aggregationQueue.enqueueBatch(active);
  };

  const handleToggleScheduler = () => {
    if (schedulerInfo.status === 'Running') {
      aggregationScheduler.pauseScheduler();
    } else {
      aggregationScheduler.startScheduler();
    }
  };

  const handleTrigger5MinSync = () => {
    aggregationScheduler.triggerScheduledBatchSync();
  };

  const handleTestAIIngestion = async () => {
    setIsProcessingAI(true);
    const result = await aiEngineService.processArticleWithAI(
      rawTitleInput,
      rawTextInput,
      sourceNameInput
    );
    setAiResult(result);
    setIsProcessingAI(false);
  };

  // Filtered Sources
  const filteredSources = sources.filter((src) => {
    const matchesProtocol = filterProtocol === 'ALL' || src.type === filterProtocol;
    const matchesCountry = filterCountry === 'ALL' || src.country === filterCountry;
    const matchesSearch =
      src.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      src.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      src.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProtocol && matchesCountry && matchesSearch;
  });

  const availableProtocols: { id: string; label: string }[] = [
    { id: 'ALL', label: 'جميع البرتوكولات' },
    { id: 'RSS', label: 'RSS Feed' },
    { id: 'Atom', label: 'Atom' },
    { id: 'Google_News', label: 'Google News' },
    { id: 'NewsAPI', label: 'NewsAPI' },
    { id: 'GNews', label: 'GNews' },
    { id: 'Mediastack', label: 'Mediastack' },
    { id: 'NewsData_io', label: 'NewsData.io' },
    { id: 'Guardian', label: 'The Guardian' },
    { id: 'NYT', label: 'NY Times' },
    { id: 'Reuters', label: 'Reuters' },
    { id: 'BBC', label: 'BBC' },
    { id: 'CNN', label: 'CNN' },
    { id: 'AlJazeera', label: 'الجزيرة' },
    { id: 'AlArabiya', label: 'العربية' },
    { id: 'SkyNews', label: 'سكاي نيوز' },
    { id: 'JSON', label: 'JSON / REST' },
  ];

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Main Navigation Tabs */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveMainMode('AI_ENTITY_EXTRACTION')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeMainMode === 'AI_ENTITY_EXTRACTION'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
            استخراج الكيانات بالذكاء الاصطناعي (AI Entity Extraction)
          </button>

          <button
            onClick={() => setActiveMainMode('DEDUPLICATION_ENGINE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeMainMode === 'DEDUPLICATION_ENGINE'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GitMerge className="w-4 h-4 text-amber-400" />
            محرك كشف التكرار (Duplicate Detection)
          </button>

          <button
            onClick={() => setActiveMainMode('SOURCES_QUEUE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeMainMode === 'SOURCES_QUEUE'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-400" />
            إدارة طابور السحب (Sources & Queue)
          </button>
        </div>

        <Badge variant="emerald" className="hidden sm:inline-flex">
          أنظمة معالجة البيانات المتقدمة نشطة
        </Badge>
      </div>

      {activeMainMode === 'AI_ENTITY_EXTRACTION' ? (
        <AIEntityExtractionModule />
      ) : activeMainMode === 'DEDUPLICATION_ENGINE' ? (
        <DuplicateDetectionPanel />
      ) : (
        <>
          {/* Top Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-100 font-medium">الأخبار المستخرجة اليوم</p>
              <h3 className="text-2xl font-black mt-1">
                {queueMetrics.totalArticlesIngested.toLocaleString('ar-EG')}
              </h3>
              <p className="text-[11px] text-indigo-200 mt-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-300" />
                عبر {sources.length} مصدر إخباري مفعّل
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 font-medium">سعة طابور المعالجة والتزامن</p>
              <h3 className="text-2xl font-black mt-1">
                {queueMetrics.activeWorkersCount} / {queueMetrics.maxConcurrency} عمال نشطين
              </h3>
              <p className="text-[11px] text-emerald-200 mt-1">
                إنتاجية: {queueMetrics.throughputPerMin} تغذية/دقيقة
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-sky-600 to-sky-800 text-white border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-sky-100 font-medium">معدل سرعة السحب والتحليل</p>
              <h3 className="text-2xl font-black mt-1">{queueMetrics.averageLatencyMs} ملي ثانية</h3>
              <p className="text-[11px] text-sky-200 mt-1">Parallel In-Memory Queue Engine</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Cpu className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-600 to-amber-800 text-white border-none shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-100 font-medium">حالة الجدولة الآلية (5 دقائق)</p>
              <h3 className="text-2xl font-black mt-1 flex items-center gap-2">
                {schedulerInfo.formattedCountdown}
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded">
                  {schedulerInfo.status === 'Running' ? 'نشطة' : 'متوقفة'}
                </span>
              </h3>
              <p className="text-[11px] text-amber-200 mt-1">
                آخر دورة سحب: {schedulerInfo.lastRunTime}
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Control Action Toolbar */}
      <Card className="bg-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                محرك الجمع والتجميع الآلي المزدوج (News Aggregation Engine)
              </h3>
              <Badge variant="rose">تزامن عالي</Badge>
            </div>
            <p className="text-xs text-slate-400">
              دعم سحب الأخبار من آلاف المصادر العالمية والمحلية باستخدام طابور المهام وتفادي الحمل على السيرفر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={handleTrigger5MinSync}
              className="bg-indigo-600 hover:bg-indigo-500 shadow-sm"
            >
              <RefreshCw className="w-4 h-4 ml-1.5 animate-spin-slow" />
              تشغيل دورة الـ 5 دقائق فلياً
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEnqueueAllActive}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              <Layers className="w-4 h-4 ml-1.5 text-emerald-400" />
              سحب دفعة لجميع المصادر
            </Button>

            <Button
              variant={schedulerInfo.status === 'Running' ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleScheduler}
              className="border-slate-700"
            >
              {schedulerInfo.status === 'Running' ? (
                <>
                  <Pause className="w-4 h-4 ml-1.5 text-amber-400" />
                  إيقاف الجدولة مؤقتاً
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-1.5 text-emerald-400" />
                  استئناف الجدولة
                </>
              )}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <Plus className="w-4 h-4 ml-1.5" />
              إضافة مصدر جديد
            </Button>
          </div>
        </div>

        {/* Worker Pool Configuration */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              حجم العمال المتزامنين (Worker Pool Concurrency):
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => aggregationQueue.setMaxConcurrency(count)}
                  className={`px-2.5 py-0.5 rounded font-bold transition-colors ${
                    queueMetrics.maxConcurrency === count
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {count} Parallel
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span>
              في الطابور: <strong className="text-amber-400">{queueMetrics.pendingCount}</strong>
            </span>
            <span>•</span>
            <span>
              مكتملة: <strong className="text-emerald-400">{queueMetrics.completedCount}</strong>
            </span>
            <span>•</span>
            <span>
              أخطاء: <strong className="text-rose-400">{queueMetrics.failedCount}</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Live Queue Tasks Telemetry Stream */}
      {queueTasks.length > 0 && (
        <Card
          title={
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              البث المباشر لطابور السحب والمعالجة (Live Task Queue Stream)
            </span>
          }
          subtitle="مراقبة حية لسير مهام السحب الفوري من مختلف الموصلات والبروتوكولات"
        >
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {queueTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    task.status === 'processing'
                      ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 ring-2 ring-indigo-500/20'
                      : task.status === 'completed'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : task.status === 'failed'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{task.sourceName}</span>
                      <Badge
                        variant={
                          task.priority === 'High'
                            ? 'rose'
                            : task.priority === 'Medium'
                            ? 'amber'
                            : 'neutral'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>بروتوكول: {task.protocol}</span>
                      <span>•</span>
                      <span>وقت البدء: {task.startedAt || task.queuedAt}</span>
                    </div>
                  </div>

                  <div>
                    {task.status === 'processing' && (
                      <span className="flex items-center gap-1 text-indigo-600 font-bold bg-white px-2 py-1 rounded shadow-xs border border-indigo-100">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        جاري السحب
                      </span>
                    )}
                    {task.status === 'completed' && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold bg-white px-2 py-1 rounded shadow-xs border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />+{task.itemsIngested} خبر
                      </span>
                    )}
                    {task.status === 'failed' && (
                      <span className="flex items-center gap-1 text-rose-600 font-bold bg-white px-2 py-1 rounded shadow-xs border border-rose-100">
                        <AlertCircle className="w-3.5 h-3.5" />
                        خطأ شبكة
                      </span>
                    )}
                    {task.status === 'pending' && (
                      <span className="text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 font-medium">
                        في الانتظار
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {queueTasks.length > 6 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => aggregationQueue.clearCompletedTasks()}
                  className="text-xs text-slate-500"
                >
                  تنظيف المهام المكتملة ({queueTasks.filter((t) => t.status === 'completed').length})
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Source Network Directory Management */}
      <Card
        title={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                شبكة المصادر والمغذيات الإخبارية ({filteredSources.length} مصدر)
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                تصفية وإدارة جميع الموصلات والبروتوكولات وواجهات البرمجة المفعلة
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="بحث في اسم المصدر أو الرابط..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
              />
            </div>
          </div>
        }
      >
        {/* Protocol Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-3 border-b border-slate-100 text-xs">
          <ListFilter className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          {availableProtocols.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProtocol(p.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filterProtocol === p.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sources Table / Grid */}
        <div className="divide-y divide-slate-100 mt-2">
          {filteredSources.map((src) => (
            <div
              key={src.id}
              className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
            >
              <div className="flex items-start gap-3">
                <img
                  src={src.logo}
                  alt={src.name}
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0 mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{src.name}</h4>
                    <Badge
                      variant={
                        src.type === 'RSS'
                          ? 'indigo'
                          : src.type === 'Google_News'
                          ? 'rose'
                          : src.type === 'NewsAPI'
                          ? 'sky'
                          : 'amber'
                      }
                    >
                      {src.type}
                    </Badge>
                    <Badge
                      variant={
                        src.priority === 'High'
                          ? 'rose'
                          : src.priority === 'Medium'
                          ? 'amber'
                          : 'neutral'
                      }
                    >
                      أولوية: {src.priority}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {src.country} • {src.category} • {src.language === 'ar' ? 'عربي' : 'English'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono text-left dir-ltr truncate max-w-md">
                    {src.url}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-0.5">
                    <span>آخر سحب: {src.lastFetchedAt}</span>
                    <span>•</span>
                    <span>سحب كل {src.fetchFrequencyMinutes} دقائق</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">
                      +{src.articlesCountToday} خبر اليوم
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <div className="text-right ml-2 hidden sm:block">
                  <span className="text-xs font-bold text-amber-500">
                    {'★'.repeat(src.reliabilityRating)}
                  </span>
                  <p className="text-[10px] text-slate-400">درجة الموثوقية</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEnqueueSingle(src)}
                  disabled={src.status !== 'Active'}
                  className="text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 ml-1 text-indigo-600" />
                  سحب الآن
                </Button>

                <Button
                  variant={src.status === 'Active' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleSource(src.id)}
                  className="text-xs"
                >
                  {src.status === 'Active' ? 'إيقاف' : 'تفعيل'}
                </Button>

                <button
                  onClick={() => handleDeleteSource(src.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="حذف المصدر"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredSources.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              لا توجد مصادر مطابقة لخيارات التصفية المختارة.
            </div>
          )}
        </div>
      </Card>

      {/* Interactive Gemini 2.5 Flash Ingestion Simulator Playground */}
      <Card
        title={
          <span className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            منصة اختبار التلخيص وتصفية التكرار بالذكاء الاصطناعي (Gemini 2.5 Flash Engine)
          </span>
        }
        subtitle="اختبر كيفية قيام نماذج Gemini بمعالجة الأخبار الخام وتجميع المصادر المتعددة في خبر واحد موثوق"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم المصدر الإخباري
              </label>
              <input
                type="text"
                value={sourceNameInput}
                onChange={(e) => setSourceNameInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عنوان الخبر الخام
              </label>
              <input
                type="text"
                value={rawTitleInput}
                onChange={(e) => setRawTitleInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تفاصيل ومحتوى الخبر
              </label>
              <textarea
                rows={4}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <Button
              variant="primary"
              onClick={handleTestAIIngestion}
              disabled={isProcessingAI}
              className="w-full"
            >
              {isProcessingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  جاري تحليل وتنظيف الخبر بالذكاء الاصطناعي...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 ml-2" />
                  تشغيل معالجة Gemini 2.5 Flash
                </>
              )}
            </Button>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                نتائج معالجة محرك الذكاء الاصطناعي (18-Step Pipeline)
              </span>
              {aiResult && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  نسبة الموثوقية: {aiResult.trustScore}%
                </span>
              )}
            </div>

            {aiResult ? (
              <div className="space-y-4 text-xs leading-relaxed max-h-[550px] overflow-y-auto pr-1">
                {/* Steps 1-3: Cleaning */}
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>1-3. تنظيف HTML، إزالة الأكواد والإعلانات:</span>
                    <Badge variant="emerald">تم التنظيف</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono line-clamp-2 bg-slate-900/60 p-1.5 rounded">
                    {aiResult.adFreeContent}
                  </p>
                </div>

                {/* Steps 4-5: Language & Translation */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block mb-0.5">4. اكتشاف اللغة:</span>
                    <strong className="text-indigo-300 font-bold uppercase">{aiResult.detectedLanguage}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block mb-0.5">5. الترجمة الفورية:</span>
                    <strong className="text-emerald-300 font-bold">
                      {aiResult.translatedArabicTitle ? 'تمت الترجمة للعربية' : 'النصر أصلي بالعربية'}
                    </strong>
                  </div>
                </div>

                {/* Steps 6-8: Title, Summary & Paraphrase */}
                <div className="space-y-2">
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-indigo-900/50">
                    <span className="text-indigo-400 text-[10px] font-bold block mb-1">8. العنوان الجذاب المولد:</span>
                    <h4 className="font-bold text-white text-sm">{aiResult.catchyTitle}</h4>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 text-[10px] font-bold block mb-1">6. الملخص العربي الدقيق:</span>
                    <p className="text-slate-200">{aiResult.arabicSummary}</p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
                    <span className="text-amber-400 text-[10px] font-bold block mb-1">7. إعادة صياغة الملخص:</span>
                    <p className="text-slate-300 italic">{aiResult.paraphrasedSummary}</p>
                  </div>
                </div>

                {/* Steps 9-14: NLP Entity Extraction */}
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 space-y-2">
                  <span className="text-indigo-400 font-bold block text-[11px]">9-14. استخراج الكيانات والأشخاص والأحداث:</span>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.people.map((p, idx) => (
                      <span key={idx} className="bg-rose-950/80 text-rose-300 text-[10px] px-2 py-0.5 rounded border border-rose-800/60">
                        👤 {p}
                      </span>
                    ))}
                    {aiResult.companies.map((c, idx) => (
                      <span key={idx} className="bg-indigo-950/80 text-indigo-300 text-[10px] px-2 py-0.5 rounded border border-indigo-800/60">
                        🏢 {c}
                      </span>
                    ))}
                    {aiResult.countries.map((ct, idx) => (
                      <span key={idx} className="bg-emerald-950/80 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-800/60">
                        🌍 {ct}
                      </span>
                    ))}
                    {aiResult.cities.map((ci, idx) => (
                      <span key={idx} className="bg-sky-950/80 text-sky-300 text-[10px] px-2 py-0.5 rounded border border-sky-800/60">
                        📍 {ci}
                      </span>
                    ))}
                    {aiResult.events.map((ev, idx) => (
                      <span key={idx} className="bg-amber-950/80 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-800/60">
                        🎯 {ev}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Steps 15-16: Categorization & Trust */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block mb-0.5">15. التصنيف والفرعي:</span>
                    <strong className="text-white">{aiResult.category} • {aiResult.subCategory}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/80">
                    <span className="text-slate-400 block mb-0.5">16. تقييم الموثوقية:</span>
                    <strong className="text-emerald-400">{aiResult.trustScore}/100</strong>
                  </div>
                </div>

                {/* Step 17: SEO Meta */}
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 space-y-1">
                  <span className="text-sky-400 font-bold block text-[11px]">17. بيانات السيو SEO Metadata:</span>
                  <p className="text-[10px] text-slate-300 font-mono">Slug: {aiResult.seoMeta.slug}</p>
                  <p className="text-[10px] text-slate-400">Meta: {aiResult.seoMeta.metaDescription}</p>
                </div>

                {/* Step 18: Deduplication & Linking */}
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px]">18. ربط الأخبار المتشابهة وتصفية التكرار:</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {aiResult.isDuplicate ? 'خبر مكرر تم ربطه بالخبر الأصلي' : 'خبر فريد غير مكرر'}
                    </span>
                  </div>
                  <Badge variant={aiResult.isDuplicate ? 'amber' : 'emerald'}>
                    تشابه: {aiResult.similarityScore}%
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
                <Cpu className="w-10 h-10 text-slate-700 animate-pulse" />
                <p className="text-xs">اضغط على زر المعالجة لبدء التحليل الفوري وتطبيق الـ 18 خطوة بالكامل</p>
              </div>
            )}
          </div>
        </div>
      </Card>
        </>
      )}

      {/* Add New Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSource={handleAddSource}
      />
    </div>
  );
};

