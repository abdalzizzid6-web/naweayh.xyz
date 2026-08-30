import { pool, testDbConnection } from './server/db/connection.ts';
async function run() {
  await testDbConnection();
  const res = await pool.query('SELECT * FROM users');
  console.log(res.rows);
  process.exit(0);
}
run();
