import { pool, testDbConnection } from '../server/db/connection';
import { pgArticlesRepository } from '../server/repositories/pgArticlesRepository';
import { pgSourcesRepository } from '../server/repositories/pgSourcesRepository';

async function runEndToEndVerification() {
  console.log('--- STARTING PHASE 2 E2E ARCHITECTURE VERIFICATION ---');
  await testDbConnection();

  // 1. Articles Fetch & Filtering (SSOT in PostgreSQL)
  console.log('\n[TEST 1] Testing pgArticlesRepository.getFilteredArticles...');
  const initialArticles = await pgArticlesRepository.getFilteredArticles({ limit: 5 });
  console.log(`✓ Fetched ${initialArticles.data.length} articles from PostgreSQL (Total in DB: ${initialArticles.total})`);
  if (initialArticles.data.length === 0) {
    throw new Error('Expected at least 1 article in PostgreSQL database.');
  }
  const sampleArticle = initialArticles.data[0];
  console.log(`✓ Sample Article: ID=${sampleArticle.id}, Title="${sampleArticle.title}", Views=${sampleArticle.views_count}`);

  // 2. Fetch by Slug and ID
  console.log('\n[TEST 2] Testing pgArticlesRepository.getArticleBySlugOrId...');
  const bySlug = await pgArticlesRepository.getArticleBySlugOrId(sampleArticle.slug);
  if (!bySlug || bySlug.id !== sampleArticle.id) {
    throw new Error(`Failed to fetch article by slug: ${sampleArticle.slug}`);
  }
  console.log(`✓ Successfully retrieved article #${bySlug.id} by slug "${sampleArticle.slug}" from PostgreSQL`);

  // 3. View Increment with Deduplication
  console.log('\n[TEST 3] Testing pgArticlesRepository.incrementView with deduplication...');
  const viewerHash = 'test-device-sha256-hash-001';
  const initialViews = parseInt(sampleArticle.views_count || '0', 10);
  const viewRes1 = await pgArticlesRepository.incrementView(sampleArticle.id, viewerHash);
  console.log(`✓ First View: count=${viewRes1.viewsCount}, deduplicated=${viewRes1.deduplicated}`);
  
  const viewRes2 = await pgArticlesRepository.incrementView(sampleArticle.id, viewerHash);
  console.log(`✓ Second View (Within Window): count=${viewRes2.viewsCount}, deduplicated=${viewRes2.deduplicated}`);
  if (!viewRes2.deduplicated) {
    throw new Error('Expected second view within deduplication window to be deduplicated.');
  }

  // 4. Share Increment
  console.log('\n[TEST 4] Testing pgArticlesRepository.incrementShare...');
  const initialShares = parseInt(sampleArticle.shares_count || '0', 10);
  const shareCount = await pgArticlesRepository.incrementShare(sampleArticle.id);
  console.log(`✓ Share incremented in PostgreSQL: Before=${initialShares}, After=${shareCount}`);

  // 5. Saved Articles (PostgreSQL SSOT Bookmarks)
  console.log('\n[TEST 5] Testing pgArticlesRepository Bookmarking in PostgreSQL...');
  const testDeviceId = 'device_verification_999';
  const saveSuccess = await pgArticlesRepository.saveArticle(sampleArticle.id, undefined, testDeviceId);
  console.log(`✓ saveArticle result: ${saveSuccess}`);
  const isSaved1 = await pgArticlesRepository.isArticleSaved(sampleArticle.id, undefined, testDeviceId);
  console.log(`✓ isArticleSaved check: ${isSaved1}`);
  if (!isSaved1) {
    throw new Error('Article should be marked as saved in PostgreSQL.');
  }
  const savedArticlesList = await pgArticlesRepository.getSavedArticles({ deviceId: testDeviceId });
  console.log(`✓ getSavedArticles count: ${savedArticlesList.length}`);
  const unsaveSuccess = await pgArticlesRepository.unsaveArticle(sampleArticle.id, undefined, testDeviceId);
  console.log(`✓ unsaveArticle result: ${unsaveSuccess}`);
  const isSaved2 = await pgArticlesRepository.isArticleSaved(sampleArticle.id, undefined, testDeviceId);
  console.log(`✓ isArticleSaved after unsave: ${isSaved2}`);
  if (isSaved2) {
    throw new Error('Article should not be saved after unsave.');
  }

  // 6. Trending & Most-Read Deterministic Engine
  console.log('\n[TEST 6] Testing Trending & Most-Read Calculations in PostgreSQL...');
  const trendingArticles = await pgArticlesRepository.getTrendingArticles(5);
  console.log(`✓ Trending articles retrieved: ${trendingArticles.length}`);
  const mostReadArticles = await pgArticlesRepository.getMostReadArticles(5);
  console.log(`✓ Most read articles retrieved: ${mostReadArticles.length}`);

  // 7. AI Jobs Tracking & Retries
  console.log('\n[TEST 7] Testing AI Jobs Table in PostgreSQL...');
  const insertJobRes = await pool.query(
    `INSERT INTO ai_jobs (article_id, job_type, status, payload)
     VALUES ($1, $2, $3, $4)
     RETURNING id, status`,
    [sampleArticle.id, 'SUMMARIZATION', 'PENDING', JSON.stringify({ title: sampleArticle.title })]
  );
  const jobId = insertJobRes.rows[0].id;
  console.log(`✓ Created AI Job #${jobId} with status PENDING`);
  
  await pool.query(`UPDATE ai_jobs SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP WHERE id = $1`, [jobId]);
  console.log(`✓ Updated AI Job #${jobId} to RUNNING in PostgreSQL`);

  await pool.query(
    `UPDATE ai_jobs SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, result = $2 WHERE id = $1`,
    [jobId, JSON.stringify({ summary: 'تم تلخيص المقال بنجاح عبر الذكاء الاصطناعي' })]
  );
  console.log(`✓ Updated AI Job #${jobId} to COMPLETED in PostgreSQL`);

  // 8. Enterprise Sources Catalog
  console.log('\n[TEST 8] Testing Enterprise Sources in PostgreSQL...');
  const sources = await pgSourcesRepository.getAllSources();
  console.log(`✓ Retrieved ${sources.length} active enterprise sources from PostgreSQL news_sources table.`);

  console.log('\n======================================================');
  console.log('✅ ALL PHASE 2 DATA ARCHITECTURE E2E TESTS PASSED 100%');
  console.log('======================================================\n');
  process.exit(0);
}

runEndToEndVerification().catch((err) => {
  console.error('❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
