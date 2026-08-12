import { articlesRepository } from '../repositories/articlesRepository';
import { sourcesRepository } from '../repositories/sourcesRepository';
import { aiEngineService } from '../ai-engine/AIEngineService';
import { duplicateDetectionEngine, IngestionDeduplicationReport, BatchIngestionResult } from './DuplicateDetectionEngine';
import { NewsArticle } from '../core';

export class NewsAggregationService {
  public async ingestRawArticle(
    title: string,
    rawText: string,
    sourceId: string,
    category: string = 'عام',
    country: string = 'السعودية'
  ): Promise<NewsArticle> {
    const report = await duplicateDetectionEngine.processAndDeduplicate(
      title,
      rawText,
      sourceId,
      category,
      country
    );
    return report.targetArticle;
  }

  public async ingestRawArticleWithReport(
    title: string,
    rawText: string,
    sourceId: string,
    category: string = 'عام',
    country: string = 'السعودية'
  ): Promise<IngestionDeduplicationReport> {
    return duplicateDetectionEngine.processAndDeduplicate(
      title,
      rawText,
      sourceId,
      category,
      country
    );
  }

  public async batchIngestArticles(
    items: Array<{ title: string; text: string; sourceId: string; category?: string; country?: string }>
  ): Promise<BatchIngestionResult> {
    return duplicateDetectionEngine.processBatchArticles(items);
  }
}

export const newsAggregationService = new NewsAggregationService();

