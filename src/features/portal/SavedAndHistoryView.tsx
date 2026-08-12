import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { NewsArticle } from '../../types';
import { newsService } from '../../services/newsService';
import { Bookmark, Clock, Trash2, Eye, Share2, ExternalLink, ShieldCheck, Search, FileText } from 'lucide-react';

interface SavedAndHistoryViewProps {
  onOpenArticle: (article: NewsArticle) => void;
  savedArticles: NewsArticle[];
  readingHistory: { article: NewsArticle; readAt: string }[];
  onClearHistory: () => void;
  onRemoveBookmark: (id: string) => void;
}

export const SavedAndHistoryView: React.FC<SavedAndHistoryViewProps> = ({
  onOpenArticle,
  savedArticles,
  readingHistory,
  onClearHistory,
  onRemoveBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'SAVED' | 'HISTORY'>('SAVED');
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSaved = savedArticles.filter(
    (a) =>
      a.title.includes(filterQuery) ||
      a.summary.includes(filterQuery) ||
      a.category.includes(filterQuery)
  );

  const filteredHistory = readingHistory.filter(
    (item) =>
      item.article.title.includes(filterQuery) ||
      item.article.summary.includes(filterQuery) ||
      item.article.category.includes(filterQuery)
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Tab Switcher & Search Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-indigo-400 fill-current" />
              المحفوظات وسجل القراءة الشخصي
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              استعرض المقالات التي قمت بحفظها أو قراءتها سابقاً بسهولة وبدون فقدان للمحتوى.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'SAVED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('SAVED')}
              className="text-xs font-bold gap-1.5"
            >
              <Bookmark className="w-4 h-4" />
              المحفوظات ({savedArticles.length})
            </Button>
            <Button
              variant={activeTab === 'HISTORY' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('HISTORY')}
              className="text-xs font-bold gap-1.5"
            >
              <Clock className="w-4 h-4" />
              سجل القراءة ({readingHistory.length})
            </Button>
          </div>
        </div>

        {/* Filter Input & Clear Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="تصفية المحفوظات أو السجل..."
              className="w-full pr-9 pl-4 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {activeTab === 'HISTORY' && readingHistory.length > 0 && (
            <Button
              variant="outline"
              size="xs"
              onClick={onClearHistory}
              className="text-xs text-rose-400 border-rose-900/50 hover:bg-rose-950 gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              مسح سجل القراءة بالكامل
            </Button>
          )}
        </div>
      </div>

      {/* Saved Articles List */}
      {activeTab === 'SAVED' && (
        <div className="space-y-4">
          {filteredSaved.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSaved.map((article) => (
                <Card key={article.id} className="flex flex-col justify-between overflow-hidden group">
                  <div className="space-y-3">
                    <div
                      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => onOpenArticle(article)}
                    >
                      <img
                        src={article.mainImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {article.trustScore}%
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="indigo">{article.category}</Badge>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.publishDate}
                        </span>
                      </div>

                      <h3
                        onClick={() => onOpenArticle(article)}
                        className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                      >
                        {article.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => onRemoveBookmark(article.id)}
                      className="text-rose-500 border-rose-200 hover:bg-rose-50 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      إلغاء الحفظ
                    </Button>

                    <Button variant="primary" size="xs" onClick={() => onOpenArticle(article)}>
                      قراءة المقال
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-slate-500 space-y-3">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                لا توجد مقالات محفوظة حالياً
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                يمكنك حفظ أي مقال أثناء تصفحك بالضغط على أيقونة الحفظ لأداء التصفح في وقت لاحق.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Reading History List */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          {filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((item, index) => (
                <Card
                  key={index}
                  onClick={() => onOpenArticle(item.article)}
                  className="p-4 hover:border-indigo-500 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={item.article.mainImage}
                        alt={item.article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo">{item.article.category}</Badge>
                        <span className="text-[10px] text-slate-400 font-medium">
                          قرأت في: {item.readAt}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.article.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      {item.article.viewsCount.toLocaleString('ar-EG')}
                    </span>
                    <Button variant="outline" size="xs">
                      إعادة القراءة
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center text-slate-500 space-y-3">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                سجل القراءة فارغ
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                سيتم تسجيل المقالات التي تقوم بقراءتها هنا تلقائياً لسرعة العودة إليها.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
