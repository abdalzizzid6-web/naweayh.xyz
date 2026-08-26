import { pool } from '../db/connection';

async function check() {
  const res = await pool.query('SELECT id, name, name_arabic, url, feed_url FROM news_sources WHERE enabled = true');
  console.log('Total enabled sources:', res.rows.length);
  for (const row of res.rows) {
    console.log(`${row.name_arabic} (${row.name}) -> feedUrl: ${row.feed_url}`);
  }
  process.exit(0);
}
check().catch(console.error);
