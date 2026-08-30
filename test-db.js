const { pool } = require('./dist/server/db/connection.js');
pool.query('SELECT * FROM users').then(res => {
  console.log(res.rows);
  process.exit(0);
});
