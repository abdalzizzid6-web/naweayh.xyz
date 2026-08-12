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
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Eye,
  Share2,
  Bookmark,
  Calendar,
} from 'lucide-react';

interface NewsOperationsCenterProps {
  articles: NewsArticle[];
  onOpenArticleEditor: (article: NewsArticle | null) => void;
  onUpdateArticleStatus: (articleId: string, status: string) => void;
  onToggleBreaking: (articleId: string) => void;
  onDeleteArticle: (articleId: string) => void;
  triggerToast: (msg: string) => void;
}

export type ArticleStatusFilter =
  | 'ALL'
  | 'Fetched'
  | 'Processing'
  | 'AI Processing'
  | 'Review'
  | 'Approved'
  | 'Published'
  | 'Scheduled'
  | 'Rejected'
  | 'Archived'
  | 'Failed';

export const NewsOperationsCenter: React.FC<NewsOperationsCenterProps> = ({
  articles,
  onOpenArticleEditor,
  onUpdateArticleStatus,
  onToggleBreaking,
  onDeleteArticle,
  triggerToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || art.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'Published' && !art.isBreaking) ||
      (statusFilter === 'Approved' && true);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadgeVariant = (art: NewsArticle): BadgeVariant => {
    if (art.isBreaking) return 'rose';
    if (art.isTrending) return 'indigo';
    return 'emerald';
  };

  return (
    <div dir="rtl" className="space-y-6">
      <Card
        title="مركز عمليات إدارة وتدقيق المحتوى الأخبار"
        subtitle="استعراض وتعديل المقالات، حالات الاعتماد والتدقيق، وتعيين الأخبار العاجلة"
      >
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث العناوين أو التصنيفات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            {/* Filters & Add Button */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:outline-none"
              >
                <option value="ALL">جميع الحالات (All Statuses)</option>
                <option value="Published">منشورة (Published)</option>
                <option value="Review">قيد المراجعة (Review)</option>
                <option value="AI Processing">قيد المعالجة بالذكاء الإصطناعي</option>
                <option value="Scheduled">مجدولة (Scheduled)</option>
                <option value="Approved">معتمدة (Approved)</option>
                <option value="Rejected">مرفوضة (Rejected)</option>
                <option value="Archived">مؤرشفة (Archived)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:outline-none"
              >
                <option value="ALL">جميع الأقسام</option>
                <option value="تقنية">تقنية</option>
                <option value="سياسة">سياسة</option>
                <option value="اقتصاد">اقتصاد</option>
                <option value="رياضة">رياضة</option>
                <option value="صحة">صحة</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenArticleEditor(null)}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>خبر جديد</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">عنوان الخبر</th>
                  <th className="p-3">القسم والبلد</th>
                  <th className="p-3">تاريخ النشر</th>
                  <th className="p-3">التفاعل</th>
                  <th className="p-3">درجة الموثوقية</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={art.mainImage}
                          alt={art.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block max-w-sm truncate">{art.title}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{art.summary}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge variant="indigo">{art.category}</Badge>
                        <span className="text-[10px] text-slate-500 block">{art.country}</span>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-slate-600 text-[11px]">{art.publishDate}</td>

                    <td className="p-3">
                      <div className="text-[11px] space-y-0.5">
                        <span className="text-slate-700 block font-bold">👁️ {art.viewsCount.toLocaleString()}</span>
                        <span className="text-slate-500 block">🔄 {art.sharesCount} مشاركة</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="text-emerald-600 font-bold font-mono">{art.trustScore}%</span>
                    </td>

                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(art)}>
                        {art.isBreaking ? '🚨 عاجل' : 'منشور'}
                      </Badge>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onOpenArticleEditor(art)}
                          title="تعديل"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant={art.isBreaking ? 'primary' : 'outline'}
                          size="xs"
                          onClick={() => {
                            onToggleBreaking(art.id);
                            triggerToast(`تم تبديل حالة الخبر العاجل لـ (${art.title.slice(0, 20)}...)`);
                          }}
                          title="عاجل"
                        >
                          {art.isBreaking ? 'إلغاء العاجل' : 'عاجل'}
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            onDeleteArticle(art.id);
                            triggerToast('تم أرشفة/حذف الخبر بنجاح');
                          }}
                          className="text-rose-600 hover:bg-rose-50 border-rose-200"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
