import path from 'path';
import fs from 'fs';
import { seoEngineService } from '../src/seo-engine/SEOEngineService';
import { articlesRepository } from '../src/repositories/articlesRepository';
import { pgArticlesRepository } from './repositories/pgArticlesRepository';
import { mapDbRowToArticle } from './api/newsRouter';
import { pool } from './db/connection';

// In-Memory Template Cache
let cachedTemplate: { html: string; timestamp: number } | null = null;
const TEMPLATE_CACHE_TTL_MS = 60 * 1000; // 1 minute in dev, reloadable

export function getBaseHtmlTemplate(): string {
  const now = Date.now();
  if (cachedTemplate && (now - cachedTemplate.timestamp < TEMPLATE_CACHE_TTL_MS)) {
    return cachedTemplate.html;
  }

  try {
    const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(distIndexPath)) {
      const html = fs.readFileSync(distIndexPath, 'utf-8');
      cachedTemplate = { html, timestamp: now };
      return html;
    }
    const rootIndexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(rootIndexPath)) {
      const html = fs.readFileSync(rootIndexPath, 'utf-8');
      cachedTemplate = { html, timestamp: now };
      return html;
    }
  } catch (err) {
    console.warn('[SSR] Warning reading base index.html template from disk:', err);
  }

  // Resilient fallback HTML
  const fallbackHtml = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>أخبار نوعية — Naw3iya News | المنصة الإخبارية الذكية الأولى</title>
    <link rel="canonical" href="https://naweayh.xyz" />
    <link rel="manifest" href="/manifest.json" />
  </head>
  <body class="bg-white text-slate-900 font-['Cairo',sans-serif] antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  cachedTemplate = { html: fallbackHtml, timestamp: now };
  return fallbackHtml;
}

// In-Memory SSR Output Cache (30s TTL) to prevent duplicate queries on concurrent crawler requests
interface SsrCacheEntry {
  html: string;
  status: number;
  expiresAt: number;
}
const ssrRenderCache = new Map<string, SsrCacheEntry>();
const SSR_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const MAX_SSR_CACHE_ENTRIES = 200;

export async function renderPageSSR(
  rawHtml: string,
  reqPath: string,
  queryParams: any
): Promise<{ html: string; status: number }> {
  const cacheKey = `${reqPath}?q=${queryParams?.q || ''}`;
  const now = Date.now();
  const cached = ssrRenderCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { html: cached.html, status: cached.status };
  }

  const result = await doRenderPageSSR(rawHtml, reqPath, queryParams);

  if (ssrRenderCache.size >= MAX_SSR_CACHE_ENTRIES) {
    const oldestKey = ssrRenderCache.keys().next().value;
    if (oldestKey) ssrRenderCache.delete(oldestKey);
  }
  ssrRenderCache.set(cacheKey, {
    html: result.html,
    status: result.status,
    expiresAt: now + SSR_CACHE_TTL_MS,
  });

  return result;
}

