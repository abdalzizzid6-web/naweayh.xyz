import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { seoEngineService } from './src/seo-engine/SEOEngineService';
import { articlesRepository } from './src/repositories/articlesRepository';
import { testDbConnection } from './server/db/connection';
import { newsSchedulerWorker } from './server/workers/NewsSchedulerWorker';
import { app, syncDatabaseArticlesToRepository } from './server/app';
import { renderPageSSR } from './server/ssrHandler';

async function startServer() {
  const PORT = 3000;

  // Test DB connection and start worker scheduler in container/server mode (if not serverless)
  if (!process.env.VERCEL) {
    const connected = await testDbConnection();
    if (connected) {
      try {
        await syncDatabaseArticlesToRepository();
      } catch (err) {
        console.error('Failed to sync DB articles to repository on boot', err);
      }
      newsSchedulerWorker.start();
    }
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

