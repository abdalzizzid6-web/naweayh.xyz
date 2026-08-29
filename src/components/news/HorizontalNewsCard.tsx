import React from 'react';
import { NewsArticle } from '../../types';
import { Clock, ShieldCheck, Bookmark, BookOpen, CheckCircle2 } from 'lucide-react';

interface HorizontalNewsCardProps {
  article: NewsArticle;
  onOpen: (article: NewsArticle) => void;
  onBookmark?: (id: string) => void;
  isBookmarked?: boolean;
}

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80';

export const HorizontalNewsCard: React.FC<HorizontalNewsCardProps> = ({
  article,
  onOpen,
  onBookmark,
  isBookmarked = false,
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
      className="group bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-600/50 dark:hover:border-emerald-500/40 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex gap-3.5 sm:gap-4 items-center"
    >
      {/* Thumbnail Frame */}
      <div className="w-24 sm:w-36 aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-slate-950 relative">
        <img
          src={article.mainImage || DEFAULT_NEWS_IMAGE}
          alt={article.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_NEWS_IMAGE;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isFull && (
          <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 backdrop-blur-2xs">
            كامل
          </span>
        )}
      </div>

      {/* Text Details */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {article.category}
            </span>
            <span>•</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px] sm:max-w-[160px]">
              {primarySource?.name || 'مصدر معتمد'}
            </span>
          </div>

          <span className="font-mono text-[10px] shrink-0">
            {new Date(article.publishDate).toLocaleDateString('ar-YE', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
          {article.title}
        </h4>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 hidden sm:block">
          {article.excerpt || article.summary}
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTimeMinutes || 3} د
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {article.trustScore || 95}% موثوق
            </span>
          </div>

          {onBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(article.id);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
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
    </div>
  );
};
