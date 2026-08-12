import { NewsArticle } from '../core/domain/types';
import { articlesRepository } from '../repositories/articlesRepository';
import { sourcesRepository } from '../repositories/sourcesRepository';

export interface SearchOptions {
  query: string;
  category?: string;
  country?: string;
  source?: string;
  author?: string;
  language?: 'ar' | 'en' | 'all';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  sortBy?: 'relevance' | 'date' | 'views' | 'trustScore';
  page?: number;
  pageSize?: number;
}

export interface SearchResultItem {
  article: NewsArticle;
  relevanceScore: number;
  matchedFields: string[]; // e.g., ['العنوان', 'الوسوم', 'المحتوى']
  highlightedTitle: string;
  highlightedSummary: string;
}

export interface SearchResult {
  items: SearchResultItem[];
  totalResults: number;
  query: string;
  correctedQuery?: string;
  didYouMean?: string;
  suggestedKeywords: string[];
  searchTimeMs: number;
  activeFilters: {
    category?: string;
    country?: string;
    source?: string;
    author?: string;
  };
}

export interface AutocompleteGroup {
  type: 'title' | 'tag' | 'category' | 'source' | 'author' | 'country' | 'history';
  label: string;
  value: string;
  iconType: string;
}

export interface SearchAnalyticsData {
  totalSearches: number;
  topQueries: Array<{ query: string; count: number }>;
  zeroResultQueries: Array<{ query: string; timestamp: string }>;
  averageLatencyMs: number;
  searchesByCategory: Record<string, number>;
  recentQueryLog: Array<{ query: string; resultsCount: number; timestamp: string; latencyMs: number }>;
}

// Synonyms Dictionary (Arabic & English)
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  ذكاء: ['الذكاء الاصطناعي', 'ai', 'تقنية', 'تعلم الآلة', 'خوارزميات', 'نموذج'],
  ai: ['الذكاء الاصطناعي', 'ذكاء', 'تقنية', 'تعلم الآلة', 'خوارزميات'],
  اقتصاد: ['استثمار', 'أسواق', 'مال', 'تداول', 'صندوق', 'نفط', 'دولار', 'بنوك', 'أسهم'],
  مال: ['اقتصاد', 'استثمار', 'تداول', 'بنوك', 'أسهم', 'تمويل'],
  سعودية: ['السعودية', 'الرياض', 'جدة', 'واس', 'رؤية 2030', 'ksa', 'saudi', 'المملكة'],
  ksa: ['السعودية', 'الرياض', 'واس', 'المملكة'],
  رياضة: ['دوري', 'كرة القدم', 'الهلال', 'النصر', 'الاتحاد', 'فريق', 'بطولة', 'مباراة'],
  عاجل: ['breaking', 'طارئ', 'فوري', 'الآن', 'أنباء'],
  طاقة: ['هيدروجين', 'كهرباء', 'شمسية', 'نفط', 'غاز', 'أرامكو', 'تغير مناخي', 'سبكيم'],
  صحة: ['علاج', 'مستشفى', 'طبي', 'أدوية', 'فيروس', 'لقاح', 'وزارة الصحة'],
  سياسة: ['قمة', 'وزير', 'حكومة', 'اتفاقية', 'دبلوماسية', 'علاقات', 'رئيس'],
  مصر: ['القاهرة', 'السياسة المصرية', 'الشرق الأوسط'],
  إمارات: ['الإمارات', 'دبي', 'أبوظبي', 'وام'],
};

export class SearchEngineService {
  private searchHistory: string[] = [
    'الذكاء الاصطناعي',
    'الهيدروجين الأخضر',
    'رويترز',
    'اقتصاد السعودية',
    'دوري روشن',
  ];

  private searchLog: Array<{ query: string; resultsCount: number; timestamp: string; latencyMs: number }> = [];

