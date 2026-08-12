import { pool } from '../db/connection';
import { FeedSourceConfig } from '../services/NewsIngestionService';

export class PgSourcesRepository {
  public async getActiveSources(): Promise<FeedSourceConfig[]> {
    const res = await pool.query(
      `SELECT id, name, name_arabic as "nameArabic", url, feed_url as "feedUrl", logo, 
              country, language, category, type, enabled, priority, trust_score as "trustScore", 
              fetch_interval as "fetchInterval", retry_count as "retryCount", 
              next_retry_at as "nextRetryAt", cooldown_until as "cooldownUntil"
       FROM news_sources 
       WHERE enabled = true AND (next_retry_at IS NULL OR next_retry_at <= CURRENT_TIMESTAMP)
       ORDER BY priority ASC, id ASC`
    );
    return res.rows;
  }
  
  public async getAllSources(): Promise<any[]> {
    const res = await pool.query(
      `SELECT *,
              name_arabic as "nameArabic",
              feed_url as "feedUrl",
              trust_score as "trustScore",
              fetch_interval as "fetchInterval",
              health_score as "healthScore",
              status_classification as "statusClassification",
              failure_reason as "failureReason",
              last_error as "lastError",
              last_checked_at as "lastCheckedAt",
              retry_count as "retryCount",
              next_retry_at as "nextRetryAt"
       FROM news_sources 
       ORDER BY priority ASC, id ASC`
    );
    return res.rows;
  }

  public async getSourcesStats(): Promise<{
    totalSources: number;
    activeSources: number;
    downSources: number;
    pausedSources: number;
    averageHealthScore: number;
    failureReasons: Record<string, number>;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as "total",
        COUNT(*) FILTER (WHERE enabled = TRUE AND (status_classification IS NULL OR status_classification != 'DOWN')) as "active",
        COUNT(*) FILTER (WHERE status_classification = 'DOWN') as "down",
        COUNT(*) FILTER (WHERE enabled = FALSE) as "paused",
        ROUND(AVG(COALESCE(health_score, 100)), 1) as "avgHealth",
        failure_reason,
        COUNT(failure_reason) as "reasonCount"
      FROM news_sources
      GROUP BY failure_reason
    `;

    const res = await pool.query(sql);
    let total = 0;
    let active = 0;
    let down = 0;
    let paused = 0;
    let avgHealth = 100;
    const failureReasons: Record<string, number> = {};

    for (const r of res.rows) {
      total = parseInt(r.total || '0', 10);
      active = parseInt(r.active || '0', 10);
      down = parseInt(r.down || '0', 10);
      paused = parseInt(r.paused || '0', 10);
      avgHealth = parseFloat(r.avgHealth || '100');
      if (r.failure_reason) {
        failureReasons[r.failure_reason] = parseInt(r.reasonCount || '0', 10);
      }
    }

    return {
      totalSources: total,
      activeSources: active,
      downSources: down,
      pausedSources: paused,
      averageHealthScore: avgHealth,
      failureReasons,
    };
  }

  public async updateLastFetched(sourceId: number, success: boolean): Promise<void> {
    if (success) {
      await pool.query(
        `UPDATE news_sources SET last_fetched_at = CURRENT_TIMESTAMP, last_success_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [sourceId]
      );
    } else {
      await pool.query(
        `UPDATE news_sources SET last_fetched_at = CURRENT_TIMESTAMP, last_error_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [sourceId]
      );
    }
  }
}

export const pgSourcesRepository = new PgSourcesRepository();
