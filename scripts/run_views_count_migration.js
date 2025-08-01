// Load environment variables first
require('dotenv').config();
const { pg: pool } = require('../config/db.config');
const fs = require('fs');
const path = require('path');

async function runViewsCountMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting views_count migrations...');

    // Check if PostgreSQL is connected
    const result = await client.query('SELECT version()');
    console.log('✅ Connected to PostgreSQL:', result.rows[0].version.split(' ')[0]);

    // Run cars migration
    console.log('📝 Running cars views_count migration...');
    const carsMigrationPath = path.join(__dirname, '../database/migrations/add_views_count_to_cars.sql');
    const carsMigration = fs.readFileSync(carsMigrationPath, 'utf8');
    await client.query(carsMigration);
    console.log('✅ Cars views_count migration completed');

    // Run parts migration
    console.log('📝 Running parts views_count migration...');
    const partsMigrationPath = path.join(__dirname, '../database/migrations/add_views_count_to_parts.sql');
    const partsMigration = fs.readFileSync(partsMigrationPath, 'utf8');
    await client.query(partsMigration);
    console.log('✅ Parts views_count migration completed');

    // Verify the columns were added
    console.log('🔍 Verifying migrations...');

    const carsColumnsQuery = `
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'cars' AND column_name = 'views_count'
    `;
    const carsColumns = await client.query(carsColumnsQuery);

    const partsColumnsQuery = `
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'parts' AND column_name = 'views_count'
    `;
    const partsColumns = await client.query(partsColumnsQuery);

    // Check indexes
    const carsIndexQuery = `
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'cars' AND indexname = 'idx_cars_views_count'
    `;
    const carsIndex = await client.query(carsIndexQuery);

    const partsIndexQuery = `
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'parts' AND indexname = 'idx_parts_views_count'
    `;
    const partsIndex = await client.query(partsIndexQuery);

    console.log('📊 Migration Results:');
    console.log(`   Cars views_count column: ${carsColumns.rows.length > 0 ? '✅ Added' : '❌ Missing'}`);
    if (carsColumns.rows.length > 0) {
      console.log(`   - Type: ${carsColumns.rows[0].data_type}`);
      console.log(`   - Default: ${carsColumns.rows[0].column_default}`);
    }
    console.log(`   Cars views_count index: ${carsIndex.rows.length > 0 ? '✅ Created' : '❌ Missing'}`);

    console.log(`   Parts views_count column: ${partsColumns.rows.length > 0 ? '✅ Added' : '❌ Missing'}`);
    if (partsColumns.rows.length > 0) {
      console.log(`   - Type: ${partsColumns.rows[0].data_type}`);
      console.log(`   - Default: ${partsColumns.rows[0].column_default}`);
    }
    console.log(`   Parts views_count index: ${partsIndex.rows.length > 0 ? '✅ Created' : '❌ Missing'}`);

    // Check if any existing records need updating
    const carsNullCount = await client.query('SELECT COUNT(*) FROM cars WHERE views_count IS NULL');
    const partsNullCount = await client.query('SELECT COUNT(*) FROM parts WHERE views_count IS NULL');

    console.log(`📈 Data Status:`);
    console.log(`   Cars with NULL views_count: ${carsNullCount.rows[0].count}`);
    console.log(`   Parts with NULL views_count: ${partsNullCount.rows[0].count}`);

    console.log('🎉 All views_count migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runViewsCountMigration()
  .then(() => {
    console.log('✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error.message);
    process.exit(1);
  });