import { pool } from '../db/connection';

export interface CursorPaginatedArticles {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

export class PgArticlesRepository {
  public async getFilteredArticles(params: {
    category?: string;
    search?: string;
    country?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (params.category && params.category !== 'الكل') {
        conditions.push(`a.category = $${idx}`);
        values.push(params.category);
        idx++;
      }
      if (params.country && params.country !== 'جميع الدول') {
        conditions.push(`s.country = $${idx}`);
        values.push(params.country);
        idx++;
      }
      if (params.search) {
        conditions.push(`(a.title ILIKE $${idx} OR a.summary ILIKE $${idx})`);
        values.push(`%${params.search}%`);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await pool.query(
        `SELECT COUNT(*) as count FROM news_articles a LEFT JOIN news_sources s ON a.source_id = s.id ${whereClause}`,
        values
      );
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      const limit = params.limit || 20;
      const offset = params.offset || 0;
      values.push(limit, offset);

      const query = `
        SELECT a.*, s.name as "sourceName", s.name_arabic as "sourceNameArabic", s.logo as "sourceLogo", s.country as "sourceCountry"
        FROM news_articles a
        LEFT JOIN news_sources s ON a.source_id = s.id
        ${whereClause}
        ORDER BY a.published_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      const res = await pool.query(query, values);
      return { data: res.rows, total };
    } catch (err) {
      console.warn('[pgArticlesRepository.getFilteredArticles error]:', err);
      return { data: [], total: 0 };
    }
  }

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
   * Increment article view count in PostgreSQL with rate-limiting / deduplication window.
   */
  public async incrementView(
    articleId: string | number,
    viewerHash?: string
  ): Promise<{ viewsCount: number; deduplicated: boolean }> {
    const isNum = !isNaN(Number(articleId));
    const findSql = isNum
      ? `SELECT id, views_count FROM news_articles WHERE id = $1`
      : `SELECT id, views_count FROM news_articles WHERE slug = $1 OR id::text = $1`;
    const findRes = await pool.query(findSql, [isNum ? Number(articleId) : articleId]);
    if (findRes.rows.length === 0) {
      return { viewsCount: 0, deduplicated: false };
    }
    const realId = findRes.rows[0].id;
    const currentViews = parseInt(findRes.rows[0].views_count || '0', 10);

    if (viewerHash) {
      try {
        const dedupRes = await pool.query(
          `SELECT 1 FROM article_views_log 
           WHERE article_id = $1 AND viewer_hash = $2 AND viewed_at >= NOW() - INTERVAL '30 minutes' 
           LIMIT 1`,
          [realId, viewerHash]
        );
        if (dedupRes.rows.length > 0) {
          return { viewsCount: currentViews, deduplicated: true };
        }
        await pool.query(
          `INSERT INTO article_views_log (article_id, viewer_hash) VALUES ($1, $2)`,
          [realId, viewerHash]
        );
      } catch (logErr) {
        console.warn('[ArticleViewsLog] Non-fatal log notice:', logErr);
      }
    }

    const updateRes = await pool.query(
      `UPDATE news_articles SET views_count = views_count + 1 WHERE id = $1 RETURNING views_count`,
      [realId]
    );
    return {
      viewsCount: parseInt(updateRes.rows[0]?.views_count || String(currentViews + 1), 10),
      deduplicated: false,
    };
  }

  /**
   * Increment article share count in PostgreSQL
   */
  public async incrementShare(articleId: string | number): Promise<number> {
    const isNum = !isNaN(Number(articleId));
    const findSql = isNum
      ? `SELECT id FROM news_articles WHERE id = $1`
      : `SELECT id FROM news_articles WHERE slug = $1 OR id::text = $1`;
    const findRes = await pool.query(findSql, [isNum ? Number(articleId) : articleId]);
    if (findRes.rows.length === 0) return 0;
    const realId = findRes.rows[0].id;

    const res = await pool.query(
      `UPDATE news_articles SET shares_count = shares_count + 1 WHERE id = $1 RETURNING shares_count`,
      [realId]
    );
    return parseInt(res.rows[0]?.shares_count || '0', 10);
  }

  /**
   * Save / Bookmark article in PostgreSQL
   */
  public async saveArticle(
    articleId: string | number,
    userId?: number | string | null,
    deviceId?: string | null
  ): Promise<{ saved: boolean; savesCount: number }> {
    const isNum = !isNaN(Number(articleId));
    const findSql = isNum
      ? `SELECT id FROM news_articles WHERE id = $1`
      : `SELECT id FROM news_articles WHERE slug = $1 OR id::text = $1`;
    const findRes = await pool.query(findSql, [isNum ? Number(articleId) : articleId]);
    if (findRes.rows.length === 0) return { saved: false, savesCount: 0 };
    const realId = findRes.rows[0].id;

    let numericUserId: number | null = null;
    let finalDeviceId: string | null = deviceId || null;

    if (typeof userId === 'number') {
      numericUserId = userId;
    } else if (typeof userId === 'string') {
      if (!isNaN(Number(userId))) {
        numericUserId = Number(userId);
      } else {
        finalDeviceId = finalDeviceId || userId;
      }
    }

    if (numericUserId) {
      await pool.query(
        `INSERT INTO user_saved_articles (user_id, article_id) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, article_id) WHERE user_id IS NOT NULL DO NOTHING`,
        [numericUserId, realId]
      );
    } else if (finalDeviceId) {
      await pool.query(
        `INSERT INTO user_saved_articles (device_id, article_id) 
         VALUES ($1, $2) 
         ON CONFLICT (device_id, article_id) WHERE device_id IS NOT NULL DO NOTHING`,
        [finalDeviceId, realId]
      );
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) as count FROM user_saved_articles WHERE article_id = $1`,
      [realId]
    );
    const savesCount = Math.max(1, parseInt(countRes.rows[0]?.count || '1', 10));

    await pool.query(
      `UPDATE news_articles SET saves_count = $1 WHERE id = $2`,
      [savesCount, realId]
    );

    return { saved: true, savesCount };
  }

