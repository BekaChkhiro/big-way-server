const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db'
    };

    pool = new Pool(config);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
}

module.exports = getPool();