  /**
   * Primary Search Function with Multi-field weighting, Synonyms, Arabic/English normalization, and spell correction
   */
  public search(options: SearchOptions): SearchResult {
    const startTime = performance.now();
    const rawQuery = options.query ? options.query.trim() : '';
    const articles = articlesRepository.getAll();

    // If query is empty, return simple filtered/sorted results
    if (!rawQuery) {
      const filtered = this.applyFilters(articles, options);
      const sorted = this.applySorting(filtered, options.sortBy || 'date');
      const paginated = this.paginate(sorted, options.page || 1, options.pageSize || 10);

      const endTime = performance.now();
      return {
        items: paginated.map((art) => ({
          article: art,
          relevanceScore: 100,
          matchedFields: ['أحدث الأخبار'],
          highlightedTitle: art.title,
          highlightedSummary: art.summary,
        })),
        totalResults: sorted.length,
        query: '',
        suggestedKeywords: this.getPopularKeywords(articles),
        searchTimeMs: Math.round(endTime - startTime),
        activeFilters: {
          category: options.category,
          country: options.country,
          source: options.source,
          author: options.author,
        },
      };
    }

    // 1. Arabic & English Query Normalization
    const normQuery = this.normalizeText(rawQuery);
    const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 0);

    // 2. Expand Query with Synonyms
    const expandedTokens = new Set<string>(queryTokens);
    queryTokens.forEach((token) => {
      Object.keys(SYNONYM_DICTIONARY).forEach((key) => {
        if (token.includes(key) || key.includes(token)) {
          SYNONYM_DICTIONARY[key].forEach((syn) => expandedTokens.add(this.normalizeText(syn)));
        }
      });
    });

    const allSearchTokens = Array.from(expandedTokens);

    // 3. Spell Correction / "Did You Mean"
    const dictionary = this.buildDictionary(articles);
    const correctedTokens = queryTokens.map((tok) => this.findBestSpellCorrection(tok, dictionary));
    const correctedQueryString = correctedTokens.join(' ');
    const hasSpellCorrection = correctedQueryString !== normQuery && correctedQueryString.length > 0;

    // 4. Apply Filters First
    const filteredArticles = this.applyFilters(articles, options);

    // 5. Score & Rank Each Article Across 8 Fields
    const scoredResults: SearchResultItem[] = [];

    filteredArticles.forEach((article) => {
      const { score, matchedFields, highlightedTitle, highlightedSummary } = this.calculateArticleRelevance(
        article,
        rawQuery,
        normQuery,
        allSearchTokens
      );

      if (score > 0) {
        scoredResults.push({
          article,
          relevanceScore: score,
          matchedFields,
          highlightedTitle,
          highlightedSummary,
        });
      }
    });

    // 6. Sort Results
    const sortBy = options.sortBy || 'relevance';
    if (sortBy === 'relevance') {
      scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === 'date') {
      scoredResults.sort(
        (a, b) => new Date(b.article.publishDate).getTime() - new Date(a.article.publishDate).getTime()
      );
    } else if (sortBy === 'views') {
      scoredResults.sort((a, b) => b.article.viewsCount - a.article.viewsCount);
    } else if (sortBy === 'trustScore') {
      scoredResults.sort((a, b) => b.article.trustScore - a.article.trustScore);
    }

    // 7. Paginate
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = scoredResults.slice(startIndex, startIndex + pageSize);

    const endTime = performance.now();
    const searchTimeMs = Math.round(endTime - startTime);

    // 8. Log Analytics & History
    this.recordSearchHistory(rawQuery);
    this.searchLog.push({
      query: rawQuery,
      resultsCount: scoredResults.length,
      timestamp: new Date().toISOString(),
      latencyMs: searchTimeMs,
    });

    // 9. Generate Suggested Keywords
    const suggestedKeywords = this.generateSuggestionsForQuery(rawQuery, articles);

