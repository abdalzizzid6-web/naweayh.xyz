import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { seoEngineService } from './src/seo-engine/SEOEngineService';
import { articlesRepository } from './src/repositories/articlesRepository';
import { testDbConnection } from './server/db/connection';
import { newsSchedulerWorker } from './server/workers/NewsSchedulerWorker';
import { app } from './server/app';

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
