import { pool } from '../db/connection';

export interface CursorPaginatedArticles {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

export class PgArticlesRepository {
  public async getLatestArticles(limit: number = 20, offset: number = 0): Promise<any[]> {
    const res = await pool.query(
      `SELECT a.*, s.name as "sourceName", s.name_arabic as "sourceNameArabic", s.logo as "sourceLogo", s.country as "sourceCountry"
       FROM news_articles a
       LEFT JOIN news_sources s ON a.source_id = s.id
       ORDER BY a.published_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }

  /**
   * Fetch single article by slug or id from PostgreSQL
   */
  public async getArticleBySlugOrId(slugOrId: string): Promise<any | null> {
    const res = await pool.query(
      `SELECT a.*, s.name as "sourceName", s.name_arabic as "sourceNameArabic", s.logo as "sourceLogo", s.country as "sourceCountry"
       FROM news_articles a
       LEFT JOIN news_sources s ON a.source_id = s.id
       WHERE a.slug = $1 OR a.id::text = $1
       LIMIT 1`,
      [slugOrId]
    );
    return res.rows[0] || null;
  }

  /**
   * Cursor-based pagination (NO OFFSET) for high-performance scale
   */
  public async getLatestArticlesCursor(params: {
    limit?: number;
    cursor?: string; // ISO timestamp or article ID
    category?: string;
    country?: string;
    isBreaking?: boolean;
    minQualityScore?: number;
  }): Promise<CursorPaginatedArticles> {
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (params.cursor) {
      conditions.push(`a.published_at < $${paramIdx++}`);
      values.push(params.cursor);
    }

    if (params.category && params.category !== 'جميع القطاعات' && params.category !== 'الكل') {
      conditions.push(`a.category = $${paramIdx++}`);
      values.push(params.category);
    }

    if (params.country && params.country !== 'جميع الدول' && params.country !== 'الكل') {
      conditions.push(`a.country = $${paramIdx++}`);
      values.push(params.country);
    }

    if (params.isBreaking) {
      conditions.push(`a.is_breaking = TRUE`);
    }

    if (params.minQualityScore && params.minQualityScore > 0) {
      conditions.push(`a.content_quality_score >= $${paramIdx++}`);
      values.push(params.minQualityScore);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit + 1); // fetch +1 to determine hasMore

    const sql = `
      SELECT a.*, s.name as "sourceName", s.name_arabic as "sourceNameArabic", s.logo as "sourceLogo", s.country as "sourceCountry"
      FROM news_articles a
      LEFT JOIN news_sources s ON a.source_id = s.id
      ${whereClause}
      ORDER BY a.published_at DESC, a.id DESC
      LIMIT $${paramIdx}
    `;

    const res = await pool.query(sql, values);
    const hasMore = res.rows.length > limit;
    const items = hasMore ? res.rows.slice(0, limit) : res.rows;
    const lastItem = items[items.length - 1];
    const nextCursor = lastItem && lastItem.published_at ? new Date(lastItem.published_at).toISOString() : null;

    return {
      items,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
    };
  }

  /**
   * Freshness metrics calculation (articles per 1h, 6h, 24h, 7d)
   */
  public async getFreshnessMetrics(): Promise<{
    articlesLast1h: number;
    articlesLast6h: number;
    articlesLast24h: number;
    articlesLast7d: number;
    lastArticleTimestamp: string | null;
  }> {
    const sql = `
      SELECT 
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '1 hour') as "last1h",
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '6 hours') as "last6h",
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '24 hours') as "last24h",
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as "last7d",
        MAX(published_at) as "latestArticle"
      FROM news_articles
    `;

    const res = await pool.query(sql);
    const row = res.rows[0] || {};

    return {
      articlesLast1h: parseInt(row.last1h || '0', 10),
      articlesLast6h: parseInt(row.last6h || '0', 10),
      articlesLast24h: parseInt(row.last24h || '0', 10),
      articlesLast7d: parseInt(row.last7d || '0', 10),
      lastArticleTimestamp: row.latestArticle ? new Date(row.latestArticle).toISOString() : null,
    };
  }

  /**
   * Network Source Map metrics grouped by country
   */
  public async getSourceMapMetrics(): Promise<Array<{
    country: string;
    totalSources: number;
    activeSources: number;
    downSources: number;
    totalArticles: number;
    avgHealthScore: number;
  }>> {
    const sql = `
      SELECT 
        s.country,
        COUNT(DISTINCT s.id) as "totalSources",
        COUNT(DISTINCT s.id) FILTER (WHERE s.enabled = TRUE AND (s.status_classification IS NULL OR s.status_classification != 'DOWN')) as "activeSources",
        COUNT(DISTINCT s.id) FILTER (WHERE s.status_classification = 'DOWN') as "downSources",
        COALESCE(COUNT(a.id), 0) as "totalArticles",
        ROUND(AVG(COALESCE(s.health_score, 100)), 1) as "avgHealthScore"
      FROM news_sources s
      LEFT JOIN news_articles a ON a.source_id = s.id
      GROUP BY s.country
      ORDER BY "totalArticles" DESC, "totalSources" DESC
    `;

    const res = await pool.query(sql);
    return res.rows.map((r) => ({
      country: r.country,
      totalSources: parseInt(r.totalSources || '0', 10),
      activeSources: parseInt(r.activeSources || '0', 10),
      downSources: parseInt(r.downSources || '0', 10),
      totalArticles: parseInt(r.totalArticles || '0', 10),
      avgHealthScore: parseFloat(r.avgHealthScore || '100'),
    }));
  }
}

export const pgArticlesRepository = new PgArticlesRepository();
