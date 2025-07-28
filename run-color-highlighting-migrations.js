// Script to run color highlighting migrations
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a pool using environment variables or default values
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'big_way_marketplace',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function runColorHighlightingMigrations() {
  console.log('🚀 Running Color Highlighting Migrations...\n');
  
  try {
    // Migration files to run
    const migrations = [
      'database/migrations/add_color_highlighting_to_cars.sql',
      'database/migrations/add_color_highlighting_to_parts.sql'
    ];
    
    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, migrationFile);
      
      console.log(`📝 Running migration: ${migrationFile}`);
      
      // Check if file exists
      if (!fs.existsSync(migrationPath)) {
        console.log(`❌ Migration file not found: ${migrationPath}`);
        continue;
      }
      
      // Read the migration file
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        // Execute the migration
        await pool.query(migrationSQL);
        console.log(`✅ Successfully applied: ${migrationFile}`);
      } catch (migrationError) {
        if (migrationError.message.includes('already exists') || migrationError.message.includes('IF NOT EXISTS')) {
          console.log(`⚠️  Migration already applied: ${migrationFile}`);
        } else {
          console.error(`❌ Error applying migration ${migrationFile}:`, migrationError.message);
        }
      }
    }
    
    // Verify the migrations were applied
    console.log('\n🔍 Verifying migrations...');
    
    // Check cars table
    const carsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      AND column_name LIKE '%color_highlighting%'
    `);
    
    console.log(`✅ Cars table has ${carsCheck.rows.length} color highlighting columns`);
    
    // Check parts table
    const partsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'parts' 
      AND column_name LIKE '%color_highlighting%'
    `);
    
    console.log(`✅ Parts table has ${partsCheck.rows.length} color highlighting columns`);
    
    if (carsCheck.rows.length > 0 && partsCheck.rows.length > 0) {
      console.log('\n🎉 Color highlighting migrations completed successfully!');
      console.log('You can now use color highlighting features in your application.');
    } else {
      console.log('\n❌ Some migrations may not have been applied correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection failed. Make sure PostgreSQL is running.');
      console.log('   Check your database connection settings in .env file or environment variables.');
    }
  } finally {
    await pool.end();
  }
}

// Run the migrations
runColorHighlightingMigrations().catch(console.error);