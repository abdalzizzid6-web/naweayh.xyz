import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  searchEngineService,
  SearchOptions,
  SearchResult,
  AutocompleteGroup,
  SearchAnalyticsData,
} from '../../search-engine/SearchEngineService';
import { NEWS_CATEGORIES, COUNTRIES } from '../../services/newsService';
import { NewsArticle } from '../../core/domain/types';
import {
  Search,
  X,
  Sparkles,
  History,
  TrendingUp,
  SlidersHorizontal,
  BarChart2,
  Calendar,
  Globe,
  Tag,
  User,
  Filter,
  Eye,
  CheckCircle2,
  Zap,
  ArrowRight,
  Clock,
  Trash2,
  FileText,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface SearchEnginePanelProps {
  onSelectArticle?: (article: NewsArticle) => void;
  initialQuery?: string;
}

export const SearchEnginePanel: React.FC<SearchEnginePanelProps> = ({
  onSelectArticle,
  initialQuery = '',
}) => {
  const [activeTab, setActiveTab] = useState<'INSTANT_SEARCH' | 'ANALYTICS' | 'HISTORY'>('INSTANT_SEARCH');

  // Search Input & Query State
  const [query, setQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [selectedCountry, setSelectedCountry] = useState<string>('جميع الدول');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en' | 'all'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'views' | 'trustScore'>('relevance');

  // Results & Autocomplete State
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteGroup[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<SearchAnalyticsData>(searchEngineService.getSearchAnalytics());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Debounce search query input for Instant Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Execute Search whenever query or filters change
  useEffect(() => {
    const options: SearchOptions = {
      query: debouncedQuery,
      category: selectedCategory,
      country: selectedCountry,
      source: selectedSource,
      author: selectedAuthor,
      language: selectedLanguage,
      dateRange: selectedDateRange,
      sortBy: sortBy,
      page: 1,
      pageSize: 15,
    };

    const res = searchEngineService.search(options);
    setSearchResult(res);
    setSearchHistory(searchEngineService.getSearchHistory());
    setAnalyticsData(searchEngineService.getSearchAnalytics());
  }, [
    debouncedQuery,
    selectedCategory,
    selectedCountry,
    selectedSource,
    selectedAuthor,
    selectedLanguage,
    selectedDateRange,
    sortBy,
  ]);

  // Handle Input Changes & Autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 0) {
      const suggestions = searchEngineService.getAutocompleteSuggestions(val);
      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  // Close Autocomplete on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAutocomplete = (item: AutocompleteGroup) => {
    setQuery(item.value);
    setShowAutocomplete(false);
  };

  const handleClearQuery = () => {
    setQuery('');
    setDebouncedQuery('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleClearHistory = () => {
    searchEngineService.clearSearchHistory();
    setSearchHistory([]);
    setAnalyticsData(searchEngineService.getSearchAnalytics());
  };

  const handleRemoveHistoryItem = (itemQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    searchEngineService.removeSearchHistoryItem(itemQuery);
    setSearchHistory(searchEngineService.getSearchHistory());
    setAnalyticsData(searchEngineService.getSearchAnalytics());
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800/50 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full border border-indigo-500/30 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Advanced Enterprise Search Engine (NLP & Arabic Indexing)
            </span>
            <Badge variant="emerald">محدث فورياً (Instant Live)</Badge>
          </div>
          <h2 className="text-2xl font-black text-white">محرك البحث الشامل والمسترجع الذكي</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            بحث متقدم في العنوان، المحتوى، الملخص، الوسوم، الكاتب، والمصدر مع دعم التصحيح الإملائي، المرادفات، الإكمال التلقائي واكتشاف اللغات.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'INSTANT_SEARCH' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('INSTANT_SEARCH')}
            className="text-xs gap-2"
          >
            <Search className="w-4 h-4" />
            البحث الفوري
          </Button>
          <Button
            variant={activeTab === 'ANALYTICS' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('ANALYTICS')}
            className="text-xs gap-2"
          >
            <BarChart2 className="w-4 h-4" />
            تحليلات البحث ({analyticsData.totalSearches})
          </Button>
          <Button
            variant={activeTab === 'HISTORY' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('HISTORY')}
            className="text-xs gap-2"
          >
            <History className="w-4 h-4" />
            سجل البحث ({searchHistory.length})
          </Button>
        </div>
      </div>

      {/* Main Search Panel */}
      {activeTab === 'INSTANT_SEARCH' && (
        <div className="space-y-6">
          {/* Giant Search Input Box with Autocomplete */}
          <div className="relative">
            <div className="relative flex items-center">
              <div className="absolute right-4 text-indigo-400">
                <Search className="w-6 h-6" />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => {
                  if (query.trim().length > 0) setShowAutocomplete(true);
                  else if (searchHistory.length > 0) {
                    setAutocompleteSuggestions(searchEngineService.getAutocompleteSuggestions(''));
                    setShowAutocomplete(true);
                  }
                }}
                placeholder="ابحث عن خبر، عنوان، كاتب، مصدر، وسام، أو موضوع خاص..."
                className="w-full bg-slate-900 border-2 border-indigo-600/60 focus:border-indigo-400 rounded-2xl py-4 pr-14 pl-28 text-white placeholder-slate-400 font-bold text-base shadow-2xl focus:outline-none transition-all"
              />

              {query && (
                <button
                  onClick={handleClearQuery}
                  className="absolute left-16 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all"
                  title="مسح النص"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Live search metrics inside search bar */}
              {searchResult && (
                <div className="absolute left-4 hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-emerald-400 font-bold">{searchResult.totalResults} نتيجة</span>
                  <span>({searchResult.searchTimeMs}ms)</span>
                </div>
              )}
            </div>

            {/* Autocomplete Suggestions Overlay */}
            {showAutocomplete && autocompleteSuggestions.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute z-50 top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="bg-slate-950 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    الاقتراحات التلقائية والإكمال الفوري (Autocomplete)
                  </span>
                  <span>اضغط للاختيار السريع</span>
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                  {autocompleteSuggestions.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectAutocomplete(item)}
                      className="px-3 py-2 rounded-xl hover:bg-indigo-950/80 hover:border-indigo-500/50 border border-transparent cursor-pointer flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.type === 'history' && <History className="w-4 h-4 text-slate-400" />}
                        {item.type === 'title' && <FileText className="w-4 h-4 text-indigo-400" />}
                        {item.type === 'tag' && <Tag className="w-4 h-4 text-amber-400" />}
                        {item.type === 'category' && <Filter className="w-4 h-4 text-emerald-400" />}
                        {item.type === 'source' && <Globe className="w-4 h-4 text-sky-400" />}
                        {item.type === 'author' && <User className="w-4 h-4 text-rose-400" />}

                        <span className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-1">
                          {item.label}
                        </span>
                      </div>

                      <Badge variant="outline" className="text-[10px] opacity-70">
                        {item.type === 'title' && 'عنوان'}
                        {item.type === 'tag' && 'وسام'}
                        {item.type === 'category' && 'قسم'}
                        {item.type === 'source' && 'مصدر'}
                        {item.type === 'author' && 'كاتب'}
                        {item.type === 'history' && 'سابق'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Did You Mean / Spell Correction Alert */}
          {searchResult?.didYouMean && (
            <div className="bg-amber-950/60 border border-amber-800/80 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-200 shadow-md">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  هل تقصد:{' '}
                  <button
                    onClick={() => setQuery(searchResult.didYouMean!)}
                    className="font-bold text-white underline hover:text-amber-300 ml-1"
                  >
                    "{searchResult.didYouMean}"
                  </button>
                  ؟
                </span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setQuery(searchResult.didYouMean!)}
                className="text-[10px] border-amber-700 hover:bg-amber-900/50 text-white"
              >
                تطبيق التصحيح الإملائي
              </Button>
            </div>
          )}

          {/* Suggested Keyword Pills */}
          {searchResult?.suggestedKeywords && searchResult.suggestedKeywords.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                كلمات دلالية ذات صلة:
              </span>
              {searchResult.suggestedKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(kw)}
                  className="bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white px-3 py-1 rounded-full text-xs font-medium transition-all"
                >
                  #{kw}
                </button>
              ))}
            </div>
          )}

          {/* Advanced Multi-Field Filter Bar */}
          <Card className="bg-slate-900 border-slate-800 text-slate-100 p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                تصفية النتائج بحسب أبعاد البحث الفائق (Multi-Field Filters)
              </span>

              {(selectedCategory !== 'الكل' ||
                selectedCountry !== 'جميع الدول' ||
                selectedSource !== '' ||
                selectedAuthor !== '' ||
                selectedLanguage !== 'all' ||
                selectedDateRange !== 'all') && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setSelectedCategory('الكل');
                    setSelectedCountry('جميع الدول');
                    setSelectedSource('');
                    setSelectedAuthor('');
                    setSelectedLanguage('all');
                    setSelectedDateRange('all');
                  }}
                  className="text-[10px] gap-1 text-rose-400 border-rose-900/50 hover:bg-rose-950"
                >
                  <RotateCcw className="w-3 h-3" />
                  إعادة ضبط الفلاتر
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Category Filter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">التصنيف والقسم:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {NEWS_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">الدولة:</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {COUNTRIES.map((cnt, idx) => (
                    <option key={idx} value={cnt}>
                      {cnt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">لغة الخبر:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">جميع اللغات</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">الإنجليزية (English)</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">التاريخ والتوقيت:</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">كل الأوقات</option>
                  <option value="today">اليوم (24 ساعة)</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">ترتيب النتائج:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="relevance">حسب الأهمية والملاءمة</option>
                  <option value="date">حسب الأحدث تاريخاً</option>
                  <option value="views">حسب الأكثر قراءة</option>
                  <option value="trustScore">حسب درجة الموثوقية</option>
                </select>
              </div>

              {/* Author input filter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-bold">تصفية باسم الكاتب:</label>
                <input
                  type="text"
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  placeholder="اسم المحرر أو الكاتب..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Search Results Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                عُثر على <strong className="text-white">{searchResult?.totalResults || 0}</strong> خبر مطبق
                للمعايير
              </span>
              <span>وقت الاسترجاع: {searchResult?.searchTimeMs || 0} ملي ثانية</span>
            </div>

            {searchResult && searchResult.items.length > 0 ? (
              <div className="space-y-4">
                {searchResult.items.map((item, index) => (
                  <Card
                    key={item.article.id || index}
                    onClick={() => onSelectArticle && onSelectArticle(item.article)}
                    className="bg-slate-900 border-slate-800 hover:border-indigo-500/80 transition-all p-5 text-slate-100 cursor-pointer shadow-md group hover:shadow-xl space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="indigo">{item.article.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {item.article.country}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Globe className="w-3.5 h-3.5 text-sky-400" />
                          المصدر الرئيسي: {item.article.sources[0]?.name || 'وكالة أنباء'}
                        </span>
                        {item.article.author && (
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                            <User className="w-3 h-3 text-rose-400" />
                            الكاتب: {item.article.author}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          {item.article.viewsCount.toLocaleString()} مشاهدة
                        </span>
                        <span className="text-amber-400 font-bold">موثوقية {item.article.trustScore}%</span>
                        <span className="bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-800">
                          درجة التطابق: {item.relevanceScore}%
                        </span>
                      </div>
                    </div>

                    {/* Title with highlighted match */}
                    <h3
                      className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug"
                      dangerouslySetInnerHTML={{ __html: item.highlightedTitle }}
                    />

                    {/* Summary with highlighted match */}
                    <p
                      className="text-xs text-slate-300 line-clamp-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.highlightedSummary }}
                    />

                    {/* Matched Fields & Tags Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 font-bold">تطابق في الحقول:</span>
                        {item.matchedFields.map((f, fIdx) => (
                          <span
                            key={fIdx}
                            className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>نُشر: {item.article.publishDate}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900 border-slate-800 text-slate-400 p-12 text-center flex flex-col items-center justify-center space-y-3">
                <Search className="w-12 h-12 text-slate-600 mb-2" />
                <h4 className="text-base font-bold text-white">لم يتم العثور على نتائج مطابقة لـ "{query}"</h4>
                <p className="text-xs max-w-md">
                  جرّب تغيير كلمات البحث، أو إزالة بعض الفلاتر، أو الاستعانة بالكلمات المفتاحية المقترحة أعلاه.
                </p>
                <Button variant="outline" size="xs" onClick={handleClearQuery} className="mt-2 text-xs">
                  إعادة ضبط البحث
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'ANALYTICS' && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              إحصائيات وتحليلات محرك البحث (Search Analytics & Query Trends)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              مراقبة اتجاهات البحث، الكلمات الأكثر طلباً، زمن استجابة المحرك، والطلبات الخالية من النتائج لتطوير الفهرس.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 block">إجمالي عمليات البحث:</span>
              <strong className="text-2xl font-black text-white">{analyticsData.totalSearches} عملية</strong>
            </div>

            <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/80">
              <span className="text-xs text-emerald-300 block">متوسط زمن الاستجابة:</span>
              <strong className="text-2xl font-black text-emerald-400">{analyticsData.averageLatencyMs}ms</strong>
            </div>

            <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-800/80">
              <span className="text-xs text-indigo-300 block">الكلمة الأولى الأكثر بحثاً:</span>
              <strong className="text-lg font-black text-indigo-300 line-clamp-1">
                {analyticsData.topQueries[0]?.query || 'الذكاء الاصطناعي'}
              </strong>
            </div>

            <div className="bg-rose-950/60 p-4 rounded-xl border border-rose-800/80">
              <span className="text-xs text-rose-300 block">البحث بدون نتائج (Zero Results):</span>
              <strong className="text-2xl font-black text-rose-400">
                {analyticsData.zeroResultQueries.length} طلبات
              </strong>
            </div>
          </div>

          {/* Popular Queries Bar Chart */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-indigo-300 block">الكلمات والمصطلحات الأكثر شعبية واقتراحاً:</span>

            <div className="space-y-2.5">
              {analyticsData.topQueries.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{item.query}</span>
                    <span className="text-slate-400 font-mono">{item.count} مرة بحث</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* History Tab */}
      {activeTab === 'HISTORY' && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                سجل عمليات البحث الأخيرة (Search History)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                عرض وإدارة عمليات البحث السابقة الخاصة بك مع إمكانية إعادة تشغيل أي بحث بنقرة واحدة.
              </p>
            </div>

            {searchHistory.length > 0 && (
              <Button
                variant="outline"
                size="xs"
                onClick={handleClearHistory}
                className="text-xs text-rose-400 border-rose-900/50 hover:bg-rose-950 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                مسح السجل بالكامل
              </Button>
            )}
          </div>

          {searchHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {searchHistory.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(item);
                    setActiveTab('INSTANT_SEARCH');
                  }}
                  className="bg-slate-800/80 hover:bg-slate-800 p-3.5 rounded-xl border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-400 group-hover:text-amber-400 transition-colors" />
                    <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {item}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleRemoveHistoryItem(item, e)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-full hover:bg-slate-700 transition-colors"
                    title="حذف من السجل"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-slate-400 space-y-2">
              <History className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs">سجل البحث فارغ حالياً</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
