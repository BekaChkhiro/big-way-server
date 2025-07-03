const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const config = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          },
          max: 20, // Maximum number of clients in the pool
          idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
          connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'Lumia635-',
          database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db',
          max: 20,
          idleTimeoutMillis: 60000,
          connectionTimeoutMillis: 10000,
        };

    pool = new Pool(config);

    // Error handling
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
      // Don't crash on connection errors, but log them
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
      }
      if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.');
      }
      if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.');
      }
    });

    // Connection validation
    pool.on('connect', (client) => {
      client.query('SELECT NOW()', (err) => {
        if (err) {
          console.error('Error executing connection test query:', err);
        }
      });
    });
  }
  return pool;
}

module.exports = getPool();