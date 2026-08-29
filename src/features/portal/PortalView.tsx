import React, { useState, useEffect } from 'react';
import { useApp } from '../../presentation';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { newsService, NEWS_CATEGORIES, COUNTRIES, YEMEN_REGIONS, UserPreferences } from '../../services/newsService';
import { storiesService, StoryCluster } from '../../services/storiesService';
import { NewsArticle, NewsSource } from '../../types';
import { ArticleDetailModal } from './ArticleDetailModal';
import { SearchEnginePanel } from './SearchEnginePanel';
import { OnboardingModal } from './OnboardingModal';
import { SavedAndHistoryView } from './SavedAndHistoryView';
import { BottomNav, PortalTab } from '../../components/navigation/BottomNav';
import {
  Search,
  Zap,
  Globe,
  Share2,
  Bookmark,
  Clock,
  Eye,
  ShieldCheck,
  Play,
  Pause,
  ChevronLeft,
  Sparkles,
  Layers,
  SearchCode,
  Flame,
  TrendingUp,
  MapPin,
  Sliders,
  Check,
  Plus,
  Compass,
  FileText,
  UserCheck,
  Radio,
} from 'lucide-react';

export const PortalView: React.FC = () => {
  // Navigation Tabs State
  const { activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab, navigate } = useApp();
  
  // Map AppContext NavTab to PortalTab logic
  const activeTab = globalActiveTab === 'portal' || globalActiveTab === 'topics' ? 'home' : globalActiveTab;
  const setActiveTab = (tab: string) => {
    if (tab === 'home') setGlobalActiveTab('portal');
    else setGlobalActiveTab(tab as any);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedCountry, setSelectedCountry] = useState<string>('جميع الدول');
  const [selectedYemenRegion, setSelectedYemenRegion] = useState<string>('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Article Reader
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  // Onboarding & Preferences State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    categories: ['اليمن', 'سياسة', 'اقتصاد', 'تقنية'],
    countries: ['اليمن', 'السعودية', 'عالمي'],
    sources: ['spa', 'reuters', 'saba', 'aljazeera'],
    notificationsEnabled: true,
  });

  // Followed Sources State
  const [followedSources, setFollowedSources] = useState<string[]>(['spa', 'reuters', 'saba']);

  // Ticker State
  const [breakingNews, setBreakingNews] = useState<NewsArticle[]>([]);
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);
  const [stories, setStories] = useState<StoryCluster[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [, setForceUpdate] = useState<number>(0);

  useEffect(() => {
    setBreakingNews(newsService.getBreakingNews());
    
    async function syncData() {
      setIsSyncing(true);
      try {
        await newsService.syncLatestFromApi();
        setBreakingNews(newsService.getBreakingNews());
        setForceUpdate((v) => v + 1);
      } catch (err) {
        console.warn('API sync warning:', err);
      } finally {
        setIsSyncing(false);
      }
    }

    async function fetchStories() {
      try {
        const res = await storiesService.getStories({ limit: 6 });
        setStories(res.data);
      } catch (e) {
        // silent fallback
      }
    }

    syncData();
    fetchStories();
  }, []);

  useEffect(() => {
    if (breakingNews.length <= 1 || isTickerPaused) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % breakingNews.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [breakingNews, isTickerPaused]);

  // Saved Articles & Reading History
  const [savedArticles, setSavedArticles] = useState<NewsArticle[]>(newsService.getSavedArticles());
  const [readingHistory, setReadingHistory] = useState(newsService.getReadingHistory());

  const handleOpenArticle = (article: NewsArticle) => {
    newsService.recordReadingHistory(article);
    setReadingHistory(newsService.getReadingHistory());
    if (article.slug) {
      navigate(`/news/${article.slug}`);
    }
  };

  const handleShare = (id: string) => {
    newsService.shareArticle(id);
  };

  const handleBookmark = (id: string) => {
    newsService.toggleBookmark(id);
    setSavedArticles(newsService.getSavedArticles());
  };

  const toggleFollowSource = (sourceId: string) => {
    if (followedSources.includes(sourceId)) {
      setFollowedSources(followedSources.filter((s) => s !== sourceId));
    } else {
      setFollowedSources([...followedSources, sourceId]);
    }
  };

  // Article Queries
  const paginatedResult = newsService.getArticles(
    selectedCategory === 'الكل' ? undefined : selectedCategory,
    selectedCountry === 'جميع الدول' ? undefined : selectedCountry,
    searchQuery || (selectedYemenRegion ? selectedYemenRegion : undefined),
    false,
    false,
    { page: currentPage, limit: 9 }
  );

  const heroArticle = paginatedResult.data.length > 0 ? paginatedResult.data[0] : null;
  const gridArticles = paginatedResult.data.length > 0 ? paginatedResult.data.slice(1) : [];

  // Special Feeds
  const trendingNews = newsService.getTrendingNews().slice(0, 4);
  const mostReadNews = newsService.getMostReadNews(5);
  const sourcesList = newsService.getSources();

  // Personalized Feed ("أخبارك") Filter
  const personalizedArticles = newsService
    .getArticles()
    .data.filter(
      (art) =>
        userPreferences.categories.includes(art.category) ||
        userPreferences.countries.includes(art.country)
    );

  return (
    <div dir="rtl" className="space-y-6 pb-20 md:pb-6 font-sans">
      
      {/* 1. Breaking News Ticker (شريط عاجل) */}
      {breakingNews.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex items-center">
          <div className="bg-rose-600 text-white px-4 py-3 font-black text-xs flex items-center gap-2 whitespace-nowrap shrink-0">
            <Zap className="w-4 h-4 fill-current animate-bounce" />
            عاجل
          </div>
          <div className="flex-1 px-4 py-2 text-xs sm:text-sm font-semibold overflow-hidden text-ellipsis whitespace-nowrap text-slate-100 flex items-center justify-between">
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

      {/* 2. Top Header Toolbar & View Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Row 1: Search & Personalization Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Main Search Trigger Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowAdvancedSearch(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAdvancedSearch(true);
                setCurrentPage(1);
              }}
              placeholder="ابحث في الأخبار، المصادر، والكيانات..."
              className="w-full pr-9 pl-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* View Tabs Selector (Desktop) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'home'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                الرئيسية
              </button>
              <button
                onClick={() => setActiveTab('latest')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'latest'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                آخر الأخبار
              </button>
              <button
                onClick={() => setActiveTab('my_feed')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'my_feed'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                أخبارك
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  activeTab === 'saved'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                المحفوظات
              </button>
            </div>

            {/* AI Search Engine Dedicated Toggle */}
            <Button
              variant={showAdvancedSearch ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="text-xs gap-1.5 font-bold"
            >
              <SearchCode className="w-4 h-4 text-amber-500" />
              {showAdvancedSearch ? 'إغلاق البحث' : 'البحث الذكي (AI Search)'}
            </Button>

            {/* Customize Interests Onboarding Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-xs gap-1 font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
            >
              <Sliders className="w-3.5 h-3.5" />
              تخصيص اهتماماتي
            </Button>
          </div>
        </div>

        {/* Row 2: Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-3">
          {NEWS_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedYemenRegion('');
                  setCurrentPage(1);
                  if (activeTab !== 'home') setActiveTab('home');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {category === 'الكل' && <Layers className="w-3.5 h-3.5" />}
                {category === 'اليمن' && <MapPin className="w-3.5 h-3.5 text-rose-400" />}
                {category === 'تقنية' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                {category === 'فيديو' && <Play className="w-3.5 h-3.5 text-sky-400" />}
                {category}
              </button>
            );
          })}
        </div>

        {/* Row 3: Yemen Regional Governorates Sub-Bar (If Yemen Selected) */}
        {(selectedCategory === 'اليمن' || selectedCategory === 'الكل') && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              تغطية المحافظات اليمنية:
            </span>
            {YEMEN_REGIONS.map((region) => {
              const isSelected = selectedYemenRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => {
                    setSelectedYemenRegion(isSelected ? '' : region);
                    setSelectedCategory('اليمن');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/60 dark:border-slate-700'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced AI Search Engine Overlay */}
      {showAdvancedSearch && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-200">
          <SearchEnginePanel
            initialQuery={searchQuery}
            onSelectArticle={(art) => handleOpenArticle(art)}
          />
        </div>
      )}

      {/* VIEW 1: HOME PAGE (الرئيسية) */}
      {activeTab === 'home' && (
        <div className="space-y-8">
          
          {/* Stories First Section (قصص الأحداث الموحدة) */}
          {stories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">قصص الأحداث الكبرى (Stories First)</h3>
                    <p className="text-xs text-slate-500">أحدث التغطيات مجمعة في قصص إخبارية موحدة من مصادر متعددة</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {stories.length} قصص نشطة
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {stories.map((story) => (
                  <Card
                    key={story.id}
                    onClick={() => navigate(`/story/${story.slug}`)}
                    className="p-5 bg-white border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer rounded-2xl shadow-xs space-y-3 flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Badge className="bg-emerald-50 text-emerald-800 font-bold">{story.category || 'عام'}</Badge>
                        <span className="text-slate-400 font-medium">{new Date(story.last_updated_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {story.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {story.sources_count || 1} مصادر تغطي الحدث
                      </span>
                      <span className="text-indigo-600 font-bold group-hover:translate-x-[-4px] transition-transform flex items-center gap-1">
                        استعراض القصة <ChevronLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Hero Story Feature Card */}
          {heroArticle && (
            <div
              onClick={() => handleOpenArticle(heroArticle)}
              className="group relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl cursor-pointer transition-all duration-300 hover:shadow-2xl"
            >
              <div className="aspect-[21/9] sm:aspect-[21/8] relative">
                <img
                  src={heroArticle.mainImage}
                  alt={heroArticle.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              </div>

              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="indigo">{heroArticle.category}</Badge>
                  <Badge variant="sky">{heroArticle.country}</Badge>
                  <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    موثوقية {heroArticle.trustScore}% ({heroArticle.sources.length} مصادر)
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white group-hover:text-indigo-200 transition-colors leading-tight">
                  {heroArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
                  {heroArticle.summary}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {heroArticle.publishDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {heroArticle.viewsCount.toLocaleString('ar-EG')} قراءة
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout: Trending & Latest Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Right 2 Columns: Grid of Main Feed Articles */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  أحدث الأخبار والتغطيات
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  عرض {gridArticles.length + (heroArticle ? 1 : 0)} من أصل {paginatedResult.total}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {gridArticles.map((article) => (
                  <Card key={article.id} className="flex flex-col justify-between overflow-hidden group">
                    <div className="space-y-3">
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
                        onClick={() => handleOpenArticle(article)}
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
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-md text-[11px] font-bold text-slate-800 dark:text-slate-100 shadow-xs">
                          <img
                            src={article.sources[0]?.logo}
                            alt={article.sources[0]?.name}
                            className="w-3.5 h-3.5 rounded-full"
                          />
                          {article.sources[0]?.name}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="indigo">{article.category}</Badge>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.publishDate.split(' ')[1] || article.publishDate}
                          </span>
                        </div>

                        <h3
                          onClick={() => handleOpenArticle(article)}
                          className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                        >
                          {article.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {article.viewsCount.toLocaleString('ar-EG')}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleBookmark(article.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="حفظ المقال"
                        >
                          <Bookmark className={`w-4 h-4 ${article.isBookmarked ? 'fill-current text-indigo-600' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleShare(article.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="مشاركة"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenArticle(article)}
                          className="mr-1 text-xs"
                        >
                          التفاصيل
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Left 1 Column: Trending (الأكثر تداولاً) & Most Read (الأكثر قراءة) */}
            <div className="space-y-6">
              
              {/* Trending Velocity Box */}
              <Card className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                    <Flame className="w-4 h-4 fill-current text-amber-400" />
                    الأكثر تداولاً الآن (Velocity Rank)
                  </h3>
                  <Badge variant="rose">مباشر</Badge>
                </div>

                <div className="space-y-3">
                  {trendingNews.map((art, idx) => (
                    <div
                      key={art.id}
                      onClick={() => handleOpenArticle(art)}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-amber-400 font-black">#{idx + 1} الأكثر تفاعلاً</span>
                        <Badge variant="outline" className="text-[10px]">
                          {art.category}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                        <span>{art.viewsCount.toLocaleString()} قراءة</span>
                        <span>•</span>
                        <span>{art.sharesCount} مشاركة</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Most Read Box */}
              <Card className="p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    الأكثر قراءة هذا الأسبوع
                  </h3>
                </div>

                <div className="space-y-3">
                  {mostReadNews.map((art, idx) => (
                    <div
                      key={art.id}
                      onClick={() => handleOpenArticle(art)}
                      className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                          {art.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {art.viewsCount.toLocaleString()} مشاهدة
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Followed Sources Bar */}
              <Card className="p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    المصادر الإخبارية المعتمدة
                  </h3>
                </div>

                <div className="space-y-2">
                  {sourcesList.slice(0, 4).map((src) => {
                    const isFollowed = followedSources.includes(src.id);
                    return (
                      <div
                        key={src.id}
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={src.logo}
                            alt={src.name}
                            className="w-6 h-6 rounded-full object-cover border"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block line-clamp-1">
                              {src.name}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block">
                              موثوقية {src.reliabilityRating || src.trustScore || 95}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleFollowSource(src.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isFollowed
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isFollowed ? 'تتابع' : '+ متابعة'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LATEST NEWS (آخر الأخبار) */}
      {activeTab === 'latest' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-500 fill-current" />
                شريط وتدفق آخر الأخبار الفورية
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تغطية لحظية مستمرة بجميع المستجدات مرتبة حسب أحدث وقت نشر بكل دقة.
              </p>
            </div>
            <Badge variant="rose">محدث فورياً</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedResult.data.map((article) => (
              <Card key={article.id} className="flex flex-col justify-between overflow-hidden group">
                <div className="space-y-3">
                  <div
                    className="relative aspect-video rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => handleOpenArticle(article)}
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
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {article.publishDate}
                      </span>
                    </div>

                    <h3
                      onClick={() => handleOpenArticle(article)}
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
                  <span className="text-slate-400 font-mono">
                    {article.viewsCount.toLocaleString()} قراءة
                  </span>
                  <Button variant="outline" size="xs" onClick={() => handleOpenArticle(article)}>
                    قراءة التفاصيل
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: MY FEED (أخبارك المخصصة) */}
      {activeTab === 'my_feed' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="indigo">موجزك الذكي</Badge>
                <span className="text-xs text-indigo-300 font-bold">بناءً على اهتماماتك المحددة</span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                تغطيات وموجز "أخبارك" المخصص
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                يتم تجميع هذه الأخبار خصيصاً لك بناءً على الأقسام والدول التي اخترت متابعتها ({userPreferences.categories.join('، ')}).
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-xs text-white border-indigo-500 hover:bg-indigo-900/50 gap-1.5"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              تعديل الاهتمامات
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {personalizedArticles.map((article) => (
              <Card key={article.id} className="flex flex-col justify-between overflow-hidden group">
                <div className="space-y-3">
                  <div
                    className="relative aspect-video rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => handleOpenArticle(article)}
                  >
                    <img
                      src={article.mainImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="indigo">{article.category}</Badge>
                      <Badge variant="sky">{article.country}</Badge>
                    </div>

                    <h3
                      onClick={() => handleOpenArticle(article)}
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
                  <Button variant="outline" size="xs" onClick={() => handleOpenArticle(article)}>
                    عرض الخبر
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: SAVED & HISTORY (المحفوظات وسجل القراءة) */}
      {activeTab === 'saved' && (
        <SavedAndHistoryView
          onOpenArticle={handleOpenArticle}
          savedArticles={savedArticles}
          readingHistory={readingHistory}
          onClearHistory={() => {
            newsService.clearReadingHistory();
            setReadingHistory([]);
          }}
          onRemoveBookmark={(id) => {
            newsService.toggleBookmark(id);
            setSavedArticles(newsService.getSavedArticles());
          }}
        />
      )}

      {/* Pagination Bar for Home and Latest */}
      {(activeTab === 'home' || activeTab === 'latest') && paginatedResult.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </Button>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
            صفحة {currentPage} من {paginatedResult.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === paginatedResult.totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(paginatedResult.totalPages, prev + 1))}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Onboarding Preference Customization Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialPreferences={userPreferences}
        onSavePreferences={(prefs) => setUserPreferences(prefs)}
      />

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSearch={() => setShowAdvancedSearch(true)}
      />
    </div>
  );
};