async function doRenderPageSSR(
  rawHtml: string,
  reqPath: string,
  queryParams: any
): Promise<{ html: string; status: number }> {
  // 1. Article Page /news/:slug
  const newsMatch = reqPath.match(/^\/news\/([^\/]+)/);
  if (newsMatch) {
    let rawSlug = newsMatch[1];
    try {
      rawSlug = decodeURIComponent(rawSlug);
    } catch {
      // Malformed URI percent-encoding
      const meta = seoEngineService.generate404MetaTags();
      const bodyContent = seoEngineService.generate404SemanticHtml();
      const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas: [], bodyContent });
      return { html, status: 404 };
    }

    let article: any = null;
    try {
      const dbRow = await pgArticlesRepository.getArticleBySlugOrId(rawSlug);
      article = dbRow ? mapDbRowToArticle(dbRow) : articlesRepository.getBySlug(rawSlug) || articlesRepository.getById(rawSlug);
    } catch (err) {
      console.warn('[SSR /news] DB fetch notice:', err);
      article = articlesRepository.getBySlug(rawSlug) || articlesRepository.getById(rawSlug);
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
      // Real HTTP 404 to eliminate Soft 404 in Google Search Console!
      const meta = seoEngineService.generate404MetaTags();
      const bodyContent = seoEngineService.generate404SemanticHtml();
      const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas: [], bodyContent });
      return { html, status: 404 };
    }
  }

  // 2. Category Page /category/:category
  const categoryMatch = reqPath.match(/^\/category\/([^\/]+)/);
  if (categoryMatch) {
    let categoryName = categoryMatch[1];
    try {
      categoryName = decodeURIComponent(categoryName);
    } catch {}

    const dbRes = await pgArticlesRepository.getFilteredArticles({ category: categoryName, limit: 12 });
    const categoryArticles = dbRes.data.length > 0 
      ? dbRes.data.map(mapDbRowToArticle)
      : articlesRepository.getAll().filter((a) => a.category && a.category.toLowerCase() === categoryName.toLowerCase());

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
    let sourceName = sourceMatch[1];
    try {
      sourceName = decodeURIComponent(sourceName);
    } catch {}

    const dbRes = await pgArticlesRepository.getFilteredArticles({ search: sourceName, limit: 12 });
    const sourceArticles = dbRes.data.length > 0
      ? dbRes.data.map(mapDbRowToArticle)
      : articlesRepository.getAll().filter((a) => a.sources && a.sources.some((s) => s.name.toLowerCase() === sourceName.toLowerCase()));

    const meta = seoEngineService.generateSourceMetaTags(sourceName);
    const schemas = [
      seoEngineService.generateSourceBreadcrumbSchema(sourceName),
      seoEngineService.generateWebSiteSchema(),
    ];
    const bodyContent = seoEngineService.generateSourceSemanticHtml(sourceName, sourceArticles);
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas, bodyContent });
    return { html, status: 200 };
  }

  // 4. Static Legal and Editorial Pages
  if (reqPath === '/privacy-policy') {
    const meta = seoEngineService.generateStaticPageMetaTags('privacy');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/terms') {
    const meta = seoEngineService.generateStaticPageMetaTags('terms');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/about') {
    const meta = seoEngineService.generateStaticPageMetaTags('about');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/contact') {
    const meta = seoEngineService.generateStaticPageMetaTags('contact');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/editorial-guidelines' || reqPath === '/editorial-policy') {
    const meta = seoEngineService.generateStaticPageMetaTags('editorial');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/cookie-policy') {
    const meta = seoEngineService.generateStaticPageMetaTags('cookies');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/corrections') {
    const meta = seoEngineService.generateStaticPageMetaTags('corrections');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  if (reqPath === '/advertising-policy') {
    const meta = seoEngineService.generateStaticPageMetaTags('advertising');
    const schemas = [seoEngineService.generateWebSiteSchema(), seoEngineService.generateOrganizationSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  // 5. Search Page /search
  if (reqPath.startsWith('/search')) {
    const query = (queryParams?.q as string) || '';
    const meta = seoEngineService.generateSearchMetaTags(query);
    const schemas = [seoEngineService.generateWebSiteSchema()];
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
    return { html, status: 200 };
  }

  // 5b. Story Cluster Detail Route /story/:slug
  if (reqPath.startsWith('/story/')) {
    const slug = decodeURIComponent(reqPath.replace('/story/', '').split('/')[0]);
    try {
      const storyRes = await pool.query('SELECT * FROM story_clusters WHERE slug = $1 LIMIT 1', [slug]);
      if (storyRes.rowCount && storyRes.rows[0]) {
        const story = storyRes.rows[0];
        const meta = seoEngineService.generateStoryMetaTags(story.title, story.summary, story.slug);
        const schemas = [
          seoEngineService.generateWebSiteSchema(),
          seoEngineService.generateOrganizationSchema(),
        ];
        const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas });
        return { html, status: 200 };
      }
    } catch {
      // Fallback to default
    }
  }

  // 6. Explicit 404 Route
  if (reqPath === '/404') {
    const meta = seoEngineService.generate404MetaTags();
    const bodyContent = seoEngineService.generate404SemanticHtml();
    const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas: [], bodyContent });
    return { html, status: 404 };
  }

  // 7. Homepage & Default Routes
  const dbRes = await pgArticlesRepository.getFilteredArticles({ limit: 12 });
  const allArticles = dbRes.data.length > 0 ? dbRes.data.map(mapDbRowToArticle) : articlesRepository.getAll();
  const meta = seoEngineService.generateMetaTags();
  const schemas = [
    seoEngineService.generateWebSiteSchema(),
    seoEngineService.generateOrganizationSchema(),
  ];
  const bodyContent = seoEngineService.generateHomepageSemanticHtml(allArticles);
  const html = seoEngineService.renderSSRHtml(rawHtml, { meta, schemas, bodyContent });
  return { html, status: 200 };
}
