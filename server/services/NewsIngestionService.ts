import { pool } from '../db/connection';
import { adapterRegistry } from './adapters/AdapterRegistry';
import { httpClientService } from './HttpClientService';
import { storyClusteringService } from './StoryClusteringService';
import { contentExtractorService } from './ContentExtractorService';
import { sourceDiscoveryEngine } from './SourceDiscoveryEngine';
import { cacheService } from './CacheService';

// Prevent regional intermediate SSL certificate errors from blocking news ingestion
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export function getCanonicalUrl(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'source'];
    trackingParams.forEach(p => urlObj.searchParams.delete(p));
    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

export type FailureReason =
  | 'HTTP_ERROR'
  | 'TIMEOUT'
  | 'DNS_ERROR'
  | 'INVALID_RSS'
  | 'EMPTY_FEED'
  | 'BLOCKED'
  | 'REDIRECT'
  | 'TLS_ERROR'
  | 'PARSER_ERROR'
  | 'ROBOTS_RESTRICTION'
  | 'RATE_LIMIT'
  | 'SOURCE_DEPRECATED'
  | 'UNKNOWN';

export interface FeedSourceConfig {
  id: number;
  name: string;
  nameArabic: string;
  url: string;
  feedUrl: string;
  logo: string;
  country: string;
  language: string;
  category: string;
  type: string;
  enabled: boolean;
  priority: number;
  trustScore: number;
  fetchInterval: number;
  retryCount?: number;
  nextRetryAt?: Date;
  cooldownUntil?: Date;
}

export interface IngestedArticleDTO {
  title: string;
  slug: string;
  summary: string;
  content: string;
  formattedBody: string;
  coverImageUrl: string;
  author: string;
  sourceId: number;
  category: string;
  country: string;
  language: string;
  originalArticleUrl: string;
  canonicalUrl: string;
  contentClassification: string;
  contentOrigin: string;
  contentQualityScore: number;
  wordCount: number;
  paragraphCount: number;
  isFullContentAvailable: boolean;
  trustScore: number;
  sentiment: string;
  publishedAt: Date;
  status: string;
}

export interface IngestionLog {
  sourceId: number;
  sourceName: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  articlesFetched: number;
  newArticlesCount: number;
  duplicatesCount: number;
  failureReason?: FailureReason;
  error?: string;
  healthScore?: number;
}

export class NewsIngestionService {
  private logHistory: IngestionLog[] = [];

  /**
   * Exponential backoff next retry time calculator (1m, 5m, 15m, 30m, 1h, 6h, 24h)
   */
  public calculateNextRetry(retryCount: number): Date {
    const minutes = [1, 5, 15, 30, 60, 360, 1440];
    const idx = Math.min(retryCount, minutes.length - 1);
    const delayMs = minutes[idx] * 60 * 1000;
    return new Date(Date.now() + delayMs);
  }

  /**
   * Classifies error string into standard Phase 3.6 Failure Reason
   */
  public classifyFailureReason(errorMsg: string): FailureReason {
    const msg = (errorMsg || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('aborted')) return 'TIMEOUT';
    if (msg.includes('enotfound') || msg.includes('dns') || msg.includes('getaddrinfo')) return 'DNS_ERROR';
    if (msg.includes('403') || msg.includes('405') || msg.includes('waf') || msg.includes('blocked')) return 'BLOCKED';
    if (msg.includes('cert') || msg.includes('tls') || msg.includes('ssl')) return 'TLS_ERROR';
    if (msg.includes('http error')) return 'HTTP_ERROR';
    if (msg.includes('xml') || msg.includes('parser') || msg.includes('nested tags')) return 'PARSER_ERROR';
    if (msg.includes('empty feed')) return 'EMPTY_FEED';
    if (msg.includes('429') || msg.includes('rate limit')) return 'RATE_LIMIT';
    return 'UNKNOWN';
  }

