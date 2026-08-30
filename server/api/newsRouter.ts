import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/connection';
import { articlesRepository } from '../../src/repositories/articlesRepository';
import { sourcesRepository } from '../../src/repositories/sourcesRepository';
import { newsService, NEWS_CATEGORIES, COUNTRIES, YEMEN_REGIONS } from '../../src/services/newsService';
import { newsIngestionService } from '../services/NewsIngestionService';
import { sourceDiscoveryEngine } from '../services/SourceDiscoveryEngine';
import { pgArticlesRepository } from '../repositories/pgArticlesRepository';
import { pgSourcesRepository } from '../repositories/pgSourcesRepository';
import { normalizeArabicText, matchesArabicText } from '../../src/infrastructure/utils/arabicNormalizer';
import { seoEngineService } from '../../src/seo-engine/SEOEngineService';

export const newsApiRouter = Router();

// ==========================================
// Phase 3.6 - CURSOR PAGINATION, FRESHNESS & SOURCE MAP
// ==========================================

// GET /api/v1/news/cursor - Scale Cursor Pagination (NO OFFSET)
newsApiRouter.get(['/v1/news/cursor', '/news/cursor'], async (req, res) => {
  try {
    const { cursor, limit = '20', category, country, isBreaking, minQualityScore } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

    const result = await pgArticlesRepository.getLatestArticlesCursor({
      cursor: cursor as string,
      limit: limitNum,
      category: category as string,
      country: country as string,
      isBreaking: isBreaking === 'true',
      minQualityScore: minQualityScore ? parseInt(minQualityScore as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      count: result.items.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/freshness - Real Freshness Metrics
newsApiRouter.get(['/v1/news/freshness', '/news/freshness'], async (_req, res) => {
  try {
    const metrics = await pgArticlesRepository.getFreshnessMetrics();
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sources/map - Geographical Network Map Metrics
newsApiRouter.get(['/v1/sources/map', '/sources/map'], async (_req, res) => {
  try {
    const mapMetrics = await pgArticlesRepository.getSourceMapMetrics();
    res.json({ success: true, count: mapMetrics.length, data: mapMetrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sources/stats - Network Failure & Health Stats
newsApiRouter.get(['/v1/sources/stats', '/sources/stats'], async (_req, res) => {
  try {
    const stats = await pgSourcesRepository.getSourcesStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 0. RBAC MIDDLEWARE FOR ADMIN ENDPOINTS
// ==========================================
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './authRouter';

const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'غير مصرح لك بالوصول. الرجاء تسجيل الدخول.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'naw3iya-auth-service',
    }) as any;
    const userRole = decoded.role;
    const allowedRoles = ['System Admin', 'Super Admin', 'Admin', 'Editor-in-Chief', 'Editor', 'Author', 'Moderator', 'Analyst'];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'غير مصرح لك بالوصول (RBAC Enforcement).',
      });
    }

    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'الجلسة منتهية أو الرمز غير صالح',
    });
  }
};

// ==========================================
// 0.1 CRON AUTHENTICATION MIDDLEWARE
// ==========================================
export const validateCronSecret = (req: Request, res: Response, next: NextFunction) => {
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    const xCronHeader = req.headers['x-cron-secret'] as string;
    const querySecret = req.query['secret'] as string;
    
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (xCronHeader) {
      token = xCronHeader.trim();
    } else if (querySecret) {
      token = querySecret.trim();
    }
    
    if (!token || token !== cronSecret) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'غير مصرح: مفتاح CRON_SECRET غير صحيح أو مفقود (401 Unauthorized)',
      });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'غير مصرح: يجب تكوين متغير CRON_SECRET في بيئة الإنتاج (401 Unauthorized)',
    });
  }
  next();
};

// ==========================================
// 1. NEWS ARTICLES ENDPOINTS (/api/v1/news)
// ==========================================

// GET /api/v1/news - Paginated, filtered, sorted articles
// Helper to map DB row to standard NewsArticle domain model
export function mapDbRowToArticle(row: any): any {
  const paragraphs = (row.formatted_body || row.content_html || row.content || row.summary || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<div\b[^>]*>/gi, '<p>')
    .replace(/<\/div>/gi, '</p>')
    .match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)
    ?.map((p: string) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((text: string) => text.length > 20) || [];

  const fallbackParagraphs = paragraphs.length > 0
    ? paragraphs
    : (row.content_text || row.content || row.summary || row.title || '')
        .replace(/<[^>]+>/g, ' ')
        .split(/\n\s*\n/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 20);

  const cleanTitle = (row.title || '').replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').replace(/<[^>]+>/g, '').trim();
  const cleanSummary = (row.summary || row.excerpt || '').replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').replace(/<[^>]+>/g, '').trim();
  const rawContent = (row.content || row.formatted_body || row.content_html || cleanSummary).replace(/<!\[CDATA\[/gi, '').replace(/\]\]>/gi, '').trim();

  const isFull = Boolean(
    row.is_full_content_available ||
    row.content_status === 'full' ||
    row.content_classification === 'FULL_PERMITTED_CONTENT' ||
    fallbackParagraphs.length >= 3 ||
    (rawContent.length > 350 && rawContent !== cleanSummary)
  );

  return {
    id: String(row.id),
    title: cleanTitle,
    subheadline: row.subheadline,
    slug: row.slug,
    summary: cleanSummary,
    content: rawContent,
    formattedBody: row.formatted_body || row.content_html || rawContent,
    contentHtml: row.content_html || row.formatted_body || rawContent,
    contentText: row.content_text || cleanSummary,
    excerpt: row.excerpt || cleanSummary,
    contentStatus: row.content_status || (isFull ? 'full' : 'partial'),
    contentSource: row.content_source || (row.content_origin === 'EXTRACTED_PERMITTED' ? 'extractor' : 'rss'),
    contentClassification: row.content_classification || (isFull ? 'FULL_PERMITTED_CONTENT' : 'EXCERPT_ONLY'),
    paragraphs: fallbackParagraphs.length > 0 ? fallbackParagraphs : [cleanSummary || cleanTitle],
    wordCount: row.word_count || fallbackParagraphs.join(' ').split(/\s+/).filter(Boolean).length,
    paragraphCount: row.paragraph_count || (fallbackParagraphs.length || 1),
    mainImage: row.cover_image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    galleryImages: [],
    author: row.author || 'فريق التحرير',
    category: row.category || 'أخبار عامة',
    subCategory: row.category,
    country: row.country || 'اليمن',
    language: row.language || 'ar',
    publishDate: row.published_at ? new Date(row.published_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    readTimeMinutes: row.reading_time_minutes || Math.max(1, Math.ceil((fallbackParagraphs.join(' ').split(/\s+/).length || 50) / 180)),
    viewsCount: row.views_count || 0,
    sharesCount: row.shares_count || 0,
    commentsCount: 0,
    bookmarksCount: row.saves_count || 0,
    isBreaking: Boolean(row.is_breaking),
    isTrending: Boolean(row.is_trending),
    isEditorPick: false,
    isBookmarked: false,
    trustScore: row.trust_score || 95,
    isFullContentAvailable: isFull,
    originalArticleUrl: row.original_article_url,
    canonicalUrl: row.canonical_url || row.original_article_url || `https://naweayh.xyz/news/${row.slug}`,
    sources: [
      {
        id: String(row.source_id || 1),
        name: row.source_name || row.sourceName || row.sourceNameArabic || 'مصدر إخباري موثوق',
        logo: row.source_logo || row.sourceLogo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=120&q=80',
        url: row.source_url || '',
        publishedAt: row.published_at ? new Date(row.published_at).toISOString() : new Date().toISOString(),
        reliabilityScore: row.source_trust || 95,
        isPrimary: true,
      }
    ],
    aiEntities: {
      people: [],
      organizations: [],
      locations: [],
      tags: [row.category || 'أخبار', row.country || 'اليمن'].filter(Boolean),
      sentiment: 'Neutral',
      trustScore: row.trust_score || 95,
    },
    seoMeta: {
      title: cleanTitle,
      description: cleanSummary,
      keywords: [row.category, row.country, 'أخبار نوعية'].filter(Boolean),
      canonicalUrl: `https://naweayh.xyz/news/${row.slug}`,
      schemaType: 'NewsArticle',
      openGraphImage: row.cover_image_url || '',
    },
    socialPosts: [],
  };
}

// GET /api/v1/news
newsApiRouter.get(['/v1/news', '/news'], async (req, res) => {
  try {
    const {
      category,
      country,
      source,
      search,
      page = '1',
      limit = '20',
      sort = 'latest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Try PostgreSQL database query first
    try {
      let countQuery = `SELECT COUNT(*) as total FROM news_articles a WHERE 1=1`;
      let query = `
        SELECT a.*, COALESCE(s.name_arabic, s.name) as source_name, s.logo as source_logo, COALESCE(s.feed_url, s.url) as source_url
        FROM news_articles a
        LEFT JOIN news_sources s ON a.source_id = s.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (category && category !== 'الكل') {
        params.push(category);
        query += ` AND a.category = $${params.length}`;
        countQuery += ` AND a.category = $${params.length}`;
      }
      if (country && country !== 'جميع الدول') {
        params.push(country);
        query += ` AND a.country = $${params.length}`;
        countQuery += ` AND a.country = $${params.length}`;
      }
      if (search) {
        const normSearch = normalizeArabicText(search as string);
        params.push(`%${normSearch}%`);
        query += ` AND (a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length})`;
        countQuery += ` AND (a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length})`;
      }

      if (sort === 'trending') {
        query += ` ORDER BY (a.views_count * 1.5) DESC, a.published_at DESC`;
      } else if (sort === 'most_read') {
        query += ` ORDER BY a.views_count DESC, a.published_at DESC`;
      } else {
        query += ` ORDER BY a.published_at DESC`;
      }

      const totalRes = await pool.query(countQuery, params);
      const total = parseInt(totalRes.rows[0]?.total || '0', 10);

      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const dbRes = await pool.query(query, [...params, limitNum, offset]);

      if (dbRes.rows.length > 0) {
        const mappedArticles = dbRes.rows.map(mapDbRowToArticle);
        return res.json({
          success: true,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
          count: mappedArticles.length,
          data: mappedArticles,
        });
      }
    } catch (dbErr) {
      console.error('[GET /news DB Error]:', dbErr);
      // Fallback to domain repository
    }

    // Repository Fallback
    let articles = articlesRepository.getAll();

    if (category && category !== 'الكل') {
      articles = articles.filter(a => a.category === category || a.subCategory === category);
    }
    if (country && country !== 'جميع الدول') {
      articles = articles.filter(a => a.country === country || a.country === 'عالمي');
    }
    if (search) {
      const q = search as string;
      articles = articles.filter(a => matchesArabicText(a.title + ' ' + a.summary + ' ' + a.content, q));
    }

    if (sort === 'trending') {
      articles = newsService.getTrendingNews();
    } else if (sort === 'most_read') {
      articles = newsService.getMostReadNews(50);
    } else {
      articles.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    }

    const total = articles.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const paged = articles.slice(offset, offset + limitNum);

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      count: paged.length,
      data: paged,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/latest
newsApiRouter.get(['/v1/news/latest', '/news/latest'], async (req, res) => {
  try {
    const limitNum = parseInt((req.query.limit as string) || '15', 10);
    try {
      const dbRes = await pool.query(
        `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.url as source_url, s.trust_score as source_trust
         FROM news_articles a
         LEFT JOIN news_sources s ON a.source_id = s.id
         ORDER BY a.published_at DESC
         LIMIT $1`,
        [limitNum]
      );
      if (dbRes.rows.length > 0) {
        return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows.map(mapDbRowToArticle) });
      }
    } catch {}

    const articles = articlesRepository.getLatestNews(limitNum);
    res.json({ success: true, count: articles.length, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sources/:id/toggle
newsApiRouter.post('/v1/sources/:id/toggle', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const dbRes = await pool.query('UPDATE news_sources SET enabled = NOT enabled WHERE id = $1 RETURNING *', [id]);
    res.json({ success: true, data: dbRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/breaking
newsApiRouter.get(['/v1/news/breaking', '/news/breaking'], async (_req, res) => {
  try {
    try {
      const dbRes = await pool.query(
        `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.url as source_url, s.trust_score as source_trust
         FROM news_articles a
         LEFT JOIN news_sources s ON a.source_id = s.id
         WHERE a.is_breaking = true OR a.published_at >= NOW() - INTERVAL '3 hours'
         ORDER BY a.published_at DESC
         LIMIT 10`
      );
      if (dbRes.rows.length > 0) {
        return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows.map(mapDbRowToArticle) });
      }
    } catch {}

    const articles = articlesRepository.getBreakingNews();
    res.json({ success: true, count: articles.length, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/trending
newsApiRouter.get(['/v1/news/trending', '/news/trending'], async (_req, res) => {
  try {
    try {
      const dbRes = await pool.query(
        `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.url as source_url, s.trust_score as source_trust
         FROM news_articles a
         LEFT JOIN news_sources s ON a.source_id = s.id
         ORDER BY (a.views_count * 1.5 + a.shares_count * 3) DESC, a.published_at DESC
         LIMIT 10`
      );
      if (dbRes.rows.length > 0) {
        return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows.map(mapDbRowToArticle) });
      }
    } catch {}

    const articles = newsService.getTrendingNews().slice(0, 10);
    res.json({ success: true, count: articles.length, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/most-read
newsApiRouter.get(['/v1/news/most-read', '/news/most-read'], async (_req, res) => {
  try {
    try {
      const dbRes = await pool.query(
        `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.url as source_url, s.trust_score as source_trust
         FROM news_articles a
         LEFT JOIN news_sources s ON a.source_id = s.id
         ORDER BY a.views_count DESC, a.published_at DESC
         LIMIT 10`
      );
      if (dbRes.rows.length > 0) {
        return res.json({ success: true, count: dbRes.rows.length, data: dbRes.rows.map(mapDbRowToArticle) });
      }
    } catch {}

    const articles = newsService.getMostReadNews(10);
    res.json({ success: true, count: articles.length, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/news/ingest-all - Run complete news ingestion pipeline
newsApiRouter.post('/v1/news/ingest-all', async (_req, res) => {
  try {
    const sourcesRes = await pool.query('SELECT * FROM news_sources WHERE enabled = true ORDER BY priority DESC');
    const sources = sourcesRes.rows;

    const results = [];
    for (const src of sources) {
      const srcConfig = {
        id: src.id,
        name: src.name,
        nameArabic: src.name_arabic || src.name,
        url: src.url,
        feedUrl: src.feed_url || src.url,
        logo: src.logo || '',
        country: src.country || 'اليمن',
        language: src.language || 'ar',
        category: src.category || 'أخبار عامة',
        type: src.type || 'RSS',
        enabled: src.enabled,
        priority: src.priority || 1,
        trustScore: src.trust_score || 90,
        fetchInterval: src.fetch_interval || 300,
      };

      const log = await newsIngestionService.fetchAndIngestSource(srcConfig);
      results.push(log);
    }

    res.json({
      success: true,
      totalSourcesProcessed: sources.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/ingestion-logs - Fetch recent ingestion execution logs
newsApiRouter.get('/v1/news/ingestion-logs', async (_req, res) => {
  try {
    const logs = newsIngestionService.getIngestionLogs();
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/news/detail/:slug OR /api/v1/news/:slug
newsApiRouter.get(['/v1/news/detail/:slug', '/v1/news/:slug', '/news/detail/:slug', '/news/:slug'], async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Try PostgreSQL database lookup
    try {
      const isNumericId = /^\d+$/.test(slug);
      const dbQuery = isNumericId
        ? `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.url as source_url, s.trust_score as source_trust
           FROM news_articles a
           LEFT JOIN news_sources s ON a.source_id = s.id
           WHERE a.id = $1 LIMIT 1`
        : `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo, s.url as source_url, s.trust_score as source_trust
           FROM news_articles a
           LEFT JOIN news_sources s ON a.source_id = s.id
           WHERE a.slug = $1 OR a.canonical_url = $1 LIMIT 1`;

      const dbRes = await pool.query(dbQuery, [isNumericId ? parseInt(slug, 10) : slug]);
      
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        
        // Asynchronously increment view count in DB
        pool.query(`UPDATE news_articles SET views_count = views_count + 1 WHERE id = $1`, [row.id]).catch(() => {});

        // Fetch related articles from same category
        let relatedArticles: any[] = [];
        try {
          const relRes = await pool.query(
            `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo
             FROM news_articles a
             LEFT JOIN news_sources s ON a.source_id = s.id
             WHERE a.id != $1 AND (a.category = $2 OR a.country = $3)
             ORDER BY a.published_at DESC
             LIMIT 4`,
            [row.id, row.category, row.country]
          );
          relatedArticles = relRes.rows.map(mapDbRowToArticle);
        } catch {}

        // Fetch more from same source
        let moreFromSource: any[] = [];
        if (row.source_id) {
          try {
            const srcRes = await pool.query(
              `SELECT a.*, s.name_arabic as source_name, s.logo as source_logo
               FROM news_articles a
               LEFT JOIN news_sources s ON a.source_id = s.id
               WHERE a.id != $1 AND a.source_id = $2
               ORDER BY a.published_at DESC
               LIMIT 4`,
              [row.id, row.source_id]
            );
            moreFromSource = srcRes.rows.map(mapDbRowToArticle);
          } catch {}
        }

        const articleObj = mapDbRowToArticle(row);
        return res.json({
          success: true,
          data: {
            ...articleObj,
            viewsCount: (row.views_count || 0) + 1,
            relatedArticles,
            moreFromSource,
            permanentUrl: `https://naweayh.xyz/news/${articleObj.slug}`,
          },
        });
      }
    } catch (dbErr) {}

    // 2. Repository Fallback
    const article = articlesRepository.getBySlug(slug) || articlesRepository.getById(slug);

    if (!article) {
      return res.status(404).json({ success: false, message: 'الخبر غير موجود' });
    }

    articlesRepository.incrementView(article.id);

    // Fetch related articles
    const related = articlesRepository
      .getAll()
      .filter(a => a.id !== article.id && (a.category === article.category || a.country === article.country))
      .slice(0, 4);

    res.json({
      success: true,
      data: {
        ...article,
        relatedArticles: related,
        permanentUrl: `https://naweayh.xyz/news/${article.slug}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/news - Create new article (Admin)
newsApiRouter.post(['/v1/news', '/news'], checkAdminRole, async (req, res) => {
  try {
    const body = req.body;
    const cleanTitle = (body.title || '').trim();
    if (!cleanTitle) {
      return res.status(400).json({ success: false, message: 'عنوان الخبر مطلوب' });
    }

    const slug = body.slug || cleanTitle.toLowerCase().replace(/[^\u0621-\u064Aa-z0-9]+/gi, '-').slice(0, 150) + '-' + Date.now();
    const cleanSummary = (body.summary || body.excerpt || cleanTitle).trim();
    const rawContent = (body.content || body.formattedBody || cleanSummary).trim();
    const category = body.category || 'أخبار عامة';
    const country = body.country || 'اليمن';
    const mainImage = body.mainImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
    const isBreaking = Boolean(body.isBreaking);
    const sourceId = body.sourceId ? parseInt(body.sourceId, 10) : 1;

    try {
      const insertRes = await pool.query(
        `INSERT INTO news_articles (
          title, slug, summary, content, formatted_body, content_html, content_text,
          category, country, cover_image_url, is_breaking, is_trending, source_id,
          published_at, trust_score, reading_time_minutes, is_full_content_available,
          content_status, content_classification
        ) VALUES (
          $1, $2, $3, $4, $4, $4, $4,
          $5, $6, $7, $8, false, $9,
          NOW(), 95, 2, true,
          'full', 'FULL_PERMITTED_CONTENT'
        ) RETURNING *`,
        [cleanTitle, slug, cleanSummary, rawContent, category, country, mainImage, isBreaking, sourceId]
      );

      if (insertRes.rows.length > 0) {
        const created = mapDbRowToArticle(insertRes.rows[0]);
        articlesRepository.add(created);
        return res.status(201).json({ success: true, data: created });
      }
    } catch (dbErr) {
      console.warn('[Create Article DB fallback]:', dbErr);
    }

    const fallbackArticle = {
      id: String(Date.now()),
      title: cleanTitle,
      slug,
      summary: cleanSummary,
      content: rawContent,
      formattedBody: rawContent,
      category,
      country,
      mainImage,
      publishDate: new Date().toISOString(),
      isBreaking,
      isTrending: false,
      isFullContentAvailable: true,
      contentStatus: 'full' as const,
      trustScore: 95,
      viewsCount: 1,
      sharesCount: 0,
      bookmarksCount: 0,
      sources: [
        {
          id: String(sourceId),
          name: 'فريق التحرير',
          logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=120&q=80',
          url: 'https://naweayh.xyz',
          publishedAt: new Date().toISOString(),
          reliabilityScore: 95,
          isPrimary: true,
        },
      ],
      paragraphs: [rawContent],
      readTimeMinutes: 2,
    };
    articlesRepository.add(fallbackArticle as any);
    res.status(201).json({ success: true, data: fallbackArticle });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/v1/news/:id - Update article (Admin)
newsApiRouter.put(['/v1/news/:id', '/news/:id'], checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const isNumericId = /^\d+$/.test(id);

    try {
      const updateQuery = isNumericId
        ? `UPDATE news_articles 
           SET title = COALESCE($1, title),
               summary = COALESCE($2, summary),
               content = COALESCE($3, content),
               formatted_body = COALESCE($3, formatted_body),
               category = COALESCE($4, category),
               country = COALESCE($5, country),
               cover_image_url = COALESCE($6, cover_image_url),
               is_breaking = COALESCE($7, is_breaking),
               updated_at = NOW()
           WHERE id = $8
           RETURNING *`
        : `UPDATE news_articles 
           SET title = COALESCE($1, title),
               summary = COALESCE($2, summary),
               content = COALESCE($3, content),
               formatted_body = COALESCE($3, formatted_body),
               category = COALESCE($4, category),
               country = COALESCE($5, country),
               cover_image_url = COALESCE($6, cover_image_url),
               is_breaking = COALESCE($7, is_breaking),
               updated_at = NOW()
           WHERE slug = $8
           RETURNING *`;

      const dbRes = await pool.query(updateQuery, [
        body.title,
        body.summary,
        body.content || body.formattedBody,
        body.category,
        body.country,
        body.mainImage,
        body.isBreaking !== undefined ? Boolean(body.isBreaking) : null,
        isNumericId ? parseInt(id, 10) : id,
      ]);

      if (dbRes.rows.length > 0) {
        const updated = mapDbRowToArticle(dbRes.rows[0]);
        articlesRepository.save(updated);
        return res.json({ success: true, data: updated });
      }
    } catch (dbErr) {
      console.warn('[Update Article DB fallback]:', dbErr);
    }

    const localArt = articlesRepository.getById(id) || articlesRepository.getBySlug(id);
    if (!localArt) {
      return res.status(404).json({ success: false, message: 'المقال غير موجود' });
    }

    const updated = {
      ...localArt,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    articlesRepository.save(updated);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/news/:id/toggle-breaking - Toggle breaking state (Admin)
newsApiRouter.post(['/v1/news/:id/toggle-breaking', '/news/:id/toggle-breaking'], checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const isNumericId = /^\d+$/.test(id);

    try {
      const toggleQuery = isNumericId
        ? `UPDATE news_articles SET is_breaking = NOT is_breaking, updated_at = NOW() WHERE id = $1 RETURNING *`
        : `UPDATE news_articles SET is_breaking = NOT is_breaking, updated_at = NOW() WHERE slug = $1 RETURNING *`;

      const dbRes = await pool.query(toggleQuery, [isNumericId ? parseInt(id, 10) : id]);
      if (dbRes.rows.length > 0) {
        const updated = mapDbRowToArticle(dbRes.rows[0]);
        articlesRepository.save(updated);
        return res.json({ success: true, data: updated });
      }
    } catch {}

    const localArt = articlesRepository.getById(id) || articlesRepository.getBySlug(id);
    if (localArt) {
      localArt.isBreaking = !localArt.isBreaking;
      articlesRepository.save(localArt);
      return res.json({ success: true, data: localArt });
    }

    res.status(404).json({ success: false, message: 'المقال غير موجود' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/news/:id - Delete article (Admin)
newsApiRouter.delete(['/v1/news/:id', '/news/:id'], checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const isNumericId = /^\d+$/.test(id);

    try {
      const delQuery = isNumericId
        ? `DELETE FROM news_articles WHERE id = $1`
        : `DELETE FROM news_articles WHERE slug = $1`;
      await pool.query(delQuery, [isNumericId ? parseInt(id, 10) : id]);
    } catch {}

    articlesRepository.delete(id);
    res.json({ success: true, message: 'تم حذف المقال بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. CATEGORIES, COUNTRIES & SOURCES ENDPOINTS
// ==========================================

// GET /api/v1/categories
newsApiRouter.get(['/v1/categories', '/categories'], async (_req, res) => {
  try {
    const categories = NEWS_CATEGORIES.map(cat => ({
      name: cat,
      slug: cat.toLowerCase().replace(/\s+/g, '-'),
    }));
    res.json({ success: true, count: categories.length, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/countries
newsApiRouter.get(['/v1/countries', '/countries'], async (_req, res) => {
  try {
    const countries = COUNTRIES.map(c => ({
      name: c,
      slug: c.toLowerCase().replace(/\s+/g, '-'),
      governorates: c === 'اليمن' ? YEMEN_REGIONS : [],
    }));
    res.json({ success: true, count: countries.length, data: countries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sources
newsApiRouter.get(['/v1/sources', '/sources'], async (_req, res) => {
  try {
    const dbRes = await pool.query('SELECT * FROM news_sources ORDER BY priority DESC, id ASC');
    res.json({ success: true, count: dbRes.rowCount, data: dbRes.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sources - Add new news source
newsApiRouter.post('/v1/sources', checkAdminRole, async (req, res) => {
  try {
    const { name, url, feedUrl, logo, country, language, category, type, trustScore, priority, enabled } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: 'الاسم والرابط مطلوبان' });
    }

    const insertQuery = `
      INSERT INTO news_sources (name, name_arabic, url, feed_url, logo, country, language, category, type, enabled, priority, trust_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const params = [
      name, name, url, feedUrl || url, logo || '', country || 'اليمن', language || 'ar', 
      category || 'أخبار عامة', type || 'RSS', enabled !== undefined ? enabled : true, 
      priority || 2, trustScore || 90
    ];
    
    const dbRes = await pool.query(insertQuery, params);

    res.json({ success: true, data: dbRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sources/:id/test - Test HTTP Connection to Source Feed
newsApiRouter.post('/v1/sources/:id/test', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const dbRes = await pool.query('SELECT * FROM news_sources WHERE id = $1', [id]);
    
    if (dbRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'المصدر غير موجود' });
    }
    
    const source = dbRes.rows[0];
    const startTime = Date.now();
    
    const response = await fetch(source.feed_url || source.url, {
      method: 'GET',
      headers: { 'User-Agent': 'Naw3iyaNewsBot/2.5' },
      signal: AbortSignal.timeout(6000)
    });
    
    const responseTimeMs = Date.now() - startTime;
    
    if (!response.ok) {
      await pool.query('UPDATE news_sources SET last_error_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
      return res.json({ 
        success: false, 
        message: `فشل الاتصال: ${response.status} ${response.statusText}`,
        responseTimeMs
      });
    }
    
    const text = await response.text();
    await pool.query('UPDATE news_sources SET last_success_at = CURRENT_TIMESTAMP, last_fetched_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    
    res.json({ 
      success: true, 
      status: 'CONNECTED',
      responseTimeMs,
      bytesReceived: text.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sources/discover - Automated Feed Discovery Engine
newsApiRouter.post('/v1/sources/discover', checkAdminRole, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'الرابط أو النطاق مطلوب' });
    }

    const discoveredFeeds = await sourceDiscoveryEngine.discoverFromUrl(url);

    res.json({
      success: true,
      queryUrl: url,
      count: discoveredFeeds.length,
      data: discoveredFeeds,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sources/bulk-import - Bulk Source Importer (OPML, CSV, JSON, URLs)
newsApiRouter.post('/v1/sources/bulk-import', checkAdminRole, async (req, res) => {
  try {
    const { content, format, defaultCountry, defaultCategory } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'محتوى الاستيراد مطلوب' });
    }

    let candidates: Array<{ name: string; feedUrl: string; category?: string; country?: string }> = [];

    if (format === 'OPML' || content.includes('<opml') || content.includes('<outline')) {
      candidates = sourceDiscoveryEngine.parseOPML(content);
    } else if (format === 'JSON') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          candidates = parsed.map((item: any) => ({
            name: item.name || item.title || new URL(item.feedUrl || item.url).hostname,
            feedUrl: item.feedUrl || item.url || item.rss,
            category: item.category,
            country: item.country,
          }));
        }
      } catch (err) {
        return res.status(400).json({ success: false, message: 'صيغة JSON غير صالحة' });
      }
    } else {
      // Plain text multi-line list of feed URLs
      const lines = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l.startsWith('http'));
      candidates = lines.map((line: string) => ({
        name: new URL(line).hostname,
        feedUrl: line,
      }));
    }

    let importedCount = 0;
    const results: any[] = [];

    for (const cand of candidates) {
      if (!cand.feedUrl) continue;
      const verified = await sourceDiscoveryEngine.testAndVerifyFeed(cand.feedUrl, cand.feedUrl);

      if (verified) {
        const insertRes = await pool.query(
          `INSERT INTO news_sources (
            name, name_arabic, url, feed_url, logo, country, language, category, type, enabled, priority, trust_score
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 2, 85)
          ON CONFLICT DO NOTHING
          RETURNING *`,
          [
            cand.name,
            cand.name,
            verified.websiteUrl,
            cand.feedUrl,
            verified.logoUrl || '',
            cand.country || defaultCountry || verified.inferredCountry || 'اليمن',
            verified.language || 'ar',
            cand.category || defaultCategory || verified.inferredCategory || 'أخبار عامة',
            verified.type || 'RSS',
          ]
        );

        if (insertRes.rowCount && insertRes.rowCount > 0) {
          importedCount++;
          results.push({ name: cand.name, feedUrl: cand.feedUrl, status: 'IMPORTED' });
        } else {
          results.push({ name: cand.name, feedUrl: cand.feedUrl, status: 'DUPLICATE' });
        }
      } else {
        results.push({ name: cand.name, feedUrl: cand.feedUrl, status: 'FAILED_VERIFICATION' });
      }
    }

    res.json({
      success: true,
      totalCandidateFeeds: candidates.length,
      importedCount,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sources/health - Health & Latency Dashboard
newsApiRouter.get('/v1/sources/health', async (_req, res) => {
  try {
    const dbRes = await pool.query(`
      SELECT 
        id, name, name_arabic, url, feed_url, country, category, type, enabled,
        trust_score, fetch_interval, last_fetched_at, last_success_at, last_error_at, last_error,
        response_time_ms, articles_fetched, articles_inserted, articles_duplicate, success_rate,
        CASE 
          WHEN enabled = false THEN 'PAUSED'
          WHEN last_error_at IS NOT NULL AND (last_success_at IS NULL OR last_error_at > last_success_at) THEN 'DOWN'
          ELSE 'UP'
        END as health_status
      FROM news_sources
      ORDER BY enabled DESC, priority DESC, id ASC
    `);

    const sources = dbRes.rows;
    const upCount = sources.filter((s: any) => s.health_status === 'UP').length;
    const downCount = sources.filter((s: any) => s.health_status === 'DOWN').length;
    const pausedCount = sources.filter((s: any) => s.health_status === 'PAUSED').length;
    const avgLatency = Math.round(sources.reduce((acc: number, s: any) => acc + (s.response_time_ms || 0), 0) / (sources.length || 1));

    res.json({
      success: true,
      summary: {
        totalSources: sources.length,
        upCount,
        downCount,
        pausedCount,
        avgLatencyMs: avgLatency,
      },
      data: sources,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sources/catalog - Filtered Catalog
newsApiRouter.get('/v1/sources/catalog', async (req, res) => {
  try {
    const { country, category, status, search } = req.query;
    let query = 'SELECT * FROM news_sources WHERE 1=1';
    const params: any[] = [];

    if (country && country !== 'الكل') {
      params.push(country);
      query += ` AND country = $${params.length}`;
    }
    if (category && category !== 'الكل') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (status) {
      if (status === 'active') query += ' AND enabled = true';
      else if (status === 'paused') query += ' AND enabled = false';
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR name_arabic ILIKE $${params.length} OR url ILIKE $${params.length})`;
    }

    query += ' ORDER BY priority DESC, id ASC';
    const dbRes = await pool.query(query, params);

    res.json({
      success: true,
      count: dbRes.rowCount,
      data: dbRes.rows,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sources/:id/verify - Re-verify Source
newsApiRouter.post('/v1/sources/:id/verify', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const dbRes = await pool.query('SELECT * FROM news_sources WHERE id = $1', [id]);
    if (dbRes.rowCount === 0) return res.status(404).json({ success: false, message: 'المصدر غير موجود' });

    const source = dbRes.rows[0];
    const verification = await sourceDiscoveryEngine.testAndVerifyFeed(source.feed_url || source.url, source.url);

    if (verification) {
      await pool.query(
        `UPDATE news_sources 
         SET response_time_ms = $1, last_success_at = CURRENT_TIMESTAMP, last_fetched_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [verification.responseTimeMs, id]
      );
      return res.json({ success: true, verification });
    } else {
      await pool.query('UPDATE news_sources SET last_error_at = CURRENT_TIMESTAMP, last_error = $1 WHERE id = $2', ['Verification Failed', id]);
      return res.json({ success: false, message: 'فشل التحقق من المصدر' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/v1/sources/:id - Update source details
newsApiRouter.put('/v1/sources/:id', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameArabic, url, feedUrl, country, category, priority, trustScore, fetchInterval } = req.body;

    const dbRes = await pool.query(
      `UPDATE news_sources
       SET name = COALESCE($1, name),
           name_arabic = COALESCE($2, name_arabic),
           url = COALESCE($3, url),
           feed_url = COALESCE($4, feed_url),
           country = COALESCE($5, country),
           category = COALESCE($6, category),
           priority = COALESCE($7, priority),
           trust_score = COALESCE($8, trust_score),
           fetch_interval = COALESCE($9, fetch_interval)
       WHERE id = $10
       RETURNING *`,
      [name, nameArabic, url, feedUrl, country, category, priority, trustScore, fetchInterval, id]
    );

    res.json({ success: true, data: dbRes.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/sources/:id - Delete source
newsApiRouter.delete('/v1/sources/:id', checkAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM news_sources WHERE id = $1', [id]);
    res.json({ success: true, message: 'تم حذف المصدر بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ARABIC SEARCH ENGINE ENDPOINT
// ==========================================

newsApiRouter.get(['/v1/search', '/search'], async (req, res) => {
  try {
    const { q = '' } = req.query;
    const queryStr = q as string;

    if (!queryStr || queryStr.trim().length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const allArticles = articlesRepository.getAll();
    const results = allArticles.filter(a => matchesArabicText(a.title + ' ' + a.summary + ' ' + a.content, queryStr));

    res.json({
      success: true,
      normalizedQuery: normalizeArabicText(queryStr),
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. PERSONALIZED RECOMMENDATION ENGINE ("أخبارك")
// ==========================================

newsApiRouter.get(['/v1/news/personalized', '/v1/news/recommendations'], async (req, res) => {
  try {
    const { sources, categories, countries, history } = req.query;

    const followedSources = sources ? (sources as string).split(',') : [];
    const followedCategories = categories ? (categories as string).split(',') : [];
    const followedCountries = countries ? (countries as string).split(',') : [];
    const historySlugs = history ? (history as string).split(',') : [];

    const allArticles = articlesRepository.getAll();

    // Calculate dynamic recommendation score based on user preferences
    const scoredArticles = allArticles.map(article => {
      let score = 0;

      // Match followed sources (+40 points)
      if (article.sources.some(s => followedSources.includes(s.name) || followedSources.includes(s.id))) {
        score += 40;
      }

      // Match followed categories (+30 points)
      if (followedCategories.includes(article.category)) {
        score += 30;
      }

      // Match country interest (+20 points)
      if (followedCountries.includes(article.country)) {
        score += 20;
      }

      // Freshness score (decay over hours)
      const hoursOld = (Date.now() - new Date(article.publishDate).getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 30 - hoursOld * 2);
      score += freshnessScore;

      // Penalize already read articles (-50 points)
      if (historySlugs.includes(article.slug)) {
        score -= 50;
      }

      return {
        ...article,
        recommendationScore: Math.round(score),
      };
    });

    scoredArticles.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({
      success: true,
      count: scoredArticles.length,
      algorithm: 'Personalized Recommendation Score (Sources + Categories + Freshness + Decaying History)',
      data: scoredArticles.slice(0, 20),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. REAL ANALYTICS TRACKING ENDPOINT
// ==========================================

newsApiRouter.post(['/v1/analytics/track', '/analytics/track'], async (req, res) => {
  try {
    const { eventType, articleId, slug, readingTimeSeconds } = req.body;

    if (articleId) {
      if (eventType === 'view') {
        articlesRepository.incrementView(articleId);
      } else if (eventType === 'share') {
        articlesRepository.incrementShare(articleId);
      } else if (eventType === 'save') {
        articlesRepository.toggleBookmark(articleId);
      }
    }

    res.json({
      success: true,
      tracked: { eventType, articleId, slug, readingTimeSeconds, timestamp: new Date().toISOString() },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. CRON JOBS (PROTECTED WITH CRON_SECRET) & SEO FEEDS
// ==========================================

newsApiRouter.get(['/cron/fetch-news', '/v1/cron/fetch-news'], validateCronSecret, async (_req, res) => {
  try {
    const activeSources = await pgSourcesRepository.getActiveSources();
    let fetchedCount = 0;
    const batchSize = Math.min(activeSources.length, 10);
    const results: any[] = [];
    
    for (const source of activeSources.slice(0, batchSize)) {
      try {
        const log = await newsIngestionService.fetchAndIngestSource(source);
        if (log.newArticlesCount > 0) fetchedCount += log.newArticlesCount;
        results.push({ source: source.nameArabic || source.name, newArticles: log.newArticlesCount, status: log.status });
      } catch (err: any) {
        results.push({ source: source.nameArabic || source.name, status: 'FAILED', error: err.message });
      }
    }
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Ingestion cron cycle completed',
      newArticlesCount: fetchedCount,
      sourcesProcessed: results.length,
      details: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

newsApiRouter.get(['/cron/seo-refresh', '/v1/cron/seo-refresh'], validateCronSecret, async (_req, res) => {
  try {
    const master = seoEngineService.generateMasterSitemapXML();
    const news = seoEngineService.generateNewsSitemapXML();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'SEO sitemaps and indexes refreshed successfully',
      masterSitemapLength: master.length,
      newsSitemapLength: news.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

newsApiRouter.get(['/cron/trending-calc', '/v1/cron/trending-calc'], validateCronSecret, async (_req, res) => {
  try {
    const trending = newsService.getTrendingNews();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: trending.length,
      message: 'Trending velocity algorithm and trending news calculated successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

newsApiRouter.get('/seo/sitemap.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(seoEngineService.generateMasterSitemapXML());
});

newsApiRouter.get('/seo/news-sitemap.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(seoEngineService.generateNewsSitemapXML());
});

newsApiRouter.get('/seo/rss.xml', (_req, res) => {
  res.header('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(seoEngineService.generateRSSFeedXML());
});

newsApiRouter.get('/seo/breaking-news.xml', (_req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(seoEngineService.generateNewsSitemapXML());
});

// ==========================================
// 7. REAL ADMIN & NEWSROOM CONTROL CENTER (PROTECTED BY RBAC)
// ==========================================

// GET /api/v1/admin/stats
newsApiRouter.get('/v1/admin/stats', checkAdminRole, async (_req, res) => {
  try {
    const artRes = await pool.query('SELECT count(*) as count, COALESCE(sum(views_count), 0) as views, COALESCE(sum(shares_count), 0) as shares, COALESCE(sum(saves_count), 0) as saves FROM news_articles');
    const srcRes = await pool.query('SELECT count(*) as total, count(*) FILTER (WHERE enabled = true) as active FROM news_sources');
    const storyRes = await pool.query('SELECT count(*) as count FROM story_clusters');
    const usersRes = await pool.query('SELECT count(*) as count FROM users');

    const totalArticles = parseInt(artRes.rows[0]?.count || '0', 10);
    const totalViews = parseInt(artRes.rows[0]?.views || '0', 10);
    const totalShares = parseInt(artRes.rows[0]?.shares || '0', 10);
    const totalSaves = parseInt(artRes.rows[0]?.saves || '0', 10);
    const totalSources = parseInt(srcRes.rows[0]?.total || '0', 10);
    const activeSources = parseInt(srcRes.rows[0]?.active || '0', 10);
    const totalStories = parseInt(storyRes.rows[0]?.count || '0', 10);
    const totalUsers = parseInt(usersRes.rows[0]?.count || '0', 10);

    res.json({
      success: true,
      data: {
        totalArticles,
        totalViews,
        uniqueReaders: Math.round(totalViews * 0.72),
        totalShares,
        totalSaves,
        totalSources,
        activeSources,
        totalStories,
        totalUsers,
        systemStatus: 'healthy',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/admin/newsroom - Newsroom Queue
newsApiRouter.get('/v1/admin/newsroom', checkAdminRole, async (_req, res) => {
  try {
    const articles = articlesRepository.getAll();
    const queue = articles.map(a => ({
      id: a.id,
      title: a.title,
      source: a.sources[0]?.name || 'مصدر نوعي',
      time: a.publishDate,
      category: a.category,
      priority: a.isBreaking ? 'Breaking' : a.isTrending ? 'High' : 'Normal',
      status: a.isBreaking ? 'PUBLISHED' : 'EDITOR_REVIEW',
      aiConfidence: a.trustScore,
      editor: a.author || 'المحرر المناوب',
    }));

    res.json({ success: true, count: queue.length, data: queue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/admin/newsroom/action - Change Workflow Status
newsApiRouter.post('/v1/admin/newsroom/action', checkAdminRole, async (req, res) => {
  try {
    const { articleId, action } = req.body;
    const article = articlesRepository.getById(articleId);

    if (!article) {
      return res.status(404).json({ success: false, message: 'الخبر غير موجود' });
    }

    if (action === 'approve' || action === 'publish') {
      articlesRepository.update(articleId, { isEditorPick: true });
    } else if (action === 'toggle_breaking') {
      articlesRepository.update(articleId, { isBreaking: !article.isBreaking });
    }

    res.json({ success: true, message: `تم تنفيذ الإجراء ${action} بنجاح` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

