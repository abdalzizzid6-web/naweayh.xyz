import { articlesRepository } from '../repositories/articlesRepository';
import { NewsArticle } from '../core';

export class BreakingNewsTicker {
  public static getActiveBreakingNews(): NewsArticle[] {
    const paginated = articlesRepository.getFilteredArticles('الكل', 'جميع الدول', '', true, false);
    return paginated.data;
  }
}
