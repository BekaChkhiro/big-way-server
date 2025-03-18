const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    let config;

    if (process.env.DATABASE_URL) {
      // If DATABASE_URL is provided (production environment)
      config = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      };
    } else {
      // Local development environment
      config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'Lumia635-',
        database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db'
      };
    }

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