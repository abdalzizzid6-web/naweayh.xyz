import { articlesRepository } from '../repositories/articlesRepository';
import { sourcesRepository } from '../repositories/sourcesRepository';
import { socialChannelsRepository } from '../repositories/socialChannelsRepository';
import { auditRepository } from '../repositories/auditRepository';
import { PaginatedResult, PaginationOptions } from '../repositories/baseRepository';
import { NewsArticle, NewsSource, SocialChannelConfig } from '../types';

export const NEWS_CATEGORIES = [
  'الكل',
  'اليمن',
  'العرب والعالم',
  'سياسة',
  'اقتصاد',
  'تقنية',
  'رياضة',
  'صحة',
  'علوم',
  'ثقافة',
  'سيارات',
  'فيديو'
];

export const COUNTRIES = [
  'جميع الدول',
  'اليمن',
  'السعودية',
  'الإمارات',
  'قطر',
  'الكويت',
  'عمان',
  'البحرين',
  'مصر',
  'الأردن',
  'عالمي'
];

export const YEMEN_REGIONS = [
  'صنعاء',
  'عدن',
  'تعز',
  'حضرموت',
  'مأرب',
  'الحديدة',
  'إب',
  'شبوة',
  'أبين',
  'الضالع',
  'لحج',
  'المهرة'
];

export interface UserPreferences {
  categories: string[];
  countries: string[];
  sources: string[];
  notificationsEnabled: boolean;
}

class NewsService {
  private readingHistory: { article: NewsArticle; readAt: string }[] = [];
  private articlesCache: Map<string, NewsArticle> = new Map();
  private breakingCache: NewsArticle[] = [];
  private trendingCache: NewsArticle[] = [];
  private mostReadCache: NewsArticle[] = [];
  private savedCache: NewsArticle[] = [];
  private sourcesCache: NewsSource[] = [];

  constructor() {
    this.loadHistoryFromLocalStorage();
  }

