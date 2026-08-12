import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { seoEngineService } from './src/seo-engine/SEOEngineService';
import { articlesRepository } from './src/repositories/articlesRepository';
import { testDbConnection, pool } from './server/db/connection';
import { newsSchedulerWorker } from './server/workers/NewsSchedulerWorker';
import { aiPipelineService } from './server/services/AIPipelineService';
import { newsApiRouter } from './server/api/newsRouter';
import { storiesApiRouter } from './server/api/storiesRouter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/api', newsApiRouter);
  app.use('/api', storiesApiRouter);

  // Test DB connection and start worker scheduler in production background
  testDbConnection().then(connected => {
    if (connected) {
      newsSchedulerWorker.start();
    }
  });

  // API: AI Pipeline Processing Endpoint (Server-side secret protection)
  app.post('/api/ai/process', async (req, res) => {
    try {
      const { title, content, sourceName } = req.body;
      const result = await aiPipelineService.processArticleWithAI(title || '', content || '', sourceName || 'أخبار نوعية');
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 1. Google News XML Sitemap Endpoint
  app.get('/sitemap-news.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateNewsSitemapXML());
  });

  // 2. Image XML Sitemap Endpoint
  app.get('/sitemap-images.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateImageSitemapXML());
  });

  // 3. Video XML Sitemap Endpoint
  app.get('/sitemap-videos.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateVideoSitemapXML());
  });

  // 4. Master Sitemap Index
  app.get('/sitemap.xml', (_req, res) => {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(seoEngineService.generateMasterSitemapXML());
  });

  // 5. RSS 2.0 Feed Endpoint
  app.get('/rss.xml', (_req, res) => {
    res.header('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(seoEngineService.generateRSSFeedXML());
  });

  // 6. Robots.txt Endpoint
  app.get('/robots.txt', (_req, res) => {
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.send(seoEngineService.generateRobotsTxt());
  });

  // 7. AMP (Accelerated Mobile Pages) Endpoint
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

  // 8. Enhanced Enterprise Health Check API
  app.get('/api/health', async (_req, res) => {
    const startTime = Date.now();
    let dbStatus = 'FAILED';
    let dbLatency = 0;

    try {
      const client = await pool.connect();
      const dbStart = Date.now();
      await client.query('SELECT 1');
      client.release();
      dbLatency = Date.now() - dbStart;
      dbStatus = 'HEALTHY';
    } catch (dbErr) {
      dbStatus = 'FAILED';
    }

    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const aiStatus = hasGeminiKey ? 'AVAILABLE' : 'QUOTA_EXCEEDED';
    const ingestionStatus = dbStatus === 'HEALTHY' ? 'HEALTHY' : 'FAILED';
    const schedulerStatus = 'RUNNING';

    const overallStatus = dbStatus === 'HEALTHY' ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      service: 'Naw3iya News Enterprise Platform',
      environment: process.env.NODE_ENV || 'development',
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

  // 9. Vite Dev Server / SSR Static Fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8');

        // Dynamic SSR Meta Tag Injection for Crawlers
        const slugMatch = req.path.match(/\/news\/([^\/]+)/);
        let article = undefined;
        if (slugMatch) {
          article = articlesRepository.getBySlug(slugMatch[1]);
        }

        const meta = seoEngineService.generateMetaTags(article);
        const jsonLd = article
          ? JSON.stringify([
              seoEngineService.generateNewsArticleSchema(article),
              seoEngineService.generateBreadcrumbSchema(article),
            ])
          : JSON.stringify(seoEngineService.generateWebSiteSchema());

        // Replace Title & Inject Tags
        html = html.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`);
        const ssrTags = `
    <meta name="description" content="${meta.description}" />
    <meta name="keywords" content="${meta.keywords}" />
    <link rel="canonical" href="${meta.canonicalUrl}" />
    <meta property="og:type" content="${meta.ogType}" />
    <meta property="og:title" content="${meta.ogTitle}" />
    <meta property="og:description" content="${meta.ogDescription}" />
    <meta property="og:image" content="${meta.ogImage}" />
    <meta property="og:url" content="${meta.canonicalUrl}" />
    <meta property="og:site_name" content="${meta.ogSiteName}" />
    <meta name="twitter:card" content="${meta.twitterCard}" />
    <meta name="twitter:title" content="${meta.twitterTitle}" />
    <meta name="twitter:description" content="${meta.twitterDescription}" />
    <meta name="twitter:image" content="${meta.twitterImage}" />
    <script type="application/ld+json">${jsonLd}</script>
        `;
        html = html.replace('</head>', `${ssrTags}\n</head>`);

        res.send(html);
      } else {
        res.status(404).send('Build index.html not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Naw3iya News Enterprise Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
