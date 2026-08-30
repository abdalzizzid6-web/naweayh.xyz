import { AuthService } from "../../../services/AuthService";
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Rss,
  Plus,
  Zap,
  Activity,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Compass,
  UploadCloud,
  Server,
  Trash2,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';

interface SourceManagementCenterProps {
  sources?: any[];
  onAddSource?: (source: any) => void;
  onToggleSourceStatus?: (id: string) => void;
  triggerToast: (msg: string) => void;
}

export const SourceManagementCenter: React.FC<SourceManagementCenterProps> = ({
  triggerToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CATALOG' | 'DISCOVERY' | 'BULK_IMPORT' | 'HEALTH'>('CATALOG');
  const [catalogSources, setCatalogSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('الكل');
  const [categoryFilter, setCategoryFilter] = useState('الكل');

  // Discovery State
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<any[]>([]);

  // Bulk Import State
  const [importContent, setImportContent] = useState('');
  const [importFormat, setImportFormat] = useState<'OPML' | 'JSON' | 'URL_LIST'>('OPML');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Health Metrics
  const [healthSummary, setHealthSummary] = useState<any>({
    totalSources: 0,
    upCount: 0,
    downCount: 0,
    pausedCount: 0,
    avgLatencyMs: 0,
  });

  const fetchCatalogSources = async () => {
    setLoading(true);
    try {
      const res = await AuthService.fetchWithAuth(`/api/v1/sources/catalog?country=${encodeURIComponent(countryFilter)}&category=${encodeURIComponent(categoryFilter)}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setCatalogSources(data.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthMetrics = async () => {
    try {
      const res = await AuthService.fetchWithAuth('/api/v1/sources/health');
      const data = await res.json();
      if (data.success) {
        setHealthSummary(data.summary);
        if (activeSubTab === 'HEALTH') {
          setCatalogSources(data.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (activeSubTab === 'CATALOG') {
      fetchCatalogSources();
    } else if (activeSubTab === 'HEALTH') {
      fetchHealthMetrics();
    }
  }, [activeSubTab, countryFilter, categoryFilter, search]);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoveryUrl) return;
    setDiscoveryLoading(true);
    try {
      const res = await AuthService.fetchWithAuth('/api/v1/sources/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: discoveryUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscoveredFeeds(data.data);
        if (data.data.length === 0) {
          triggerToast('لم يتم العثور على خلاصات RSS صالحة في هذا الرابط');
        } else {
          triggerToast(`تم اكتشاف ${data.data.length} خلاصة إخبارية صالحة!`);
        }
      }
    } catch {
      triggerToast('حدث خطأ أثناء فحص الرابط');
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handleAddDiscoveredFeed = async (feed: any) => {
    try {
      const res = await AuthService.fetchWithAuth('/api/v1/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: feed.title,
          url: feed.websiteUrl,
          feedUrl: feed.feedUrl,
          logo: feed.logoUrl || '',
          country: feed.inferredCountry || 'اليمن',
          category: feed.inferredCategory || 'سياسة',
          type: feed.type || 'RSS',
          trustScore: feed.reliabilityScore || 90,
          priority: 2,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`تمت إضافة المصدر المكتشف (${feed.title}) بنجاح`);
        fetchCatalogSources();
      }
    } catch {
      triggerToast('فشل إضافة المصدر المكتشف');
    }
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importContent) return;
    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await AuthService.fetchWithAuth('/api/v1/sources/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: importContent,
          format: importFormat,
          defaultCountry: 'اليمن',
          defaultCategory: 'سياسة',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data);
        triggerToast(`تم استيراد ${data.importedCount} مصدر بنجاح من إجمالي ${data.totalCandidateFeeds}`);
        fetchCatalogSources();
      }
    } catch {
      triggerToast('فشل الاستيراد الجماعي للمصادر');
    } finally {
      setImportLoading(false);
    }
  };

  const handleToggleSource = async (id: number) => {
    try {
      const res = await AuthService.fetchWithAuth(`/api/v1/sources/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        triggerToast('تم تحديث حالة المصدر بنجاح');
        fetchCatalogSources();
      }
    } catch {
      triggerToast('حدث خطأ أثناء تعديل حالة المصدر');
    }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا المصدر الإخباري؟')) return;
    try {
      const res = await AuthService.fetchWithAuth(`/api/v1/sources/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerToast('تم حذف المصدر بنجاح');
        fetchCatalogSources();
      }
    } catch {
      triggerToast('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Header Navigation Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 font-['Cairo',sans-serif]">
            إدارة واكتشاف المصادر الإخبارية (Enterprise Source Catalog)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            كتالوج موحد + محرك اكتشاف تلقائي للخلاصات + استيراد جماعي + مراقبة الصحة والزمن الفعلي
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSubTab('CATALOG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'CATALOG'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>كتالوج المصادر</span>
          </button>

          <button
            onClick={() => setActiveSubTab('DISCOVERY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'DISCOVERY'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>اكتشاف تلقائي (Discovery)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('BULK_IMPORT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'BULK_IMPORT'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>استيراد جماعي</span>
          </button>

          <button
            onClick={() => setActiveSubTab('HEALTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'HEALTH'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>لوحة الصحة (Health)</span>
          </button>
        </div>
      </div>

      {/* 1. CATALOG TAB */}
      {activeSubTab === 'CATALOG' && (
        <Card
          title="قائمة المصادر الإخبارية المعتمدة"
          subtitle="تصفية وفلترة المصادر حسب الدولة والتصنيف وحالة التفعيل"
        >
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم المصدر أو الرابط..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="الكل">جميع الدول 🌍</option>
                  <option value="اليمن">اليمن 🇾🇪</option>
                  <option value="السعودية">السعودية 🇸🇦</option>
                  <option value="الإمارات">الإمارات 🇦🇪</option>
                  <option value="قطر">قطر 🇶🇦</option>
                  <option value="الكويت">الكويت 🇰🇼</option>
                  <option value="مصر">مصر 🇪🇬</option>
                  <option value="عالمي">عالمي 🌐</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="الكل">جميع التصنيفات</option>
                  <option value="سياسة">سياسة</option>
                  <option value="اقتصاد">اقتصاد</option>
                  <option value="رياضة">رياضة</option>
                  <option value="تقنية">تقنية</option>
                  <option value="أخبار عامة">أخبار عامة</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCatalogSources}
                  className="gap-1 text-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث</span>
                </Button>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogSources.map((src) => (
                <div
                  key={src.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 font-bold overflow-hidden">
                          {src.logo ? (
                            <img src={src.logo} alt={src.name} className="w-full h-full object-cover" />
                          ) : (
                            <Rss className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {src.name_arabic || src.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {src.country} • {src.category} • {src.type}
                          </span>
                        </div>
                      </div>

                      <Badge variant={src.enabled ? 'emerald' : 'amber'}>
                        {src.enabled ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>

                    <p className="text-[11px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded-lg truncate border border-slate-100">
                      {src.feed_url || src.url}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                      <span>الموثوقية: <strong className="text-emerald-700 font-mono">{src.trust_score || 90}%</strong></span>
                      <span>الاستجابة: <strong className="text-slate-900 font-mono">{src.response_time_ms || 0}ms</strong></span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSource(src.id)}
                        className="text-[11px] py-1 h-7"
                      >
                        {src.enabled ? 'تجميد' : 'تفعيل'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSource(src.id)}
                        className="text-[11px] text-rose-600 hover:bg-rose-50 py-1 h-7"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* 2. DISCOVERY ENGINE TAB */}
      {activeSubTab === 'DISCOVERY' && (
        <Card
          title="محرك اكتشاف المصادر الذكي (Source Discovery Engine)"
          subtitle="أدخل رابط الموقع الإخباري لاكتشاف خلاصات RSS/Atom/API والتحقق الآلي منها"
        >
          <div className="space-y-6">
            <form onSubmit={handleDiscover} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                رابط الموقع الإخباري أو رابط الخلاصة المباشر:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="مثال: https://sabanews.net أو skynewsarabia.com"
                  value={discoveryUrl}
                  onChange={(e) => setDiscoveryUrl(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-600"
                />
                <Button
                  type="submit"
                  disabled={discoveryLoading}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs px-5 gap-1.5"
                >
                  {discoveryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                  <span>فحص واكتشاف الخلاصات</span>
                </Button>
              </div>
            </form>

            {/* Discovered Feeds List */}
            {discoveredFeeds.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  الخلاصات المكتشفة القابلة للإضافة ({discoveredFeeds.length})
                </h4>

                <div className="space-y-3">
                  {discoveredFeeds.map((feed, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900">{feed.title}</h5>
                          <p className="text-xs text-slate-500 mt-0.5">{feed.description}</p>
                        </div>
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => handleAddDiscoveredFeed(feed)}
                          className="text-xs gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة إلى الكتالوج</span>
                        </Button>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 truncate border border-slate-100">
                        {feed.feedUrl}
                      </div>

                      {/* Verification Steps Indicator */}
                      <div className="flex items-center gap-4 text-[11px] pt-1 text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> اتصال ناجح ({feed.responseTimeMs}ms)
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تم جلب {feed.articlesCount} مقال
                        </span>
                        <span>الدولة المستنتجة: <strong className="text-slate-900">{feed.inferredCountry}</strong></span>
                        <span>التصنيف المستنتج: <strong className="text-slate-900">{feed.inferredCategory}</strong></span>
                      </div>

                      {/* Sample Articles Preview */}
                      {feed.sampleArticles && feed.sampleArticles.length > 0 && (
                        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/80 space-y-1">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1">معاينة أحدث العناوين المكتشفة:</span>
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                            {feed.sampleArticles.slice(0, 3).map((art: any, aIdx: number) => (
                              <li key={aIdx} className="truncate">{art.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 3. BULK IMPORT TAB */}
      {activeSubTab === 'BULK_IMPORT' && (
        <Card
          title="مستورد المصادر الجماعي (Source Importer)"
          subtitle="استيراد مصادر متعددة دفعة واحدة عبر ملفات OPML XML، JSON، أو قائمة روابط"
        >
          <form onSubmit={handleBulkImportSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">صيغة الاستيراد:</label>
              <select
                value={importFormat}
                onChange={(e) => setImportFormat(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="OPML">ملف OPML XML (Standard RSS Export)</option>
                <option value="JSON">مصفوفة JSON</option>
                <option value="URL_LIST">قائمة روابط (روابط متعدة بأسطر منفصلة)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                لصق محتوى الاستيراد أو قائمة الخلاصات:
              </label>
              <textarea
                rows={8}
                required
                placeholder={
                  importFormat === 'OPML'
                    ? '<?xml version="1.0"?>\n<opml version="2.0">\n  <body>\n    <outline text="SPA" xmlUrl="https://spa.gov.sa/rss/all.xml"/>\n  </body>\n</opml>'
                    : importFormat === 'JSON'
                    ? '[\n  {"name": "سبأ", "feedUrl": "https://sabanews.net/ar/rss.xml"}\n]'
                    : 'https://spa.gov.sa/rss/all.xml\nhttps://skynewsarabia.com/rss.xml'
                }
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>

            <Button
              type="submit"
              disabled={importLoading}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs px-6 gap-2"
            >
              {importLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>بدء التحقق والبدء في الاستيراد الجماعي</span>
            </Button>
          </form>

          {/* Import Results Report */}
          {importResult && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-emerald-950">تقرير نتيجة الاستيراد الجماعي:</h4>
              <div className="flex items-center gap-4 text-xs font-bold text-emerald-900">
                <span>إجمالي الخلاصات المفحوصة: {importResult.totalCandidateFeeds}</span>
                <span>المستورد بنجاح: {importResult.importedCount}</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                {importResult.results.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-emerald-100 font-mono">
                    <span className="truncate">{r.name} ({r.feedUrl})</span>
                    <Badge variant={r.status === 'IMPORTED' ? 'emerald' : 'amber'}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 4. HEALTH DASHBOARD TAB */}
      {activeSubTab === 'HEALTH' && (
        <Card
          title="مراقبة صحة واستجابة الشبكة (Source Health & Latency Dashboard)"
          subtitle="مراقبة حية للحالة الفنية وأوقات الاستجابة ونسب الخطأ لجميع المصادر"
        >
          <div className="space-y-6">
            {/* Health Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">إجمالي المصادر</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{healthSummary.totalSources}</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                <span className="text-xs text-emerald-700 font-bold block mb-1">نشط ويعمل (UP)</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">{healthSummary.upCount}</span>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
                <span className="text-xs text-rose-700 font-bold block mb-1">متوقف / أخطاء (DOWN)</span>
                <span className="text-2xl font-black text-rose-700 font-mono">{healthSummary.downCount}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block mb-1">متوسط الاستجابة</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">{healthSummary.avgLatencyMs}ms</span>
              </div>
            </div>

            {/* Health Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">اسم المصدر والرابط</th>
                    <th className="p-3">حالة الصحة</th>
                    <th className="p-3">الاستجابة (Latency)</th>
                    <th className="p-3">المستورد / المقتنص</th>
                    <th className="p-3">آخر تحديث</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalogSources.map((src) => (
                    <tr key={src.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{src.name_arabic || src.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs block">{src.feed_url || src.url}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant={src.health_status === 'UP' ? 'emerald' : 'rose'}>
                          {src.health_status || 'UP'}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {src.response_time_ms || 120}ms
                      </td>
                      <td className="p-3 font-mono text-slate-800">
                        {src.articles_inserted || 0} / {src.articles_fetched || 0}
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {src.last_fetched_at ? new Date(src.last_fetched_at).toLocaleTimeString('ar-SA') : 'منذ قليل'}
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
