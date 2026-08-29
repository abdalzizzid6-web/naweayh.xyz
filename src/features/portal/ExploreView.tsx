import React, { useState, useEffect } from 'react';
import { storiesService, StoryCluster } from '../../services/storiesService';
import { newsService } from '../../services/newsService';
import { NewsArticle, NewsSource } from '../../types';
import { StoryClusterCard } from '../../components/news/StoryClusterCard';
import { FeaturedNewsCard } from '../../components/news/FeaturedNewsCard';
import { HorizontalNewsCard } from '../../components/news/HorizontalNewsCard';
import { CompactNewsCard } from '../../components/news/CompactNewsCard';
import {
  Compass,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  Flame,
  Globe,
  Radio,
  Plus,
  Check,
} from 'lucide-react';

interface ExploreViewProps {
  onOpenArticle: (article: NewsArticle) => void;
  onOpenStory: (slug: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onOpenArticle,
  onOpenStory,
}) => {
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [followedSources, setFollowedSources] = useState<string[]>(['spa', 'reuters', 'saba']);
  const [sourceSearch, setSourceSearch] = useState<string>('');
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState<string>('الكل');

  const trendingNews = newsService.getTrendingNews().slice(0, 4);
  const mostReadNews = newsService.getMostReadNews(5);
  const allArticles = newsService.getArticles(undefined, undefined, undefined, false, false, { page: 1, limit: 12 }).data;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await storiesService.getStories({ limit: 6 });
        setStories(res.data);
      } catch (err) {
        console.warn('Could not load story clusters:', err);
      }
      setSources(newsService.getSources());
    }
    loadData();
  }, []);

  const toggleFollow = (id: string) => {
    if (followedSources.includes(id)) {
      setFollowedSources(followedSources.filter((s) => s !== id));
    } else {
      setFollowedSources([...followedSources, id]);
    }
  };

  const filteredSources = sources.filter((s) => {
    const matchesQuery = s.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
      s.description?.toLowerCase().includes(sourceSearch.toLowerCase());
    const matchesCategory = sourceCategoryFilter === 'الكل' || s.category === sourceCategoryFilter;
    return matchesQuery && matchesCategory;
  });

  const trendingTopics = [
    { tag: 'اليمن والتنمية', count: 18, isHot: true },
    { tag: 'الذكاء الاصطناعي العربي', count: 14, isHot: true },
    { tag: 'الاقتصاد الخليجي 2026', count: 12, isHot: false },
    { tag: 'الأمن السيبراني', count: 9, isHot: false },
    { tag: 'استكشاف الفضاء', count: 7, isHot: false },
    { tag: 'الطاقة النظيفة', count: 11, isHot: true },
  ];

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-300 text-xs font-black border border-emerald-700/60">
            <Compass className="w-3.5 h-3.5" />
            استكشاف الأخبار والقصص الموحدة
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            بوصلة الأخبار والتحليلات النوعية
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            اكتشف الأحداث المتشابكة المجمعة ذكياً، واطلع على دليل المصادر الـ 45+ المعتمدة وتتبع التغطيات الحية لحظة بلحظة.
          </p>
        </div>
      </div>

      {/* 2. Trending Topics Radar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            المواضيع الأكثر تداولاً واهتماماً الآن
          </h2>
          <span className="text-xs text-slate-400 font-mono">تحديث كل 5 دقائق</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {trendingTopics.map((topic, idx) => (
            <div
              key={idx}
              className="group bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-2xl px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>#{topic.tag}</span>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {topic.count} مقال
              </span>
              {topic.isHot && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Story Clusters Section (تغطيات الأحداث الموحدة) */}
      {stories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                تغطيات الأحداث الموحدة (Story Clusters)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تجميع ذكي لعدة مصادر إخبارية تغطي نفس الحدث مع تحليل الخط الزمني.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((cluster) => (
              <StoryClusterCard
                key={cluster.id}
                cluster={cluster}
                onOpenStory={onOpenStory}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. Two-Column Intelligence Grid: Most Read & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Most Read Leaderboard (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            المقالات الأكثر قراءة وتفاعلاً
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {mostReadNews.map((article, idx) => (
              <CompactNewsCard
                key={article.id}
                article={article}
                onOpen={onOpenArticle}
                rankIndex={idx + 1}
              />
            ))}
          </div>
        </div>

        {/* Right: Curated Deep Dive Feeds (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            مختارات استقصائية وتحليلات نوعية
          </h3>

          <div className="space-y-3">
            {allArticles.slice(0, 4).map((art) => (
              <HorizontalNewsCard
                key={art.id}
                article={art}
                onOpen={onOpenArticle}
              />
            ))}
          </div>
        </div>

      </div>

      {/* 5. Verified Sources Directory (دليل المصادر المعتمدة) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              دليل المصادر الإخبارية المعتمدة ({sources.length}+ مصدر)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مصادر رسمية وصحفية موثقة تخضع لتقييم الشفافية والموثوقية التحريرية.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              placeholder="ابحث عن مصدر أو وكالة..."
              className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSources.map((source) => {
            const isFollowed = followedSources.includes(source.id);
            return (
              <div
                key={source.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center gap-3">
                  {source.logo ? (
                    <img
                      src={source.logo}
                      alt={source.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                      {source.name.slice(0, 1)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-bold text-xs text-slate-900 dark:text-white truncate">
                      <span>{source.name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {source.country} • {source.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                    {source.reliabilityScore || 95}% موثوق
                  </span>

                  <button
                    onClick={() => toggleFollow(source.id)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ${
                      isFollowed
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-3 h-3" />
                        متابع
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        متابعة
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
