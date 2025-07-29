const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration (using same config as the main app)
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
      database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db',
    };

const pool = new Pool(config);

async function runMigration() {
  try {
    console.log('Starting VIP status migration.now..');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_vip_status_to_cars.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ VIP status migration completed successfully!');
    
    // Verify the changes
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      AND column_name IN ('vip_status', 'vip_expiration_date', 'vip_active')
      ORDER BY column_name;
    `);
    
    console.log('\n📋 Added columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Check if ENUM type was created
    const enumResult = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'vip_status')
      ORDER BY enumsortorder;
    `);
    
    console.log('\n🎯 VIP status ENUM values:');
    enumResult.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();