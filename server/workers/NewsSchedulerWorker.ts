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

  private async runIngestionCycle() {
    try {
      console.log('[NewsSchedulerWorker] Running scheduled news ingestion cycle...');
      const res = await pool.query('SELECT * FROM news_sources WHERE enabled = true');
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
      }));

      for (const source of sources) {
        try {
          await newsIngestionService.fetchAndIngestSource(source);
        } catch (sourceErr) {
          console.error(`[NewsSchedulerWorker] Failed to fetch source ${source.nameArabic}:`, sourceErr);
        }
      }
      console.log(`[NewsSchedulerWorker] Cycle completed successfully for ${sources.length} sources.`);
    } catch (err) {
      console.error('[NewsSchedulerWorker] Database error during ingestion cycle:', err);
    }
  }
}

export const newsSchedulerWorker = new NewsSchedulerWorker();
