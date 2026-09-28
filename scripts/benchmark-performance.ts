import { pool, ensureDbInitialized } from '../server/db/connection';
import { pgArticlesRepository } from '../server/repositories/pgArticlesRepository';

interface TimingResult {
  scale: string;
  totalArticles: number;
  feedLatencyMs: number;
  categoryFilterLatencyMs: number;
  cursorPaginationLatencyMs: number;
  fullTextSearchLatencyMs: number;
  slugLookupLatencyMs: number;
}

async function measure<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = parseFloat((performance.now() - start).toFixed(2));
  return { result, durationMs };
}

async function runBenchmarkForScale(targetScaleCount: number, label: string): Promise<TimingResult> {
  console.log(`\n======================================================`);
  console.log(`▶ Starting Benchmark: ${label} (${targetScaleCount.toLocaleString()} articles)`);
  console.log(`======================================================`);

  // 1. Check current count
  const countBeforeRes = await pool.query('SELECT COUNT(*) as count FROM news_articles');
  const countBefore = parseInt(countBeforeRes.rows[0].count, 10);
  const needed = Math.max(0, targetScaleCount - countBefore);

  if (needed > 0) {
    console.log(`⚡ Generating ${needed.toLocaleString()} articles using PostgreSQL generate_series batch insert...`);
    const batchStart = performance.now();

    await pool.query(`
      INSERT INTO news_articles (
        title, slug, summary, content, formatted_body, category, country, language,
        cover_image_url, published_at, created_at, is_breaking, is_trending,
        views_count, shares_count, saves_count, reading_time_minutes, trust_score,
        content_classification, content_origin, content_status, content_quality_score,
        word_count, paragraph_count, source_id
      )
      SELECT 
        'تقرير إخباري نوعي رقم ' || i || ' حول التطورات الاقتصادية والسياسية في اليمن والمنطقة',
        'news-benchmark-article-' || i || '-' || floor(random() * 1000000)::text,
        'ملخص تحليلي موسع وشامل يوضح تفاصيل الحدث الإخباري وأبعاده الاستراتيجية رقم ' || i,
        'المحتوى الإخباري الكامل للخبر الافتراضي المستخدم لأغراض قياس الأداء والتحقق من كفاءة الفهارس وسرعة الاستعلامات.',
        '<p>المحتوى الإخباري الكامل للخبر الافتراضي المستخدم لأغراض قياس الأداء والتحقق من كفاءة الفهارس وسرعة الاستعلامات.</p>',
        (ARRAY['سياسة', 'اقتصاد', 'تقنية', 'رياضة', 'ثقافة', 'صحة', 'عالمي', 'اليمن'])[1 + (i % 8)],
        (ARRAY['اليمن', 'السعودية', 'الإمارات', 'قطر', 'مصر', 'عمان', 'الكويت'])[1 + (i % 7)],
        'ar',
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
        NOW() - (i || ' minutes')::INTERVAL,
        NOW() - (i || ' minutes')::INTERVAL,
        (i % 50 = 0),
        (i % 30 = 0),
        (i * 7) % 5000,
        (i * 3) % 1000,
        (i * 2) % 500,
        2 + (i % 5),
        85 + (i % 15),
        'FULL_PERMITTED_CONTENT',
        'FULL_FEED',
        'full',
        90,
        250,
        4,
        1
      FROM generate_series(1, $1) AS i
    `, [needed]);

    console.log(`✓ Data batch ready in ${(performance.now() - batchStart).toFixed(2)}ms`);
  }

  const actualCountRes = await pool.query('SELECT COUNT(*) as count FROM news_articles');
  const actualCount = parseInt(actualCountRes.rows[0].count, 10);
  console.log(`Current Total Articles in DB: ${actualCount.toLocaleString()}`);

  // Test 1: Feed Latest (20 items with ARTICLE_CARD_FIELDS)
  const { durationMs: feedLatencyMs } = await measure(() => pgArticlesRepository.getLatestArticles(20, 0));

  // Test 2: Category Filtered Feed ('سياسة' with composite index)
  const { durationMs: categoryFilterLatencyMs } = await measure(() =>
    pgArticlesRepository.getFilteredArticles({ category: 'سياسة', limit: 20 })
  );

  // Test 3: Cursor Pagination
  const latestCursorItem = await pool.query('SELECT published_at FROM news_articles ORDER BY published_at DESC LIMIT 1 OFFSET 20');
  const cursorDate = latestCursorItem.rows[0]?.published_at ? new Date(latestCursorItem.rows[0].published_at).toISOString() : undefined;
  const { durationMs: cursorPaginationLatencyMs } = await measure(() =>
    pgArticlesRepository.getLatestArticlesCursor({ limit: 20, cursor: cursorDate })
  );

  // Test 4: Full Text Search with GIN Index
  const { durationMs: fullTextSearchLatencyMs } = await measure(() =>
    pgArticlesRepository.searchArticles('اليمن التطورات الاقتصادية', 20)
  );

  // Test 5: Single Article Lookup by Slug (B-Tree index)
  const sampleSlugRes = await pool.query('SELECT slug FROM news_articles LIMIT 1');
  const sampleSlug = sampleSlugRes.rows[0]?.slug || 'test-slug';
  const { durationMs: slugLookupLatencyMs } = await measure(() =>
    pgArticlesRepository.getArticleBySlugOrId(sampleSlug)
  );

  console.log(`📊 Timings for ${label}:`);
  console.log(`   - Feed Latest (20 cards):              ${feedLatencyMs} ms`);
  console.log(`   - Category Filter (Composite Index):    ${categoryFilterLatencyMs} ms`);
  console.log(`   - Cursor Pagination (B-Tree Index):     ${cursorPaginationLatencyMs} ms`);
  console.log(`   - Full Text Search (GIN Index):         ${fullTextSearchLatencyMs} ms`);
  console.log(`   - Slug Exact Lookup (B-Tree Index):     ${slugLookupLatencyMs} ms`);

  return {
    scale: label,
    totalArticles: actualCount,
    feedLatencyMs,
    categoryFilterLatencyMs,
    cursorPaginationLatencyMs,
    fullTextSearchLatencyMs,
    slugLookupLatencyMs,
  };
}

async function main() {
  console.log('Initializing database connection & schemas...');
  await ensureDbInitialized();

  // Clean any old benchmark articles if left over
  await pool.query("DELETE FROM news_articles WHERE slug LIKE 'news-benchmark-article-%'");

  const results: TimingResult[] = [];

  // Scale 1: 100 Articles
  results.push(await runBenchmarkForScale(100, '100 Articles'));

  // Scale 2: 10,000 Articles
  results.push(await runBenchmarkForScale(10000, '10,000 Articles'));

  // Scale 3: 100,000 Articles
  results.push(await runBenchmarkForScale(100000, '100,000 Articles'));

  console.log('\n========================================================================');
  console.log('🏆 COMPREHENSIVE PERFORMANCE BENCHMARK MATRIX (PostgreSQL + GIN + Projections)');
  console.log('========================================================================');
  console.table(results);

  // Cleanup benchmark generated articles
  console.log('\nCleaning up benchmark generated records to leave production DB pristine...');
  await pool.query("DELETE FROM news_articles WHERE slug LIKE 'news-benchmark-article-%'");
  const finalCountRes = await pool.query('SELECT COUNT(*) as count FROM news_articles');
  console.log(`Cleanup complete. Final active production articles count: ${finalCountRes.rows[0].count}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