  /**
   * Unsave / Remove Bookmark in PostgreSQL
   */
  public async unsaveArticle(
    articleId: string | number,
    userId?: number | string | null,
    deviceId?: string | null
  ): Promise<{ saved: boolean; savesCount: number }> {
    const isNum = !isNaN(Number(articleId));
    const findSql = isNum
      ? `SELECT id FROM news_articles WHERE id = $1`
      : `SELECT id FROM news_articles WHERE slug = $1 OR id::text = $1`;
    const findRes = await pool.query(findSql, [isNum ? Number(articleId) : articleId]);
    if (findRes.rows.length === 0) return { saved: false, savesCount: 0 };
    const realId = findRes.rows[0].id;

    let numericUserId: number | null = null;
    let finalDeviceId: string | null = deviceId || null;

    if (typeof userId === 'number') {
      numericUserId = userId;
    } else if (typeof userId === 'string') {
      if (!isNaN(Number(userId))) {
        numericUserId = Number(userId);
      } else {
        finalDeviceId = finalDeviceId || userId;
      }
    }

    if (numericUserId) {
      await pool.query(
        `DELETE FROM user_saved_articles WHERE user_id = $1 AND article_id = $2`,
        [numericUserId, realId]
      );
    } else if (finalDeviceId) {
      await pool.query(
        `DELETE FROM user_saved_articles WHERE device_id = $1 AND article_id = $2`,
        [finalDeviceId, realId]
      );
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) as count FROM user_saved_articles WHERE article_id = $1`,
      [realId]
    );
    const savesCount = parseInt(countRes.rows[0]?.count || '0', 10);

    await pool.query(
      `UPDATE news_articles SET saves_count = $1 WHERE id = $2`,
      [savesCount, realId]
    );

    return { saved: false, savesCount };
  }

  /**
   * Check if article is saved by user or device
   */
  public async isArticleSaved(
    articleId: string | number,
    userId?: number | string | null,
    deviceId?: string | null
  ): Promise<boolean> {
    const isNum = !isNaN(Number(articleId));
    const findSql = isNum
      ? `SELECT id FROM news_articles WHERE id = $1`
      : `SELECT id FROM news_articles WHERE slug = $1 OR id::text = $1`;
    const findRes = await pool.query(findSql, [isNum ? Number(articleId) : articleId]);
    if (findRes.rows.length === 0) return false;
    const realId = findRes.rows[0].id;

    let numericUserId: number | null = null;
    let finalDeviceId: string | null = deviceId || null;

    if (typeof userId === 'number') {
      numericUserId = userId;
    } else if (typeof userId === 'string') {
      if (!isNaN(Number(userId))) {
        numericUserId = Number(userId);
      } else {
        finalDeviceId = finalDeviceId || userId;
      }
    }

    if (numericUserId) {
      const res = await pool.query(
        `SELECT 1 FROM user_saved_articles WHERE user_id = $1 AND article_id = $2 LIMIT 1`,
        [numericUserId, realId]
      );
      return res.rows.length > 0;
    } else if (finalDeviceId) {
      const res = await pool.query(
        `SELECT 1 FROM user_saved_articles WHERE device_id = $1 AND article_id = $2 LIMIT 1`,
        [finalDeviceId, realId]
      );
      return res.rows.length > 0;
    }
    return false;
  }

  /**
   * Get saved articles from PostgreSQL
   */
  public async getSavedArticles(params: {
    userId?: number | null;
    deviceId?: string | null;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = Math.max(0, params.offset || 0);

    let sql = `
      SELECT a.*, 
             COALESCE(s.name_arabic, s.name) as "sourceName", 
             s.logo as "sourceLogo", 
             COALESCE(s.feed_url, s.url) as "sourceUrl", 
             s.country as "sourceCountry",
             s.trust_score as "sourceTrust",
             usa.created_at as "savedAt",
             TRUE as "isBookmarked"
      FROM user_saved_articles usa
      JOIN news_articles a ON usa.article_id = a.id
      LEFT JOIN news_sources s ON a.source_id = s.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (params.userId) {
      values.push(params.userId);
      sql += ` AND usa.user_id = $${values.length}`;
    } else if (params.deviceId) {
      values.push(params.deviceId);
      sql += ` AND usa.device_id = $${values.length}`;
    }

    sql += ` ORDER BY usa.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const res = await pool.query(sql, values);
    return res.rows;
  }

  /**
   * Real Deterministic Trending News from PostgreSQL
   * Velocity formula: Score = (Views * 1.5 + Shares * 3 + Saves * 2) / (HoursOld + 2)^1.2
   */
  public async getTrendingArticles(limit: number = 10): Promise<any[]> {
    const sql = `
      SELECT a.*, 
             COALESCE(s.name_arabic, s.name) as "sourceName", 
             s.logo as "sourceLogo", 
             COALESCE(s.feed_url, s.url) as "sourceUrl", 
             s.country as "sourceCountry",
             s.trust_score as "sourceTrust",
             ((COALESCE(a.views_count, 0) * 1.5) + (COALESCE(a.shares_count, 0) * 3.0) + (COALESCE(a.saves_count, 0) * 2.0)) / 
             POWER(GREATEST(0.5, EXTRACT(EPOCH FROM (NOW() - COALESCE(a.published_at, a.created_at, NOW()))) / 3600.0) + 2.0, 1.2) as "trendingScore"
      FROM news_articles a
      LEFT JOIN news_sources s ON a.source_id = s.id
      ORDER BY "trendingScore" DESC NULLS LAST, a.published_at DESC NULLS LAST
      LIMIT $1
    `;
    const res = await pool.query(sql, [limit]);
    return res.rows || [];
  }

  /**
   * Real Most-Read News from PostgreSQL
   */
  public async getMostReadArticles(limit: number = 10): Promise<any[]> {
    const sql = `
      SELECT a.*, 
             COALESCE(s.name_arabic, s.name) as "sourceName", 
             s.logo as "sourceLogo", 
             COALESCE(s.feed_url, s.url) as "sourceUrl", 
             s.country as "sourceCountry",
             s.trust_score as "sourceTrust"
      FROM news_articles a
      LEFT JOIN news_sources s ON a.source_id = s.id
      ORDER BY a.views_count DESC, a.published_at DESC
      LIMIT $1
    `;
    const res = await pool.query(sql, [limit]);
    return res.rows;
  }

  /**
   * Real Breaking News from PostgreSQL
   */
  public async getBreakingArticles(limit: number = 10): Promise<any[]> {
    const sql = `
      SELECT a.*, 
             COALESCE(s.name_arabic, s.name) as "sourceName", 
             s.logo as "sourceLogo", 
             COALESCE(s.feed_url, s.url) as "sourceUrl", 
             s.country as "sourceCountry",
             s.trust_score as "sourceTrust"
      FROM news_articles a
      LEFT JOIN news_sources s ON a.source_id = s.id
      WHERE a.is_breaking = TRUE OR a.published_at >= NOW() - INTERVAL '6 hours'
      ORDER BY a.is_breaking DESC, a.published_at DESC
      LIMIT $1
    `;
    const res = await pool.query(sql, [limit]);
    return res.rows;
  }

  /**
   * Delete article from PostgreSQL
   */
  public async deleteArticle(id: string | number): Promise<boolean> {
    const isNum = !isNaN(Number(id));
    const sql = isNum
      ? `DELETE FROM news_articles WHERE id = $1 RETURNING id`
      : `DELETE FROM news_articles WHERE slug = $1 OR id::text = $1 RETURNING id`;
    const res = await pool.query(sql, [isNum ? Number(id) : id]);
    return (res.rowCount || 0) > 0;
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
