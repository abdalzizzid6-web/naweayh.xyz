import React, { useState, useEffect } from 'react';
import { useApp } from '../../presentation';
import { newsService, NEWS_CATEGORIES, COUNTRIES, YEMEN_REGIONS, UserPreferences } from '../../services/newsService';
import { storiesService, StoryCluster } from '../../services/storiesService';
import { NewsArticle, NewsSource } from '../../types';
import { HeroNewsCard, FeaturedNewsCard, HorizontalNewsCard, CompactNewsCard, StoryClusterCard, HeroNewsSkeleton, FeaturedNewsSkeleton, HorizontalNewsSkeleton } from '../../components/news';
import { ExploreView } from './ExploreView';
import { SavedAndHistoryView } from './SavedAndHistoryView';
import { OnboardingModal } from './OnboardingModal';
import { SearchEnginePanel } from './SearchEnginePanel';
import {
  Zap,
  Play,
  Pause,
  ChevronLeft,
  Search,
  Sparkles,
  Layers,
  MapPin,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Radio,
  Bookmark,
  UserCheck,
  SearchCode,
  Flame,
  ArrowLeft,
} from 'lucide-react';

export const PortalView: React.FC = () => {
  const { activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab, navigate } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedCountry, setSelectedCountry] = useState<string>('جميع الدول');
  const [selectedYemenRegion, setSelectedYemenRegion] = useState<string>('');
  
  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Followed Sources & Ticker
  const [followedSources, setFollowedSources] = useState<string[]>(['spa', 'reuters', 'saba']);
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setForceUpdate] = useState<number>(0);

  // Saved Articles & History
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>(newsService.getSavedArticles());
  const [readingHistory, setReadingHistory] = useState(newsService.getReadingHistory());

  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      setBreakingNews(newsService.getBreakingNews());
      
      try {
        await newsService.syncLatestFromApi();
        setBreakingNews(newsService.getBreakingNews());
        setForceUpdate((v) => v + 1);
      } catch (err) {
        console.warn('API sync fallback:', err);
      }

      try {
        const storyRes = await storiesService.getStories({ limit: 4 });
        setStories(storyRes.data);
      } catch (e) {
        console.warn('Stories load fallback:', e);
      }

      setIsLoading(false);
    }

    initData();
  }, []);

  // Breaking News ticker loop
  useEffect(() => {
    if (breakingNews.length <= 1 || isTickerPaused) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % breakingNews.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [breakingNews, isTickerPaused]);

  const handleOpenArticle = (article: NewsArticle) => {
    newsService.recordReadingHistory(article);
    setReadingHistory(newsService.getReadingHistory());
    if (article.slug) {
      navigate(`/news/${article.slug}`);
    }
  };

  const handleOpenStory = (slug: string) => {
    navigate(`/story/${slug}`);
  };

  const handleBookmark = (id: string) => {
    newsService.toggleBookmark(id);
    setSavedArticles(newsService.getSavedArticles());
  };

  const handleShare = (id: string) => {
    newsService.shareArticle(id);
  };

  // Switch view if global activeTab is "topics" or "saved" or "my_feed"
  if (globalActiveTab === 'topics') {
    return (
      <ExploreView
        onOpenArticle={handleOpenArticle}
        onOpenStory={handleOpenStory}
      />
    );
  }

  if (globalActiveTab === 'saved') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SavedAndHistoryView
          onOpenArticle={handleOpenArticle}
          savedArticles={savedArticles}
          readingHistory={readingHistory}
          onClearHistory={() => {
            newsService.clearReadingHistory();
            setReadingHistory([]);
          }}
          onRemoveBookmark={handleBookmark}
        />
      </div>
    );
  }

  // Filter and paginated articles
  const effectiveCategory = globalActiveTab === 'yemen' 
    ? 'اليمن' 
    : globalActiveTab === 'arab'
    ? 'العالم العربي'
    : globalActiveTab === 'world'
    ? 'دولي'
    : globalActiveTab === 'business'
    ? 'اقتصاد'
    : globalActiveTab === 'tech'
    ? 'تقنية'
    : globalActiveTab === 'sports'
    ? 'رياضة'
    : selectedCategory === 'الكل'
    ? undefined
    : selectedCategory;

  const paginatedResult = newsService.getArticles(
    effectiveCategory,
    selectedCountry === 'جميع الدول' ? undefined : selectedCountry,
    searchQuery || (selectedYemenRegion ? selectedYemenRegion : undefined),
    globalActiveTab === 'latest',
    false,
    { page: currentPage, limit: 12 }
  );

  const heroArticle = paginatedResult.data.length > 0 ? paginatedResult.data[0] : null;
  const companionArticles = paginatedResult.data.slice(1, 3);
  const remainingArticles = paginatedResult.data.slice(3);

  const mostReadNews = newsService.getMostReadNews(5);
  const trendingNews = newsService.getTrendingNews().slice(0, 4);

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 font-sans">
      
      {/* 1. Breaking News Ticker (شريط عاجل حي) */}
      {breakingNews.length > 0 && (
        <div className="bg-slate-900 dark:bg-black text-white rounded-2xl overflow-hidden shadow-md border border-slate-800 flex items-center">
          <div className="bg-rose-600 text-white px-4 py-3 font-black text-xs flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Zap className="w-4 h-4 fill-current" />
            عاجل
          </div>
          
          <div className="flex-1 px-4 py-2 text-xs sm:text-sm font-bold overflow-hidden text-ellipsis whitespace-nowrap text-slate-100 flex items-center justify-between">
            <span
              className="cursor-pointer hover:text-rose-300 transition-colors"
              onClick={() => handleOpenArticle(breakingNews[tickerIndex])}
            >
              {breakingNews[tickerIndex]?.title}
            </span>
            <span className="text-[11px] text-slate-400 mr-2 shrink-0 hidden sm:inline font-mono">
              ({tickerIndex + 1} من {breakingNews.length})
            </span>
          </div>

          <div className="px-3 flex items-center gap-1.5 border-r border-slate-800 text-slate-400">
            <button
              onClick={() => setIsTickerPaused(!isTickerPaused)}
              className="p-1 hover:text-white transition-colors"
              title={isTickerPaused ? 'تشغيل الشريط' : 'إيقاف مؤقت'}
            >
              {isTickerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setTickerIndex((prev) => (prev + 1) % breakingNews.length)}
              className="p-1 hover:text-white transition-colors"
              title="الخبر التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Topic & Governorate Filter Rail */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Categories Pills */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            {NEWS_CATEGORIES.map((cat) => {
              const isSelected = (effectiveCategory || 'الكل') === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedYemenRegion('');
                    setCurrentPage(1);
                    if (globalActiveTab !== 'portal') setGlobalActiveTab('portal');
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'الكل' && <Layers className="w-3.5 h-3.5" />}
                  {cat === 'اليمن' && <MapPin className="w-3.5 h-3.5 text-rose-400" />}
                  {cat === 'تقنية' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              تخصيص اهتماماتي
            </button>
          </div>
        </div>

        {/* Yemen Regional Governorates Sub-Bar */}
        {(effectiveCategory === 'اليمن' || effectiveCategory === 'الكل') && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              المحافظات:
            </span>
            {YEMEN_REGIONS.map((region) => {
              const isSelected = selectedYemenRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => {
                    setSelectedYemenRegion(isSelected ? '' : region);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* 3. Hero Editorial Section (المقال الرئيسي والقصص المرافقة) */}
      {isLoading ? (
        <HeroNewsSkeleton />
      ) : heroArticle ? (
        <div className="space-y-6">
          <HeroNewsCard
            article={heroArticle}
            onOpen={handleOpenArticle}
            onBookmark={handleBookmark}
            onShare={handleShare}
            isBookmarked={savedArticles.some((a) => a.id === heroArticle.id)}
          />

          {/* Companion 2-column featured cards */}
          {companionArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companionArticles.map((art, idx) => (
                <FeaturedNewsCard
                  key={art.id}
                  article={art}
                  onOpen={handleOpenArticle}
                  onBookmark={handleBookmark}
                  isBookmarked={savedArticles.some((a) => a.id === art.id)}
                  featuredOrder={idx + 2}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">لا توجد مقالات مطابقة للمعايير المحددة</h3>
          <p className="text-xs text-slate-500">جرب اختيار قسم آخر أو إعادة ضبط البحث</p>
        </div>
      )}

      {/* 4. Story Clusters Rail (تغطيات موحدة للأحداث) */}
      {stories.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-emerald-700 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                تغطيات الأحداث الموحدة (Story Clusters)
              </h2>
            </div>

            <button
              onClick={() => setGlobalActiveTab('topics')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 flex items-center gap-1"
            >
              عرض جميع التغطيات
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.slice(0, 3).map((st) => (
              <StoryClusterCard
                key={st.id}
                cluster={st}
                onOpenStory={handleOpenStory}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Main Feed + Editorial Rail Layout (8 cols + 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        {/* Main Feed Stream (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-5 bg-emerald-700 rounded-full" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                أحدث التحليلات والأخبار
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              صفحة {currentPage} من {paginatedResult.totalPages || 1}
            </span>
          </div>

          {remainingArticles.length > 0 ? (
            <div className="space-y-3.5">
              {remainingArticles.map((art) => (
                <HorizontalNewsCard
                  key={art.id}
                  article={art}
                  onOpen={handleOpenArticle}
                  onBookmark={handleBookmark}
                  isBookmarked={savedArticles.some((a) => a.id === art.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">تم عرض كافة الأخبار لهذا القسم</p>
          )}

          {/* Pagination Controls */}
          {paginatedResult.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                الصفحة السابقة
              </button>
              <span className="text-xs font-mono font-bold px-3 text-slate-600 dark:text-slate-400">
                {currentPage} / {paginatedResult.totalPages}
              </span>
              <button
                disabled={currentPage >= paginatedResult.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                الصفحة التالية
              </button>
            </div>
          )}
        </div>

        {/* Editorial Sidebar Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Most Read Leaderboard */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              الأكثر قراءة اليوم
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {mostReadNews.map((art, idx) => (
                <CompactNewsCard
                  key={art.id}
                  article={art}
                  onOpen={handleOpenArticle}
                  rankIndex={idx + 1}
                />
              ))}
            </div>
          </div>

          {/* AI Intelligence Spotlight */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-emerald-900/50 shadow-lg space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700/60">
                <Sparkles className="w-3 h-3 text-amber-400" />
                تحليل نوعي بالذكاء الاصطناعي
              </span>
            </div>

            <h4 className="text-sm font-black text-white leading-snug">
              كيف يحلل OmniNews أكثر من 45 مصدراً في ثوانٍ؟
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              يقوم نظام استخراج المحتوى الذكي بتنقيب النصوص الكاملة وفلترة التكرارات، وربط التغطيات المتزامنة في خط زمني موثق دون فقدان دقة المصدر الأصلي.
            </p>
          </div>

          {/* Verified Sources Follow List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              مصادر مقترحة للمتابعة
            </h4>

            <div className="space-y-2.5">
              {newsService.getSources().slice(0, 4).map((src) => {
                const isFollowed = followedSources.includes(src.id);
                return (
                  <div key={src.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {src.logo ? (
                        <img src={src.logo} alt={src.name} className="w-6 h-6 rounded-lg object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px]">
                          {src.name.slice(0, 1)}
                        </div>
                      )}
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{src.name}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (isFollowed) setFollowedSources(followedSources.filter((s) => s !== src.id));
                        else setFollowedSources([...followedSources, src.id]);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        isFollowed
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isFollowed ? 'متابع' : 'متابعة'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Onboarding Preferences Modal */}
      {isOnboardingOpen && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onSavePreferences={() => {
            setIsOnboardingOpen(false);
          }}
        />
      )}

    </div>
  );
};
