const pool = require('./config/db.config');
const fs = require('fs').promises;
const path = require('path');

async function runVinMigration() {
  let client;
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_vin_code_to_cars.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('Migration SQL:');
    console.log(migrationSQL);
    
    // Get a client from the pool
    client = await pool.connect();
    
    // Execute the migration
    console.log('Running VIN code migration...');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the column was added
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cars' AND column_name = 'vin_code'
    `);
    
    console.log('VIN code column info:', columnCheck.rows);
    
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    if (client) {
      client.release();
    }
    process.exit(0);
  }
}

runVinMigration();