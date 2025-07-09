/**
 * Script to force remove the steering wheel constraint
 */
const fs = require('fs').promises;
const path = require('path');
const pool = require('../../config/db.config');

async function runMigration() {
  try {
    console.log('Starting force migration to remove steering wheel constraint...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'force_remove_constraint.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Connect to the database and run the migration
    const client = await pool.connect();
    try {
      console.log('Beginning transaction...');
      await client.query('BEGIN');
      
      console.log('Executing SQL migration...');
      await client.query(sqlContent);
      
      // Double check if the constraint still exists
      const checkResult = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'specifications' 
        AND constraint_name = 'valid_steering_wheel'
      `);
      
      if (checkResult.rows.length > 0) {
        console.log('WARNING: Constraint still exists, attempting direct removal...');
        await client.query('ALTER TABLE specifications DROP CONSTRAINT valid_steering_wheel');
      } else {
        console.log('Constraint successfully removed');
      }
      
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
