import express, { Express } from 'express';
import { newsApiRouter, mapDbRowToArticle } from './api/newsRouter';
import { authRouter } from './api/authRouter';
import { storiesApiRouter } from './api/storiesRouter';
import { aiPipelineService } from './services/AIPipelineService';
import { seoEngineService } from '../src/seo-engine/SEOEngineService';
import { articlesRepository } from '../src/repositories/articlesRepository';
import { sourcesRepository } from '../src/repositories/sourcesRepository';
import { pool } from './db/connection';
import { newsSchedulerWorker } from './workers/NewsSchedulerWorker';

export async function syncDatabaseArticlesToRepository(): Promise<number> {
  try {
    const sourcesRes = await pool.query(`SELECT * FROM news_sources ORDER BY id ASC`);
    if (sourcesRes.rows && sourcesRes.rows.length > 0) {
      for (const row of sourcesRes.rows) {
        if (!sourcesRepository.getById(String(row.id))) {
          sourcesRepository.add({
            id: String(row.id),
            name: row.name_arabic || row.name,
            logo: row.logo || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=100&q=80',
            url: row.feed_url || row.url || '',
            type: (row.protocol === 'GOOGLE_NEWS' ? 'Google_News' : row.protocol === 'REUTERS' ? 'Reuters' : 'RSS') as any,
            category: row.category || 'عام',
            country: row.country || 'اليمن',
            language: row.language || 'ar',
            priority: (row.priority || 'Medium') as any,
            reliabilityRating: row.reliability_score ? Math.min(5, Math.ceil(row.reliability_score / 20)) : 5,
            fetchFrequencyMinutes: row.fetch_frequency_minutes || 5,
            status: row.status === 'Active' || row.status === 'active' ? 'Active' : 'Active',
            lastFetchedAt: row.last_fetched_at ? new Date(row.last_fetched_at).toISOString() : new Date().toISOString(),
            articlesCountToday: row.articles_count_today || 0,
          });
        }
      }
    }

    let res = await pool.query(`
      SELECT a.*, s.name as "sourceName", s.name_arabic as "sourceNameArabic", s.logo as "sourceLogo", s.country as "sourceCountry"
      FROM news_articles a
      LEFT JOIN news_sources s ON a.source_id = s.id
      ORDER BY a.published_at DESC
      LIMIT 200
    `);

    if (!res.rows || res.rows.length === 0) {
      newsSchedulerWorker.runIngestionCycle().catch(console.error);
    }

    if (res.rows && res.rows.length > 0) {
      for (const row of res.rows) {
        const article = mapDbRowToArticle(row);
        if (!articlesRepository.getById(article.id) && !articlesRepository.getBySlug(article.slug)) {
          articlesRepository.add(article);
        }
      }
      return res.rows.length;
    }
  } catch (err) {
    console.error('[SEO Sync] Error loading DB articles:', err);
  }
  return 0;
}

