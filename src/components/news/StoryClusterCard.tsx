import React from 'react';
import { StoryCluster } from '../../services/storiesService';
import { Layers, ArrowLeft, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface StoryClusterCardProps {
  cluster: StoryCluster;
  onOpenStory: (slug: string) => void;
}

const DEFAULT_SOURCE_LOGO = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=60&q=80';

export const StoryClusterCard: React.FC<StoryClusterCardProps> = ({
  cluster,
  onOpenStory,
}) => {
  return (
    <div
      onClick={() => onOpenStory(cluster.slug)}
      className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 hover:border-emerald-500/60 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Background Subtle Accent */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

      <div className="relative z-10 space-y-3">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full bg-emerald-900/70 text-emerald-300 border border-emerald-700/60 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            تغطية موحدة للأحداث (Story Cluster)
          </span>

          <span className="text-[10px] font-mono text-slate-400">
            {cluster.category}
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
          {cluster.title}
        </h3>

        {/* Lead Summary */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {cluster.summary}
        </p>

        {/* Sources Cluster Avatars & Stats */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex -space-x-2 overflow-hidden">
            {cluster.sources?.slice(0, 3).map((src, i) => (
              <img
                key={i}
                src={src.logo || DEFAULT_SOURCE_LOGO}
                alt={src.name}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_SOURCE_LOGO;
                }}
                className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-emerald-300">
            {cluster.sourcesCount || 5} مصادر موثقة • {cluster.articlesCount || 8} تحديثات
          </span>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-[10px] font-mono">
          <Clock className="w-3 h-3" />
          تحديث مستمر
        </span>

        <span className="inline-flex items-center gap-1 font-black text-emerald-400 group-hover:-translate-x-1 transition-transform">
          عرض القصة الكاملة والخط الزمني
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
