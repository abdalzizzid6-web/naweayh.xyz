import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  duplicateDetectionEngine,
  DeduplicationComparisonResult,
  BatchIngestionResult,
  IngestionDeduplicationReport,
} from '../../news-engine/DuplicateDetectionEngine';
import { articlesRepository } from '../../repositories/articlesRepository';
import { NewsArticle } from '../../core/domain/types';
import {
  GitMerge,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Zap,
  BarChart3,
  Globe,
  RefreshCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const DuplicateDetectionPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SIMULATION_100' | 'MANUAL_TEST' | 'STORED_CLUSTERS'>('SIMULATION_100');

  // 100 Newspaper Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<BatchIngestionResult | null>(null);
  const [selectedReport, setSelectedReport] = useState<IngestionDeduplicationReport | null>(null);

  // Manual comparison state
  const [titleA, setTitleA] = useState('السعودية تعلن إطلاق مبادرة الطاقة الخضراء الكبرى بالرياض');
  const [contentA, setContentA] = useState('أعلنت وزارة الطاقة السعودية عن إطلاق أكبر مشروع للهيدروجين الأخضر والطاقة الشمسية باستثمارات تبلغ 50 مليار دولار.');

  const [titleB, setTitleB] = useState('الرياض تطلق مشروعاً ضخماً للهيدروجين الأخضر بـ 50 مليار دولار');
  const [contentB, setContentB] = useState('كشفت مصادر رسمية في الرياض عن بدء تنفيذ المبادرة الوطنية للهيدروجين الأخضر بمشاركة شركات عالمية.');

  const [comparisonResult, setComparisonResult] = useState<DeduplicationComparisonResult | null>(null);

  // Articles from repository
  const [articlesList, setArticlesList] = useState<NewsArticle[]>(articlesRepository.getAll());

  // Run 100 Newspaper Simulation
  const handleRun100NewspaperSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    setSelectedReport(null);

    // Generate 100 newspaper articles about 3 distinct major breaking news topics
    const newspaperSources = [
      { id: 'src-spa', name: 'وكالة الأنباء السعودية (واس)', reliability: 98 },
      { id: 'src-reuters', name: 'رويترز العربية', reliability: 95 },
      { id: 'src-bloomberg', name: 'بلومبرغ الشرق', reliability: 94 },
      { id: 'src-bbc', name: 'بي بي سي عربي', reliability: 92 },
      { id: 'src-aljazeera', name: 'الجزيرة نت', reliability: 90 },
      { id: 'src-alarabiya', name: 'العربية.نت', reliability: 91 },
      { id: 'src-cnn', name: 'CNN بالعربية', reliability: 89 },
      { id: 'src-skynews', name: 'سكاي نيوز عربية', reliability: 88 },
      { id: 'src-wsj', name: 'وول ستريت جورنال', reliability: 93 },
      { id: 'src-ft', name: 'فايننشال تايمز', reliability: 92 },
    ];

    const batchItems: Array<{ title: string; text: string; sourceId: string; category?: string; country?: string }> = [];

    // Story Cluster 1: Green Energy Initiative (40 newspapers publish this)
    for (let i = 1; i <= 40; i++) {
      const src = newspaperSources[i % newspaperSources.length];
      const variations = [
        'السعودية تعلن تأسيس أكبر مجمع للهيدروجين الأخضر بالرياض باستثمارات 50 مليار دولار',
        'الرياض تشهد إطلاق المبادرة الوطنية للهيدروجين النظيف بمشاركة 20 شركة عالمية',
        'تأسيس أضخم مشروع للهيدروجين الأخضر في الشرق الأوسط بالعاصمة السعودية',
        'إطلاق مجمع الهيدروجين الأخضر السعودي بـ 50 مليار دولار لتحقيق الحياد الصفري',
      ];
      batchItems.push({
        title: `${variations[i % variations.length]} (صحيفة ${i})`,
        text: `أعلنت وزارة الطاقة اليوم بحضور كبار المسؤولين عن بدء المرحلة الأولى من مشروع الهيدروجين الأخضر بقدرة 20 جيجاوات. ${
          i % 5 === 0 ? 'تحديث جديد: وقّعت 5 شركات ألمانية يابانية عقود الصيانة والتشغيل الفوري.' : ''
        }`,
        sourceId: src.id,
        category: 'اقتصاد',
        country: 'السعودية',
      });
    }

    // Story Cluster 2: Global AI Summit (35 newspapers publish this)
    for (let i = 1; i <= 35; i++) {
      const src = newspaperSources[i % newspaperSources.length];
      batchItems.push({
        title: `انطلاق قمة الذكاء الاصطناعي العالمية بمشاركة 100 دولة ومؤسسة تقنية (المصدر ${i})`,
        text: 'افتتحت اليوم أعمال قمة الذكاء الاصطناعي لمناقشة الحوكمة العالمية والأنظمة الذكية وسبل دعم الابتكار المالي والتكنولوجي.',
        sourceId: src.id,
        category: 'تكنولوجيا',
        country: 'السعودية',
      });
    }

    // Story Cluster 3: Space Exploration Mission (25 newspapers publish this)
    for (let i = 1; i <= 25; i++) {
      const src = newspaperSources[i % newspaperSources.length];
      batchItems.push({
        title: `إطلاق مهمة الفضاء العربية الجديدة لدراسة التغير المناخي والطقس (الوسيلة ${i})`,
        text: 'نجح أحدث قمر صناعي عربي في الوصول إلى مداره المخصص للبدء في نقل البيانات المناخية والصور الفضائية عالية الدقة.',
        sourceId: src.id,
        category: 'علوم',
        country: 'الإمارات',
      });
    }

    // Process all 100 newspapers through DuplicateDetectionEngine
    const result = await duplicateDetectionEngine.processBatchArticles(batchItems);
    setSimulationResult(result);
    setArticlesList(articlesRepository.getAll());
    setIsSimulating(false);
  };

  // Run Manual Deduplication Check
  const handleRunManualCompare = () => {
    const dummyArticle: NewsArticle = {
      id: 'existing-test-art',
      title: titleA,
      slug: 'test-slug',
      summary: contentA,
      content: contentA,
      mainImage: '',
      galleryImages: [],
      category: 'عام',
      country: 'السعودية',
      language: 'ar',
      publishDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readTimeMinutes: 2,
      viewsCount: 10,
      sharesCount: 1,
      commentsCount: 0,
      bookmarksCount: 0,
      isBreaking: false,
      isTrending: false,
      isEditorPick: false,
      trustScore: 90,
      sources: [],
      aiEntities: {
        people: ['وزير الطاقة'],
        organizations: ['وزارة الطاقة'],
        locations: ['الرياض', 'السعودية'],
        countries: ['السعودية'],
        cities: ['الرياض'],
        events: ['مبادرة الطاقة الخضراء'],
        keywords: ['الهيدروجين', 'الأخضر', 'الطاقة', 'استثمارات'],
        tags: ['#طاقة'],
        sentiment: 'Positive',
        trustScore: 90,
      },
      seoMeta: {
        title: titleA,
        description: contentA,
        keywords: ['طاقة'],
        canonicalUrl: '',
        schemaType: '',
        openGraphImage: '',
      },
      socialPosts: [],
    };

    const res = duplicateDetectionEngine.compareArticles(
      {
        title: titleB,
        content: contentB,
        keywords: ['الهيدروجين', 'الأخضر', 'الرياض'],
        people: ['وزير الطاقة'],
        companies: ['الشركات العالميه'],
        locations: ['الرياض'],
      },
      dummyArticle
    );

    setComparisonResult(res);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800/50 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Duplicate Detection & Multi-Source Clustering Engine
            </span>
            <Badge variant="emerald">جاهز للعمل المباشر</Badge>
          </div>
          <h2 className="text-2xl font-black text-white">محرك كشف التكرار وتجميع المصادر الذكي</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            عند نشر 100 صحيفة لنفس الخبر، يقوم المحرك بدمجها تلقائياً في خبر موحد فريد، وربط كافة المصادر ورتبها حسب الموثوقية مع تحديث الفحوى فور ورود معلومات جديدة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'SIMULATION_100' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('SIMULATION_100')}
            className="text-xs gap-2"
          >
            <GitMerge className="w-4 h-4" />
            محاكاة 100 صحيفة
          </Button>
          <Button
            variant={activeTab === 'MANUAL_TEST' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('MANUAL_TEST')}
            className="text-xs gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            اختبار خوارزمية التطابق
          </Button>
          <Button
            variant={activeTab === 'STORED_CLUSTERS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('STORED_CLUSTERS')}
            className="text-xs gap-2"
          >
            <Layers className="w-4 h-4" />
            الأخبار المجمعة ({articlesList.length})
          </Button>
        </div>
      </div>

      {/* Tab 1: 100 Newspaper Simulation */}
      {activeTab === 'SIMULATION_100' && (
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  محاكاة نشر 100 صحيفة لخبر واحد (100 Newspaper Simulation Test)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  يقوم الاختبار بتغذية النظام بـ 100 خبر من 10 وكالات أنباء عالمية، لتطبيق خوارزميات التصفية والدمج في الوقت الفعلي.
                </p>
              </div>

              <Button
                disabled={isSimulating}
                onClick={handleRun100NewspaperSimulation}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg gap-2"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    جاري معالجة الـ 100 خبر ودمج التكرار...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-400" />
                    تشغيل محاكاة الـ 100 صحيفة الآن
                  </>
                )}
              </Button>
            </div>

            {/* Results Summary Bar */}
            {simulationResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <span className="text-xs text-slate-400 block">إجمالي الأخبار المدخلة:</span>
                  <strong className="text-2xl font-black text-white">{simulationResult.totalIngested} صحيفة</strong>
                </div>

                <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/80">
                  <span className="text-xs text-emerald-300 block">الأخبار الموحدة الناتجة:</span>
                  <strong className="text-2xl font-black text-emerald-400">
                    {simulationResult.uniqueStoriesCreated} أخبار فريدة
                  </strong>
                </div>

                <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-800/80">
                  <span className="text-xs text-indigo-300 block">الأخبار المكررة المدمجة:</span>
                  <strong className="text-2xl font-black text-indigo-400">
                    {simulationResult.duplicatesMerged} خبر مدمج
                  </strong>
                </div>

                <div className="bg-amber-950/60 p-4 rounded-xl border border-amber-800/80">
                  <span className="text-xs text-amber-300 block">نسبة الضغط والتصفية:</span>
                  <strong className="text-2xl font-black text-amber-400">
                    {Math.round((simulationResult.duplicatesMerged / simulationResult.totalIngested) * 100)}% تصفية
                  </strong>
                </div>
              </div>
            )}
          </Card>

          {/* Detailed Reports Grid */}
          {simulationResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Reports list */}
              <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                <h4 className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
                  سجل المعالجة الفورية (100 عملية)
                </h4>

                {simulationResult.reports.map((report, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedReport(report)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedReport === report
                        ? 'bg-indigo-950/80 border-indigo-500 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant={report.status === 'CREATED_NEW' ? 'emerald' : 'sky'}>
                        {report.status === 'CREATED_NEW' ? 'خبر جديد فريد' : 'تم الدمج مع خبر سابق'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">العملية #{idx + 1}</span>
                    </div>

                    <h5 className="font-bold text-white text-xs line-clamp-1">
                      {report.targetArticle.title}
                    </h5>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        المصادر المرتبطة: {report.sourcesCount}
                      </span>
                      {report.similarityDetails.overallSimilarityScore > 0 && (
                        <span className="text-indigo-300 font-bold">
                          نسبة التطابق: {report.similarityDetails.overallSimilarityScore}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Report Inspector */}
              <div className="lg:col-span-7">
                {selectedReport ? (
                  <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-white text-sm">تفاصيل تقرير المعالجة والدمج</h4>
                      </div>
                      <Badge variant="indigo">
                        درجة موثوقية التجميع: {selectedReport.targetArticle.trustScore}%
                      </Badge>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block mb-1">العنوان الصحفي الموحد:</span>
                      <h3 className="font-black text-lg text-white bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        {selectedReport.targetArticle.title}
                      </h3>
                    </div>

                    {/* Breakdown Scores */}
                    {selectedReport.status === 'MERGED_INTO_EXISTING' && (
                      <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
                        <span className="text-xs font-bold text-indigo-300 block">
                          تحليل أبعاد التطابق الذكي Multi-Layer Matching:
                        </span>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-[11px] block">تطابق العناوين (Title Match):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full"
                                  style={{ width: `${selectedReport.similarityDetails.titleSimilarityScore}%` }}
                                />
                              </div>
                              <span className="font-bold text-indigo-300 text-[11px]">
                                {selectedReport.similarityDetails.titleSimilarityScore}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">تطابق النص والمحتوى (Content Match):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full"
                                  style={{ width: `${selectedReport.similarityDetails.contentSimilarityScore}%` }}
                                />
                              </div>
                              <span className="font-bold text-emerald-300 text-[11px]">
                                {selectedReport.similarityDetails.contentSimilarityScore}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">تطابق الكيانات الذكية (NLP Entities):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full"
                                  style={{ width: `${selectedReport.similarityDetails.nlpEntityOverlapScore}%` }}
                                />
                              </div>
                              <span className="font-bold text-amber-300 text-[11px]">
                                {selectedReport.similarityDetails.nlpEntityOverlapScore}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">التطابق الدلالي (Semantic Embedding):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-sky-500 h-full"
                                  style={{ width: `${selectedReport.similarityDetails.semanticEmbeddingScore}%` }}
                                />
                              </div>
                              <span className="font-bold text-sky-300 text-[11px]">
                                {selectedReport.similarityDetails.semanticEmbeddingScore}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedReport.similarityDetails.matchReason && (
                          <div className="bg-indigo-950/80 text-indigo-200 text-xs p-2.5 rounded-lg border border-indigo-800 flex items-center gap-2">
                            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>سبب الدمج: {selectedReport.similarityDetails.matchReason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Linked Sources with Reliability Ranking */}
                    <div>
                      <span className="text-xs text-slate-400 block mb-2 font-bold">
                        المصادر المرتبطة مرتبة حسب درجة الموثوقية (Reliability Ranking):
                      </span>

                      <div className="space-y-2">
                        {selectedReport.targetArticle.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              src.isPrimary
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                {sIdx + 1}
                              </span>
                              <div>
                                <h5 className="font-bold text-xs flex items-center gap-2">
                                  {src.name}
                                  {src.isPrimary && (
                                    <Badge variant="emerald" className="text-[10px]">
                                      المصدر الرئيسي الأصلي
                                    </Badge>
                                  )}
                                </h5>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  وقت النشر: {src.publishedAt}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-amber-400 block">
                                موثوقية {src.reliabilityScore}%
                              </span>
                              <span className="text-[10px] text-slate-400">مرتبة تلقائياً</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Updated Information Section */}
                    {selectedReport.hasNewInformation && (
                      <div className="bg-amber-950/40 border border-amber-800/80 p-3.5 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          تم تحديث الخبر تلقائياً بتفاصيل جديدة من المصادر الأخيرة!
                        </span>
                        <p className="text-xs text-slate-300">{selectedReport.addedDetailsSummary}</p>
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="bg-slate-900 border-slate-800 text-slate-400 p-12 text-center flex flex-col items-center justify-center h-full">
                    <Layers className="w-12 h-12 text-slate-700 mb-3" />
                    <p className="text-xs">اختر أي عملية من السجل الجانبي لمعاينة تفاصيل التطابق والمصادر المرتبطة</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Comparison Tester */}
      {activeTab === 'MANUAL_TEST' && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              اختبار مطابقة خبرين يدوياً (Manual Similarity Tester)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              أدخل عنوانين ونصين للاختبار المباشر لحساب درجات التشابه عبر الخوارزميات الأربعة المتقاطعة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* News Article A */}
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-indigo-300 block">الخبر الأول (Article A)</span>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">عنوان الخبر الأول:</label>
                <input
                  type="text"
                  value={titleA}
                  onChange={(e) => setTitleA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">نص الخبر الأول:</label>
                <textarea
                  rows={4}
                  value={contentA}
                  onChange={(e) => setContentA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* News Article B */}
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-sky-300 block">الخبر الثاني (Article B)</span>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">عنوان الخبر الثاني:</label>
                <input
                  type="text"
                  value={titleB}
                  onChange={(e) => setTitleB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">نص الخبر الثاني:</label>
                <textarea
                  rows={4}
                  value={contentB}
                  onChange={(e) => setContentB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleRunManualCompare}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-lg gap-2"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              حساب التطابق والتحليل الفوري
            </Button>
          </div>

          {/* Comparison Output */}
          {comparisonResult && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  نتيجة التحليل التراكمي
                </span>
                <Badge variant={comparisonResult.isDuplicate ? 'emerald' : 'amber'}>
                  {comparisonResult.isDuplicate ? 'خبر مكرر (Duplicate Match)' : 'خبر منفصل غير مكرر'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">تطابق العناوين Title</span>
                  <strong className="text-xl font-bold text-indigo-400 mt-1 block">
                    {comparisonResult.titleSimilarityScore}%
                  </strong>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">تطابق النص Content</span>
                  <strong className="text-xl font-bold text-emerald-400 mt-1 block">
                    {comparisonResult.contentSimilarityScore}%
                  </strong>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">تطابق الكيانات NLP</span>
                  <strong className="text-xl font-bold text-amber-400 mt-1 block">
                    {comparisonResult.nlpEntityOverlapScore}%
                  </strong>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 block">التطابق الدلالي Semantic</span>
                  <strong className="text-xl font-bold text-sky-400 mt-1 block">
                    {comparisonResult.semanticEmbeddingScore}%
                  </strong>
                </div>
              </div>

              <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-300 block font-bold">النتيجة الإجمالية المركبة:</span>
                  <p className="text-xs text-slate-200 mt-0.5">{comparisonResult.matchReason || 'لا يوجد تطابق مكرر'}</p>
                </div>
                <div className="text-2xl font-black text-white bg-indigo-600 px-4 py-2 rounded-xl">
                  {comparisonResult.overallSimilarityScore}%
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Stored Clusters in Repository */}
      {activeTab === 'STORED_CLUSTERS' && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                قاعدة البيانات الحالية للأخبار المجمعة ({articlesList.length} خبر موحد)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تعرض هذه القائمة الأخبار المجمعة الحالية وكل خبر يضم مصادره المتعددة المرتبة حسب الموثوقية.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setArticlesList(articlesRepository.getAll())}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث القائمة
            </Button>
          </div>

          <div className="space-y-4">
            {articlesList.map((art) => (
              <div
                key={art.id}
                className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="indigo">{art.category}</Badge>
                    <span className="text-xs text-slate-400 font-mono">ID: {art.id}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">آخر تحديث: {art.updatedAt}</span>
                </div>

                <h4 className="font-bold text-white text-sm">{art.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2">{art.summary}</p>

                {/* Sources list */}
                <div className="bg-slate-900/80 p-3 rounded-lg space-y-2 border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    المصادر المربوطة بالخبر ({art.sources.length} مصدر):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {art.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                          src.isPrimary
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {src.name}
                        <strong className="text-amber-400 font-bold">({src.reliabilityScore}%)</strong>
                        {src.isPrimary && <Badge variant="emerald" className="text-[8px]">رئيسي</Badge>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
