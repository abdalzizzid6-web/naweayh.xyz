import React from 'react';
import { NewsArticle } from '../../types';
import { Clock, ShieldCheck, Bookmark, BookOpen, FileText, CheckCircle2 } from 'lucide-react';

interface FeaturedNewsCardProps {
  article: NewsArticle;
  onOpen: (article: NewsArticle) => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
  featuredOrder?: number;
}

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';

export const FeaturedNewsCard: React.FC<FeaturedNewsCardProps> = ({
  article,
  onOpen,
  onBookmark,
  isBookmarked = false,
  featuredOrder,
}) => {
  const isFull = Boolean(
    article.isFullContentAvailable ||
    article.contentStatus === 'full' ||
    article.contentClassification === 'FULL_PERMITTED_CONTENT'
  );
  const primarySource = article.sources?.[0];

  return (
    <div
      onClick={() => onOpen(article)}
      className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 hover:border-emerald-600/50 dark:hover:border-emerald-500/40 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Cover Aspect Ratio Frame */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
          <img
            src={article.mainImage || DEFAULT_NEWS_IMAGE}
            alt={article.title}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_NEWS_IMAGE;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-slate-700/60">
              {article.category}
            </span>
            {featuredOrder && (
              <span className="bg-emerald-800 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {featuredOrder}
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 z-10">
            {isFull ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 backdrop-blur-xs">
                <BookOpen className="w-2.5 h-2.5" />
                مقال كامل
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-xs">
                <FileText className="w-2.5 h-2.5" />
                موجز
              </span>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              {primarySource?.name || 'مصدر معتمد'}
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            </span>
            <span className="font-mono text-[10px]">
              {new Date(article.publishDate).toLocaleDateString('ar-YE', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {article.excerpt || article.summary}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-0 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800/80 mt-2">
        <div className="flex items-center gap-2.5 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTimeMinutes || 3} د
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {article.trustScore || 95}% ثقة
          </span>
        </div>

        {onBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(article.id);
            }}
            className={`p-2 rounded-lg border transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              isBookmarked
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            }`}
            title="حفظ"
            aria-label="حفظ المقال"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