  private loadHistoryFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('user_reading_history');
        if (raw) {
          this.readingHistory = JSON.parse(raw);
        }
      }
    } catch {}
  }

  private saveHistoryToLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('user_reading_history', JSON.stringify(this.readingHistory.slice(0, 50)));
      }
    } catch {}
  }

  /**
   * Fetch paginated articles from PostgreSQL via Backend API (Source of Truth)
   */
  public async fetchArticles(
    category?: string,
    country?: string,
    search?: string,
    isBreaking?: boolean,
    isTrending?: boolean,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<NewsArticle>> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'الكل') params.append('category', category);
      if (country && country !== 'جميع الدول') params.append('country', country);
      if (search) params.append('search', search);
      if (isBreaking) params.append('isBreaking', 'true');
      if (isTrending) params.append('isTrending', 'true');
      if (pagination) {
        params.append('page', String(pagination.page || 1));
        params.append('limit', String(pagination.limit || 12));
      }

      const res = await fetch(`/api/v1/news?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          for (const item of json.data) {
            this.articlesCache.set(item.id, item);
            if (item.slug) this.articlesCache.set(item.slug, item);
            if (!articlesRepository.getById(item.id)) {
              articlesRepository.add(item);
            }
          }
          return {
            data: json.data,
            total: json.total || json.data.length,
            page: json.page || pagination?.page || 1,
            totalPages: json.totalPages || Math.ceil((json.total || json.data.length) / (pagination?.limit || 12)) || 1,
          };
        }
      }
    } catch (err) {
      console.warn('[NewsService.fetchArticles error, using repository fallback]:', err);
    }

    return articlesRepository.getFilteredArticles(category, country, search, isBreaking, isTrending, pagination);
  }

  /**
   * Synchronous getArticles for backwards compatibility with immediate renders
   */
  public getArticles(
    category?: string,
    country?: string,
    search?: string,
    isBreaking?: boolean,
    isTrending?: boolean,
    pagination?: PaginationOptions
  ): PaginatedResult<NewsArticle> {
    return articlesRepository.getFilteredArticles(category, country, search, isBreaking, isTrending, pagination);
  }

  public getArticleById(id: string): NewsArticle | null {
    const cached = this.articlesCache.get(id);
    if (cached) return cached;
    return articlesRepository.getById(id) || null;
  }

  /**
   * Fetch breaking news from PostgreSQL via Backend API
   */
  public async fetchBreakingNews(): Promise<NewsArticle[]> {
    try {
      const res = await fetch('/api/v1/news/breaking');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.breakingCache = json.data;
          for (const item of json.data) {
            this.articlesCache.set(item.id, item);
            if (!articlesRepository.getById(item.id)) articlesRepository.add(item);
          }
          return json.data;
        }
      }
    } catch {}
    return this.getBreakingNews();
  }

  public getBreakingNews(): NewsArticle[] {
    if (this.breakingCache.length > 0) return this.breakingCache;
    return articlesRepository.getFilteredArticles(undefined, undefined, undefined, true).data;
  }

  /**
   * Fetch trending news directly from PostgreSQL velocity calculation
   */
  public async fetchTrendingNews(): Promise<NewsArticle[]> {
    try {
      const res = await fetch('/api/v1/news/trending');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.trendingCache = json.data;
          for (const item of json.data) {
            this.articlesCache.set(item.id, item);
            if (!articlesRepository.getById(item.id)) articlesRepository.add(item);
          }
          return json.data;
        }
      }
    } catch {}
    return this.getTrendingNews();
  }

  public getTrendingNews(): NewsArticle[] {
    if (this.trendingCache.length > 0) return this.trendingCache;
    const all = articlesRepository.getAll();
    const now = new Date().getTime();

    const scored = all.map((article) => {
      const pubTime = new Date(article.publishDate).getTime() || now - 3600000;
      const hoursOld = Math.max(0.1, (now - pubTime) / (1000 * 3600));
      const score =
        (article.viewsCount * 1.5 + article.sharesCount * 3 + article.bookmarksCount * 2) /
        Math.pow(hoursOld + 2, 1.2);
      return { article, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((item) => item.article);
  }

  /**
   * Fetch most read news from PostgreSQL
   */
  public async fetchMostReadNews(limit = 6): Promise<NewsArticle[]> {
    try {
      const res = await fetch(`/api/v1/news/most-read?limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.mostReadCache = json.data;
          for (const item of json.data) {
            this.articlesCache.set(item.id, item);
            if (!articlesRepository.getById(item.id)) articlesRepository.add(item);
          }
          return json.data;
        }
      }
    } catch {}
    return this.getMostReadNews(limit);
  }

  public getMostReadNews(limit = 6): NewsArticle[] {
    if (this.mostReadCache.length > 0) return this.mostReadCache.slice(0, limit);
    return [...articlesRepository.getAll()]
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, limit);
  }

  /**
   * Fetch saved articles from PostgreSQL
   */
  public async fetchSavedArticles(): Promise<NewsArticle[]> {
    try {
      const res = await fetch('/api/v1/news/saved');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.savedCache = json.data;
          return json.data;
        }
      }
    } catch {}
    return this.getSavedArticles();
  }

  public getSavedArticles(): NewsArticle[] {
    if (this.savedCache.length > 0) return this.savedCache;
    return articlesRepository.getAll().filter((a) => a.isBookmarked);
  }

  public recordReadingHistory(article: NewsArticle): void {
    const timeStr = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    this.readingHistory = [
      { article, readAt: timeStr },
      ...this.readingHistory.filter((item) => item.article.id !== article.id),
    ].slice(0, 50);

    this.saveHistoryToLocalStorage();
  }

  public getReadingHistory() {
    return this.readingHistory;
  }

  public clearReadingHistory() {
    this.readingHistory = [];
    this.saveHistoryToLocalStorage();
  }

  /**
   * Sources Management -> PostgreSQL Backend
   */
  public async fetchSources(): Promise<NewsSource[]> {
    try {
      const res = await fetch('/api/v1/sources');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.sourcesCache = json.data;
          for (const s of json.data) {
            if (!sourcesRepository.getById(s.id)) sourcesRepository.add(s);
          }
          return json.data;
        }
      }
    } catch {}
    return this.getSources();
  }

  public getSources(): NewsSource[] {
    if (this.sourcesCache.length > 0) return this.sourcesCache;
    return sourcesRepository.getAll();
  }

  public addSource(source: NewsSource): NewsSource {
    const added = sourcesRepository.add(source);
    auditRepository.logAction(
      'System Admin',
      'System Admin',
      `إضافة مصدر إخباري جديد (${added.name})`,
      'NewsSource',
      `تمت إضافة المصدر بنجاح ببروتوكول ${added.type}`,
      'Success'
    );
    return added;
  }

  public deleteSource(id: string): boolean {
    const source = sourcesRepository.getById(id);
    const success = sourcesRepository.delete(id);
    if (success && source) {
      auditRepository.logAction(
        'System Admin',
        'System Admin',
        `حذف مصدر إخباري (${source.name})`,
        'NewsSource',
        `تم حذف المصدر نهائياً من النظام`,
        'Success'
      );
    }
    return success;
  }

  public toggleSourceStatus(id: string): NewsSource | null {
    const updated = sourcesRepository.toggleSourceStatus(id);
    if (updated) {
      auditRepository.logAction(
        'System Admin',
        'System Admin',
        `تحديث حالة مصدر الأخبار ${updated.name}`,
        'NewsSource',
        `تغيير الحالة إلى ${updated.status}`,
        'Success'
      );
    }
    return updated;
  }

  public getSocialChannels(): SocialChannelConfig[] {
    return socialChannelsRepository.getAll();
  }

  public toggleSocialChannel(id: string): SocialChannelConfig | null {
    const updated = socialChannelsRepository.toggleChannel(id);
    if (updated) {
      auditRepository.logAction(
        'Operations Lead',
        'Operations Lead',
        `تغيير إعدادات القناة الاجتماعية ${updated.platform}`,
        'SocialChannel',
        `تفعيل: ${updated.enabled}`,
        'Success'
      );
    }
    return updated;
  }

  /**
   * Sync all news streams from PostgreSQL
   */
  public async syncLatestFromApi(): Promise<NewsArticle[]> {
    try {
      const [articlesRes, breakingRes, trendingRes, mostReadRes, sourcesRes] = await Promise.allSettled([
        fetch('/api/v1/news?limit=50'),
        fetch('/api/v1/news/breaking'),
        fetch('/api/v1/news/trending'),
        fetch('/api/v1/news/most-read?limit=8'),
        fetch('/api/v1/sources'),
      ]);

      if (breakingRes.status === 'fulfilled' && breakingRes.value.ok) {
        const bJson = await breakingRes.value.json();
        if (bJson.success && Array.isArray(bJson.data)) {
          this.breakingCache = bJson.data;
          for (const item of bJson.data) this.articlesCache.set(item.id, item);
        }
      }

      if (trendingRes.status === 'fulfilled' && trendingRes.value.ok) {
        const tJson = await trendingRes.value.json();
        if (tJson.success && Array.isArray(tJson.data)) {
          this.trendingCache = tJson.data;
          for (const item of tJson.data) this.articlesCache.set(item.id, item);
        }
      }

      if (mostReadRes.status === 'fulfilled' && mostReadRes.value.ok) {
        const mJson = await mostReadRes.value.json();
        if (mJson.success && Array.isArray(mJson.data)) {
          this.mostReadCache = mJson.data;
          for (const item of mJson.data) this.articlesCache.set(item.id, item);
        }
      }

      if (sourcesRes.status === 'fulfilled' && sourcesRes.value.ok) {
        const sJson = await sourcesRes.value.json();
        if (sJson.success && Array.isArray(sJson.data)) {
          this.sourcesCache = sJson.data;
        }
      }

      if (articlesRes.status === 'fulfilled' && articlesRes.value.ok) {
        const json = await articlesRes.value.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          for (const item of json.data) {
            this.articlesCache.set(item.id, item);
            if (item.slug) this.articlesCache.set(item.slug, item);
            if (!articlesRepository.getById(item.id) && !articlesRepository.getBySlug(item.slug)) {
              articlesRepository.add(item);
            }
          }
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[syncLatestFromApi error]:', err);
    }
    return [];
  }

  /**
   * Fetch article by slug or id directly from PostgreSQL
   */
  public async getArticleBySlugOrIdAsync(slugOrId: string): Promise<NewsArticle | null> {
    try {
      const response = await fetch(`/api/v1/news/detail/${encodeURIComponent(slugOrId)}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const article = json.data as NewsArticle;
          this.articlesCache.set(article.id, article);
          if (article.slug) this.articlesCache.set(article.slug, article);
          this.recordReadingHistory(article);
          return article;
        }
      }
    } catch {}

    const local = articlesRepository.getBySlug(slugOrId) || articlesRepository.getById(slugOrId);
    if (local) {
      this.incrementView(local.id);
      this.recordReadingHistory(local);
    }
    return local || null;
  }

  /**
   * Track view count in PostgreSQL
   */
  public incrementView(id: string): void {
    const cached = this.articlesCache.get(id);
    if (cached) cached.viewsCount = (cached.viewsCount || 0) + 1;
    articlesRepository.incrementView(id);

    // Call PostgreSQL endpoint fire-and-forget
    fetch(`/api/v1/news/${encodeURIComponent(id)}/view`, { method: 'POST' }).catch(() => {});
  }

  /**
   * Track share count in PostgreSQL
   */
  public shareArticle(id: string): void {
    const cached = this.articlesCache.get(id);
    if (cached) cached.sharesCount = (cached.sharesCount || 0) + 1;
    articlesRepository.incrementShare(id);

    // Call PostgreSQL endpoint fire-and-forget
    fetch(`/api/v1/news/${encodeURIComponent(id)}/share`, { method: 'POST' }).catch(() => {});
  }

  /**
   * Toggle bookmark in PostgreSQL
   */
  public toggleBookmark(id: string): boolean {
    const cached = this.articlesCache.get(id);
    let newStatus = false;
    if (cached) {
      cached.isBookmarked = !cached.isBookmarked;
      newStatus = cached.isBookmarked;
    } else {
      newStatus = articlesRepository.toggleBookmark(id);
    }

    // Call PostgreSQL endpoint
    fetch(`/api/v1/news/${encodeURIComponent(id)}/save`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success && typeof data.saved === 'boolean') {
          if (cached) cached.isBookmarked = data.saved;
        }
      })
      .catch(() => {});

    return newStatus;
  }
}

export const newsService = new NewsService();
