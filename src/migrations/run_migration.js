/**
 * Script to run the steering wheel constraint fix migration
 */
const fs = require('fs').promises;
const path = require('path');
const { pg: pool } = require('../../config/db.config');

async function runMigration() {
  try {
    console.log('Starting migration to fix steering wheel constraint...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'fix_steering_wheel_constraint.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Connect to the database and run the migration
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      console.log('Executing SQL migration...');
      await client.query(sqlContent);
      
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', error.message);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error running migration:', error.message);
  }
}

// Run the migration
runMigration().finally(() => {
  pool.end(); // Close the connection pool when done
});
