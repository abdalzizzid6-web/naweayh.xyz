import { pool } from '../db/connection';
import { newsIngestionService } from '../services/NewsIngestionService';

async function test() {
  const res = await pool.query(`SELECT * FROM news_sources WHERE name_arabic LIKE '%بنا%' OR name_arabic LIKE '%خيوط%' LIMIT 2`);
  for (const source of res.rows) {
    console.log('Testing source:', source.name_arabic, source.feed_url);
    try {
      const log = await newsIngestionService.fetchAndIngestSource({
        id: source.id,
        name: source.name,
        nameArabic: source.name_arabic,
        url: source.url,
        feedUrl: source.feed_url,
        logo: source.logo,
        country: source.country,
        language: source.language,
        category: source.category,
        type: source.type,
        enabled: source.enabled,
        priority: source.priority,
        trustScore: source.trust_score,
        fetchInterval: source.fetch_interval,
      });
      console.log('Result:', log);
    } catch (err: any) {
      console.log('Error:', err.message);
    }
  }
  process.exit(0);
}
test().catch(console.error);
