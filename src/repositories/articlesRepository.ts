import { BaseRepository, PaginationOptions, PaginatedResult } from './baseRepository';
import { NewsArticle } from '../types';

const INITIAL_ARTICLES: NewsArticle[] = [];

export class ArticlesRepository extends BaseRepository<NewsArticle> {
  constructor() {
    super('safara90_news_articles_v1');
    this.seedIfEmpty();
  }

  private seedIfEmpty(): void {
    if (this.getStoredItems().length === 0) {
      this.setStoredItems(INITIAL_ARTICLES);
    }
  }

  public getFilteredArticles(
    categoryFilter?: string,
    countryFilter?: string,
    searchQuery?: string,
    isBreakingOnly?: boolean,
    isTrendingOnly?: boolean,
    options?: PaginationOptions
  ): PaginatedResult<NewsArticle> {
    let articles = this.getStoredItems();

    if (categoryFilter && categoryFilter !== 'الكل' && categoryFilter !== 'All') {
      articles = articles.filter((a) => a.category === categoryFilter);
    }

    if (countryFilter && countryFilter !== 'جميع الدول' && countryFilter !== 'All') {
      articles = articles.filter((a) => a.country === countryFilter || a.country === 'عالمي');
    }

    if (isBreakingOnly) {
      articles = articles.filter((a) => a.isBreaking);
    }

    if (isTrendingOnly) {
      articles = articles.filter((a) => a.isTrending);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.aiEntities.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.aiEntities.people.some((p) => p.toLowerCase().includes(q))
      );
    }

    // Sort by publishDate descending
    articles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    if (!options) {
      return {
        data: articles,
        total: articles.length,
        page: 1,
        totalPages: 1,
      };
    }

    const limit = Math.max(1, options.limit);
    const page = Math.max(1, options.page);
    const start = (page - 1) * limit;
    const paginatedData = articles.slice(start, start + limit);
    const totalPages = Math.ceil(articles.length / limit) || 1;

    return {
      data: paginatedData,
      total: articles.length,
      page,
      totalPages,
    };
  }

  public getBySlug(slug: string): NewsArticle | undefined {
    return this.getAll().find((a) => a.slug === slug);
  }

  public getBreakingNews(): NewsArticle[] {
    return this.getAll().filter((a) => a.isBreaking);
  }

  public getTrendingNews(): NewsArticle[] {
    return this.getAll().filter((a) => a.isTrending);
  }

  public getLatestNews(limit = 10): NewsArticle[] {
    return [...this.getAll()]
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, limit);
  }

  public incrementView(articleId: string): void {
    const article = this.getById(articleId);
    if (article) {
      this.update(articleId, { viewsCount: article.viewsCount + 1 });
    }
  }

  public incrementShare(articleId: string): void {
    const article = this.getById(articleId);
    if (article) {
      this.update(articleId, { sharesCount: article.sharesCount + 1 });
    }
  }

  public toggleBookmark(articleId: string): boolean {
    const article = this.getById(articleId);
    if (article) {
      this.update(articleId, { bookmarksCount: article.bookmarksCount + 1 });
      return true;
    }
    return false;
  }

  public save(article: NewsArticle): NewsArticle {
    const existing = this.getById(article.id);
    if (existing) {
      return this.update(article.id, article) || article;
    } else {
      return this.add(article);
    }
  }
}

export const articlesRepository = new ArticlesRepository();
