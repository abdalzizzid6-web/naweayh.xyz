import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { seoEngineService } from './src/seo-engine/SEOEngineService';
import { articlesRepository } from './src/repositories/articlesRepository';
import { testDbConnection } from './server/db/connection';
import { newsSchedulerWorker } from './server/workers/NewsSchedulerWorker';
import { app, syncDatabaseArticlesToRepository } from './server/app';
import { pgArticlesRepository } from './server/repositories/pgArticlesRepository';
import { mapDbRowToArticle } from './server/api/newsRouter';

async function renderPageSSR(rawHtml: string, reqPath: string, queryParams: any): Promise<{ html: string; status: number }> {
  if (articlesRepository.getAll().length === 0) {
    await syncDatabaseArticlesToRepository();
  }
  const allArticles = articlesRepository.getAll();

  // 1. Article Page /news/:slug
  const newsMatch = reqPath.match(/^\/news\/([^\/]+)/);
  if (newsMatch) {
    const rawSlug = decodeURIComponent(newsMatch[1]);
    let article = articlesRepository.getBySlug(rawSlug) || articlesRepository.getById(rawSlug);
    
    // Fallback: Query PostgreSQL directly if not in memory
    if (!article) {
      const dbRow = await pgArticlesRepository.getArticleBySlugOrId(rawSlug);
      if (dbRow) {
        article = mapDbRowToArticle(dbRow);
        articlesRepository.add(article);
      }
    }

    if (article) {
      const meta = seoEngineService.generateMetaTags(article);
      const schemas = [
        seoEngineService.generateNewsArticleSchema(article),
        seoEngineService.generateArticleBreadcrumbSchema(article),
      ];
      const bodyContent = seoEngineService.generateArticleSemanticHtml(article);
      const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas, bodyContent });
      return { html, status: 200 };
    } else {
      const meta = seoEngineService.generate404MetaTags();
      const bodyContent = seoEngineService.generate404SemanticHtml();
      const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas: [], bodyContent });
      return { html, status: 404 };
    }
  }

  // 2. Category Page /category/:category
  const categoryMatch = reqPath.match(/^\/category\/([^\/]+)/);
  if (categoryMatch) {
    const categoryName = decodeURIComponent(categoryMatch[1]);
    const categoryArticles = allArticles.filter(
      (a) => a.category && a.category.toLowerCase() === categoryName.toLowerCase()
    );
    const meta = seoEngineService.generateCategoryMetaTags(categoryName);
    const schemas = [
      seoEngineService.generateCategoryBreadcrumbSchema(categoryName),
      seoEngineService.generateWebSiteSchema(),
    ];
    const bodyContent = seoEngineService.generateCategorySemanticHtml(categoryName, categoryArticles);
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas, bodyContent });
    return { html, status: 200 };
  }

  // 3. Source Page /source/:source
  const sourceMatch = reqPath.match(/^\/source\/([^\/]+)/);
  if (sourceMatch) {
    const sourceName = decodeURIComponent(sourceMatch[1]);
    const sourceArticles = allArticles.filter((a) =>
      a.sources && a.sources.some((s) => s.name.toLowerCase() === sourceName.toLowerCase())
    );
    const meta = seoEngineService.generateSourceMetaTags(sourceName);
    const schemas = [
      seoEngineService.generateSourceBreadcrumbSchema(sourceName),
      seoEngineService.generateWebSiteSchema(),
    ];
    const bodyContent = seoEngineService.generateSourceSemanticHtml(sourceName, sourceArticles);
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas, bodyContent });
    return { html, status: 200 };
  }

  // 4. Search Page /search
  if (reqPath.startsWith('/search')) {
    const query = (queryParams?.q as string) || '';
    const meta = seoEngineService.generateSearchMetaTags(query);
    const schemas = [seoEngineService.generateWebSiteSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  // 5. 404 Page
  if (reqPath === '/404') {
    const meta = seoEngineService.generate404MetaTags();
    const bodyContent = seoEngineService.generate404SemanticHtml();
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas: [], bodyContent });
    return { html, status: 404 };
  }

  // 6. Homepage & Default Routes
  const meta = seoEngineService.generateMetaTags();
  const schemas = [
    seoEngineService.generateWebSiteSchema(),
    seoEngineService.generateOrganizationSchema(),
  ];
  const bodyContent = seoEngineService.generateHomepageSemanticHtml(allArticles);
  const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas, bodyContent });
  return { html, status: 200 };
}

async function startServer() {
  const PORT = 3000;

  // Test DB connection and start worker scheduler in container/server mode (if not serverless)
  if (!process.env.VERCEL) {
    testDbConnection().then(connected => {
      if (connected) {
        newsSchedulerWorker.start();
      }
    });
  }

  // Vite Dev Server / SSR Static Fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    // Use vite's connect instance as middleware for static assets / HMR
    app.use(vite.middlewares);

    // SSR Handler for dev
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.includes('.')) {
        return next();
      }

      try {
        const rootIndexPath = path.join(process.cwd(), 'index.html');
        let rawHtml = fs.readFileSync(rootIndexPath, 'utf-8');
        rawHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);

        const { html, status } = await renderPageSSR(rawHtml, req.baseUrl || req.path, req.query);
        res.status(status).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', async (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const rawHtml = fs.readFileSync(indexPath, 'utf-8');
        const { html, status } = await renderPageSSR(rawHtml, req.path, req.query);
        res.status(status).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(html);
      } else {
        res.status(404).send('Build index.html not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniNews Enterprise Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

