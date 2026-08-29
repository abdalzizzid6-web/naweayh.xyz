import { articlesRepository } from '../repositories/articlesRepository';
import { sourcesRepository } from '../repositories/sourcesRepository';
import { socialChannelsRepository } from '../repositories/socialChannelsRepository';
import { auditRepository } from '../repositories/auditRepository';
import { BaseRepository, PaginatedResult, PaginationOptions } from '../repositories/baseRepository';
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
    const art = articlesRepository.getById(id);
    if (art) {
      articlesRepository.incrementView(id);
      this.recordReadingHistory(art);
    }
    return art;
  }

  public getBreakingNews(): NewsArticle[] {
    return articlesRepository.getFilteredArticles(undefined, undefined, undefined, true).data;
  }

  /**
   * Calculates Real-Time Trending News using Velocity Ranking Formula:
   * Score = (Views * 1.5 + Shares * 3 + Bookmarks * 2) / (HoursOld + 2)^1.2
   */
  public getTrendingNews(): NewsArticle[] {
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
   * Calculates Most Read Articles by View Count
   */
  public getMostReadNews(limit = 6): NewsArticle[] {
    return [...articlesRepository.getAll()]
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, limit);
  }

  public getSavedArticles(): NewsArticle[] {
    return articlesRepository.getAll().filter((a) => a.isBookmarked);
  }

  public recordReadingHistory(article: NewsArticle): void {
    const timeStr = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Avoid duplicate top entry
    this.readingHistory = [
      { article, readAt: timeStr },
      ...this.readingHistory.filter((item) => item.article.id !== article.id),
    ].slice(0, 50);
  }

  public getReadingHistory() {
    return this.readingHistory;
  }

  public clearReadingHistory() {
    this.readingHistory = [];
  }

  public getSources(): NewsSource[] {
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

  public async syncLatestFromApi(): Promise<NewsArticle[]> {
    try {
      const response = await fetch('/api/v1/news?limit=50');
      if (!response.ok) return [];
      const json = await response.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        for (const item of json.data) {
          if (!articlesRepository.getById(item.id) && !articlesRepository.getBySlug(item.slug)) {
            articlesRepository.add(item);
          }
        }
        return json.data;
      }
    } catch {
      // Fallback silently if offline or on initial render
    }
    return [];
  }

  public async getArticleBySlugOrIdAsync(slugOrId: string): Promise<NewsArticle | null> {
    try {
      const response = await fetch(`/api/v1/news/detail/${encodeURIComponent(slugOrId)}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const article = json.data as NewsArticle;
          this.recordReadingHistory(article);
          return article;
        }
      }
    } catch {
      // Fallback to local repo
    }
    const local = articlesRepository.getBySlug(slugOrId) || articlesRepository.getById(slugOrId);
    if (local) {
      articlesRepository.incrementView(local.id);
      this.recordReadingHistory(local);
    }
    return local;
  }

  public shareArticle(id: string): void {
    articlesRepository.incrementShare(id);
  }

  public toggleBookmark(id: string): boolean {
    return articlesRepository.toggleBookmark(id);
  }
}

export const newsService = new NewsService();