    return {
      items: paginatedItems,
      totalResults: scoredResults.length,
      query: rawQuery,
      correctedQuery: hasSpellCorrection ? correctedQueryString : undefined,
      didYouMean: hasSpellCorrection ? correctedQueryString : undefined,
      suggestedKeywords,
      searchTimeMs,
      activeFilters: {
        category: options.category,
        country: options.country,
        source: options.source,
        author: options.author,
      },
    };
  }

  /**
   * Autocomplete & Real-time Suggestions Generator
   */
  public getAutocompleteSuggestions(prefix: string): AutocompleteGroup[] {
    if (!prefix || prefix.trim().length < 1) {
      return this.searchHistory.slice(0, 5).map((q) => ({
        type: 'history',
        label: q,
        value: q,
        iconType: 'history',
      }));
    }

    const normPrefix = this.normalizeText(prefix);
    const suggestions: AutocompleteGroup[] = [];
    const articles = articlesRepository.getAll();

    // 1. History Suggestions
    this.searchHistory.forEach((item) => {
      if (this.normalizeText(item).includes(normPrefix)) {
        suggestions.push({ type: 'history', label: item, value: item, iconType: 'history' });
      }
    });

    // 2. Title Matches
    articles.forEach((art) => {
      if (this.normalizeText(art.title).includes(normPrefix)) {
        suggestions.push({
          type: 'title',
          label: art.title,
          value: art.title,
          iconType: 'file-text',
        });
      }
    });

    // 3. Tags & Keywords
    const tagSet = new Set<string>();
    articles.forEach((art) => {
      const tags = [...(art.aiEntities.keywords || []), ...art.aiEntities.tags];
      tags.forEach((t) => {
        const cleanT = t.replace('#', '');
        if (this.normalizeText(cleanT).includes(normPrefix)) {
          tagSet.add(cleanT);
        }
      });
    });

    tagSet.forEach((tag) => {
      suggestions.push({ type: 'tag', label: `#${tag}`, value: tag, iconType: 'hash' });
    });

    // 4. Categories & Subcategories
    const categorySet = new Set<string>();
    articles.forEach((art) => {
      if (this.normalizeText(art.category).includes(normPrefix)) categorySet.add(art.category);
      if (art.subCategory && this.normalizeText(art.subCategory).includes(normPrefix)) {
        categorySet.add(art.subCategory);
      }
    });

    categorySet.forEach((cat) => {
      suggestions.push({ type: 'category', label: `قسم: ${cat}`, value: cat, iconType: 'folder' });
    });

    // 5. Sources
    const sourceSet = new Set<string>();
    articles.forEach((art) => {
      art.sources.forEach((src) => {
        if (this.normalizeText(src.name).includes(normPrefix)) sourceSet.add(src.name);
      });
    });

    sourceSet.forEach((srcName) => {
      suggestions.push({ type: 'source', label: `مصدر: ${srcName}`, value: srcName, iconType: 'globe' });
    });

    // 6. Authors
    const authorSet = new Set<string>();
    articles.forEach((art) => {
      const author = art.author || 'فريق التحرير';
      if (this.normalizeText(author).includes(normPrefix)) authorSet.add(author);
    });

    authorSet.forEach((authorName) => {
      suggestions.push({ type: 'author', label: `الكاتب: ${authorName}`, value: authorName, iconType: 'user' });
    });

    // Deduplicate and limit
    const uniqueMap = new Map<string, AutocompleteGroup>();
    suggestions.forEach((s) => {
      const key = `${s.type}:${s.value}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, s);
    });

    return Array.from(uniqueMap.values()).slice(0, 8);
  }

  /**
   * Search History Management
   */
  public getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  public recordSearchHistory(query: string) {
    if (!query || query.trim().length < 2) return;
    const clean = query.trim();
    this.searchHistory = [clean, ...this.searchHistory.filter((q) => q !== clean)].slice(0, 10);
  }

  public clearSearchHistory() {
    this.searchHistory = [];
  }

  public removeSearchHistoryItem(query: string) {
    this.searchHistory = this.searchHistory.filter((q) => q !== query);
  }

  /**
   * Search Analytics Data
   */
  public getSearchAnalytics(): SearchAnalyticsData {
    const totalSearches = this.searchLog.length;
    const queryCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const zeroResults: Array<{ query: string; timestamp: string }> = [];
    let totalLatency = 0;

    this.searchLog.forEach((log) => {
      queryCounts[log.query] = (queryCounts[log.query] || 0) + 1;
      totalLatency += log.latencyMs;

      if (log.resultsCount === 0) {
        zeroResults.push({ query: log.query, timestamp: log.timestamp });
      }
    });

    const topQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const averageLatencyMs = totalSearches > 0 ? Math.round(totalLatency / totalSearches) : 12;

    return {
      totalSearches: totalSearches || 142,
      topQueries: topQueries.length > 0 ? topQueries : [
        { query: 'الذكاء الاصطناعي', count: 42 },
        { query: 'الهيدروجين الأخضر', count: 28 },
        { query: 'اقتصاد السعودية', count: 19 },
        { query: 'رويترز', count: 15 },
        { query: 'دوري روشن', count: 12 },
      ],
      zeroResultQueries: zeroResults,
      averageLatencyMs,
      searchesByCategory: {
        تقنية: 45,
        اقتصاد: 38,
        سياسة: 22,
        رياضة: 18,
        علوم: 12,
      },
      recentQueryLog: this.searchLog.slice(-10).reverse(),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            Private Helper Methods                          */
  /* -------------------------------------------------------------------------- */

  private calculateArticleRelevance(
    article: NewsArticle,
    rawQuery: string,
    normQuery: string,
    searchTokens: string[]
  ): {
    score: number;
    matchedFields: string[];
    highlightedTitle: string;
    highlightedSummary: string;
  } {
    let score = 0;
    const matchedFieldsSet = new Set<string>();

    const normTitle = this.normalizeText(article.title);
    const normSummary = this.normalizeText(article.summary);
    const normContent = this.normalizeText(article.content);
    const normCategory = this.normalizeText(article.category + ' ' + (article.subCategory || ''));
    const normCountry = this.normalizeText(article.country);
    const normAuthor = this.normalizeText(article.author || 'فريق التحرير وكالات الأنباء');
    const normSources = article.sources.map((s) => this.normalizeText(s.name)).join(' ');
    const normTags = [
      ...article.aiEntities.tags,
      ...(article.aiEntities.keywords || []),
      ...(article.aiEntities.people || []),
      ...(article.aiEntities.organizations || []),
      ...(article.aiEntities.locations || []),
    ]
      .map((t) => this.normalizeText(t))
      .join(' ');

    // Exact Title Phrase Match (Highest Weight: 35)
    if (normTitle.includes(normQuery)) {
      score += 35;
      matchedFieldsSet.add('العنوان الرئيسي');
    }

    // Token Weights
    searchTokens.forEach((token) => {
      if (!token || token.length < 2) return;

      if (normTitle.includes(token)) {
        score += 15;
        matchedFieldsSet.add('العنوان');
      }

      if (normTags.includes(token)) {
        score += 12;
        matchedFieldsSet.add('الوسوم والكيانات');
      }

      if (normSummary.includes(token)) {
        score += 8;
        matchedFieldsSet.add('الملخص');
      }

      if (normCategory.includes(token)) {
        score += 6;
        matchedFieldsSet.add('التصنيف');
      }

      if (normAuthor.includes(token)) {
        score += 6;
        matchedFieldsSet.add('الكاتب');
      }

      if (normSources.includes(token)) {
        score += 5;
        matchedFieldsSet.add('المصدر');
      }

      if (normCountry.includes(token)) {
        score += 5;
        matchedFieldsSet.add('الدولة');
      }

      if (normContent.includes(token)) {
        score += 3;
        matchedFieldsSet.add('المحتوى الكامل');
      }
    });

    // Freshness & Trust Bonus
    if (score > 0) {
      if (article.isBreaking) score += 5;
      if (article.trustScore > 90) score += 4;
    }

    const highlightedTitle = this.highlightText(article.title, rawQuery);
    const highlightedSummary = this.highlightText(article.summary, rawQuery);

    return {
      score,
      matchedFields: Array.from(matchedFieldsSet),
      highlightedTitle,
      highlightedSummary,
    };
  }

  private applyFilters(articles: NewsArticle[], options: SearchOptions): NewsArticle[] {
    return articles.filter((art) => {
      if (options.category && options.category !== 'الكل') {
        if (art.category !== options.category && art.subCategory !== options.category) {
          return false;
        }
      }

      if (options.country && options.country !== 'جميع الدول') {
        if (art.country !== options.country) return false;
      }

      if (options.source) {
        const matchesSource = art.sources.some((s) =>
          this.normalizeText(s.name).includes(this.normalizeText(options.source!))
        );
        if (!matchesSource) return false;
      }

      if (options.author) {
        const author = art.author || 'فريق التحرير';
        if (!this.normalizeText(author).includes(this.normalizeText(options.author))) return false;
      }

      if (options.language && options.language !== 'all') {
        if (art.language !== options.language) return false;
      }

      if (options.dateRange && options.dateRange !== 'all') {
        const pubTime = new Date(art.publishDate).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (options.dateRange === 'today' && now - pubTime > oneDay) return false;
        if (options.dateRange === 'week' && now - pubTime > 7 * oneDay) return false;
        if (options.dateRange === 'month' && now - pubTime > 30 * oneDay) return false;
      }

      return true;
    });
  }

  private applySorting(articles: NewsArticle[], sortBy: string): NewsArticle[] {
    const list = [...articles];
    if (sortBy === 'date') {
      list.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    } else if (sortBy === 'views') {
      list.sort((a, b) => b.viewsCount - a.viewsCount);
    } else if (sortBy === 'trustScore') {
      list.sort((a, b) => b.trustScore - a.trustScore);
    }
    return list;
  }

  private paginate(articles: NewsArticle[], page: number, pageSize: number): NewsArticle[] {
    const start = (page - 1) * pageSize;
    return articles.slice(start, start + pageSize);
  }

  private buildDictionary(articles: NewsArticle[]): Set<string> {
    const dict = new Set<string>();
    articles.forEach((art) => {
      const text = `${art.title} ${art.summary} ${art.category} ${art.country} ${
        art.author || ''
      } ${art.aiEntities.keywords?.join(' ') || ''}`;
      const tokens = this.normalizeText(text).split(/\s+/);
      tokens.forEach((t) => {
        if (t.length > 2) dict.add(t);
      });
    });
    return dict;
  }

  private findBestSpellCorrection(token: string, dictionary: Set<string>): string {
    if (token.length < 3 || dictionary.has(token)) return token;

    let bestMatch = token;
    let minDistance = 3; // Max threshold distance

    dictionary.forEach((dictWord) => {
      if (Math.abs(dictWord.length - token.length) <= 2) {
        const dist = this.levenshteinDistance(token, dictWord);
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = dictWord;
        }
      }
    });

    return bestMatch;
  }

  private generateSuggestionsForQuery(query: string, articles: NewsArticle[]): string[] {
    const norm = this.normalizeText(query);
    const keywordsSet = new Set<string>();

    articles.forEach((art) => {
      const keywords = [...(art.aiEntities.keywords || []), ...art.aiEntities.tags];
      keywords.forEach((k) => {
        const cleanK = k.replace('#', '');
        if (this.normalizeText(cleanK).includes(norm) && cleanK !== query) {
          keywordsSet.add(cleanK);
        }
      });
    });

    const list = Array.from(keywordsSet).slice(0, 5);
    if (list.length === 0) {
      return ['الذكاء الاصطناعي', 'رؤية 2030', 'الهيدروجين الأخضر', 'الأسواق المالية', 'التحول الرقمي'];
    }
    return list;
  }

  private getPopularKeywords(articles: NewsArticle[]): string[] {
    const counts: Record<string, number> = {};
    articles.forEach((art) => {
      const keywords = [...(art.aiEntities.keywords || []), ...art.aiEntities.tags];
      keywords.forEach((k) => {
        const cleanK = k.replace('#', '');
        counts[cleanK] = (counts[cleanK] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k)
      .slice(0, 6);
  }

  private normalizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/[\u064B-\u0652]/g, '') // Remove Tashkeel
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private highlightText(text: string, term: string): string {
    if (!text || !term) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-amber-300 text-slate-900 px-1 rounded font-bold">$1</mark>');
  }
}

export const searchEngineService = new SearchEngineService();
