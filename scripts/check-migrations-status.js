// Load environment variables first
require('dotenv').config();
const { pg } = require('../config/db.config');

async function checkMigrationsStatus() {
  const client = await pg.connect();
  
  try {
    console.log('🔍 Checking database migration status...\n');
    
    // Check if pgmigrations table exists (used by node-pg-migrate)
    const pgMigrationsExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pgmigrations'
      );
    `);
    
    if (pgMigrationsExists.rows[0].exists) {
      console.log('✅ pgmigrations table exists');
      
      // Get list of applied migrations
      const appliedMigrations = await client.query(`
        SELECT id, name, run_on 
        FROM pgmigrations 
        ORDER BY run_on DESC
        LIMIT 10;
      `);
      
      console.log('\n📋 Recently applied node-pg-migrate migrations:');
      if (appliedMigrations.rows.length > 0) {
        appliedMigrations.rows.forEach(migration => {
          console.log(`   - ${migration.name} (applied on: ${migration.run_on})`);
        });
      } else {
        console.log('   No migrations found in pgmigrations table');
      }
    } else {
      console.log('❌ pgmigrations table does not exist (node-pg-migrate not initialized)');
    }
    
    // Check specific migration results
    console.log('\n📊 Checking specific migration results:');
    
    // Check multilingual terms columns
    const termsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'terms_and_conditions' 
      AND column_name IN ('title_ka', 'title_en', 'title_ru', 'content_ka', 'content_en', 'content_ru')
      ORDER BY column_name;
    `);
    
    console.log(`\n✅ Multilingual Terms Migration:`);
    console.log(`   Found ${termsColumns.rows.length}/6 multilingual columns:`);
    termsColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
    // Check views_count columns
    const carsViewsCount = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'cars' AND column_name = 'views_count';
    `);
    
    const partsViewsCount = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'parts' AND column_name = 'views_count';
    `);
    
    console.log(`\n✅ Views Count Migration:`);
    console.log(`   Cars: ${carsViewsCount.rows.length > 0 ? 'views_count column exists' : 'views_count column missing'}`);
    console.log(`   Parts: ${partsViewsCount.rows.length > 0 ? 'views_count column exists' : 'views_count column missing'}`);
    
    // Check other important columns
    const checkColumns = [
      { table: 'users', column: 'google_id', migration: 'Google OAuth' },
      { table: 'users', column: 'facebook_id', migration: 'Facebook OAuth' },
      { table: 'users', column: 'balance', migration: 'User Balance' },
      { table: 'cars', column: 'vip_expires_at', migration: 'VIP Status' },
      { table: 'parts', column: 'vip_expires_at', migration: 'VIP Status' },
      { table: 'cars', column: 'currency', migration: 'Currency' },
      { table: 'cars', column: 'vin_code', migration: 'VIN Code' }
    ];
    
    console.log('\n📋 Other migrations status:');
    for (const check of checkColumns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        );
      `, [check.table, check.column]);
      
      console.log(`   ${check.migration}: ${result.rows[0].exists ? '✅' : '❌'} (${check.table}.${check.column})`);
    }
    
    console.log('\n✨ Migration status check completed!');
    
  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the check
checkMigrationsStatus()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Status check failed:', error);
    process.exit(1);
  });