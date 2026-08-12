import { pool, initDb } from '../db/connection';
import { newsIngestionService } from '../services/NewsIngestionService';
import { pgSourcesRepository } from '../repositories/pgSourcesRepository';
import { pgArticlesRepository } from '../repositories/pgArticlesRepository';

async function main() {
  console.log('--- PHASE 3.6 - REAL INGESTION & NETWORK HARDENING RUN ---');
  
  // 1. Initialize DB schema and seed sources
  await initDb();

  // 2. Fetch all sources
  const sources = await pgSourcesRepository.getActiveSources();
  console.log(`Loaded ${sources.length} active news sources for ingestion pipeline...`);

  // 3. Process each source through the pipeline
  let totalNew = 0;
  let totalFetched = 0;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    console.log(`[${i + 1}/${sources.length}] Ingesting source ID ${src.id}: ${src.nameArabic || src.name} (${src.country}) - ${src.feedUrl}`);
    
    try {
      const log = await newsIngestionService.fetchAndIngestSource(src);
      totalFetched += log.articlesFetched;
      totalNew += log.newArticlesCount;
      if (log.status === 'SUCCESS') {
        successCount++;
        console.log(`   -> SUCCESS | Fetched: ${log.articlesFetched} | New: ${log.newArticlesCount} | Time: ${log.durationMs}ms`);
      } else {
        failureCount++;
        console.log(`   -> FAILED | Reason: ${log.failureReason} | Error: ${log.error}`);
      }
    } catch (err: any) {
      failureCount++;
      console.log(`   -> EXCEPTION | Error: ${err?.message || err}`);
    }
  }

  // 4. Print Summary Stats
  console.log('\n==================================================');
  console.log('INGESTION CYCLE COMPLETE');
  console.log(`Total Sources Tested: ${sources.length}`);
  console.log(`Success Count: ${successCount}`);
  console.log(`Failure Count: ${failureCount}`);
  console.log(`Success Rate: ${Math.round((successCount / sources.length) * 100)}%`);
  console.log(`Total Articles Fetched: ${totalFetched}`);
  console.log(`Total New Articles Inserted: ${totalNew}`);
  console.log('==================================================\n');

  // 5. Get Source Network Health Stats
  const stats = await pgSourcesRepository.getSourcesStats();
  console.log('NETWORK HEALTH STATS:', JSON.stringify(stats, null, 2));

  // 6. Get Freshness Metrics
  const freshness = await pgArticlesRepository.getFreshnessMetrics();
  console.log('FRESHNESS METRICS:', JSON.stringify(freshness, null, 2));

  // 7. Get Source Map
  const mapMetrics = await pgArticlesRepository.getSourceMapMetrics();
  console.log('SOURCE MAP BY COUNTRY:', JSON.stringify(mapMetrics, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
