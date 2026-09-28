import express, { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { newsApiRouter, mapDbRowToArticle } from './api/newsRouter';
import { authRouter, requireAdminAuth } from './api/authRouter';
import { storiesApiRouter } from './api/storiesRouter';
import { socialRouter } from './api/socialRouter';
import { aiPipelineService } from './services/AIPipelineService';
import { seoEngineService } from '../src/seo-engine/SEOEngineService';
import { articlesRepository } from '../src/repositories/articlesRepository';
import { sourcesRepository } from '../src/repositories/sourcesRepository';
import { pool } from './db/connection';
import { newsSchedulerWorker } from './workers/NewsSchedulerWorker';
import { telemetryService } from './services/TelemetryService';
import { renderPageSSR, getBaseHtmlTemplate } from './ssrHandler';
import { pgArticlesRepository } from './repositories/pgArticlesRepository';
import { RateLimiterService } from './services/RateLimiterService';
import { validateRequest, CommonSchemas } from './services/ValidationService';

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

    // 1. Redirect www and non-https traffic to clean https://naweayh.xyz (skip localhost / 127.0.0.1 in dev)
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    if (!isLocalhost && (isWww || (proto === 'http' && host.includes('naweayh.xyz')))) {
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

  // 0. Security Headers (Helmet, CSP, HSTS, Permissions-Policy, Clickjacking protection)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://pagead2.googlesyndication.com',
            'https://www.googletagmanager.com',
            'https://partner.googleadservices.com',
            'https://tpc.googlesyndication.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'http://localhost:*', 'ws://localhost:*'],
          frameSrc: [
            "'self'",
            'https://googleads.g.doubleclick.net',
            'https://tpc.googlesyndication.com',
            'https://www.google.com',
          ],
          frameAncestors: [
            "'self'",
            'https://*.run.app',
            'https://*.google.com',
            'https://naweayh.xyz',
          ],
        },
      },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      xContentTypeOptions: true,
      frameguard: false, // Handled via CSP frameAncestors to permit preview iframe safely
    })
  );

  // Set Permissions-Policy header
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });

  // Cookie parser for secure HttpOnly cookie session management
  app.use(cookieParser());

  // Basic Middleware & Live Request Telemetry with strict 1MB body limits
  app.use(telemetryService.middleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Live Forensic Health & Metrics Telemetry API (Admin-Only)
  app.get('/api/v1/monitoring/health-metrics', requireAdminAuth, async (_req, res) => {
    try {
      const metrics = await telemetryService.getLiveMetrics();
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Real AI Jobs Endpoint (Admin Protected)
  app.get('/api/v1/admin/ai-jobs', requireAdminAuth, async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT j.id, j.article_id, j.job_type, j.status, j.attempts, j.max_attempts, 
                j.last_error, j.payload, j.result, j.created_at, j.started_at, j.completed_at,
                COALESCE(a.title, j.payload->>'title', 'مهمة بدون عنوان') as article_title
         FROM ai_jobs j
         LEFT JOIN news_articles a ON j.article_id = a.id
         ORDER BY j.created_at DESC
         LIMIT 50`
      );
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Retry Real AI Job Endpoint (Admin Protected)
  app.post('/api/v1/admin/ai-jobs/:id/retry', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const jobRes = await pool.query('SELECT * FROM ai_jobs WHERE id = $1', [id]);
      if (jobRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'المهمة غير موجودة' });
      }
      const job = jobRes.rows[0];
      const payload = job.payload || {};
      await pool.query(
        `UPDATE ai_jobs SET status = 'RUNNING', attempts = attempts + 1, last_error = NULL WHERE id = $1`,
        [id]
      );
      // Process in background
      aiPipelineService.processArticleWithAI(
        payload.title || '',
        payload.content || '',
        payload.sourceName || 'أخبار نوعية',
        job.article_id
      ).catch(err => console.warn('[Retry AI Job] Failed:', err.message));

      res.json({ success: true, message: 'تمت إعادة جدولة المهمة بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api', newsApiRouter);
  app.use('/api', storiesApiRouter);
  app.use('/api', socialRouter);

  // AI Pipeline Processing Endpoint (Admin Protected & Rate Limited & Validated)
  const appSecurityLimits = RateLimiterService.getLimits();
  app.post(
    '/api/ai/process',
    requireAdminAuth,
    RateLimiterService.middleware({
      keyPrefix: 'ai',
      maxPoints: appSecurityLimits.aiMax,
      windowSeconds: 60,
    }),
    validateRequest({ body: CommonSchemas.aiProcessBody }),
    async (req, res) => {
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
    }
  );

  // Public Health Check API (Security Hardened: Status ONLY. Zero leaks of environment, runtime, or database metrics)
  app.get(['/api/health', '/health'], async (_req, res) => {
    let dbStatus = 'FAILED';
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      if (typeof client.release === 'function') {
        client.release();
      }
      dbStatus = 'HEALTHY';
    } catch {
      dbStatus = 'FAILED';
    }

    const overallStatus = dbStatus === 'HEALTHY' ? 'healthy' : 'degraded';
    res.json({
      status: overallStatus,
    });
  });

  // Admin-Only Diagnostic Health Check (Protected with Central Auth & RBAC)
  app.get('/api/v1/admin/health', requireAdminAuth, async (_req, res) => {
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
          provider: 'Google Gemini AI (gemini-2.5-flash)',
        },
        scheduler: {
          status: schedulerStatus,
        },
      },
    });
  });

  // XML & SEO Sitemaps (Both root and /api/seo paths supported with real PostgreSQL queries)
  const serveMasterSitemap = async (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateMasterSitemapXML());
  };

  const serveNewsSitemap = async (_req: express.Request, res: express.Response) => {
    try {
      const dbArticles = await pgArticlesRepository.getRecentArticlesForGoogleNews(48, 1000);
      const articles = dbArticles.length > 0 ? dbArticles.map(mapDbRowToArticle) : articlesRepository.getAll();
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateNewsSitemapXML(articles));
    } catch {
      if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateNewsSitemapXML());
    }
  };

  const servePagesSitemap = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generatePagesSitemapXML());
  };

  const serveCategoriesSitemap = async (_req: express.Request, res: express.Response) => {
    try {
      const catsRes = await pool.query("SELECT DISTINCT category FROM news_articles WHERE category IS NOT NULL AND category != ''");
      const categories = catsRes.rows.map((r: any) => r.category);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateCategoriesSitemapXML(categories));
    } catch {
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateCategoriesSitemapXML());
    }
  };

  const serveSourcesSitemap = async (_req: express.Request, res: express.Response) => {
    try {
      const srcRes = await pool.query('SELECT name, name_arabic FROM news_sources ORDER BY id ASC');
      const sources = srcRes.rows.map((r: any) => r.name_arabic || r.name).filter(Boolean);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateSourcesSitemapXML(sources));
    } catch {
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateSourcesSitemapXML());
    }
  };

  const serveImageSitemap = async (_req: express.Request, res: express.Response) => {
    try {
      const dbArticles = await pgArticlesRepository.getLatestArticlesWithImages(1000);
      const articles = dbArticles.length > 0 ? dbArticles.map(mapDbRowToArticle) : articlesRepository.getAll();
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateImageSitemapXML(articles));
    } catch {
      if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(seoEngineService.generateImageSitemapXML());
    }
  };

  const serveRSS = async (_req: express.Request, res: express.Response) => {
    try {
      const dbArticles = await pgArticlesRepository.getLatestArticles(50);
      const articles = dbArticles.length > 0 ? dbArticles.map(mapDbRowToArticle) : articlesRepository.getAll();
      res.header('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(seoEngineService.generateRSSFeedXML(articles));
    } catch {
      if (articlesRepository.getAll().length === 0) await syncDatabaseArticlesToRepository();
      res.header('Content-Type', 'application/rss+xml; charset=utf-8');
      res.send(seoEngineService.generateRSSFeedXML());
    }
  };

  const serveRobots = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(seoEngineService.generateRobotsTxt());
  };

  const serveAdsTxt = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(
      '# Ads.txt for Naw3iya News (https://naweayh.xyz)\n' +
      '# Official Publisher Authorized Digital Sellers\n' +
      'google.com, pub-7294820194820194, DIRECT, f08c47fec0942fa0\n'
    );
  };

  // Root level SEO routes
  app.get('/sitemap.xml', serveMasterSitemap);
  app.get('/sitemap-news.xml', serveNewsSitemap);
  app.get('/news-sitemap.xml', serveNewsSitemap);
  app.get('/sitemap-pages.xml', servePagesSitemap);
  app.get('/sitemap-categories.xml', serveCategoriesSitemap);
  app.get('/sitemap-sources.xml', serveSourcesSitemap);
  app.get('/sitemap-images.xml', serveImageSitemap);
  app.get('/rss.xml', serveRSS);
  app.get('/feed.xml', serveRSS);
  app.get('/breaking-news.xml', serveNewsSitemap);
  app.get('/robots.txt', serveRobots);
  app.get('/ads.txt', serveAdsTxt);

  // /api/seo/* paths for Vercel rewrites
  app.get('/api/seo/sitemap.xml', serveMasterSitemap);
  app.get('/api/seo/news-sitemap.xml', serveNewsSitemap);
  app.get('/api/seo/rss.xml', serveRSS);
  app.get('/api/seo/breaking-news.xml', serveNewsSitemap);

  // AMP HTML Endpoint
  app.get('/amp/news/:slug', (req, res) => {
    let slug = req.params.slug;
    try {
      slug = decodeURIComponent(slug);
    } catch {}
    const article = articlesRepository.getBySlug(slug) || articlesRepository.getById(slug);
    if (!article) {
      res.status(404).send('Article not found');
      return;
    }
    res.header('Content-Type', 'text/html; charset=utf-8');
    res.send(seoEngineService.generateAMPArticleHTML(article));
  });

  // Server-Side Pre-render HTML Endpoints (For OpenGraph, WhatsApp, Twitter, and Crawlers)
  const handleSSRRoute = async (req: express.Request, res: express.Response) => {
    try {
      const baseHtml = getBaseHtmlTemplate();
      const { html, status } = await renderPageSSR(baseHtml, req.path, req.query);
      res.status(status).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(html);
    } catch (err) {
      console.warn('[SSR Route Error]:', err);
      const baseHtml = getBaseHtmlTemplate();
      res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(baseHtml);
    }
  };

  app.get('/', handleSSRRoute);
  app.get('/news/:slug', handleSSRRoute);
  app.get('/category/:category', handleSSRRoute);
  app.get('/source/:source', handleSSRRoute);
  app.get('/privacy-policy', handleSSRRoute);
  app.get('/terms', handleSSRRoute);
  app.get('/about', handleSSRRoute);
  app.get('/contact', handleSSRRoute);
  app.get('/editorial-policy', handleSSRRoute);
  app.get('/editorial-guidelines', handleSSRRoute);
  app.get('/cookie-policy', handleSSRRoute);
  app.get('/corrections', handleSSRRoute);
  app.get('/advertising-policy', handleSSRRoute);
  app.get('/story/:slug', handleSSRRoute);
  app.get('/search', handleSSRRoute);

  return app;
}

export const app = createExpressApp();
