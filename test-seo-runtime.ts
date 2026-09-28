import { app, syncDatabaseArticlesToRepository } from './server/app';
import { testDbConnection, pool } from './server/db/connection';
import http from 'http';

function makeRequest(server: http.Server, path: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  const addr = server.address() as any;
  const port = addr.port;
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method: 'GET',
      headers: {
        'Host': 'naweayh.xyz',
        'x-forwarded-proto': 'https',
        ...headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Safe Mode Full SEO & Indexing Verification Suite ---\n');

  await testDbConnection();
  try {
    const srcRes = await pool.query('SELECT id FROM news_sources LIMIT 1');
    let sourceId = srcRes.rows[0]?.id;
    if (!sourceId) {
      const newSrc = await pool.query(`
        INSERT INTO news_sources (name, name_arabic, feed_url, url, protocol, category, country, language, status)
        VALUES ('Saba News', 'وكالة سبأ للأنباء', 'https://sabanew.net/feed', 'https://sabanew.net', 'RSS', 'اليمن', 'اليمن', 'ar', 'Active')
        RETURNING id
      `);
      sourceId = newSrc.rows[0].id;
    }
    await pool.query(`
      INSERT INTO news_articles (source_id, title, slug, summary, content, category, country, published_at, cover_image_url)
      VALUES (
        $1,
        'تدشين المشاريع التنموية في اليمن وفق الرؤية الحديثة',
        'تدشين-المشاريع-التنموية-في-اليمن',
        'تغطية صحفية شاملة حول تدشين المشاريع التنموية والتحديثات في العاصمة والمحافظات.',
        'تفاصيل الخبر ومحتوى التقرير الإخباري الشامل المنشور على منصة أخبار نوعية.',
        'اليمن',
        'اليمن',
        NOW(),
        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'
      ) ON CONFLICT (slug) DO NOTHING
    `, [sourceId]);
    await syncDatabaseArticlesToRepository();
  } catch (err) {
    console.warn('[Seed warning]:', err);
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  console.log(`[Test Server] Running on port ${port}`);

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Robots.txt
    console.log('\n[1. Testing robots.txt]');
    const robots = await makeRequest(server, '/robots.txt');
    assert('Robots.txt status 200', robots.status === 200);
    assert('Robots.txt contains Googlebot', robots.body.includes('Googlebot'));
    assert('Robots.txt allows /news/', robots.body.includes('Allow: /news/'));
    assert('Robots.txt disallows /admin/', robots.body.includes('Disallow: /admin/'));
    assert('Robots.txt disallows /api/', robots.body.includes('Disallow: /api/'));
    assert('Robots.txt references sitemap.xml', robots.body.includes('https://naweayh.xyz/sitemap.xml'));

    // 2. Master Sitemap Index
    console.log('\n[2. Testing sitemap.xml (Master Index)]');
    const sitemap = await makeRequest(server, '/sitemap.xml');
    assert('Master Sitemap status 200', sitemap.status === 200);
    assert('Master Sitemap is XML', (sitemap.headers['content-type'] || '').includes('xml'));
    assert('Master Sitemap contains sitemapindex', sitemap.body.includes('<sitemapindex'));
    assert('Master Sitemap includes sitemap-news.xml', sitemap.body.includes('/sitemap-news.xml'));
    assert('Master Sitemap includes sitemap-pages.xml', sitemap.body.includes('/sitemap-pages.xml'));
    assert('Master Sitemap includes sitemap-categories.xml', sitemap.body.includes('/sitemap-categories.xml'));
    assert('Master Sitemap includes sitemap-sources.xml', sitemap.body.includes('/sitemap-sources.xml'));
    assert('Master Sitemap includes sitemap-images.xml', sitemap.body.includes('/sitemap-images.xml'));
    assert('Master Sitemap does NOT contain sitemap-videos.xml', !sitemap.body.includes('sitemap-videos.xml'));

    // 3. News Sitemap (Google News)
    console.log('\n[3. Testing sitemap-news.xml (Google News)]');
    const newsSitemap = await makeRequest(server, '/sitemap-news.xml');
    assert('News Sitemap status 200', newsSitemap.status === 200);
    assert('News Sitemap contains news namespace', newsSitemap.body.includes('schemas/sitemap-news/0.9'));
    assert('News Sitemap contains <news:news>', newsSitemap.body.includes('<news:news>'));
    assert('News Sitemap contains publication name', newsSitemap.body.includes('<news:name>أخبار نوعية</news:name>'));

    // 4. Pages Sitemap
    console.log('\n[4. Testing sitemap-pages.xml (Static & Legal Pages)]');
    const pagesSitemap = await makeRequest(server, '/sitemap-pages.xml');
    assert('Pages Sitemap status 200', pagesSitemap.status === 200);
    assert('Pages Sitemap includes homepage', pagesSitemap.body.includes('https://naweayh.xyz/'));
    assert('Pages Sitemap includes privacy-policy', pagesSitemap.body.includes('https://naweayh.xyz/privacy-policy'));
    assert('Pages Sitemap includes terms', pagesSitemap.body.includes('https://naweayh.xyz/terms'));
    assert('Pages Sitemap includes about', pagesSitemap.body.includes('https://naweayh.xyz/about'));
    assert('Pages Sitemap includes contact', pagesSitemap.body.includes('https://naweayh.xyz/contact'));
    assert('Pages Sitemap includes editorial-guidelines', pagesSitemap.body.includes('https://naweayh.xyz/editorial-guidelines'));

    // 5. Categories Sitemap
    console.log('\n[5. Testing sitemap-categories.xml]');
    const catSitemap = await makeRequest(server, '/sitemap-categories.xml');
    assert('Categories Sitemap status 200', catSitemap.status === 200);
    assert('Categories Sitemap contains category URLs', catSitemap.body.includes('https://naweayh.xyz/category/'));

    // 6. Sources Sitemap
    console.log('\n[6. Testing sitemap-sources.xml]');
    const srcSitemap = await makeRequest(server, '/sitemap-sources.xml');
    assert('Sources Sitemap status 200', srcSitemap.status === 200);
    assert('Sources Sitemap contains source URLs', srcSitemap.body.includes('https://naweayh.xyz/source/'));

    // 7. Image Sitemap
    console.log('\n[7. Testing sitemap-images.xml]');
    const imgSitemap = await makeRequest(server, '/sitemap-images.xml');
    assert('Image Sitemap status 200', imgSitemap.status === 200);
    assert('Image Sitemap contains image tags', imgSitemap.body.includes('<image:image>') || imgSitemap.body.includes('<urlset'));

    // 8. RSS 2.0 Feed
    console.log('\n[8. Testing rss.xml]');
    const rss = await makeRequest(server, '/rss.xml');
    assert('RSS feed status 200', rss.status === 200);
    assert('RSS feed is RSS 2.0', rss.body.includes('<rss version="2.0"'));
    assert('RSS feed contains channel', rss.body.includes('<channel>'));
    assert('RSS feed contains atom link', rss.body.includes('https://naweayh.xyz/rss.xml'));

    // 9. Homepage SSR & Meta Tags
    console.log('\n[9. Testing Homepage SSR & Canonical]');
    const home = await makeRequest(server, '/');
    assert('Homepage status 200', home.status === 200);
    assert('Homepage contains canonical tag', home.body.includes('<link rel="canonical" href="https://naweayh.xyz/"'));
    assert('Homepage contains max-image-preview:large', home.body.includes('max-image-preview:large'));
    assert('Homepage contains Twitter card', home.body.includes('twitter:card'));
    assert('Homepage contains official Twitter handle', home.body.includes('@naweayh_news'));
    assert('Homepage contains WebSite JSON-LD schema', home.body.includes('"@type": "WebSite"') || home.body.includes('@type":"WebSite"'));
    assert('Homepage contains Organization JSON-LD schema', home.body.includes('"@type": "NewsMediaOrganization"') || home.body.includes('NewsMediaOrganization'));

    // 10. 301 Redirects
    console.log('\n[10. Testing 301 Redirects]');
    const legacyRedirect = await makeRequest(server, '/article/my-legacy-slug');
    assert('Legacy /article/ redirects 301', legacyRedirect.status === 301);
    assert('Redirect location is /news/my-legacy-slug', legacyRedirect.headers.location === 'https://naweayh.xyz/news/my-legacy-slug');

    const catQueryRedirect = await makeRequest(server, '/?cat=140');
    assert('Legacy ?cat= query redirects 301 to clean home', catQueryRedirect.status === 301);
    assert('Redirect location is clean home', catQueryRedirect.headers.location === 'https://naweayh.xyz/');

    // 11. True 404 Handling (Preventing Soft 404!)
    console.log('\n[11. Testing True 404 (No Soft 404)]');
    const notFound = await makeRequest(server, '/news/non-existent-article-xyz-404-check');
    assert('Non-existent article returns HTTP 404 (NOT 200 Soft 404)', notFound.status === 404);
    assert('404 contains noindex, nofollow', notFound.body.includes('noindex, nofollow'));
    assert('404 contains clear message', notFound.body.includes('404') || notFound.body.includes('غير موجودة'));

    // 12. Category SSR Page
    console.log('\n[12. Testing Category Page SSR]');
    const catPage = await makeRequest(server, `/category/${encodeURIComponent('اليمن')}`);
    assert('Category page returns status 200', catPage.status === 200);
    assert('Category page contains canonical URL', catPage.body.includes('https://naweayh.xyz/category/'));
    assert('Category page contains BreadcrumbList schema', catPage.body.includes('BreadcrumbList'));

    // 13. Legal Static Page SSR
    console.log('\n[13. Testing Trust & Policy Pages SSR]');
    const privacyPage = await makeRequest(server, '/privacy-policy');
    assert('Privacy page returns status 200', privacyPage.status === 200);
    assert('Privacy page contains canonical URL', privacyPage.body.includes('https://naweayh.xyz/privacy-policy'));
    assert('Privacy page contains Title', privacyPage.body.includes('سياسة الخصوصية'));

    const cookiePage = await makeRequest(server, '/cookie-policy');
    assert('Cookie policy returns status 200', cookiePage.status === 200);
    assert('Cookie policy contains canonical URL', cookiePage.body.includes('https://naweayh.xyz/cookie-policy'));

    const correctionsPage = await makeRequest(server, '/corrections');
    assert('Corrections policy returns status 200', correctionsPage.status === 200);
    assert('Corrections policy contains canonical URL', correctionsPage.body.includes('https://naweayh.xyz/corrections'));

    const adPolicyPage = await makeRequest(server, '/advertising-policy');
    assert('Advertising policy returns status 200', adPolicyPage.status === 200);
    assert('Advertising policy contains canonical URL', adPolicyPage.body.includes('https://naweayh.xyz/advertising-policy'));

    const editorialPage = await makeRequest(server, '/editorial-policy');
    assert('Editorial policy returns status 200', editorialPage.status === 200);
    assert('Editorial policy contains canonical URL', editorialPage.body.includes('https://naweayh.xyz/editorial-policy'));

    // 14. Testing ads.txt
    console.log('\n[14. Testing ads.txt for AdSense]');
    const adsTxt = await makeRequest(server, '/ads.txt');
    assert('ads.txt status 200', adsTxt.status === 200);
    assert('ads.txt contains google.com publisher', adsTxt.body.includes('google.com') && adsTxt.body.includes('DIRECT'));

    // 15. Testing /search SSR
    console.log('\n[15. Testing /search SSR]');
    const searchPage = await makeRequest(server, '/search?q=%D8%A7%D9%84%D9%8A%D9%85%D9%86');
    assert('Search page returns status 200', searchPage.status === 200);
    assert('Search page contains canonical URL', searchPage.body.includes('https://naweayh.xyz/search'));

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
