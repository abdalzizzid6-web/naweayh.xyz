import React, { useState } from 'react';
import { NewsArticle } from '../../../core/domain/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Zap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  BookOpen,
  Globe,
} from 'lucide-react';

interface NewsOperationsCenterProps {
  articles: NewsArticle[];
  onOpenArticleEditor: (article: NewsArticle | null) => void;
  onUpdateArticleStatus: (articleId: string, status: string) => void;
  onToggleBreaking: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  triggerToast: (msg: string) => void;
}

export const NewsOperationsCenter: React.FC<NewsOperationsCenterProps> = ({
  articles,
  onOpenArticleEditor,
  onToggleBreaking,
  onDeleteArticle,
  triggerToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BREAKING' | 'TRENDING' | 'FULL' | 'PARTIAL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);
  const itemsPerPage = 12;

  // Extract unique categories & countries from actual articles
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));
  const countries = Array.from(new Set(articles.map((a) => a.country).filter(Boolean)));

  const filtered = articles.filter((art) => {
    const s = search.toLowerCase().trim();
    const matchesSearch =
      !s ||
      art.title.toLowerCase().includes(s) ||
      art.category.toLowerCase().includes(s) ||
      (art.summary && art.summary.toLowerCase().includes(s));

    const matchesCategory = categoryFilter === 'ALL' || art.category === categoryFilter;
    const matchesCountry = countryFilter === 'ALL' || art.country === countryFilter;

    let matchesStatus = true;
    if (statusFilter === 'BREAKING') matchesStatus = Boolean(art.isBreaking);
    else if (statusFilter === 'TRENDING') matchesStatus = Boolean(art.isTrending);
    else if (statusFilter === 'FULL') matchesStatus = Boolean(art.isFullContentAvailable);
    else if (statusFilter === 'PARTIAL') matchesStatus = !art.isFullContentAvailable;

    return matchesSearch && matchesCategory && matchesCountry && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadgeVariant = (art: NewsArticle): BadgeVariant => {
    if (art.isBreaking) return 'rose';
    if (art.isTrending) return 'indigo';
    return 'emerald';
  };

  return (
    <div dir="rtl" className="space-y-6">
      <Card
        title="مركز عمليات وإدارة المحتوى الإخباري"
        subtitle={`إجمالي المقالات المسجلة: ${articles.length} | المفلترة: ${filtered.length}`}
      >
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالعنوان، الكلمات المفتاحية، أو القسم..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">جميع الأقسام ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Content Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="p-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">جميع الحالات ونوع المحتوى</option>
              <option value="BREAKING">🚨 الأخبار العاجلة فقط</option>
              <option value="TRENDING">🔥 الرائجة (Trending)</option>
              <option value="FULL">📖 محتوى كامل (Full)</option>
              <option value="PARTIAL">📄 مقتطف / موجز (Partial)</option>
            </select>

            {/* Add Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenArticleEditor(null)}
              className="gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خبر جديد</span>
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">عنوان الخبر</th>
                  <th className="p-3.5">القسم والمصدر</th>
                  <th className="p-3.5">نوع المحتوى</th>
                  <th className="p-3.5">تاريخ النشر</th>
                  <th className="p-3.5">المشاهدات</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginated.length > 0 ? (
                  paginated.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.mainImage}
                            alt={art.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block truncate" title={art.title}>
                              {art.title}
                            </span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">
                              {art.summary || 'لا يوجد ملخص متاح'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <Badge variant="indigo">{art.category}</Badge>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                            {art.sources?.[0]?.name || art.country || 'اليمن'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {art.isFullContentAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <BookOpen className="w-3 h-3" />
                            كامل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <FileText className="w-3 h-3" />
                            موجز
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(art.publishDate).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3.5">
                        <span className="text-slate-700 dark:text-slate-300 font-bold font-mono text-[11px]">
                          👁️ {(art.viewsCount || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <Badge variant={getStatusBadgeVariant(art)}>
                          {art.isBreaking ? '🚨 عاجل' : art.isTrending ? '🔥 رائج' : 'منشور'}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Preview Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setPreviewArticle(art)}
                            title="معاينة سريعة"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onOpenArticleEditor(art)}
                            title="تعديل المقال"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          </Button>

                          {/* Toggle Breaking Button */}
                          <Button
                            variant={art.isBreaking ? 'primary' : 'outline'}
                            size="xs"
                            onClick={() => onToggleBreaking(art.id)}
                            title="تبديل حالة العاجل"
                            className={art.isBreaking ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف خبر: "${art.title.slice(0, 35)}..."؟`)) {
                                onDeleteArticle(art.id);
                              }
                            }}
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                            title="حذف المقال"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      لا توجد أخبار مطابقة للمعايير المحددة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
              <span>
                عرض صفحة <strong className="text-slate-900 dark:text-white font-mono">{currentPage}</strong> من{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{totalPages}</strong> (إجمالي{' '}
                {filtered.length} خبر)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="gap-1"
                >
                  التالي
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Article Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(previewArticle)}>
                  {previewArticle.isBreaking ? 'عاجل' : previewArticle.category}
                </Badge>
                <span className="text-xs text-slate-500">{previewArticle.country}</span>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm px-2 py-1 rounded-lg"
              >
                ✕ إغلاق
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
              {previewArticle.title}
            </h3>

            {previewArticle.mainImage && (
              <img
                src={previewArticle.mainImage}
                alt={previewArticle.title}
                className="w-full h-56 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
              />
            )}

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
              {previewArticle.content || previewArticle.summary}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                المصدر: {previewArticle.sources?.[0]?.name || 'فريق التحرير'}
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const art = previewArticle;
                  setPreviewArticle(null);
                  onOpenArticleEditor(art);
                }}
              >
                فتح في المحرر الكامل
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