export function createExpressApp(): Express {
  const app = express();

  // Canonical Domain, Protocol & URL Normalization Enforcement (https://naweayh.xyz)
  app.use((req, res, next) => {
    const host = req.headers.host || '';
    const isWww = host.startsWith('www.');
    const proto = req.headers['x-forwarded-proto'] || req.protocol;

    // 1. Redirect www and non-https traffic to clean https://naweayh.xyz
    if (isWww || (proto === 'http' && (host.includes('naweayh.xyz') || host.includes('localhost') === false))) {
      const cleanHost = host.replace(/^www\./, '');
      return res.redirect(301, `https://${cleanHost || 'naweayh.xyz'}${req.originalUrl}`);
    }

    // 2. Catch & normalize malformed crawler URLs (e.g. /https://naweayh.xyz/..., /https://www.naweayh.xyz/..., /https:/...)
    const rawUrl = req.originalUrl || req.url;
    const malformedHttpMatch = rawUrl.match(/^\/+(https?:\/+(?:www\.)?(?:naweayh\.xyz)?)(\/.*)?$/i);
    if (malformedHttpMatch) {
      const restPath = malformedHttpMatch[2] || '/';
      return res.redirect(301, `https://naweayh.xyz${restPath}`);
    }

    // 3. Catch direct /article/:slugOrId legacy links and redirect 301 to /news/:slugOrId
    if (req.path.startsWith('/article/')) {
      const articleIdOrSlug = req.path.replace('/article/', '');
      return res.redirect(301, `https://naweayh.xyz/news/${articleIdOrSlug}`);
    }

    // 4. Catch legacy index query parameters like ?cat=... or ?p=... and redirect 301 to canonical clean home
    if (req.path === '/' && (req.query.cat !== undefined || req.query.p !== undefined || req.query.page_id !== undefined)) {
      return res.redirect(301, 'https://naweayh.xyz/');
    }

    // 5. Catch stray /a or /https://naweayh.xyz/a links
    if (req.path === '/a') {
      return res.redirect(301, 'https://naweayh.xyz/');
    }

    next();
  });

  // Basic Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api', newsApiRouter);
  app.use('/api', storiesApiRouter);

  // AI Pipeline Processing Endpoint
  app.post('/api/ai/process', async (req, res) => {
    try {
      const { title, content, sourceName } = req.body;
      const result = await aiPipelineService.processArticleWithAI(
        title || '',
        content || '',
        sourceName || 'أخبار نوعية'
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Enterprise Health Check API
  app.get('/api/health', async (_req, res) => {
    const startTime = Date.now();
    let dbStatus = 'FAILED';
    let dbLatency = 0;

    try {
      const client = await pool.connect();
      const dbStart = Date.now();
      await client.query('SELECT 1');
      if (typeof client.release === 'function') {
        client.release();
      }
      dbLatency = Date.now() - dbStart;
      dbStatus = 'HEALTHY';
    } catch (dbErr) {
      dbStatus = 'FAILED';
    }

    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const aiStatus = hasGeminiKey ? 'AVAILABLE' : 'CONFIG_MISSING';
    const ingestionStatus = dbStatus === 'HEALTHY' ? 'HEALTHY' : 'FAILED';
    const schedulerStatus = process.env.VERCEL ? 'EXTERNAL_CRON_MANAGED' : 'RUNNING';

    const overallStatus = dbStatus === 'HEALTHY' ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      service: 'Naw3iya News Enterprise Platform',
      environment: process.env.NODE_ENV || 'development',
      runtime: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Server',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      database: dbStatus,
      news_ingestion: ingestionStatus,
      ai: aiStatus,
      scheduler: schedulerStatus,
      components: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          type: 'PostgreSQL',
        },
        news_ingestion: {
          status: ingestionStatus,
        },
        ai: {
          status: aiStatus,
          provider: 'Google Gemini AI (gemini-3.6-flash)',
        },
        scheduler: {
          status: schedulerStatus,
        },
      },
    });
  });

  // XML & SEO Sitemaps (Both root and /api/seo paths supported)
  const serveMasterSitemap = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateMasterSitemapXML());
  };

  const serveNewsSitemap = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateNewsSitemapXML());
  };

  const servePagesSitemap = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generatePagesSitemapXML());
  };

  const serveCategoriesSitemap = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateCategoriesSitemapXML());
  };

  const serveSourcesSitemap = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateSourcesSitemapXML());
  };

  const serveImageSitemap = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateImageSitemapXML());
  };

  const serveVideoSitemap = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateVideoSitemapXML());
  };

  const serveRSS = async (_req: express.Request, res: express.Response) => {
    if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
    res.header('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(seoEngineService.generateRSSFeedXML());
  };

  const serveRobots = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(seoEngineService.generateRobotsTxt());
  };

  // Root level SEO routes
  app.get('/sitemap.xml', serveMasterSitemap);
  app.get('/sitemap-news.xml', serveNewsSitemap);
  app.get('/news-sitemap.xml', serveNewsSitemap);
  app.get('/sitemap-pages.xml', servePagesSitemap);
  app.get('/sitemap-categories.xml', serveCategoriesSitemap);
  app.get('/sitemap-sources.xml', serveSourcesSitemap);
  app.get('/sitemap-images.xml', serveImageSitemap);
  app.get('/sitemap-videos.xml', serveVideoSitemap);
  app.get('/rss.xml', serveRSS);
  app.get('/feed.xml', serveRSS);
  app.get('/breaking-news.xml', serveNewsSitemap);
  app.get('/robots.txt', serveRobots);

  // /api/seo/* paths for Vercel rewrites
  app.get('/api/seo/sitemap.xml', serveMasterSitemap);
  app.get('/api/seo/news-sitemap.xml', serveNewsSitemap);
  app.get('/api/seo/rss.xml', serveRSS);
  app.get('/api/seo/breaking-news.xml', serveNewsSitemap);

  // AMP HTML Endpoint
  app.get('/amp/news/:slug', (req, res) => {
    const slug = req.params.slug;
    const article = articlesRepository.getBySlug(slug);
    if (!article) {
      res.status(404).send('Article not found');
      return;
    }
    res.header('Content-Type', 'text/html; charset=utf-8');
    res.send(seoEngineService.generateAMPArticleHTML(article));
  });

  return app;
}

export const app = createExpressApp();
