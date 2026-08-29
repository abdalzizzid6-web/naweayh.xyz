import React from 'react';
import { NewsArticle } from '../../types';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CompactNewsCardProps {
  article: NewsArticle;
  onOpen: (article: NewsArticle) => void;
  rankIndex?: number;
}

export const CompactNewsCard: React.FC<CompactNewsCardProps> = ({
  article,
  onOpen,
  rankIndex,
}) => {
  const primarySource = article.sources?.[0];

  return (
    <div
      onClick={() => onOpen(article)}
      className="group p-3 rounded-xl hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors cursor-pointer flex gap-3 items-start border-b border-slate-100 dark:border-slate-800/60 last:border-0"
    >
      {rankIndex !== undefined && (
        <span className="text-xl sm:text-2xl font-black text-slate-300 dark:text-slate-700 font-mono group-hover:text-emerald-600 transition-colors shrink-0 w-7 text-center leading-none pt-0.5">
          {rankIndex}
        </span>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {primarySource?.name || 'مصدر معتمد'}
          </span>
          <span>•</span>
          <span className="font-mono">
            {new Date(article.publishDate).toLocaleDateString('ar-YE', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
          {article.title}
        </h5>
      </div>
    </div>
  );
};