  /**
   * Calculates health score (0 - 100) and status classification
   */
  public calculateSourceHealth(params: {
    successRate: number;
    latencyMs: number;
    articlesCount: number;
    hasRecentArticle: boolean;
    consecutiveErrors: number;
  }): { healthScore: number; statusClassification: string } {
    let score = Math.min(100, Math.max(0, params.successRate));

    // Latency penalty
    if (params.latencyMs > 3000) score -= 20;
    else if (params.latencyMs > 1500) score -= 10;

    // Consecutive errors penalty
    score -= Math.min(60, params.consecutiveErrors * 15);

    // Freshness reward
    if (params.hasRecentArticle) score = Math.min(100, score + 10);

    const healthScore = Math.max(0, Math.min(100, Math.round(score)));

    let statusClassification = 'EXCELLENT';
    if (healthScore < 25) statusClassification = 'DOWN';
    else if (healthScore < 50) statusClassification = 'POOR';
    else if (healthScore < 70) statusClassification = 'FAIR';
    else if (healthScore < 85) statusClassification = 'GOOD';

    return { healthScore, statusClassification };
  }

  private async fetchFeedContent(source: FeedSourceConfig): Promise<{
    rawData: string;
    finalUrl: string;
    responseTimeMs: number;
  }> {
    let domain = '';
    try {
      domain = source.url ? new URL(source.url).origin : new URL(source.feedUrl).origin;
    } catch {
      domain = source.feedUrl.replace(/^(https?:\/\/[^\/]+).*/, '$1');
    }

    const candidateUrls = [
      source.feedUrl,
      `${domain}/rss`,
      `${domain}/feed`,
      `${domain}/rss.xml`,
      `${domain}/ar/rss`,
      `${domain}/feed.xml`,
      `${domain}/rss/SectionRss?SectionID=203`,
      `${domain}/NewsRss.aspx?language=ar`,
      `${domain}/UI/Front/RSS.aspx`,
    ];

    const uniqueCandidates = Array.from(new Set(candidateUrls));
    let lastErr: Error | null = null;

    for (const candidateUrl of uniqueCandidates) {
      try {
        const res = await httpClientService.fetchWithRetry(candidateUrl, {
          timeoutMs: 8000,
          retryAttempts: 1,
        });

        if (res.ok && res.body.trim().length > 50) {
          if (candidateUrl !== source.feedUrl) {
            console.log(`[NewsIngestionEngine] Self-healing source ${source.nameArabic}: Updated feedUrl to ${candidateUrl}`);
            try {
              await pool.query(`UPDATE news_sources SET feed_url = $1, canonical_url = $2 WHERE id = $3`, [candidateUrl, res.finalUrl, source.id]);
            } catch {}
          }
          return { rawData: res.body, finalUrl: res.finalUrl, responseTimeMs: res.responseTimeMs };
        }
      } catch (err: any) {
        lastErr = err;
      }
    }

    // Dynamic discovery fallback
    try {
      const discoveredFeeds = await sourceDiscoveryEngine.discoverFromUrl(source.url);
      if (discoveredFeeds && discoveredFeeds.length > 0) {
        for (const candidate of discoveredFeeds) {
          try {
            const res = await httpClientService.fetchWithRetry(candidate.feedUrl, { timeoutMs: 6000, retryAttempts: 1 });
            if (res.ok && res.body.trim().length > 50) {
              console.log(`[NewsIngestionEngine] Discovered working feed for ${source.nameArabic}: ${candidate.feedUrl}`);
              try {
                await pool.query(`UPDATE news_sources SET feed_url = $1 WHERE id = $2`, [candidate.feedUrl, source.id]);
              } catch {}
              return { rawData: res.body, finalUrl: res.finalUrl, responseTimeMs: res.responseTimeMs };
            }
          } catch {}
        }
      }
    } catch {}

    // HTML Fallback scraper
    try {
      if (source.url && source.url.startsWith('http')) {
        const res = await httpClientService.fetchWithRetry(source.url, { timeoutMs: 8000, retryAttempts: 1 });
        if (res.ok && res.body.length > 100) {
          const adapter = adapterRegistry.selectAdapter('HTML_SCRAPE', source.url, res.body);
          const scrapedItems = adapter.parseItems(res.body, source.url);
          if (scrapedItems.length > 0) {
            const itemsXml = scrapedItems
              .map(
                (i) => `<item>
                  <title><![CDATA[${i.title}]]></title>
                  <link>${i.link}</link>
                  <description><![CDATA[${i.summary || i.title}]]></description>
                  <pubDate>${new Date().toUTCString()}</pubDate>
                </item>`
              )
              .join('\n');

            const syntheticXml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title><![CDATA[${source.nameArabic}]]></title><link>${source.url}</link>${itemsXml}</channel></rss>`;
            return { rawData: syntheticXml, finalUrl: source.url, responseTimeMs: res.responseTimeMs };
          }
        }
      }
    } catch {}

    throw lastErr || new Error('All candidate feed endpoints failed');
  }

  public async fetchAndIngestSource(source: FeedSourceConfig): Promise<IngestionLog> {
    const startTime = Date.now();
    const startedAt = new Date().toISOString();
    console.log(`[NewsIngestionEngine] Executing Pipeline for: ${source.nameArabic} (${source.feedUrl})`);

    let articlesFetched = 0;
    let newArticlesCount = 0;
    let duplicatesCount = 0;
    let errorMessage: string | undefined = undefined;
    let failureReason: FailureReason | undefined = undefined;

    try {
      if (!source.feedUrl || !source.feedUrl.startsWith('http')) {
        throw new Error('Invalid feed URL scheme');
      }

      // STAGE 1: FETCH
      const { rawData, finalUrl, responseTimeMs } = await this.fetchFeedContent(source);

      // STAGE 2: ADAPTER PARSING
      const { items, adapterUsed } = adapterRegistry.parseWithBestAdapter(rawData, source.type, source.feedUrl);
      articlesFetched = items.length;

      if (articlesFetched === 0) {
        throw new Error('EMPTY_FEED: No valid articles found in feed payload');
      }

      // STAGE 3 to 10: PROCESSING & INSERTION
      let hasRecentArticle = false;

      for (const item of items) {
        const rawTitle = item.title.trim();
        const originalUrl = item.link || source.url;
        const canonicalUrl = getCanonicalUrl(originalUrl);

        const slug =
          rawTitle
            .replace(/[\s\u0600-\u06FF]+/g, '-')
            .replace(/[^\w-]/g, '')
            .toLowerCase()
            .slice(0, 60) +
          '-' +
          Math.abs(canonicalUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString(36);

        const publishedDate = item.pubDate ? new Date(item.pubDate) : new Date();
        if (Date.now() - publishedDate.getTime() < 24 * 60 * 60 * 1000) {
          hasRecentArticle = true;
        }

        const extracted = contentExtractorService.extractFromFeedItem(item.content || '', item.summary || '', canonicalUrl, {
          coverImage: item.coverImage,
          author: item.author,
          publishedAt: publishedDate,
        });

        const summary = extracted.summary || rawTitle;
        const fullContent = item.content || item.summary || summary;
        const formattedBody = extracted.formattedBody;

        const articleDto: IngestedArticleDTO = {
          title: rawTitle,
          slug,
          summary,
          content: fullContent,
          formattedBody,
          coverImageUrl: item.coverImage || source.logo || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
          author: item.author || 'فريق التحرير',
          sourceId: source.id,
          category: (item.categories && item.categories[0]) || source.category || 'أخبار عامة',
          country: source.country || 'اليمن',
          language: source.language || 'ar',
          originalArticleUrl: originalUrl,
          canonicalUrl,
          contentClassification: extracted.contentClassification,
          contentOrigin: extracted.contentOrigin,
          contentQualityScore: extracted.contentQualityScore,
          wordCount: extracted.wordCount,
          paragraphCount: extracted.paragraphCount,
          isFullContentAvailable: extracted.isFullContentAvailable,
          trustScore: source.trustScore || 90,
          sentiment: 'Neutral',
          publishedAt: publishedDate,
          status: 'PUBLISHED',
        };

        try {
          const insertRes = await pool.query(
            `INSERT INTO news_articles (
              title, slug, summary, content, formatted_body, cover_image_url,
              author, source_id, category, country, language, original_article_url, canonical_url,
              content_classification, content_origin, content_quality_score, word_count, paragraph_count,
              is_full_content_available, trust_score, sentiment, reading_time_minutes, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            ON CONFLICT (slug) DO NOTHING
            RETURNING id`,
            [
              articleDto.title,
              articleDto.slug,
              articleDto.summary,
              articleDto.content,
              articleDto.formattedBody,
              articleDto.coverImageUrl,
              articleDto.author,
              articleDto.sourceId,
              articleDto.category,
              articleDto.country,
              articleDto.language,
              articleDto.originalArticleUrl,
              articleDto.canonicalUrl,
              articleDto.contentClassification,
              articleDto.contentOrigin,
              articleDto.contentQualityScore,
              articleDto.wordCount,
              articleDto.paragraphCount,
              articleDto.isFullContentAvailable,
              articleDto.trustScore,
              articleDto.sentiment,
              extracted.readingTimeMinutes,
              articleDto.publishedAt,
            ]
          );

          if (insertRes.rowCount && insertRes.rowCount > 0) {
            newArticlesCount++;
            const newArticleId = insertRes.rows[0].id;

            try {
              await storyClusteringService.processArticleForClustering({
                id: newArticleId,
                title: rawTitle,
                summary,
                category: articleDto.category,
                country: articleDto.country,
                sourceId: source.id,
                publishedAt: articleDto.publishedAt.toISOString(),
              });
            } catch {}
          } else {
            duplicatesCount++;
          }
        } catch {
          duplicatesCount++;
        }
      }

      // Success Updates
      const durationMs = Date.now() - startTime;
      const { healthScore, statusClassification } = this.calculateSourceHealth({
        successRate: 100,
        latencyMs: responseTimeMs,
        articlesCount: articlesFetched,
        hasRecentArticle,
        consecutiveErrors: 0,
      });

      try {
        await pool.query(
          `UPDATE news_sources 
           SET last_fetched_at = CURRENT_TIMESTAMP, 
               last_success_at = CURRENT_TIMESTAMP,
               last_checked_at = CURRENT_TIMESTAMP,
               retry_count = 0,
               next_retry_at = NULL,
               failure_reason = NULL,
               last_error = NULL,
               response_time_ms = $1,
               average_latency_ms = $1,
               articles_fetched = articles_fetched + $2,
               articles_inserted = articles_inserted + $3,
               articles_duplicate = articles_duplicate + $4,
               success_rate = 100.00,
               health_score = $5,
               status_classification = $6,
               canonical_url = $7
           WHERE id = $8`,
          [responseTimeMs, articlesFetched, newArticlesCount, duplicatesCount, healthScore, statusClassification, finalUrl, source.id]
        );
      } catch {}

      cacheService.invalidate('news');

    } catch (err: any) {
      errorMessage = err.message || 'Unknown ingestion failure';
      failureReason = this.classifyFailureReason(errorMessage);
      const currentRetries = (source.retryCount || 0) + 1;
      const nextRetryAt = this.calculateNextRetry(currentRetries);

      const { healthScore, statusClassification } = this.calculateSourceHealth({
        successRate: 20,
        latencyMs: 3000,
        articlesCount: 0,
        hasRecentArticle: false,
        consecutiveErrors: currentRetries,
      });

      console.warn(`[NewsIngestionEngine] Failure for ${source.nameArabic} [Reason: ${failureReason}]: ${errorMessage}`);

      try {
        await pool.query(
          `UPDATE news_sources 
           SET last_error_at = CURRENT_TIMESTAMP, 
               last_checked_at = CURRENT_TIMESTAMP,
               last_error = $1, 
               failure_reason = $2,
               retry_count = $3,
               next_retry_at = $4,
               success_rate = GREATEST(0, success_rate - 20),
               health_score = $5,
               status_classification = $6
           WHERE id = $7`,
          [errorMessage, failureReason, currentRetries, nextRetryAt, healthScore, statusClassification, source.id]
        );
      } catch {}
    }

    const durationMs = Date.now() - startTime;
    const completedAt = new Date().toISOString();

    const log: IngestionLog = {
      sourceId: source.id,
      sourceName: source.nameArabic,
      status: errorMessage ? (newArticlesCount > 0 ? 'PARTIAL' : 'FAILED') : 'SUCCESS',
      startedAt,
      completedAt,
      durationMs,
      articlesFetched,
      newArticlesCount,
      duplicatesCount,
      failureReason,
      error: errorMessage,
    };

    this.logHistory.unshift(log);
    this.logHistory = this.logHistory.slice(0, 100);

    return log;
  }

  public getIngestionLogs(): IngestionLog[] {
    return this.logHistory;
  }
}

export const newsIngestionService = new NewsIngestionService();
