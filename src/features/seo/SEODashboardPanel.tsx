import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { articlesRepository } from '../../repositories/articlesRepository';
import { seoEngineService, SEOAuditReport } from '../../seo-engine/SEOEngineService';
import { NewsArticle } from '../../core/domain/types';
import {
  Globe,
  FileCode2,
  Rss,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Smartphone,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
  BarChart3,
  Search,
  Check,
  ShieldCheck,
  Layers,
  Code2,
} from 'lucide-react';

export const SEODashboardPanel: React.FC = () => {
  const articles = articlesRepository.getAll();
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'SITEMAPS' | 'SCHEMAS' | 'PREVIEWS' | 'AMP' | 'VITALS'>('AUDIT');
  const [activeXmlType, setActiveXmlType] = useState<
    | 'MASTER_SITEMAP'
    | 'NEWS_SITEMAP'
    | 'PAGES_SITEMAP'
    | 'CATEGORIES_SITEMAP'
    | 'SOURCES_SITEMAP'
    | 'IMAGE_SITEMAP'
    | 'VIDEO_SITEMAP'
    | 'RSS'
    | 'ROBOTS'
  >('MASTER_SITEMAP');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  const currentArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];
  const auditReport: SEOAuditReport = currentArticle
    ? seoEngineService.auditArticleSEO(currentArticle)
    : {
        score: 0,
        status: 'CRITICAL',
        googleNewsEligible: false,
        googleDiscoverEligible: false,
        ampReady: false,
        checks: [],
      };

  const coreWebVitals = seoEngineService.getCoreWebVitalsMetrics();

  // Selected XML Output
  const getXmlContent = () => {
    switch (activeXmlType) {
      case 'MASTER_SITEMAP':
        return seoEngineService.generateMasterSitemapXML();
      case 'NEWS_SITEMAP':
        return seoEngineService.generateNewsSitemapXML();
      case 'PAGES_SITEMAP':
        return seoEngineService.generatePagesSitemapXML();
      case 'CATEGORIES_SITEMAP':
        return seoEngineService.generateCategoriesSitemapXML();
      case 'SOURCES_SITEMAP':
        return seoEngineService.generateSourcesSitemapXML();
      case 'IMAGE_SITEMAP':
        return seoEngineService.generateImageSitemapXML();
      case 'VIDEO_SITEMAP':
        return seoEngineService.generateVideoSitemapXML();
      case 'RSS':
        return seoEngineService.generateRSSFeedXML();
      case 'ROBOTS':
        return seoEngineService.generateRobotsTxt();
      default:
        return '';
    }
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(getXmlContent());
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800/50 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% SEO Compliance & Google News Engine
            </span>
            <Badge variant="emerald">جاهز لـ Google Discover & Google News</Badge>
          </div>
          <h2 className="text-2xl font-black text-white">مركز التحكم المحسن لمحركات البحث (SEO & Discover Hub)</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            إدارة الخرائط الذكية (News, Image, Video Sitemaps)، خلاصات RSS، السفرات الهيكلية (Schema.org)، معاينة بطاقات التواصل الاجتماعي، وتقييم الجاهزية لمعايير Google Discover وCore Web Vitals.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={activeTab === 'AUDIT' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('AUDIT')}
            className="text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            تدقيق الجاهزية (Google Discover)
          </Button>
          <Button
            variant={activeTab === 'SITEMAPS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('SITEMAPS')}
            className="text-xs gap-1.5"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            الخرائط و RSS
          </Button>
          <Button
            variant={activeTab === 'SCHEMAS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('SCHEMAS')}
            className="text-xs gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            البيانات المهيكلة (Schema)
          </Button>
          <Button
            variant={activeTab === 'PREVIEWS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('PREVIEWS')}
            className="text-xs gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            معاينة بطاقات المشاركة
          </Button>
          <Button
            variant={activeTab === 'AMP' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('AMP')}
            className="text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            صفحات AMP
          </Button>
          <Button
            variant={activeTab === 'VITALS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('VITALS')}
            className="text-xs gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            مؤشرات الأداء (Vitals)
          </Button>
        </div>
      </div>

      {/* Select Article Selector for Contextual Testing */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">اختر خبراً لاختبار ومعاينة نتائج الـ SEO:</span>
        </div>

        <select
          value={selectedArticleId}
          onChange={(e) => setSelectedArticleId(e.target.value)}
          className="w-full sm:w-auto bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
        >
          {articles.map((art) => (
            <option key={art.id} value={art.id}>
              [{art.category}] {art.title.slice(0, 50)}...
            </option>
          ))}
        </select>
      </Card>

      {/* TAB 1: Google News & Discover Readiness Audit */}
      {activeTab === 'AUDIT' && currentArticle && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Score Badge */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-slate-400">درجة الجاهزية الشاملة للـ SEO</span>
              <div
                className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-3xl font-black ${
                  auditReport.score >= 85
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                    : auditReport.score >= 70
                    ? 'border-amber-500 text-amber-400 bg-amber-950/30'
                    : 'border-rose-500 text-rose-400 bg-rose-950/30'
                }`}
              >
                {auditReport.score}%
              </div>
              <Badge variant={auditReport.score >= 85 ? 'emerald' : 'amber'}>
                {auditReport.status === 'EXCELLENT' ? 'ممتاز وقوي جداً' : 'جيد وبحاجة لبعض التحسينات'}
              </Badge>
            </Card>

            {/* Google News Eligibility */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" />
                <h4 className="text-sm font-bold text-white">Google News Readiness</h4>
              </div>
              <p className="text-xs text-slate-300">
                مطابقة معايير الفهرسة الأوتوماتيكية في أخبار جوجل، تحديد المصدر والكاتب وتوافق العناوين المباشرة.
              </p>
              <div className="pt-2">
                {auditReport.googleNewsEligible ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/50 p-3 rounded-xl border border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>مؤهل 100% للظهور في Google News Carousel</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-950/50 p-3 rounded-xl border border-amber-800">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>يتطلب إضافة اسم الكاتب الصريح ورابط دائم</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Google Discover Eligibility */}
            <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Google Discover Readiness</h4>
              </div>
              <p className="text-xs text-slate-300">
                يتطلب صوراً عالية الدقة أفقية بعرض يزيد عن 1200px ومعدل تفاعل مرتفع وعناوين واضحة.
              </p>
              <div className="pt-2">
                {auditReport.googleDiscoverEligible ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/50 p-3 rounded-xl border border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>مؤهل للظهور في خلاصة Google Discover للجوالات</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-950/50 p-3 rounded-xl border border-amber-800">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>تأكد من توفير صورة رئيسية بعرض 1200px على الأقل</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Audit Checks Checklist */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              تفاصيل الفحوصات الفنية لـ SEO معيار التحرير الممتاز
            </h3>

            <div className="space-y-2.5">
              {auditReport.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    {chk.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">{chk.label}</span>
                      {chk.recommendation && (
                        <p className="text-[11px] text-amber-300 mt-0.5">{chk.recommendation}</p>
                      )}
                    </div>
                  </div>

                  <Badge variant={chk.passed ? 'emerald' : 'rose'}>
                    {chk.passed ? 'اجتاز بنجاح' : 'يتطلب تحسين'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Live Sitemaps & RSS Inspector */}
      {activeTab === 'SITEMAPS' && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                مولد الخرائط البرمجية وخلاصة الأخبار (Sitemaps & RSS Feed Generator)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                جميع الخرائط يتم توليدها ديناميكياً وفق بروتوكولات Google News 0.9 و Sitemaps.org المعيارية.
              </p>
            </div>

            <Button variant="primary" size="xs" onClick={handleCopyXml} className="text-xs gap-1.5">
              {copiedStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedStatus ? 'تم النسخ للحافظة!' : 'نسخ الكود البرمجي'}
            </Button>
          </div>

          {/* Sub Tab Switcher for XML files */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveXmlType('MASTER_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'MASTER_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap.xml (الفهرس الشامل)
            </button>
            <button
              onClick={() => setActiveXmlType('NEWS_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'NEWS_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap-news.xml (أخبار جوجل)
            </button>
            <button
              onClick={() => setActiveXmlType('PAGES_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'PAGES_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap-pages.xml (الصفحات)
            </button>
            <button
              onClick={() => setActiveXmlType('CATEGORIES_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'CATEGORIES_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap-categories.xml (الأقسام)
            </button>
            <button
              onClick={() => setActiveXmlType('SOURCES_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'SOURCES_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap-sources.xml (المصادر)
            </button>
            <button
              onClick={() => setActiveXmlType('IMAGE_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'IMAGE_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap-images.xml (الصور)
            </button>
            <button
              onClick={() => setActiveXmlType('VIDEO_SITEMAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'VIDEO_SITEMAP'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              sitemap-videos.xml (الفيديو)
            </button>
            <button
              onClick={() => setActiveXmlType('RSS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'RSS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              rss.xml (خلاصة الأخبار)
            </button>
            <button
              onClick={() => setActiveXmlType('ROBOTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeXmlType === 'ROBOTS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              robots.txt
            </button>
          </div>

          {/* XML Code Container */}
          <div className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-96">
            <pre className="whitespace-pre-wrap leading-relaxed">{getXmlContent()}</pre>
          </div>
        </Card>
      )}

      {/* TAB 3: Schema.org Live Inspector */}
      {activeTab === 'SCHEMAS' && currentArticle && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              معاينة محرك البيانات المهيكلة (Schema.org / JSON-LD)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              توليد تلقائي لمخططات NewsArticle و BreadcrumbList و WebSite مع تأكيد الصحة القياسية لـ Google Rich Results.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* NewsArticle Schema */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-300 block">
                1. مخطط NewsArticle Schema (للخبر المSelected):
              </span>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-80">
                <pre>{JSON.stringify(seoEngineService.generateNewsArticleSchema(currentArticle), null, 2)}</pre>
              </div>
            </div>

            {/* Breadcrumb & WebSite Schema */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-300 block">
                2. مخطط فتات الخبز BreadcrumbList Schema:
              </span>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-400 overflow-x-auto max-h-80">
                <pre>{JSON.stringify(seoEngineService.generateArticleBreadcrumbSchema(currentArticle), null, 2)}</pre>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: Social Share Cards Simulator */}
      {activeTab === 'PREVIEWS' && currentArticle && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              محاكي بطاقات التواصل الاجتماعي والبحث (Social & SERP Live Preview)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              استعراض المظهر النهائي للخبر عند مشاركته على واتساب، تويتر (X)، فيسبوك، ومحرك بحث جوجل.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google SERP Snippet Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">محاكاة نتيجه محرك بحث جوجل (Google Search Result):</span>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 font-sans">
                <span className="text-xs text-slate-400 block line-clamp-1">https://naweayh.xyz › news › {currentArticle.slug}</span>
                <h4 className="text-base font-bold text-indigo-400 hover:underline cursor-pointer line-clamp-1">
                  {currentArticle.title}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {currentArticle.summary}
                </p>
              </div>
            </div>

            {/* Twitter/X Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block">محاكاة بطاقة تويتر (Twitter / X Large Summary Card):</span>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <img
                  src={currentArticle.mainImage}
                  alt={currentArticle.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3.5 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">naweayh.xyz</span>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{currentArticle.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{currentArticle.summary}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: AMP Mobile Simulator */}
      {activeTab === 'AMP' && currentArticle && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                معاينة صفحات التصفح السريع للجوال (Accelerated Mobile Pages - AMP)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                توليد تلقائي لكود AMP ⚡ المتوافق مع شاشات الجوال في Google News لتوفير سرعة تحميل تحت 0.5 ثانية.
              </p>
            </div>
            <Badge variant="amber">AMP ⚡ Ready</Badge>
          </div>

          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs text-amber-300 max-h-96 overflow-x-auto">
            <pre className="whitespace-pre-wrap">{seoEngineService.generateAMPArticleHTML(currentArticle)}</pre>
          </div>
        </Card>
      )}

      {/* TAB 6: Core Web Vitals Monitoring */}
      {activeTab === 'VITALS' && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              مؤشرات تجربة المستخدم وتجربة الصفحة (Core Web Vitals)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              مراقبة معايير سرعة الاستجابة واستقرار الصفحة وفق متطلبات تحديث Google Page Experience 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">LCP (أكبر عنصر):</span>
              <strong className="text-2xl font-black text-emerald-400">{coreWebVitals.lcp.value} ms</strong>
              <span className="text-[10px] text-emerald-400 block">ممتاز (&lt;2500ms)</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">INP (التفاعل):</span>
              <strong className="text-2xl font-black text-emerald-400">{coreWebVitals.inp.value} ms</strong>
              <span className="text-[10px] text-emerald-400 block">استجابة فورية (&lt;200ms)</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">CLS (استقرار التنسيق):</span>
              <strong className="text-2xl font-black text-emerald-400">{coreWebVitals.cls.value}</strong>
              <span className="text-[10px] text-emerald-400 block">بدون انزياح (&lt;0.1)</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">TTFB (استجابة الخادم):</span>
              <strong className="text-2xl font-black text-emerald-400">{coreWebVitals.ttfb.value} ms</strong>
              <span className="text-[10px] text-emerald-400 block">خادم سريع جداً (&lt;800ms)</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">FCP (أول رسم):</span>
              <strong className="text-2xl font-black text-emerald-400">{coreWebVitals.fcp.value} ms</strong>
              <span className="text-[10px] text-emerald-400 block">تحميل ممتاز (&lt;1800ms)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
