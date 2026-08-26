import express, { Express } from 'express';
import { newsApiRouter } from './api/newsRouter';
import { storiesApiRouter } from './api/storiesRouter';
import { aiPipelineService } from './services/AIPipelineService';
import { seoEngineService } from '../src/seo-engine/SEOEngineService';
import { articlesRepository } from '../src/repositories/articlesRepository';
import { pool } from './db/connection';

export function createExpressApp(): Express {
  const app = express();

  // Basic Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
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
  const serveMasterSitemap = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateMasterSitemapXML());
  };

  const serveNewsSitemap = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateNewsSitemapXML());
  };

  const serveImageSitemap = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateImageSitemapXML());
  };

  const serveVideoSitemap = (_req: express.Request, res: express.Response) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateVideoSitemapXML());
  };

  const serveRSS = (_req: express.Request, res: express.Response) => {
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
  app.get('/sitemap-images.xml', serveImageSitemap);
  app.get('/sitemap-videos.xml', serveVideoSitemap);
  app.get('/rss.xml', serveRSS);
  app.get('/feed.xml', serveRSS);
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
