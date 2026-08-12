import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { NewsArticle } from '../../../core/domain/types';
import {
  BarChart3,
  Search,
  Eye,
  Share2,
  Bookmark,
  TrendingUp,
  Clock,
  Globe,
  Users,
} from 'lucide-react';

interface AnalyticsCenterProps {
  articles: NewsArticle[];
}

export const AnalyticsCenter: React.FC<AnalyticsCenterProps> = ({ articles }) => {
  const [timeFilter, setTimeFilter] = useState<'TODAY' | '7DAYS' | '30DAYS'>('TODAY');

  // Search Queries Log
  const searchLogs = [
    { query: 'الذكاء الاصطناعي', count: 142, resultsCount: 8, lastSearch: 'منذ دقيقة' },
    { query: 'أخبار اليمن اليوم', count: 98, resultsCount: 15, lastSearch: 'منذ 3 دقائق' },
    { query: 'النمو الاقتصادي', count: 64, resultsCount: 5, lastSearch: 'منذ 10 دقائق' },
    { query: 'أسعار الصرف YER', count: 210, resultsCount: 3, lastSearch: 'منذ دقيقتين' },
  ];

  const totalViews = articles.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalShares = articles.reduce((acc, a) => acc + (a.sharesCount || 0), 0);
  const totalSaves = articles.reduce((acc, a) => acc + (a.bookmarksCount || 0), 0);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Time Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900">مركز تحليلات الأداء وسلوك القراء</h3>
          <p className="text-xs text-slate-500 mt-0.5">قراءة التفاعلات الحقيقية، عمليات البحث الأكثر شيوعاً، والأقسام الأكثر زواراً</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTimeFilter('TODAY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'TODAY' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setTimeFilter('7DAYS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeFilter === '7DAYS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setTimeFilter('30DAYS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeFilter === '30DAYS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            آخر 30 يوماً
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-bold block">إجمالي الزيارات والمشاهدات</span>
          <strong className="text-2xl font-black text-slate-900 font-mono block">{totalViews.toLocaleString()}</strong>
          <span className="text-[10px] text-emerald-600 font-bold">↑ +14.2% مقارنة بالفترة السابقة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-bold block">إجمالي المشاركات</span>
          <strong className="text-2xl font-black text-indigo-600 font-mono block">{totalShares.toLocaleString()}</strong>
          <span className="text-[10px] text-indigo-600 font-bold">انتشار عالي على التليجرام والمجتمعات</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-bold block">المحفوظات القراء</span>
          <strong className="text-2xl font-black text-purple-600 font-mono block">{totalSaves.toLocaleString()}</strong>
          <span className="text-[10px] text-purple-600 font-bold">معدل حفظ المقالات التحليلية</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-bold block">متوسط زمن القراءة</span>
          <strong className="text-2xl font-black text-emerald-600 font-mono block">3.4 دقيقة</strong>
          <span className="text-[10px] text-emerald-600 font-bold">معدل قراءة متعمق وممتاز</span>
        </div>
      </div>

      {/* Search Queries Analytics */}
      <Card
        title="سجل استعلامات وبحث المستخدمين (Search Analytics Log)"
        subtitle="متابعة المواضيع والكلمات التي يبحث عنها القراء للوقوف على اهتمامات الجمهور"
      >
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">عبارة البحث (Search Query)</th>
                <th className="p-3">عدد مرات البحث</th>
                <th className="p-3">عدد النتائج المتاحة</th>
                <th className="p-3">آخر استعلام</th>
                <th className="p-3">التقييم والتغطية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {searchLogs.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{s.query}</td>
                  <td className="p-3 font-mono font-bold text-indigo-600">{s.count} مرة</td>
                  <td className="p-3 font-mono text-slate-700">{s.resultsCount} نتيجة</td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">{s.lastSearch}</td>
                  <td className="p-3">
                    <Badge variant={s.resultsCount >= 5 ? 'emerald' : 'amber'}>
                      {s.resultsCount >= 5 ? 'تغطية ممتازة' : 'يحتاج محتوى إضافي'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
