const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          }
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'Lumia635-',
          database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db'
        };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Test the connection
    pool.query('SELECT NOW()', (err) => {
      if (err) {
        console.error('Database connection failed:', err);
        process.exit(-1);
      } else {
        console.log('Database connection successful');
      }
    });
  }
  return pool;
}

module.exports = getPool();