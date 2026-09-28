import { pool } from '../db/connection';
import { newsIngestionService, FeedSourceConfig } from '../services/NewsIngestionService';

export class NewsSchedulerWorker {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private intervalMs = 5 * 60 * 1000; // Default 5 minutes

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[NewsSchedulerWorker] Started. Polling news sources every ${this.intervalMs / 1000}s`);

    // Run initial ingestion check
    this.runIngestionCycle();

    // Schedule recurring interval
    this.timer = setInterval(() => {
      this.runIngestionCycle();
    }, this.intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[NewsSchedulerWorker] Stopped.');
  }

  public async runIngestionCycle() {
    try {
      console.log('[NewsSchedulerWorker] Running scheduled news ingestion cycle with bounded parallelism...');
      const res = await pool.query(
        `SELECT * FROM news_sources 
         WHERE enabled = true 
           AND (cooldown_until IS NULL OR cooldown_until <= NOW())
           AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY priority DESC, id ASC`
      );

      const sources: FeedSourceConfig[] = res.rows.map(row => ({
        id: row.id,
        name: row.name,
        nameArabic: row.name_arabic,
        url: row.url,
        feedUrl: row.feed_url,
        logo: row.logo,
        country: row.country,
        language: row.language,
        category: row.category,
        type: row.type,
        enabled: row.enabled,
        priority: row.priority,
        trustScore: row.trust_score,
        fetchInterval: row.fetch_interval,
        retryCount: row.retry_count || 0,
        nextRetryAt: row.next_retry_at,
        cooldownUntil: row.cooldown_until,
      }));

      if (sources.length === 0) {
        console.log('[NewsSchedulerWorker] No eligible sources need ingestion currently.');
        return;
      }

      // Bounded Concurrency: maximum 3 parallel sources at any given moment
      const CONCURRENCY_LIMIT = 3;
      let activeIndex = 0;

      const worker = async (): Promise<void> => {
        while (activeIndex < sources.length) {
          const currentIndex = activeIndex++;
          const source = sources[currentIndex];
          try {
            const log = await newsIngestionService.fetchAndIngestSource(source);
            if (log.status === 'SUCCESS' || log.status === 'PARTIAL') {
              // Reset retry count on success
              await pool.query(
                `UPDATE news_sources SET retry_count = 0, next_retry_at = NULL, failure_reason = NULL WHERE id = $1`,
                [source.id]
              ).catch(() => {});
            } else {
              // Calculate exponential backoff on failure (min 2 mins, max 2 hours)
              const nextRetries = (source.retryCount || 0) + 1;
              const backoffMinutes = Math.min(120, Math.pow(2, Math.min(nextRetries, 6)));
              await pool.query(
                `UPDATE news_sources 
                 SET retry_count = $1, 
                     next_retry_at = NOW() + ($2 || ' minutes')::INTERVAL, 
                     failure_reason = $3 
                 WHERE id = $4`,
                [nextRetries, backoffMinutes, log.failureReason || 'UNKNOWN', source.id]
              ).catch(() => {});
            }
          } catch (sourceErr: any) {
            console.error(`[NewsSchedulerWorker] Ingestion error on ${source.nameArabic}:`, sourceErr.message || sourceErr);
            const nextRetries = (source.retryCount || 0) + 1;
            const backoffMinutes = Math.min(120, Math.pow(2, Math.min(nextRetries, 6)));
            await pool.query(
              `UPDATE news_sources 
               SET retry_count = $1, 
                   next_retry_at = NOW() + ($2 || ' minutes')::INTERVAL, 
                   failure_reason = 'UNKNOWN' 
               WHERE id = $3`,
              [nextRetries, backoffMinutes, source.id]
            ).catch(() => {});
          }
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, sources.length) }, () => worker());
      await Promise.all(workers);

      console.log(`[NewsSchedulerWorker] Ingestion cycle completed for ${sources.length} sources (Concurrency: ${CONCURRENCY_LIMIT}).`);
    } catch (err) {
      console.error('[NewsSchedulerWorker] Database error during ingestion cycle:', err);
    }
  }
}

export const newsSchedulerWorker = new NewsSchedulerWorker();
