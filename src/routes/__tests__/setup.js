const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const testPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'big_way_test_db'
});

async function setupTestDb() {
  try {
    // Drop everything first
    await testPool.query(`
      DROP TABLE IF EXISTS wishlists, car_images, cars, 
      specifications, locations, brands, categories, users CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS car_status CASCADE;
      DROP INDEX IF EXISTS idx_cars_brand_id;
      DROP INDEX IF EXISTS idx_cars_category_id;
      DROP INDEX IF EXISTS idx_cars_seller_id;
      DROP INDEX IF EXISTS idx_wishlists_user_id;
      DROP INDEX IF EXISTS idx_wishlists_car_id;
    `);

    // Read schema SQL
    const schema = fs.readFileSync(
      path.join(__dirname, '../../../database/schema.sql'),
      'utf8'
    );

    // Create tables and init data
    await testPool.query(schema);

    // Insert test data
    await testPool.query(`
      INSERT INTO brands (name) VALUES 
      ('Test Brand 1'),
      ('Test Brand 2');

      INSERT INTO categories (name) VALUES 
      ('Test Category 1'),
      ('Test Category 2');
    `);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

async function teardownTestDb() {
  try {
    // Clean up all tables
    await testPool.query(`
      DROP TABLE IF EXISTS wishlists, car_images, cars, 
      specifications, locations, brands, categories, users CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS car_status CASCADE;
      DROP INDEX IF EXISTS idx_cars_brand_id;
      DROP INDEX IF EXISTS idx_cars_category_id;
      DROP INDEX IF EXISTS idx_cars_seller_id;
      DROP INDEX IF EXISTS idx_wishlists_user_id;
      DROP INDEX IF EXISTS idx_wishlists_car_id;
    `);
    await testPool.end();
  } catch (error) {
    console.error('Error tearing down test database:', error);
    throw error;
  }
}

module.exports = {
  testPool,
  setupTestDb,
  teardownTestDb
};