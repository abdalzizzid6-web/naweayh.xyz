import React from 'react';
import { NewsArticle } from '../../types';
import { Badge } from '../ui/Badge';
import {
  Clock,
  Eye,
  ShieldCheck,
  Bookmark,
  Share2,
  BookOpen,
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface HeroNewsCardProps {
  article: NewsArticle;
  onOpen: (article: NewsArticle) => void;
  onBookmark?: (id: string) => void;
  onShare?: (id: string) => void;
  isBookmarked?: boolean;
}

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';

export const HeroNewsCard: React.FC<HeroNewsCardProps> = ({
  article,
  onOpen,
  onBookmark,
  onShare,
  isBookmarked = false,
}) => {
  const isFull = Boolean(
    article.isFullContentAvailable ||
    article.contentStatus === 'full' ||
    article.contentClassification === 'FULL_PERMITTED_CONTENT' ||
    (article.paragraphs && article.paragraphs.length >= 3)
  );

  const primarySource = article.sources?.[0];

  return (
    <div
      onClick={() => onOpen(article)}
      className="group relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl hover:border-emerald-600/40 dark:hover:border-emerald-500/30 transition-all duration-300 cursor-pointer flex flex-col lg:flex-row"
    >
      {/* Visual Image Section */}
      <div className="lg:w-7/12 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-slate-950">
        <img
          src={article.mainImage || DEFAULT_NEWS_IMAGE}
          alt={article.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_NEWS_IMAGE;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent lg:hidden" />
        
        {/* Floating Badges on Image */}
        <div className="absolute top-3.5 right-3.5 flex flex-wrap gap-2 z-10">
          <span className="bg-emerald-800/95 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            القصة الرئيسية
          </span>
          <span className="bg-slate-900/85 backdrop-blur-xs text-slate-100 text-[11px] font-bold px-3 py-1 rounded-full border border-slate-700/50">
            {article.category}
          </span>
        </div>

        {/* Content Status Indicator */}
        <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2">
          {isFull ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 backdrop-blur-xs">
              <BookOpen className="w-3 h-3" />
              مقال كامل
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/50 backdrop-blur-xs">
              <FileText className="w-3 h-3" />
              موجز إخباري معتمد
            </span>
          )}
        </div>
      </div>

      {/* Editorial Content Section */}
      <div className="lg:w-5/12 p-5 sm:p-7 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Source Attribution & Timing */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              {primarySource?.logo ? (
                <img
                  src={primarySource.logo}
                  alt={primarySource.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] flex items-center justify-center font-bold">
                  {primarySource?.name?.slice(0, 1) || 'ن'}
                </div>
              )}
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                {primarySource?.name || 'مصدر معتمد'}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            </div>

            <span className="font-mono text-[11px] text-slate-400">
              {new Date(article.publishDate).toLocaleDateString('ar-YE', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-3">
            {article.title}
          </h2>

          {/* Lead Summary Excerpt */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {article.excerpt || article.summary}
          </p>
        </div>

        {/* Footer Meta & Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {article.readTimeMinutes || 3} د
            </span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {article.trustScore || 95}%
            </span>
          </div>

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {onBookmark && (
              <button
                onClick={() => onBookmark(article.id)}
                className={`p-2.5 rounded-xl border transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  isBookmarked
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="حفظ المقال"
                aria-label="حفظ المقال"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(article.id)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="مشاركة"
                aria-label="مشاركة المقال"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

